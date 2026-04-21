import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { FiClock, FiMapPin, FiTruck, FiCheckCircle, FiUser, FiArrowLeft } from 'react-icons/fi';
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
  const [booking, setBooking] = useState(null);
  const [techLocation, setTechLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    fetchBooking();

    // Initialize Socket.io
    const token = localStorage.getItem('token');
    socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socketRef.current.emit('join_booking', bookingId);

    socketRef.current.on('status_update', (data) => {
      setBooking(prev => ({ ...prev, status: data.status, technician: data.technician }));
      toast.success(`Booking status updated to ${data.status}`);
    });

    socketRef.current.on('location_update', (data) => {
      setTechLocation({ lat: data.lat, lng: data.lng });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [bookingId]);

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

              {isLoaded && techLocation ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={techLocation}
                  zoom={15}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    styles: [
                      { "featureType": "administrative", "elementType": "all", "stylers": [{ "visibility": "off" }] },
                      { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "simplified" }] },
                      { "featureType": "road", "elementType": "labels", "stylers": [{ "visibility": "simplified" }] },
                      { "featureType": "water", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }
                    ]
                  }}
                >
                  <Marker 
                    position={techLocation} 
                    icon={{
                      url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // Delivery truck/technician icon
                      scaledSize: new window.google.maps.Size(40, 40)
                    }}
                  />
                </GoogleMap>
              ) : (
                <div className="map-placeholder">
                  <FiMapPin size={48} />
                  <h3>Map will be active when technician is on the way</h3>
                  <p>Current Status: {booking.status.toUpperCase()}</p>
                  {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                    <div style={{ marginTop: '1rem', color: '#f59e0b', fontSize: '0.8rem' }}>
                      (Google Maps API key not found in environment)
                    </div>
                  )}
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
