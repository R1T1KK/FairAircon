import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiStar, FiUser, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ReviewSection.css';

const INITIAL_VISIBLE = 6;
const MIN_REVIEWS_FOR_AVG = 10;

const ReviewSection = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [formData, setFormData] = useState({
    serviceId: '',
    rating: 5,
    comment: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [reviewsRes, servicesRes] = await Promise.all([
        api.get('/reviews'),
        api.get('/services')
      ]);
      setReviews(reviewsRes.data.reviews || []);
      setServices(servicesRes.data.services || []);
    } catch (err) {
      console.error('Failed to fetch reviews data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/reviews'), api.get('/services')])
      .then(([reviewsRes, servicesRes]) => {
        if (!active) return;
        setReviews(reviewsRes.data.reviews || []);
        setServices(servicesRes.data.services || []);
      })
      .catch((err) => {
        console.error('Failed to fetch reviews data', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }
    if (!formData.serviceId) {
      toast.error('Please select a service');
      return;
    }
    if (!formData.comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const res = await api.post('/reviews', formData);
      if (res.data.success) {
        toast.success('Review submitted');
        setFormData({ serviceId: '', rating: 5, comment: '' });
        setShowForm(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const getAverageRating = () => {
    if (!reviews.length) return '0.0';
    const total = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;
  const showAverageSummary = reviews.length >= MIN_REVIEWS_FOR_AVG;

  return (
    <section className="section review-section" aria-labelledby="reviews-heading">
      <div className="container">
        <div className="review-header">
          <div>
            <h2 id="reviews-heading" className="section-title">Customer reviews</h2>
            <p className="section-subtitle">Feedback from Fair Aircon service bookings</p>
          </div>

          <div className="review-header-actions">
            {showAverageSummary && (
              <div className="card review-stats">
                <div className="avg-rating tabular-nums">
                  <span className="avg-score">{getAverageRating()}</span>
                  <FiStar size={20} className="avg-star" aria-hidden="true" />
                </div>
                <span className="total-reviews tabular-nums">
                  Based on {reviews.length} reviews
                </span>
              </div>
            )}

            {!showForm && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (user) {
                    setShowForm(true);
                  } else {
                    toast.error('Please log in to write a review');
                  }
                }}
              >
                Write a review
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="card review-form-container">
            <h3>Write a review</h3>
            <form onSubmit={handleReviewSubmit} className="review-form">
              <div className="review-form-group">
                <label htmlFor="review-service-select">Select service</label>
                <select
                  id="review-service-select"
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  required
                >
                  <option value="">Choose a service</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="review-form-group">
                <span className="review-label">Rating</span>
                <div className="star-rating-input" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`input-star-btn ${star <= formData.rating ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      aria-pressed={star <= formData.rating}
                    >
                      <FiStar size={20} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="review-form-group">
                <label htmlFor="review-comment-input">Your feedback</label>
                <textarea
                  id="review-comment-input"
                  placeholder="Share details of your experience"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="review-form-actions">
                <button type="submit" className="btn btn-primary">
                  Submit review
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="reviews-grid" aria-label="Loading reviews">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card review-card review-skeleton" aria-hidden="true">
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
                <div className="skeleton-line medium" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="card reviews-empty">
            <p>No reviews yet. Be the first to share feedback after your service.</p>
          </div>
        ) : (
          <>
            <div className="reviews-grid">
              {visibleReviews.map((review) => {
                const isVerifiedBooking = Boolean(review.booking);
                return (
                  <article key={review._id} className="card review-card">
                    <div className="review-card-top">
                      <div className="review-stars-static" aria-label={`${review.rating} out of 5 stars`}>
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            size={15}
                            className={i < review.rating ? 'star-active' : 'star-inactive'}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      {review.service?.name && (
                        <span className="review-service-tag">{review.service.name}</span>
                      )}
                    </div>

                    <p className="review-text">{review.comment}</p>

                    <div className="review-author">
                      <div className="review-avatar" aria-hidden="true">
                        <FiUser size={16} />
                      </div>
                      <div className="review-author-info">
                        <strong>{review.user?.name || 'Customer'}</strong>
                        {isVerifiedBooking && (
                          <span className="review-verified-badge">
                            <FiCheckCircle size={12} aria-hidden="true" />
                            <span>Verified booking</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {reviews.length > INITIAL_VISIBLE && (
              <div className="see-more-container">
                {hasMore ? (
                  <button
                    id="reviews-see-more-btn"
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                  >
                    <span>Show more reviews</span>
                    <span className="see-more-count tabular-nums">
                      +{reviews.length - visibleCount}
                    </span>
                  </button>
                ) : (
                  <button
                    id="reviews-see-less-btn"
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setVisibleCount(INITIAL_VISIBLE)}
                  >
                    Show fewer
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ReviewSection;
