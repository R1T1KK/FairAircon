import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import {
  FiSearch,
  FiMessageCircle,
  FiGlobe,
  FiAlertCircle,
  FiPhone,
  FiEye,
  FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import '../Admin.css';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'on-the-way', label: 'On the Way' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null); // { bookingId, newStatus }
  const socketRef = useRef(null);
  const notifiedBookingsRef = useRef(new Set());

  const fetchBookings = useCallback(async () => {
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/admin/bookings', { params });
      setBookings(res.data.bookings || []);
    } catch {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let active = true;
    const params = {};
    if (statusFilter !== 'all') params.status = statusFilter;

    Promise.all([
      api.get('/admin/bookings', { params }),
      api.get('/admin/technicians')
    ])
      .then(([bookingsRes, techRes]) => {
        if (!active) return;
        setBookings(bookingsRes.data.bookings || []);
        setTechnicians(techRes.data.technicians || []);
        setError('');
      })
      .catch(() => {
        if (active) setError('Failed to load bookings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [statusFilter]);

  // Socket.IO for real-time WhatsApp booking notifications (preserved)
  useEffect(() => {
    const token = localStorage.getItem('airfix_token');
    if (!token) return;

    const SOCKET_BASE = (
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL ||
      'http://localhost:5000'
    ).replace(/\/api\/?$/, '');

    const socket = io(SOCKET_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('new_whatsapp_booking', (data) => {
      const bookingId = data.booking?._id || data.booking?.externalBookingId;
      if (notifiedBookingsRef.current.has(bookingId)) return;
      notifiedBookingsRef.current.add(bookingId);

      try {
        const audio = new Audio(
          'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1xeHSHeIOLeHB5b3V+gHaFjIR1b3JvdHt+eIKKhHdxcW92fH55g4mGe3Vycnh+fnqBh4R6dnR0en9+eoGGg3t3dXZ7f356gYWBe3h2eHx/fXuBhIF7eXd5fH99fICDgHt5eHp9f318gIKAe3l4en1/fXyAgoB7enh6fX99fICCgHt6eXt+f319gIJ/fHp5e35/fX2Agn98enl7fn99fYCBf3x6ent+f319gIF/fHt6e35/fX2AgX98e3p7fn99fYCBf3x7ent+f319gIF/fHt7fH5/fX2AgX98e3t8fn99fYCBf3x7e3x+f31+gIF/fHt7fH5/fX6AgX98fHt8fn9+fn+Bf3x8fHx+f35+f4F/fHx8fH5/fn5/gX98fHx8fn9+fn+Bf3x8fHx+f35+f4F/fHx8fX9/fn5/gX9+fHx9f39+fn+Af35+fX1/f35+f4B/fn5+fn9/f39/gH9+fn5+f39/f3+Af35+fn5/f39/f4B/fn5+fn9/f39/gH9+fn5/f39/f3+Af35+fn9/f39/f4B/fn5+f39/f3+Af35+fn9/f39/f4B/'
        );
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {
        // Ignore audio autoplay block
      }

      toast.success(
        `New WhatsApp Booking: ${data.booking?.user?.name || 'Customer'} — ${
          data.booking?.service?.name || 'Service'
        }`,
        { duration: 6000 }
      );

      fetchBookings();
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [fetchBookings]);

  // Escape key closes modals
  useEffect(() => {
    if (!selectedBooking && !cancelConfirm) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedBooking(null);
        setCancelConfirm(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedBooking, cancelConfirm]);

  const executeStatusChange = async (bookingId, newStatus) => {
    try {
      await api.put(`/admin/bookings/${bookingId}`, { status: newStatus });
      toast.success('Status updated');
      fetchBookings();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleStatusChange = (bookingId, newStatus) => {
    if (newStatus === 'cancelled') {
      setCancelConfirm({ bookingId, newStatus });
      return;
    }
    executeStatusChange(bookingId, newStatus);
  };

  const handleAssignTechnician = async (bookingId, techId) => {
    try {
      await api.put(`/admin/bookings/${bookingId}`, { technician: techId });
      toast.success('Technician assigned');
      fetchBookings();
    } catch {
      toast.error('Assignment failed');
    }
  };

  const filtered = bookings.filter((b) => {
    if (sourceFilter !== 'all' && b.source !== sourceFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.user?.name?.toLowerCase().includes(q) ||
      b.user?.email?.toLowerCase().includes(q) ||
      b.service?.name?.toLowerCase().includes(q) ||
      b.externalBookingId?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Manage Bookings</h1>
          <p className="admin-page-subtitle tabular-nums">
            {filtered.length} booking{filtered.length === 1 ? '' : 's'} shown
          </p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-wrap">
            <FiSearch size={16} className="admin-search-icon" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search bookings"
              className="admin-search"
              placeholder="Search name, email, or service"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            aria-label="Filter by status"
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by source"
            className="admin-filter-select"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="website">Website</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="dash-stat-card admin-state-card" role="alert">
          <FiAlertCircle size={24} aria-hidden="true" />
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setLoading(true);
              fetchBookings();
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Source</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: 40 }}>
                      Loading bookings...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}
                    >
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <div className="td-name">{b.user?.name}</div>
                        <div className="td-sub tabular-nums">{b.user?.phone}</div>
                      </td>
                      <td>{b.service?.name}</td>
                      <td>
                        {b.source === 'whatsapp' ? (
                          <span className="badge badge-completed">
                            <FiMessageCircle size={12} aria-hidden="true" />
                            <span>WhatsApp</span>
                          </span>
                        ) : (
                          <span className="badge badge-in-progress">
                            <FiGlobe size={12} aria-hidden="true" />
                            <span>Website</span>
                          </span>
                        )}
                      </td>
                      <td className="tabular-nums">
                        {new Date(b.scheduledDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </td>
                      <td className="tabular-nums">{b.timeSlot}</td>
                      <td className="td-name tabular-nums">₹{b.totalAmount}</td>
                      <td>
                        <span
                          className={`badge ${
                            b.paymentStatus === 'paid' ? 'badge-completed' : 'badge-pending'
                          }`}
                        >
                          {b.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td>
                        <select
                          aria-label={`Status for ${b.user?.name || 'booking'}`}
                          className="table-status-select"
                          value={b.status}
                          onChange={(e) => handleStatusChange(b._id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          aria-label={`Assign technician for ${b.user?.name || 'booking'}`}
                          className="table-status-select"
                          value={b.technician?._id || ''}
                          onChange={(e) => handleAssignTechnician(b._id, e.target.value)}
                        >
                          <option value="">Assign...</option>
                          {technicians.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-action-btn edit"
                          onClick={() => setSelectedBooking(b)}
                          aria-label={`View details for ${b.user?.name || 'booking'}`}
                        >
                          <FiEye size={14} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="admin-mobile-cards">
            {loading ? (
              <div className="dash-stat-card">Loading bookings...</div>
            ) : filtered.length === 0 ? (
              <div className="dash-stat-card admin-state-card">No bookings found</div>
            ) : (
              filtered.map((b) => (
                <article key={b._id} className="card admin-mobile-card">
                  <div className="amc-top">
                    <div>
                      <div className="td-name">{b.user?.name}</div>
                      <div className="td-sub">
                        {b.service?.name} · <span className="tabular-nums">₹{b.totalAmount}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="table-action-btn edit"
                      onClick={() => setSelectedBooking(b)}
                    >
                      Details
                    </button>
                  </div>

                  <div className="td-sub tabular-nums">
                    {new Date(b.scheduledDate).toLocaleDateString('en-IN')} · {b.timeSlot}
                  </div>

                  <div className="amc-controls">
                    <select
                      aria-label={`Status for ${b.user?.name || 'booking'}`}
                      className="table-status-select"
                      value={b.status}
                      onChange={(e) => handleStatusChange(b._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={`Assign technician for ${b.user?.name || 'booking'}`}
                      className="table-status-select"
                      value={b.technician?._id || ''}
                      onChange={(e) => handleAssignTechnician(b._id, e.target.value)}
                    >
                      <option value="">Assign...</option>
                      {technicians.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedBooking(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-detail-title"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 id="booking-detail-title" style={{ margin: 0 }}>
                Booking Details
              </h2>
              <button
                type="button"
                autoFocus
                onClick={() => setSelectedBooking(null)}
                className="btn btn-ghost btn-sm"
                aria-label="Close modal"
              >
                <FiX size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="admin-detail-rows">
              <div className="admin-detail-row">
                <span>Booking ID</span>
                <strong className="tabular-nums">{selectedBooking._id}</strong>
              </div>
              <div className="admin-detail-row">
                <span>Customer</span>
                <strong>{selectedBooking.user?.name}</strong>
              </div>
              <div className="admin-detail-row">
                <span>Phone</span>
                <strong>
                  {selectedBooking.user?.phone ? (
                    <a href={`tel:${selectedBooking.user.phone}`} style={{ color: 'var(--cobalt)' }}>
                      <FiPhone size={13} style={{ marginRight: 4 }} aria-hidden="true" />
                      {selectedBooking.user.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </strong>
              </div>
              <div className="admin-detail-row">
                <span>Service</span>
                <strong>{selectedBooking.service?.name}</strong>
              </div>
              <div className="admin-detail-row">
                <span>Schedule</span>
                <strong className="tabular-nums">
                  {new Date(selectedBooking.scheduledDate).toLocaleDateString('en-IN')} ·{' '}
                  {selectedBooking.timeSlot}
                </strong>
              </div>
              <div className="admin-detail-row">
                <span>Address</span>
                <strong>
                  {selectedBooking.address?.street}, {selectedBooking.address?.city},{' '}
                  {selectedBooking.address?.state} - {selectedBooking.address?.pincode}
                </strong>
              </div>
              {selectedBooking.notes && (
                <div className="admin-detail-row">
                  <span>Notes</span>
                  <strong>{selectedBooking.notes}</strong>
                </div>
              )}
              <div className="admin-detail-row">
                <span>Amount</span>
                <strong className="tabular-nums">₹{selectedBooking.totalAmount}</strong>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="btn-cancel-edit"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelConfirm && (
        <div
          className="admin-modal-overlay"
          onClick={() => setCancelConfirm(null)}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="cancel-confirm-title"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="cancel-confirm-title">Cancel this booking?</h2>
            <p className="admin-page-subtitle" style={{ marginBottom: 20 }}>
              This will mark the booking as cancelled. You can still update status later if needed.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                autoFocus
                className="btn-cancel-edit"
                onClick={() => setCancelConfirm(null)}
              >
                Keep booking
              </button>
              <button
                type="button"
                className="btn-save"
                style={{ backgroundColor: 'var(--danger)' }}
                onClick={() => {
                  const { bookingId, newStatus } = cancelConfirm;
                  setCancelConfirm(null);
                  executeStatusChange(bookingId, newStatus);
                }}
              >
                Confirm cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookings;
