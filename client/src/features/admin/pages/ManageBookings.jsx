import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../Admin.css';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchTechnicians();
  }, [statusFilter]);

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
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.user?.name?.toLowerCase().includes(q) ||
      b.user?.email?.toLowerCase().includes(q) ||
      b.service?.name?.toLowerCase().includes(q)
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
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service</th>
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
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No bookings found</td></tr>
            ) : (
              filtered.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div className="td-name">{b.user?.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{b.user?.phone}</div>
                  </td>
                  <td>{b.service?.name}</td>
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
