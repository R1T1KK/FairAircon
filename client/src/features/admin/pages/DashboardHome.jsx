import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { FiCalendar, FiUsers, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../Admin.css';

const DashboardHome = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-main-content"><p>Loading dashboard...</p></div>;
  if (!data) return <div className="admin-main-content"><p>Failed to load dashboard</p></div>;

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <div className="dsc-header">
            <div className="dsc-icon blue"><FiCalendar /></div>
            <span className="dsc-label">Total Bookings</span>
          </div>
          <div className="dsc-value">{data.totalBookings}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dsc-header">
            <div className="dsc-icon green"><FiCheckCircle /></div>
            <span className="dsc-label">Completed</span>
          </div>
          <div className="dsc-value">{data.completedBookings}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dsc-header">
            <div className="dsc-icon orange"><FiDollarSign /></div>
            <span className="dsc-label">Revenue</span>
          </div>
          <div className="dsc-value">₹{data.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dsc-header">
            <div className="dsc-icon purple"><FiUsers /></div>
            <span className="dsc-label">Total Users</span>
          </div>
          <div className="dsc-value">{data.totalUsers}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Monthly Bookings (Last 6 Months)</h3>
          {data.monthlyBookings.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyBookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="url(#blueGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38a3f4" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '60px 0' }}>No data yet</p>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Weekly Bookings (Last 8 Weeks)</h3>
          {data.weeklyBookings.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.weeklyBookings.map(w => ({ ...w, weekLabel: `Week ${w._id}` }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  labelFormatter={(value, items) => {
                    const item = items[0]?.payload;
                    if (item && item.startDate) {
                      const d = new Date(item.startDate);
                      return `Week ${item._id} (Starting ${d.toLocaleDateString()})`;
                    }
                    return value;
                  }}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                />
                <Bar dataKey="count" fill="url(#greenGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '60px 0' }}>No data yet</p>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Recent Bookings</h3>
          {data.recentBookings.map((b) => (
            <div key={b._id} className="recent-booking-item">
              <div className="rbi-info">
                <h4>{b.user?.name || 'User'}</h4>
                <span>{b.service?.name || 'Service'}</span>
                {b.technician && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 600, marginTop: '2px' }}>
                    Technician: {b.technician.name}
                  </div>
                )}
              </div>
              <span className={`badge badge-${b.status}`}>{b.status}</span>
            </div>
          ))}
          {data.recentBookings.length === 0 && (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>No bookings yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
