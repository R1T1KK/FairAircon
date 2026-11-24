import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import { FiSearch } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import '../Admin.css';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const socketRef = useRef(null);
  const notifiedBookingsRef = useRef(new Set());

  useEffect(() => {
    fetchBookings();
    fetchTechnicians();
  }, [statusFilter]);

  // Socket.IO for real-time WhatsApp booking notifications
  useEffect(() => {
    const token = localStorage.getItem('airfix_token');
    if (!token) return;

    const SOCKET_BASE = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    
    const socket = io(SOCKET_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Admin Socket connected for booking notifications');
    });

    socket.on('new_whatsapp_booking', (data) => {
      const bookingId = data.booking?._id || data.booking?.externalBookingId;
      
      // Prevent duplicate notifications
      if (notifiedBookingsRef.current.has(bookingId)) return;
      notifiedBookingsRef.current.add(bookingId);
      
      // Play notification sound (respects autoplay)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1xeHSHeIOLeHB5b3V+gHaFjIR1b3JvdHt+eIKKhHdxcW92fH55g4mGe3Vycnh+fnqBh4R6dnR0en9+eoGGg3t3dXZ7f356gYWBe3h2eHx/fXuBhIF7eXd5fH99fICDgHt5eHp9f318gIKAe3l4en1/fXyAgoB7enh6fX99fICCgHt6eXt+f319gIJ/fHp5e35/fX2Agn98enl7fn99fYCBf3x6ent+f319gIF/fHt6e35/fX2AgX98e3p7fn99fYCBf3x7ent+f319gIF/fHt7fH5/fX2AgX98e3t8fn99fYCBf3x7e3x+f31+gIF/fHt7fH5/fX6AgX98fHt8fn9+fn+Bf3x8fHx+f35+f4F/fHx8fH5/fn5/gX98fHx8fn9+fn+Bf3x8fHx+f35+f4F/fHx8fX9/fn5/gX9+fHx9f39+fn+Af35+fX1/f35+f4B/fn5+fn9/f39/gH9+fn5+f39/f3+Af35+fn5/f39/f4B/fn5+fn9/f39/gH9+fn5/f39/f3+Af35+fn9/f39/f4B/fn5+f39/f3+Af35+fn9/f39/f4B/');
        audio.volume = 0.5;
        audio.play().catch(() => {}); // Silently fail if autoplay blocked
      } catch (e) {}
      
      // Show notification toast
      toast.success(
        `🟢 New WhatsApp Booking!\n${data.booking?.user?.name || 'Customer'} — ${data.booking?.service?.name || 'Service'}`,
        { duration: 6000, icon: '📱' }
      );
      
      // Auto-refresh bookings list
      fetchBookings();
    });

    socket.on('disconnect', () => {
      console.log('Admin Socket disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/admin/bookings', { params });
      setBookings(res.data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/admin/technicians');
      setTechnicians(res.data.technicians);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await api.put(`/admin/bookings/${bookingId}`, { status: newStatus });
      toast.success('Status updated');
      fetchBookings();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleAssignTechnician = async (bookingId, techId) => {
    try {
      await api.put(`/admin/bookings/${bookingId}`, { technician: techId });
      toast.success('Technician assigned');
      fetchBookings();
    } catch (err) {
      toast.error('Assignment failed');
    }
  };

  const filtered = bookings.filter(b => {
    // Source filter
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
      <h1 className="admin-page-title">Manage Bookings</h1>

      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              className="admin-search"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name, email, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="assigned">Assigned</option>
            <option value="on-the-way">On the Way</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="admin-filter-select" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">All Sources</option>
            <option value="website">🌐 Website</option>
            <option value="whatsapp">📱 WhatsApp</option>
          </select>
        </div>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No bookings found</td></tr>
            ) : (
              filtered.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div className="td-name">{b.user?.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{b.user?.phone}</div>
                  </td>
                  <td>{b.service?.name}</td>
                  <td>
                    {b.source === 'whatsapp' ? (
                      <span className="badge badge-whatsapp" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: '0.78rem', borderRadius: '4px', background: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>
                        <BsWhatsapp size={12} /> WhatsApp
                      </span>
                    ) : (
                      <span className="badge" style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: '4px', background: '#e0f2fe', color: '#0284c7', fontWeight: 600 }}>
                        🌐 Website
                      </span>
                    )}
                  </td>
                  <td>{new Date(b.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td>{b.timeSlot}</td>
                  <td style={{ fontWeight: 600 }}>₹{b.totalAmount}</td>
                  <td>
                    <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-confirmed' : 'badge-pending'}`} style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px' }}>
                      {b.paymentStatus?.toUpperCase() || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <select className="table-status-select" value={b.status} onChange={(e) => handleStatusChange(b._id, e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="assigned">Assigned</option>
                      <option value="on-the-way">On the Way</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <select className="table-status-select" value={b.technician?._id || ''} onChange={(e) => handleAssignTechnician(b._id, e.target.value)}>
                      <option value="">Assign...</option>
                      {technicians.map((t) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageBookings;
