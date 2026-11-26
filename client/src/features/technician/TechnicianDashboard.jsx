import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FiMapPin,
  FiPhone,
  FiCheckCircle,
  FiTool,
  FiCalendar,
  FiRefreshCw,
  FiNavigation,
  FiUser,
  FiLogOut,
  FiClock,
  FiAlertCircle,
  FiRadio,
  FiWifiOff
} from 'react-icons/fi';
import { io } from 'socket.io-client';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './TechnicianDashboard.css';

const STATUS_LABELS = {
  assigned: 'Assigned',
  'on-the-way': 'On the way',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const TechnicianDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'history' | 'profile'
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState(null);
  const [confirmCompleteId, setConfirmCompleteId] = useState(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Location & socket sharing states:
  // 'not-sharing' | 'requesting' | 'denied' | 'sharing' | 'reconnecting' | 'disconnected'
  const [trackingJobId, setTrackingJobId] = useState(null);
  const [locationState, setLocationState] = useState('not-sharing');
  const [lastSentAt, setLastSentAt] = useState(null);

  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  const fetchJobs = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setJobsError('');
    try {
      const res = await api.get('/technician/jobs');
      setJobs(res.data.jobs || []);
      setLastUpdated(new Date());
      if (isManual) toast.success('Tasks updated');
    } catch {
      setJobsError('Failed to load assigned jobs. Please try again.');
      toast.error('Failed to load assigned jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get('/technician/jobs')
      .then((res) => {
        if (!active) return;
        setJobs(res.data.jobs || []);
        setLastUpdated(new Date());
      })
      .catch(() => {
        if (!active) return;
        setJobsError('Failed to load assigned jobs. Please try again.');
        toast.error('Failed to load assigned jobs');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    if (!localStorage.getItem('airfix_token')) {
      return () => {
        active = false;
      };
    }
    if (socketRef.current) {
      return () => {
        active = false;
      };
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: (cb) => cb({ token: localStorage.getItem('airfix_token') })
    });
    socketRef.current = socket;

    const handleConnect = () => {
      setLocationState((prev) =>
        prev === 'reconnecting' || prev === 'disconnected'
          ? watchIdRef.current
            ? 'sharing'
            : 'not-sharing'
          : prev
      );
    };

    const handleDisconnect = () => {
      if (watchIdRef.current) setLocationState('disconnected');
    };

    const handleReconnectAttempt = () => {
      if (watchIdRef.current) setLocationState('reconnecting');
    };

    const handleConnectError = (err) => {
      const isAuthError =
        err?.message === 'Authentication error' ||
        err?.message === 'User not found' ||
        !localStorage.getItem('airfix_token');

      if (isAuthError) {
        socket.io.opts.reconnection = false;
        socket.disconnect();
        setLocationState('disconnected');
        toast.error('Session expired. Please log in again.');
        logout();
        navigate('/login');
      } else if (watchIdRef.current) {
        setLocationState('reconnecting');
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('connect_error', handleConnectError);

    return () => {
      active = false;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
      socketRef.current = null;
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [logout, navigate]);

  const startTracking = (jobId) => {
    if (!navigator.geolocation) {
      setLocationState('denied');
      return toast.error('Geolocation is not supported by your browser');
    }

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTrackingJobId(jobId);
    setLocationState('requesting');
    toast.success('Live location sharing started');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (socketRef.current?.connected) {
          socketRef.current.emit('update_location', {
            bookingId: jobId,
            lat: latitude,
            lng: longitude
          });
          setLocationState('sharing');
          setLastSentAt(new Date());
        } else {
          setLocationState('reconnecting');
        }
      },
      (err) => {
        if (err?.code === 1) {
          setLocationState('denied');
          toast.error('Location permission denied');
        } else {
          setLocationState('not-sharing');
          toast.error('Failed to get location');
        }
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
    setLocationState('not-sharing');
    toast('Location sharing stopped');
  };

  const updateStatus = async (id, status) => {
    setUpdatingJobId(id);
    try {
      await api.put(`/technician/jobs/${id}/status`, { status });
      toast.success(`Job marked as ${status.replace('-', ' ')}`);

      if (status === 'completed') {
        stopTracking();
        setConfirmCompleteId(null);
      }

      fetchJobs();
    } catch {
      toast.error('Could not update status');
    } finally {
      setUpdatingJobId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeJobs = jobs.filter(
    (j) => j.status !== 'completed' && j.status !== 'cancelled'
  );
  const historyJobs = jobs.filter(
    (j) => j.status === 'completed' || j.status === 'cancelled'
  );

  const renderLocationPanel = () => {
    const stateInfo = {
      'not-sharing': {
        title: 'Location sharing is off',
        sub: 'Start travel on an assigned job to share your live location with the customer.'
      },
      requesting: {
        title: 'Requesting location permission...',
        sub: 'Allow GPS access in your browser prompt to start sharing.'
      },
      denied: {
        title: 'Location permission denied',
        sub: 'Enable Location in your browser site settings (lock icon near address bar) and phone GPS, then tap Start Live Location again.'
      },
      sharing: {
        title: 'Sharing live location',
        sub: lastSentAt
          ? `Last sent at ${lastSentAt.toLocaleTimeString('en-IN')}`
          : 'Sending GPS updates to customer'
      },
      reconnecting: {
        title: 'Reconnecting to server...',
        sub: 'Waiting for network connection to resume location updates.'
      },
      disconnected: {
        title: 'Connection paused',
        sub: 'Live updates paused while disconnected.'
      }
    }[locationState];

    return (
      <section
        className={`card tech-location-panel state-${locationState}`}
        aria-live="polite"
        aria-label="Live location status"
      >
        <div className="tlp-row">
          <div className="tlp-status">
            <div className="tlp-icon" aria-hidden="true">
              {locationState === 'denied' ? (
                <FiAlertCircle size={18} />
              ) : locationState === 'sharing' ? (
                <FiRadio size={18} />
              ) : (
                <FiNavigation size={18} />
              )}
            </div>
            <div>
              <span className="tlp-title">{stateInfo.title}</span>
              <span className="tlp-sub">{stateInfo.sub}</span>
            </div>
          </div>

          {trackingJobId && (
            <button
              type="button"
              onClick={stopTracking}
              className="btn btn-secondary btn-sm"
            >
              Stop sharing
            </button>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="tech-shell">
      {/* Desktop Sidebar */}
      <aside className="tech-sidebar" aria-label="Technician navigation">
        <div className="tech-sidebar-header">
          <FiTool size={18} aria-hidden="true" />
          <span>Field Tech Portal</span>
        </div>

        <nav className="tech-sidebar-nav">
          <button
            type="button"
            className={`tech-nav-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <FiCalendar size={17} aria-hidden="true" />
            <span>Active Jobs ({activeJobs.length})</span>
          </button>
          <button
            type="button"
            className={`tech-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FiCheckCircle size={17} aria-hidden="true" />
            <span>History ({historyJobs.length})</span>
          </button>
          <button
            type="button"
            className={`tech-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser size={17} aria-hidden="true" />
            <span>Profile</span>
          </button>
        </nav>

        <div className="tech-sidebar-footer">
          <button type="button" onClick={handleLogout} className="tech-logout-sidebar">
            <FiLogOut size={16} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="tech-main">
        <header className="tech-topbar">
          <div className="tech-topbar-brand">
            <FiTool size={18} aria-hidden="true" />
            <span>Field Tech</span>
          </div>

          <div className="tech-topbar-meta">
            <span className="tech-updated-text tabular-nums">
              Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              type="button"
              onClick={() => fetchJobs(true)}
              disabled={refreshing}
              className="tech-refresh-btn"
              aria-label="Refresh jobs"
              title="Refresh Jobs"
            >
              <FiRefreshCw size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="tech-content">
          {!isOnline && (
            <div className="tech-offline-banner" role="alert">
              <FiWifiOff size={18} aria-hidden="true" />
              <span>You are offline. Status updates and live location require internet access.</span>
            </div>
          )}

          {activeTab === 'jobs' && (
            <>
              {renderLocationPanel()}

              <div className="tech-section-header">
                <h1>Assigned jobs</h1>
                <span className="tech-count-meta tabular-nums">
                  {activeJobs.length} active job{activeJobs.length === 1 ? '' : 's'}
                </span>
              </div>

              {loading ? (
                <div className="tech-jobs-list" aria-label="Loading jobs">
                  {[1, 2].map((n) => (
                    <div key={n} className="card tech-job-card tech-skel" aria-hidden="true">
                      <div className="skel-line title" />
                      <div className="skel-line" />
                      <div className="skel-line short" />
                    </div>
                  ))}
                </div>
              ) : jobsError ? (
                <div className="card tech-state-card" role="alert">
                  <FiAlertCircle size={24} aria-hidden="true" />
                  <p>{jobsError}</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setLoading(true);
                      fetchJobs();
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : activeJobs.length === 0 ? (
                <div className="card tech-state-card">
                  <FiCheckCircle size={28} aria-hidden="true" />
                  <p>No active jobs assigned right now.</p>
                </div>
              ) : (
                <div className="tech-jobs-list">
                  {activeJobs.map((job) => {
                    const isOnTheWay = job.status === 'on-the-way';
                    const isUpdating = updatingJobId === job._id;
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${job.address?.street || ''}, ${job.address?.city || ''}, ${job.address?.pincode || ''}`
                    )}`;

                    return (
                      <article
                        key={job._id}
                        className={`card tech-job-card ${isOnTheWay ? 'is-on-the-way' : ''}`}
                      >
                        <div className="tjc-header">
                          <div>
                            <h2>{job.service?.name || 'AC Service'}</h2>
                            <span
                              className={`badge ${
                                isOnTheWay ? 'badge-pending' : 'badge-in-progress'
                              }`}
                            >
                              <span className="status-dot" aria-hidden="true" />
                              <span>{STATUS_LABELS[job.status] || job.status}</span>
                            </span>
                          </div>
                          <div className="tjc-schedule tabular-nums">
                            <div>{new Date(job.scheduledDate).toLocaleDateString('en-IN')}</div>
                            <div className="tjc-slot">{job.timeSlot}</div>
                          </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="tjc-timeline" aria-label="Job progress">
                          <div className={`tjc-step ${isOnTheWay ? 'done' : 'current'}`}>
                            <span className="tjc-step-dot" aria-hidden="true" />
                            <span>Assigned</span>
                          </div>
                          <div className={`tjc-step ${isOnTheWay ? 'current' : ''}`}>
                            <span className="tjc-step-dot" aria-hidden="true" />
                            <span>On the way</span>
                          </div>
                          <div className="tjc-step">
                            <span className="tjc-step-dot" aria-hidden="true" />
                            <span>Completed</span>
                          </div>
                        </div>

                        <div className="tjc-details">
                          <div className="tjc-customer-row">
                            <div>
                              <strong>{job.user?.name || 'Customer'}</strong>
                              {job.totalAmount && (
                                <span className="tech-count-meta tabular-nums">
                                  {' '}
                                  · ₹{job.totalAmount.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="tjc-address">
                            <FiMapPin size={18} aria-hidden="true" />
                            <span>
                              {job.address?.street}, {job.address?.city}, {job.address?.state} -{' '}
                              {job.address?.pincode}
                            </span>
                          </div>

                          {job.notes && (
                            <div className="tjc-notes">
                              <strong>Notes:</strong> {job.notes}
                            </div>
                          )}
                        </div>

                        {/* One-hand friendly field links */}
                        <div className="tjc-quick-links">
                          {job.user?.phone ? (
                            <a
                              href={`tel:${job.user.phone}`}
                              className="btn btn-secondary tech-field-btn"
                            >
                              <FiPhone size={17} aria-hidden="true" />
                              <span>Call customer</span>
                            </a>
                          ) : (
                            <span />
                          )}
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary tech-field-btn"
                          >
                            <FiMapPin size={17} aria-hidden="true" />
                            <span>Open in Maps</span>
                          </a>
                        </div>

                        {/* Primary Field Action */}
                        <div className="tjc-actions-stack">
                          {job.status === 'assigned' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => {
                                updateStatus(job._id, 'on-the-way');
                                startTracking(job._id);
                              }}
                              className="btn btn-primary tech-field-btn"
                            >
                              <FiNavigation size={17} aria-hidden="true" />
                              <span>
                                {isUpdating ? 'Updating...' : 'Start Travel (On the Way)'}
                              </span>
                            </button>
                          )}

                          {isOnTheWay && trackingJobId !== job._id && (
                            <button
                              type="button"
                              onClick={() => startTracking(job._id)}
                              className="btn btn-accent tech-field-btn"
                            >
                              <FiRadio size={17} aria-hidden="true" />
                              <span>Start Live Location</span>
                            </button>
                          )}

                          {isOnTheWay && (
                            confirmCompleteId === job._id ? (
                              <div className="tech-confirm-box" role="alertdialog" aria-label="Confirm job completion">
                                <p>Mark this job as completed?</p>
                                <div className="tech-confirm-btns">
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => updateStatus(job._id, 'completed')}
                                    className="btn tech-complete-btn tech-field-btn"
                                  >
                                    {isUpdating ? 'Saving...' : 'Yes, Complete'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => setConfirmCompleteId(null)}
                                    className="btn btn-secondary tech-field-btn"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => setConfirmCompleteId(job._id)}
                                className="btn tech-complete-btn tech-field-btn"
                              >
                                <FiCheckCircle size={17} aria-hidden="true" />
                                <span>Mark as Job Completed</span>
                              </button>
                            )
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              <div className="tech-section-header">
                <h1>Service history</h1>
                <span className="tech-count-meta tabular-nums">
                  {historyJobs.length} completed / past job{historyJobs.length === 1 ? '' : 's'}
                </span>
              </div>

              {historyJobs.length === 0 ? (
                <div className="card tech-state-card">
                  <FiClock size={24} aria-hidden="true" />
                  <p>No completed jobs yet.</p>
                </div>
              ) : (
                <div className="tech-jobs-list">
                  {historyJobs.map((job) => (
                    <article key={job._id} className="card tech-job-card is-completed">
                      <div className="tjc-header">
                        <div>
                          <h2>{job.service?.name || 'AC Service'}</h2>
                          <span className="badge badge-completed">
                            <span className="status-dot" aria-hidden="true" />
                            <span>{STATUS_LABELS[job.status] || job.status}</span>
                          </span>
                        </div>
                        <div className="tjc-schedule tabular-nums">
                          <div>{new Date(job.scheduledDate).toLocaleDateString('en-IN')}</div>
                          <div className="tjc-slot">{job.timeSlot}</div>
                        </div>
                      </div>
                      <p className="tech-count-meta">
                        {job.user?.name} · {job.address?.city} - {job.address?.pincode}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <div className="tech-section-header">
                <h1>Technician profile</h1>
              </div>

              <div className="card tech-profile-card">
                <div className="tech-profile-row">
                  <span>Name</span>
                  <strong>{user?.name}</strong>
                </div>
                <div className="tech-profile-row">
                  <span>Email</span>
                  <strong>{user?.email}</strong>
                </div>
                <div className="tech-profile-row">
                  <span>Phone</span>
                  <strong className="tabular-nums">{user?.phone || 'Not set'}</strong>
                </div>
                <div className="tech-profile-row">
                  <span>Role</span>
                  <strong>{user?.role}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary tech-field-btn"
                >
                  <FiLogOut size={17} aria-hidden="true" />
                  <span>Log out</span>
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="tech-mobile-nav" aria-label="Technician tabs">
        <button
          type="button"
          className={`tech-mobile-tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <FiCalendar size={18} aria-hidden="true" />
          <span>Jobs ({activeJobs.length})</span>
        </button>
        <button
          type="button"
          className={`tech-mobile-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FiCheckCircle size={18} aria-hidden="true" />
          <span>History</span>
        </button>
        <button
          type="button"
          className={`tech-mobile-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FiUser size={18} aria-hidden="true" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default TechnicianDashboard;
