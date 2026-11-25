import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import {
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import '../Admin.css';

const DashboardHome = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get('/admin/dashboard')
      .then((res) => {
        if (active) setData(res.data.data);
      })
      .catch(() => {
        if (active) setError('Failed to load dashboard data. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">Loading overview...</p>
          </div>
        </div>
        <div className="dashboard-stats" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="dash-stat-card" style={{ minHeight: 112 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dash-stat-card admin-state-card" role="alert">
        <FiAlertCircle size={24} aria-hidden="true" />
        <p>{error || 'Failed to load dashboard'}</p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setLoading(true);
            loadDashboard();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">
            Operations overview across bookings, revenue, and users
          </p>
        </div>
        <Link to="/admin/bookings" className="btn btn-primary btn-sm">
          <span>Manage bookings</span>
          <FiArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <div className="dsc-header">
            <span className="dsc-label">Total Bookings</span>
            <div className="dsc-icon blue">
              <FiCalendar size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="dsc-value">{data.totalBookings}</div>
        </div>

        <div className="dash-stat-card">
          <div className="dsc-header">
            <span className="dsc-label">Completed</span>
            <div className="dsc-icon green">
              <FiCheckCircle size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="dsc-value">{data.completedBookings}</div>
        </div>

        <div className="dash-stat-card">
          <div className="dsc-header">
            <span className="dsc-label">Revenue</span>
            <div className="dsc-icon orange">
              <FiDollarSign size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="dsc-value">₹{data.totalRevenue.toLocaleString('en-IN')}</div>
        </div>

        <div className="dash-stat-card">
          <div className="dsc-header">
            <span className="dsc-label">Total Users</span>
            <div className="dsc-icon navy">
              <FiUsers size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="dsc-value">{data.totalUsers}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Monthly Bookings (Last 6 Months)</h2>
          {data.monthlyBookings.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthlyBookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff4" />
                <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid rgba(15,41,66,0.1)',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.08)'
                  }}
                />
                <Bar dataKey="count" fill="#1e6fd9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="admin-page-subtitle" style={{ textAlign: 'center', padding: '48px 0' }}>
              No monthly booking data yet.
            </p>
          )}
        </div>

        <div className="dashboard-card">
          <h2>Weekly Bookings (Last 8 Weeks)</h2>
          {data.weeklyBookings.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.weeklyBookings.map((w) => ({
                  ...w,
                  weekLabel: `W${w._id}`
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff4" />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  labelFormatter={(value, items) => {
                    const item = items[0]?.payload;
                    if (item && item.startDate) {
                      const d = new Date(item.startDate);
                      return `Week ${item._id} (${d.toLocaleDateString('en-IN')})`;
                    }
                    return value;
                  }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid rgba(15,41,66,0.1)',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.08)'
                  }}
                />
                <Bar dataKey="count" fill="#0f2942" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="admin-page-subtitle" style={{ textAlign: 'center', padding: '48px 0' }}>
              No weekly booking data yet.
            </p>
          )}
        </div>

        <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
          <h2>Recent Bookings</h2>
          {data.recentBookings.length === 0 ? (
            <p className="admin-page-subtitle" style={{ textAlign: 'center', padding: '32px 0' }}>
              No bookings yet.
            </p>
          ) : (
            data.recentBookings.map((b) => (
              <div key={b._id} className="recent-booking-item">
                <div className="rbi-info">
                  <h3>{b.user?.name || 'User'}</h3>
                  <span>{b.service?.name || 'Service'}</span>
                  {b.technician && (
                    <div className="rbi-tech">Technician: {b.technician.name}</div>
                  )}
                </div>
                <span className={`badge badge-${b.status === 'completed' ? 'completed' : b.status === 'cancelled' ? 'cancelled' : b.status === 'pending' ? 'pending' : 'in-progress'}`}>
                  <span className="status-dot" aria-hidden="true" />
                  <span>{b.status.replace('-', ' ')}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
