import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit2, FiX, FiCheckCircle, FiChevronRight, FiCamera } from 'react-icons/fi';
import { FaStar, FaRegStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

import './Profile.css';

const Profile = () => {
  const { user, updateProfile, updateAvatar } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [form, setForm] = useState({
    name: '', phone: '',
    address: { street: '', city: '', state: '', pincode: '' }
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || { street: '', city: '', state: '', pincode: '' }
      });
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return toast.error('File size too large (Max 2MB)');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      await updateAvatar(formData);
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(form);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleReviewSubmit = async (bookingId) => {
    if (!reviewData.comment.trim()) return toast.error('Please add a comment');
    try {
      await api.post('/reviews', { bookingId, rating: reviewData.rating, comment: reviewData.comment });
      toast.success('Thank you for your review!');
      setReviewingId(null);
      setReviewData({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <div className="profile-page">
      {/* Background Elements */}
      <div className="mesh-gradient">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="container profile-container">
        <div className="profile-grid">
          
          {/* Side Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card profile-pillar"
          >
            <div className="profile-avatar-wrapper group">
              <div className="avatar-main">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="avatar-img" />
                ) : (
                  user?.name?.[0]?.toUpperCase()
                )}
                
                {/* Upload Overlay */}
                <label className="avatar-upload-overlay">
                  <input type="file" hidden accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
                  {uploading ? (
                    <div className="spinner-sm"></div>
                  ) : (
                    <FiCamera size={24} />
                  )}
                </label>
              </div>
              <div className="avatar-ring"></div>
            </div>

            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div 
                  key="edit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="profile-edit-form"
                >
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
                  <input value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} placeholder="City" />
                  <div className="profile-edit-actions">
                    <button onClick={handleSave} className="btn-save">Save changes</button>
                    <button onClick={() => setEditing(false)} className="btn-cancel-edit">Cancel</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="profile-view-content"
                >
                  <h2>{user?.name}</h2>
                  <p className="profile-subtitle">Premium Member</p>
                  
                  <div className="profile-info">
                    <div className="profile-info-item"><FiMail /> {user?.email}</div>
                    <div className="profile-info-item"><FiPhone /> {user?.phone}</div>
                    {user?.address?.city && (
                      <div className="profile-info-item"><FiMapPin /> {user.address.city}</div>
                    )}
                  </div>

                  <button onClick={() => setEditing(true)} className="profile-edit-btn">
                    <FiEdit2 /> Edit Details
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Main Content Area */}
          <div className="main-content">
            


            {/* Bookings Section */}
            <div className="bookings-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FiCalendar className="text-sky-500" /> Booking History
                </h2>
                <span className="text-sm font-medium text-slate-400">{bookings.length} total services</span>
              </div>

              {loading ? (
                <div className="flex justify-center p-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="glass-card p-20 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FiCalendar scale={2} color="#cbd5e1" />
                  </div>
                  <p className="text-slate-500">No bookings yet. Ready for your first clean?</p>
                  <Link to="/services" className="text-sky-500 font-semibold mt-2 inline-block">Explore Services</Link>
                </div>
              ) : (
                <div className="bookings-list">
                  {bookings.map((b, i) => (
                    <motion.div 
                      key={b._id} 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card booking-item-glass"
                    >
                      <div className="bi-header">
                        <div className="bi-title">
                          <h3>{b.service?.name}</h3>
                          <span className="bi-id">REF: {b._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                           <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-confirmed' : 'badge-pending'}`}>
                            {b.paymentStatus.toUpperCase()}
                          </span>
                          <span className={`badge badge-${b.status}`}>
                            {b.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="bi-meta">
                        <div className="meta-item"><FiCalendar /> {new Date(b.scheduledDate).toLocaleDateString()}</div>
                        <div className="meta-item">🕐 {b.timeSlot}</div>
                        <div className="meta-item font-bold text-slate-800">₹{b.totalAmount}</div>
                      </div>

                      {b.technician && (
                        <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100/50 flex align-center gap-3 mb-4">
                           <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                             {b.technician.name[0]}
                           </div>
                           <div className="text-sm">
                             <span className="text-slate-500 block text-xs">Technician Assigned</span>
                             <span className="font-semibold text-slate-700">{b.technician.name}</span>
                           </div>
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        {['pending', 'confirmed', 'assigned', 'on-the-way'].includes(b.status) && (
                          <Link to={`/tracking/${b._id}`} className="flex-1 bg-white/50 border border-slate-200 py-2 rounded-xl text-center text-sm font-semibold hover:bg-white transition-all flex items-center justify-center gap-2">
                             Track Progress <FiChevronRight />
                          </Link>
                        )}
                        {b.status === 'completed' && !b.isReviewed && (
                          <button 
                            onClick={() => setReviewingId(reviewingId === b._id ? null : b._id)} 
                            className="flex-1 bg-white/50 border border-slate-200 py-2 rounded-xl text-center text-sm font-semibold hover:bg-white transition-all flex items-center justify-center gap-2"
                          >
                             {reviewingId === b._id ? 'Cancel' : 'Rate Service'} <FaStar className="text-amber-400" />
                          </button>
                        )}
                        {b.paymentStatus === 'pending' && b.status !== 'cancelled' && (
                          <button onClick={() => toast.success("Redirecting to checkout...")} className="flex-1 bg-sky-500 text-white py-2 rounded-xl text-sm font-bold shadow-lg shadow-sky-200">
                             Finalize Payment
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {reviewingId === b._id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                          >
                            <div className="flex gap-2 mb-3">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                  key={star}
                                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                                  className="text-2xl transition-transform active:scale-95"
                                >
                                  {star <= reviewData.rating ? (
                                    <FaStar className="text-amber-400" />
                                  ) : (
                                    <FaRegStar className="text-slate-300" />
                                  )}
                                </button>
                              ))}
                            </div>
                            <textarea
                              className="w-100 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all outline-none"
                              placeholder="Describe your service experience..."
                              value={reviewData.comment}
                              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                              rows={3}
                            />
                            <button 
                              onClick={() => handleReviewSubmit(b._id)}
                              className="mt-2 w-100 bg-slate-900 text-white py-2 rounded-xl text-sm font-bold hover:bg-black transition-all"
                            >
                              Submit Review
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
