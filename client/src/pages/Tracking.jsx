import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiClock, FiMapPin, FiTruck, FiCheckCircle, FiUser, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Tracking.css';

const statuses = [
  { key: 'pending', label: 'Booking Received', desc: 'We have received your booking and are assigning a technician.' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Your booking is confirmed. Technician details will appear soon.' },
  { key: 'assigned', label: 'Technician Assigned', desc: 'A service professional has been assigned to your request.' },
  { key: 'on-the-way', label: 'On the Way', desc: 'Our technician is heading to your location right now!' },
  { key: 'completed', label: 'Service Completed', desc: 'Thank you for choosing AirFix. We hope you are satisfied!' },
  { key: 'cancelled', label: 'Cancelled', desc: 'This booking has been cancelled.' }
];

const Tracking = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [booking, setBooking] = useState(null);
  const [techLocation, setTechLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    fetchBooking();

    if (!localStorage.getItem('airfix_token')) return;
    if (socketRef.current) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: (cb) => cb({ token: localStorage.getItem('airfix_token') })
    });
    socketRef.current = socket;

    const handleConnect = () => {
      socket.emit('join_booking', bookingId);
    };

    const handleStatusUpdate = (data) => {
      setBooking(prev => (prev ? { ...prev, status: data.status, technician: data.technician } : prev));
      toast.success(`Booking status updated to ${data.status}`);
    };

    const handleLocationUpdate = (data) => {
      setTechLocation({ lat: data.lat, lng: data.lng });
    };

    const handleConnectError = (err) => {
      const isAuthError =
        err?.message === 'Authentication error' ||
        err?.message === 'User not found' ||
        !localStorage.getItem('airfix_token');

      if (isAuthError) {
        socket.io.opts.reconnection = false;
        socket.disconnect();
        toast.error('Session expired. Please log in again.');
        logout();
        navigate('/login');
      }
    };

    socket.on('connect', handleConnect);
    socket.on('status_update', handleStatusUpdate);
    socket.on('location_update', handleLocationUpdate);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('status_update', handleStatusUpdate);
      socket.off('location_update', handleLocationUpdate);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [bookingId]);

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
        html: `<div style="background:#1e86e9;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:18px;">🚐</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
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

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      setBooking(res.data.booking);
      if (res.data.booking.technician?.currentLocation) {
        setTechLocation(res.data.booking.technician.currentLocation);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status) => {
    return statuses.findIndex(s => s.key === status);
  };

  if (loading) return <div className="tracking-page"><div className="container">Loading...</div></div>;
  if (!booking) return <div className="tracking-page"><div className="container">Booking not found.</div></div>;

  const currentIndex = getStatusIndex(booking.status);

  return (
    <div className="tracking-page">
      <div className="container">
        <div className="tracking-header">
          <div>
            <Link to="/profile" className="btn-outline-lg" style={{ marginBottom: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              <FiArrowLeft /> Back to Profile
            </Link>
            <h1>Live Tracking</h1>
            <p>Booking ID: <span className="tracking-id">{booking._id}</span></p>
          </div>
          <div className="booking-summary-badge">
            <FiCheckCircle /> {booking.service?.name}
          </div>
        </div>

        <div className="tracking-grid">
          <div className="map-side">
            <div className="map-container">
              {booking.status === 'on-the-way' && techLocation && (
                <div className="map-overlay">
                  <div className="eta-card">
                    <FiTruck className="pulse" />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Estimated Arrival</p>
                      <span className="eta-value">12-15 Mins</span>
                    </div>
                  </div>
                </div>
              )}

              {techLocation ? (
                <div
                  ref={mapContainerRef}
                  style={{ width: '100%', height: '100%', minHeight: '360px', borderRadius: 'inherit' }}
                />
              ) : (
                <div className="map-placeholder">
                  <FiMapPin size={48} />
                  <h3>Map will be active when technician is on the way</h3>
                  <p>Current Status: {booking.status.toUpperCase()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="status-side">
            <div className="status-card">
              <h3>Service Progress</h3>
              <div className="status-timeline">
                {statuses.map((s, i) => {
                  const isCompleted = i < currentIndex || (booking.status === 'completed' && i === statuses.findIndex(x => x.key === 'completed'));
                  const isCurrent = i === currentIndex;
                  
                  if (s.key === 'cancelled' && booking.status !== 'cancelled') return null;

                  return (
                    <div key={s.key} className={`timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="timeline-icon">
                        {isCompleted ? <FiCheckCircle /> : i + 1}
                      </div>
                      <div className="timeline-content">
                        <h4>{s.label}</h4>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {booking.technician && (
                <div className="technician-preview">
                  <div className="tech-avatar">
                    {booking.technician.name?.[0]}
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>{booking.technician.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Your Service Professional</p>
                    <a href={`tel:${booking.technician.phone}`} style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
                      Call: {booking.technician.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
