import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiEdit2,
  FiCheckCircle,
  FiChevronRight,
  FiCamera,
  FiDownload,
  FiStar,
  FiAlertCircle,
  FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Profile.css';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'assigned', 'on-the-way'];

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  assigned: 'Technician assigned',
  'on-the-way': 'On the way',
  'in-progress': 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const getStatusBadgeClass = (status) => {
  if (status === 'completed') return 'badge-completed';
  if (status === 'cancelled') return 'badge-cancelled';
  if (status === 'pending') return 'badge-pending';
  return 'badge-in-progress';
};

const Profile = () => {
  const { user, updateProfile, updateAvatar } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || { street: '', city: '', state: '', pincode: '' }
  }));

  const loadBookings = useCallback(async () => {
    setBookingsError('');
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data.bookings || []);
    } catch {
      setBookingsError('Could not load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let active = true;
    api
      .get('/bookings/my')
      .then((res) => {
        if (active) setBookings(res.data.bookings || []);
      })
      .catch(() => {
        if (active) setBookingsError('Could not load your bookings. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('File size too large (Max 2MB)');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      await updateAvatar(formData);
      toast.success('Profile photo updated');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleReviewSubmit = async (bookingId) => {
    if (!reviewData.comment.trim()) return toast.error('Please add a comment');
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookingId,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      toast.success('Thank you for your review');
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, isReviewed: true } : b))
      );
      setReviewingId(null);
      setReviewData({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const downloadReceipt = async (bookingId) => {
    try {
      toast.loading('Generating receipt...');
      const response = await api.get(`/bookings/${bookingId}/receipt`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `FairAircon-Receipt-${bookingId.slice(-8).toUpperCase()}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Receipt downloaded');
    } catch {
      toast.dismiss();
      toast.error('Could not download receipt');
    }
  };

  const handlePayment = async (booking) => {
    if (payingId) return;
    setPaymentError(null);

    if (typeof window === 'undefined' || !window.Razorpay) {
      const msg = 'Payment checkout failed to load. Please refresh the page and try again.';
      setPaymentError({ bookingId: booking._id, message: msg });
      return toast.error(msg);
    }

    setPayingId(booking._id);
    try {
      const { data } = await api.post('/payments/create-order', {
        bookingId: booking._id
      });

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'Fair Aircon',
        description: booking.service?.name || 'AC Service',
        order_id: data.order.id,
        prefill: {
          name: data.user?.name || user?.name || '',
          email: data.user?.email || user?.email || '',
          contact: data.user?.phone || user?.phone || ''
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => {
            setPayingId(null);
          }
        },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });
            await loadBookings();
            toast.success('Payment verified successfully');
          } catch (verifyErr) {
            const msg =
              'Payment verification failed. If money was deducted, do not pay again; contact us.';
            setPaymentError({
              bookingId: booking._id,
              message: verifyErr.response?.data?.message
                ? `${msg} (${verifyErr.response.data.message})`
                : msg
            });
            toast.error(msg);
          } finally {
            setPayingId(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        const msg =
          resp?.error?.description || 'Payment failed. Please try again.';
        setPaymentError({ bookingId: booking._id, message: msg });
        toast.error(msg);
        setPayingId(null);
      });
      rzp.open();
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Could not initiate payment. Please try again.';
      setPaymentError({ bookingId: booking._id, message: msg });
      toast.error(msg);
      setPayingId(null);
    }
  };

  const upcomingBooking = bookings.find((b) => ACTIVE_STATUSES.includes(b.status));

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'active') return ACTIVE_STATUSES.includes(b.status);
    if (statusFilter === 'completed') return b.status === 'completed';
    if (statusFilter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <main className="profile-page">
      <section className="page-header-band">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <FiChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">My account</span>
          </nav>
          <h1>Customer dashboard</h1>
          <p>Manage your contact details, track active visits, and download receipts.</p>
        </div>
      </section>

      <div className="container profile-container">
        <div className="profile-grid">
          {/* Left: Profile Card */}
          <aside className="card profile-pillar" aria-label="Account profile">
            <div className="profile-avatar-wrapper">
              <div className="avatar-main">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User avatar'}
                    className="avatar-img"
                    width="88"
                    height="88"
                  />
                ) : (
                  <span>{user?.name?.[0]?.toUpperCase() || <FiUser size={28} />}</span>
                )}

                <label className="avatar-upload-overlay" aria-label="Upload profile photo">
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                  />
                  <FiCamera size={16} aria-hidden="true" />
                </label>
              </div>
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="profile-edit-form">
                <div className="profile-field">
                  <label htmlFor="prof-name">Full name</label>
                  <input
                    id="prof-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="profile-field">
                  <label htmlFor="prof-phone">Phone (10 digits)</label>
                  <input
                    id="prof-phone"
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="profile-field">
                  <label htmlFor="prof-city">City</label>
                  <input
                    id="prof-city"
                    type="text"
                    value={form.address?.city || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: { ...form.address, city: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="profile-edit-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={savingProfile}
                  >
                    {savingProfile ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-view-content">
                <h2>{user?.name}</h2>
                <p className="profile-role-meta">Customer account</p>

                <div className="profile-info">
                  <div className="profile-info-item">
                    <FiMail size={15} aria-hidden="true" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="profile-info-item">
                    <FiPhone size={15} aria-hidden="true" />
                    <span className="tabular-nums">{user?.phone || 'Not added'}</span>
                  </div>
                  {user?.address?.city && (
                    <div className="profile-info-item">
                      <FiMapPin size={15} aria-hidden="true" />
                      <span>{user.address.city}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      address: user?.address || { street: '', city: '', state: '', pincode: '' }
                    });
                    setEditing(true);
                  }}
                  className="btn btn-secondary profile-edit-btn"
                >
                  <FiEdit2 size={15} aria-hidden="true" />
                  <span>Edit details</span>
                </button>
              </div>
            )}
          </aside>

          {/* Right: Upcoming Booking + History */}
          <div className="profile-main-content">
            {/* Upcoming / Active Summary */}
            {!loading && upcomingBooking && (
              <section className="card upcoming-summary-card" aria-label="Upcoming service">
                <div className="upcoming-top">
                  <div>
                    <span className="upcoming-eyebrow">Active booking</span>
                    <h2>{upcomingBooking.service?.name}</h2>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(upcomingBooking.status)}`}>
                    <span className="status-dot" aria-hidden="true" />
                    <span>{STATUS_LABELS[upcomingBooking.status] || upcomingBooking.status}</span>
                  </span>
                </div>

                <div className="upcoming-meta">
                  <span>
                    <FiCalendar size={14} aria-hidden="true" />
                    <span className="tabular-nums">
                      {new Date(upcomingBooking.scheduledDate).toLocaleDateString('en-IN')}
                    </span>
                  </span>
                  <span>
                    <FiClock size={14} aria-hidden="true" />
                    <span className="tabular-nums">{upcomingBooking.timeSlot}</span>
                  </span>
                  {upcomingBooking.technician?.name && (
                    <span>
                      <FiUser size={14} aria-hidden="true" />
                      <span>Tech: {upcomingBooking.technician.name}</span>
                    </span>
                  )}
                </div>

                <div className="upcoming-actions">
                  <Link
                    to={`/tracking/${upcomingBooking._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Track live</span>
                    <FiArrowRight size={14} aria-hidden="true" />
                  </Link>
                  <Link to="/booking" className="btn btn-secondary btn-sm">
                    Book another service
                  </Link>
                </div>
              </section>
            )}

            {/* Booking History */}
            <section className="bookings-section" aria-labelledby="history-heading">
              <div className="bookings-header">
                <div>
                  <h2 id="history-heading">Booking history</h2>
                  <p className="bookings-count tabular-nums">
                    {bookings.length} total booking{bookings.length === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="history-filters" role="tablist" aria-label="Filter bookings">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'active', label: 'Active' },
                    { key: 'completed', label: 'Completed' },
                    { key: 'cancelled', label: 'Cancelled' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={statusFilter === tab.key}
                      className={`history-filter-btn ${statusFilter === tab.key ? 'active' : ''}`}
                      onClick={() => setStatusFilter(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="bookings-list" aria-label="Loading bookings">
                  {[1, 2].map((n) => (
                    <div key={n} className="card booking-item-card booking-skel" aria-hidden="true">
                      <div className="skel-line title" />
                      <div className="skel-line" />
                      <div className="skel-line short" />
                    </div>
                  ))}
                </div>
              ) : bookingsError ? (
                <div className="card bookings-state-card" role="alert">
                  <FiAlertCircle size={22} aria-hidden="true" />
                  <p>{bookingsError}</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setLoading(true);
                      loadBookings();
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="card bookings-state-card">
                  <FiCalendar size={24} aria-hidden="true" />
                  <p>
                    {bookings.length === 0
                      ? 'No bookings yet. Schedule your first AC service.'
                      : 'No bookings match this filter.'}
                  </p>
                  <Link to="/booking" className="btn btn-primary btn-sm">
                    Book a service
                  </Link>
                </div>
              ) : (
                <div className="bookings-list">
                  {filteredBookings.map((b) => (
                    <article key={b._id} className="card booking-item-card">
                      <div className="bi-header">
                        <div className="bi-title">
                          <h3>{b.service?.name || 'AC Service'}</h3>
                          <span className="bi-id tabular-nums">
                            REF: {b._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <div className="bi-badges">
                          <span
                            className={`badge ${
                              b.paymentStatus === 'paid' ? 'badge-completed' : 'badge-pending'
                            }`}
                          >
                            Payment: {b.paymentStatus}
                          </span>
                          <span className={`badge ${getStatusBadgeClass(b.status)}`}>
                            <span className="status-dot" aria-hidden="true" />
                            <span>{STATUS_LABELS[b.status] || b.status}</span>
                          </span>
                        </div>
                      </div>

                      <div className="bi-meta">
                        <div className="meta-item tabular-nums">
                          <FiCalendar size={14} aria-hidden="true" />
                          <span>{new Date(b.scheduledDate).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="meta-item tabular-nums">
                          <FiClock size={14} aria-hidden="true" />
                          <span>{b.timeSlot}</span>
                        </div>
                        <div className="meta-item bi-amount tabular-nums">
                          ₹{b.totalAmount?.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {b.address?.street && (
                        <p className="bi-address">
                          <FiMapPin size={14} aria-hidden="true" />
                          <span>
                            {b.address.street}, {b.address.city} - {b.address.pincode}
                          </span>
                        </p>
                      )}

                      {b.technician && (
                        <div className="bi-tech-box">
                          <div className="bi-tech-avatar" aria-hidden="true">
                            {b.technician.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <span className="bi-tech-label">Assigned technician</span>
                            <strong className="bi-tech-name">{b.technician.name}</strong>
                          </div>
                          {b.technician.phone && (
                            <a
                              href={`tel:${b.technician.phone}`}
                              className="btn btn-secondary btn-sm bi-tech-call"
                            >
                              <FiPhone size={14} aria-hidden="true" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>
                      )}

                      <div className="bi-actions">
                        {ACTIVE_STATUSES.includes(b.status) && (
                          <Link
                            to={`/tracking/${b._id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            <span>Track progress</span>
                            <FiChevronRight size={14} aria-hidden="true" />
                          </Link>
                        )}
                        {b.status === 'completed' && !b.isReviewed && (
                          <button
                            type="button"
                            onClick={() =>
                              setReviewingId(reviewingId === b._id ? null : b._id)
                            }
                            className="btn btn-secondary btn-sm"
                          >
                            <FiStar size={14} aria-hidden="true" />
                            <span>{reviewingId === b._id ? 'Cancel' : 'Rate service'}</span>
                          </button>
                        )}
                        {b.status === 'completed' && (
                          <button
                            type="button"
                            id={`download-receipt-${b._id}`}
                            onClick={() => downloadReceipt(b._id)}
                            className="btn btn-primary btn-sm"
                          >
                            <FiDownload size={14} aria-hidden="true" />
                            <span>Receipt</span>
                          </button>
                        )}
                        {b.paymentStatus === 'pending' && b.status === 'completed' && (
                          <button
                            type="button"
                            disabled={payingId === b._id}
                            onClick={() => handlePayment(b)}
                            className={`btn btn-accent btn-sm ${payingId === b._id ? 'is-loading' : ''}`}
                          >
                            {payingId === b._id ? 'Processing...' : 'Finalize payment'}
                          </button>
                        )}
                      </div>

                      {paymentError?.bookingId === b._id && (
                        <div
                          className="booking-inline-alert"
                          role="alert"
                          aria-live="polite"
                          style={{ marginTop: 12, marginBottom: 0 }}
                        >
                          <FiAlertCircle size={16} aria-hidden="true" />
                          <span style={{ flex: 1 }}>{paymentError.message}</span>
                          {b.paymentStatus === 'pending' && b.status === 'completed' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handlePayment(b)}
                              disabled={payingId === b._id}
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      )}

                      {reviewingId === b._id && (
                        <div className="bi-review-drawer">
                          <div
                            className="bi-star-row"
                            role="radiogroup"
                            aria-label="Rate this service"
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className={`bi-star-btn ${
                                  star <= reviewData.rating ? 'active' : ''
                                }`}
                                onClick={() =>
                                  setReviewData({ ...reviewData, rating: star })
                                }
                                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                aria-pressed={star <= reviewData.rating}
                              >
                                <FiStar size={18} aria-hidden="true" />
                              </button>
                            ))}
                          </div>
                          <label htmlFor={`review-text-${b._id}`} className="sr-only">
                            Describe your service experience
                          </label>
                          <textarea
                            id={`review-text-${b._id}`}
                            className="bi-review-textarea"
                            placeholder="Describe your service experience"
                            value={reviewData.comment}
                            onChange={(e) =>
                              setReviewData({ ...reviewData, comment: e.target.value })
                            }
                            rows={3}
                          />
                          <button
                            type="button"
                            onClick={() => handleReviewSubmit(b._id)}
                            className="btn btn-primary btn-sm"
                            disabled={submittingReview}
                          >
                            <FiCheckCircle size={14} aria-hidden="true" />
                            <span>{submittingReview ? 'Submitting...' : 'Submit review'}</span>
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Profile;
