import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FaStar, FaQuoteLeft, FaUserCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './ReviewSection.css';

const ReviewSection = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: '',
    rating: 5,
    comment: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
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
        toast.success('Review submitted successfully!');
        setFormData({ serviceId: '', rating: 5, comment: '' });
        setShowForm(false);
        fetchData(); // Refresh reviews list
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const getAverageRating = () => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  return (
    <section className="review-section">
      <div className="container">
        <div className="review-header">
          <div>
            <h2 className="section-title">Customer Reviews</h2>
            <p className="section-subtitle">Real feedback from our valued customers</p>
          </div>
          <div className="review-stats">
            <div className="avg-rating">
              <span className="avg-score">{getAverageRating()}</span>
              <FaStar className="avg-star" />
            </div>
            <span className="total-reviews">Based on {reviews.length} reviews</span>
          </div>
        </div>

        {showForm ? (
          <div className="review-form-container animate-fade-in-up">
            <h3>Write a Review</h3>
            <form onSubmit={handleReviewSubmit} className="review-form">
              <div className="form-group">
                <label>Select Service</label>
                <select 
                  value={formData.serviceId} 
                  onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                  required
                >
                  <option value="">-- Choose a Service --</option>
                  {services.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Rating</label>
                <div className="star-rating-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <FaStar 
                      key={star} 
                      className={`input-star ${star <= formData.rating ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, rating: star})}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Your Feedback</label>
                <textarea 
                  placeholder="Share details of your experience..."
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary-lg">Submit Review</button>
                <button type="button" className="btn-outline-lg" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="write-review-cta">
            <button 
              className="btn-primary-lg" 
              onClick={() => {
                if (user) {
                  setShowForm(true);
                } else {
                  toast.error('Please login to write a review');
                }
              }}
            >
              Write a Review
            </button>
          </div>
        )}

        {loading ? (
          <div className="reviews-loading">Loading reviews...</div>
        ) : (
          <div className="reviews-grid stagger-children mt-4">
            {reviews.map((review) => (
              <div key={review._id} className="review-card animate-fade-in-up">
                <FaQuoteLeft className="review-quote-icon" />
                <p className="review-text">{review.comment}</p>
                <div className="review-stars-static">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < review.rating ? 'star-active' : 'star-inactive'} />
                  ))}
                </div>
                {review.service && (
                  <div className="review-service-tag">
                    {review.service.name}
                  </div>
                )}
                <div className="review-author">
                  <div className="review-avatar">
                    <FaUserCircle size={40} color="#94a3b8" />
                  </div>
                  <div>
                    <strong>{review.user?.name || 'Customer'}</strong>
                    <span>Verified User</span>
                  </div>
                </div>
              </div>
            ))}
            {reviews.length === 0 && !loading && (
              <p style={{ textAlign: 'center', width: '100%', color: '#64748b' }}>No reviews yet. Be the first to review!</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewSection;
