import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiMapPin, FiPhone, FiCheckCircle, FiTool, FiCalendar, FiRefreshCw, FiNavigation } from 'react-icons/fi';
import { io } from 'socket.io-client';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import '../admin/Admin.css';

const TechnicianDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [trackingJobId, setTrackingJobId] = useState(null);
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    fetchJobs();

    // Initialize Socket.io
    const token = localStorage.getItem('token');
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const startTracking = (jobId) => {
    if (!navigator.geolocation) {
      return toast.error('Geolocation is not supported by your browser');
    }

    setTrackingJobId(jobId);
    toast.success('Live location sharing started');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socketRef.current.emit('update_location', {
          bookingId: jobId,
          lat: latitude,
          lng: longitude
        });
      },
      (err) => {
        console.error('Location Error:', err);
        toast.error('Failed to get location');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingJobId(null);
    toast.info('Location sharing stopped');
  };

  const fetchJobs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/technician/jobs');
      setJobs(res.data.jobs);
      setLastUpdated(new Date());
      if (isManual) toast.success('Tasks updated');
    } catch (err) {
      toast.error('Failed to load assigned jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/technician/jobs/${id}/status`, { status });
      toast.success(`Job marked as ${status.replace('-', ' ')}`);
      
      if (status === 'completed') {
        stopTracking();
      }
      
      fetchJobs();
    } catch (err) {
      toast.error('Could not update status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading your jobs...</div>;

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      <nav style={{ backgroundColor: 'var(--primary-600)', padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <FiTool /> Field Tech Portal
        </h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem' }}>{user?.name}</span>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px', color: 'white', padding: '6px 12px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: 'var(--gray-900)', margin: 0 }}>Your Assigned Jobs</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button 
              onClick={() => fetchJobs(true)} 
              disabled={refreshing}
              style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary-600)', transition: 'all 0.2s' }}
              title="Refresh Jobs"
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', color: 'var(--gray-500)' }}>
            <FiCheckCircle size={40} style={{ marginBottom: '15px', opacity: 0.5 }} />
            <p>You have no assigned jobs right now. Great work!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {jobs.map(job => (
              <div key={job._id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: `4px solid ${job.status === 'completed' ? '#22c55e' : (job.status === 'on-the-way' ? '#eab308' : '#3b82f6')}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: 'var(--gray-900)' }}>{job.service?.name}</h3>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', backgroundColor: job.status === 'completed' ? '#dcfce7' : '#f1f5f9', color: job.status === 'completed' ? '#166534' : 'var(--gray-600)' }}>
                      {job.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}><FiCalendar /> {new Date(job.scheduledDate).toLocaleDateString()}</div>
                    <div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{job.timeSlot}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginBottom: '15px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}><strong>Customer:</strong> {job.user?.name}</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <FiPhone /> <a href={`tel:${job.user?.phone}`} style={{ color: 'var(--primary-600)' }}>{job.user?.phone}</a>
                  </p>
                  <div style={{ margin: '0 0 8px 0', fontSize: '0.95rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <FiMapPin style={{ flexShrink: 0, marginTop: '4px' }} />
                    <span>
                      {job.address?.street}, {job.address?.city}, {job.address?.state} - {job.address?.pincode}
                      <br/>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address?.street + ', ' + job.address?.city + ', ' + job.address?.pincode)}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#38a3f4', display: 'inline-block', marginTop: '4px' }}>Open in Maps</a>
                    </span>
                  </div>
                  {job.notes && (
                    <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #fef3c7', marginTop: '10px' }}>
                      <strong>Notes:</strong> {job.notes}
                    </div>
                  )}
                </div>

                {job.status !== 'completed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {job.status === 'assigned' && (
                        <button 
                          onClick={() => {
                            updateStatus(job._id, 'on-the-way');
                            startTracking(job._id);
                          }} 
                          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#eab308', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <FiNavigation /> Start Travel (On the Way)
                        </button>
                      )}
                      
                      {job.status === 'on-the-way' && (
                        <button onClick={() => updateStatus(job._id, 'completed')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#22c55e', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                          Mark as Job Completed
                        </button>
                      )}
                    </div>
                    
                    {job.status === 'on-the-way' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '8px', background: '#ecfdf5', borderRadius: '6px', color: '#065f46', fontSize: '0.85rem' }}>
                        <div className="pulse-green"></div> 
                        Live Location is being shared with customer
                        <button onClick={stopTracking} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}>Stop</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Add this to your index.css or a separate style block
const styles = `
.pulse-green {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
`;

export default TechnicianDashboard;
