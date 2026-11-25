import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FiMapPin,
  FiCheckCircle,
  FiArrowLeft,
  FiPhone,
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiChevronRight,
  FiRadio
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Tracking.css';

const statuses = [
  { key: 'pending', label: 'Booking received', desc: 'Your request is received and awaiting confirmation.' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Your booking is confirmed. A technician will be assigned shortly.' },
  { key: 'assigned', label: 'Technician assigned', desc: 'A service professional has been assigned to your booking.' },
  { key: 'on-the-way', label: 'On the way', desc: 'Your technician is heading to your service address.' },
  { key: 'completed', label: 'Service completed', desc: 'Work is completed. Your receipt is available in your account.' },
  { key: 'cancelled', label: 'Cancelled', desc: 'This booking has been cancelled.' }
];

const CONNECTION_LABELS = {
  connecting: 'Connecting to live updates',
  live: 'Live updates active',
  reconnecting: 'Reconnecting...',
  disconnected: 'Live updates paused'
};

const Tracking = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [booking, setBooking] = useState(null);
  const [techLocation, setTechLocation] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const socketRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const loadBooking = useCallback(async () => {
    setError('');
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      setBooking(res.data.booking);
      if (res.data.booking?.technician?.currentLocation) {
        setTechLocation(res.data.booking.technician.currentLocation);
        if (res.data.booking.technician.currentLocation.updatedAt) {
          setLastUpdatedAt(new Date(res.data.booking.technician.currentLocation.updatedAt));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking details.');
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    let active = true;
    api
      .get(`/bookings/${bookingId}`)
      .then((res) => {
        if (!active) return;
        setBooking(res.data.booking);
        if (res.data.booking?.technician?.currentLocation) {
          setTechLocation(res.data.booking.technician.currentLocation);
          if (res.data.booking.technician.currentLocation.updatedAt) {
            setLastUpdatedAt(new Date(res.data.booking.technician.currentLocation.updatedAt));
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Failed to load booking details.');
        toast.error('Failed to load booking details');
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
      setConnectionState('live');
      socket.emit('join_booking', bookingId);
    };

    const handleDisconnect = () => {
      setConnectionState('disconnected');
    };

    const handleReconnectAttempt = () => {
      setConnectionState('reconnecting');
    };

    const handleStatusUpdate = (data) => {
      setBooking((prev) =>
        prev ? { ...prev, status: data.status, technician: data.technician } : prev
      );
      toast.success(`Booking status updated to ${data.status}`);
    };

    const handleLocationUpdate = (data) => {
      setTechLocation({ lat: data.lat, lng: data.lng });
      setLastUpdatedAt(new Date(data.timestamp || Date.now()));
    };

    const handleConnectError = (err) => {
      const isAuthError =
        err?.message === 'Authentication error' ||
        err?.message === 'User not found' ||
        !localStorage.getItem('airfix_token');

      if (isAuthError) {
        socket.io.opts.reconnection = false;
        socket.disconnect();
        setConnectionState('disconnected');
        toast.error('Session expired. Please log in again.');
        logout();
        navigate('/login');
      } else {
        setConnectionState('reconnecting');
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('status_update', handleStatusUpdate);
    socket.on('location_update', handleLocationUpdate);
    socket.on('connect_error', handleConnectError);

    return () => {
      active = false;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('status_update', handleStatusUpdate);
      socket.off('location_update', handleLocationUpdate);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [bookingId, logout, navigate]);

  // Initialize & update free Leaflet + OpenStreetMap map when technician location arrives
  useEffect(() => {
    if (!techLocation || !mapContainerRef.current) return;

    const coords = [techLocation.lat, techLocation.lng];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: coords,
        zoom: 15,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const techIcon = L.divIcon({
        className: 'tech-map-marker',
        html: `<div class="tech-marker-pin" aria-label="Technician location"><span class="tech-marker-dot"></span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      markerRef.current = L.marker(coords, { icon: techIcon })
        .addTo(map)
        .bindPopup('Technician Live Location');

      mapInstanceRef.current = map;
    } else {
      markerRef.current?.setLatLng(coords);
      mapInstanceRef.current.panTo(coords, { animate: true });
    }
  }, [techLocation]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <main className="tracking-page">
        <section className="page-header-band">
          <div className="container">
            <h1>Live tracking</h1>
            <p>Loading booking and technician status...</p>
          </div>
        </section>
        <div className="container tracking-shell">
          <div className="card tracking-skel" aria-hidden="true" />
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="tracking-page">
        <section className="page-header-band">
          <div className="container">
            <h1>Live tracking</h1>
          </div>
        </section>
        <div className="container tracking-shell">
          <div className="card tracking-state-card" role="alert">
            <FiAlertCircle size={24} aria-hidden="true" />
            <p>{error || 'Booking not found.'}</p>
            <div className="tracking-state-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setLoading(true);
                  loadBooking();
                }}
              >
                Retry
              </button>
              <Link to="/profile" className="btn btn-secondary btn-sm">
                Back to bookings
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentIndex = statuses.findIndex((s) => s.key === booking.status);
  const currentStatusObj = statuses[currentIndex] || {
    label: booking.status,
    desc: ''
  };
  const isCompletedOrCancelled =
    booking.status === 'completed' || booking.status === 'cancelled';

  return (
    <main className="tracking-page">
      <section className="page-header-band">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <FiChevronRight size={14} aria-hidden="true" />
            <Link to="/profile">My account</Link>
            <FiChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">Live tracking</span>
          </nav>

          <div className="tracking-hero-row">
            <div>
              <h1>{booking.service?.name || 'Service tracking'}</h1>
              <p className="tracking-ref tabular-nums">
                Booking ID: <span>{booking._id}</span>
              </p>
            </div>

            <div className="tracking-connection-pill" aria-live="polite">
              <FiRadio size={14} aria-hidden="true" />
              <span>{CONNECTION_LABELS[connectionState]}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container tracking-shell">
        <div className="tracking-top-actions">
          <Link to="/profile" className="btn btn-secondary btn-sm">
            <FiArrowLeft size={15} aria-hidden="true" />
            <span>Back to bookings</span>
          </Link>
          <div className="tracking-schedule-meta tabular-nums">
            <span>
              <FiCalendar size={14} aria-hidden="true" />
              {new Date(booking.scheduledDate).toLocaleDateString('en-IN')}
            </span>
            <span>
              <FiClock size={14} aria-hidden="true" />
              {booking.timeSlot}
            </span>
          </div>
        </div>

        <div className="tracking-grid">
          {/* Map Column */}
          <div className="map-side">
            <div className="card map-container" aria-label="Technician location map">
              {techLocation && (
                <div className="map-overlay" aria-live="polite">
                  <div className="map-status-card">
                    <span className="status-dot live-dot" aria-hidden="true" />
                    <div>
                      <strong>{currentStatusObj.label}</strong>
                      {lastUpdatedAt && (
                        <span className="map-updated tabular-nums">
                          Updated {lastUpdatedAt.toLocaleTimeString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {techLocation ? (
                <div
                  ref={mapContainerRef}
                  className="leaflet-map-host"
                />
              ) : (
                <div className="map-placeholder">
                  <div className="map-placeholder-icon">
                    <FiMapPin size={24} aria-hidden="true" />
                  </div>
                  <h2>
                    {isCompletedOrCancelled
                      ? `Booking ${currentStatusObj.label.toLowerCase()}`
                      : 'Technician location not shared yet'}
                  </h2>
                  <p>
                    {isCompletedOrCancelled
                      ? currentStatusObj.desc
                      : 'Live map activates automatically once your assigned technician starts travel.'}
                  </p>
                </div>
              )}
            </div>

            {/* Accessible text alternative for map & address */}
            {booking.address?.street && (
              <div className="card tracking-address-bar">
                <FiMapPin size={16} aria-hidden="true" />
                <div>
                  <span className="tracking-addr-label">Service address</span>
                  <p className="tracking-addr-text">
                    {booking.address.street}, {booking.address.city}, {booking.address.state} -{' '}
                    {booking.address.pincode}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Technician + Progress */}
          <aside className="status-side">
            {booking.technician && (
              <div className="card technician-preview-card">
                <div className="tech-avatar" aria-hidden="true">
                  {booking.technician.name?.[0]?.toUpperCase()}
                </div>
                <div className="tech-info">
                  <span className="tech-role-label">Assigned technician</span>
                  <h3>{booking.technician.name}</h3>
                </div>
                {booking.technician.phone && (
                  <a
                    href={`tel:${booking.technician.phone}`}
                    className="btn btn-primary btn-sm"
                  >
                    <FiPhone size={14} aria-hidden="true" />
                    <span>Call</span>
                  </a>
                )}
              </div>
            )}

            <div className="card status-card">
              <h2>Service progress</h2>
              <div className="status-timeline" aria-live="polite">
                {statuses.map((s, i) => {
                  if (s.key === 'cancelled' && booking.status !== 'cancelled') return null;

                  const isCompleted =
                    i < currentIndex ||
                    (booking.status === 'completed' && s.key === 'completed');
                  const isCurrent = i === currentIndex;

                  return (
                    <div
                      key={s.key}
                      className={`timeline-item ${isCompleted ? 'completed' : ''} ${
                        isCurrent ? 'current' : ''
                      }`}
                    >
                      <div className="timeline-icon tabular-nums">
                        {isCompleted ? <FiCheckCircle size={15} aria-hidden="true" /> : i + 1}
                      </div>
                      <div className="timeline-content">
                        <h3>{s.label}</h3>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Tracking;
