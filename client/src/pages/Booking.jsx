import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaSnowflake, FaCheckCircle, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Booking.css';

const timeSlots = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
];

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    serviceId: '',
    scheduledDate: '',
    timeSlot: '',
    address: { street: '', city: '', state: '', pincode: '' },
    notes: ''
  });
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data.services);
    } catch {
      toast.error('Failed to load services');
    }
  };

  const handleServiceSelect = (service) => {
    setForm({ ...form, serviceId: service._id });
    setSelectedService(service);
  };

  const handleAddressChange = (e) => {
    setForm({ ...form, address: { ...form.address, [e.target.name]: e.target.value } });
  };

  const nextStep = () => {
    if (step === 1 && !form.serviceId) return toast.error('Please select a service');
    if (step === 2 && (!form.scheduledDate || !form.timeSlot)) return toast.error('Please select date and time');
    if (step === 3) {
      const { street, city, state, pincode } = form.address;
      if (!street || !city || !state || !pincode) return toast.error('Please fill all address fields');
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login to book a service');
      return navigate('/login');
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!user.phone || !phoneRegex.test(user.phone)) {
      toast.error('Please update your profile with a valid 10-digit phone number before booking.');
      return navigate('/profile');
    }

    setLoading(true);
    try {
      await api.post('/bookings', form);
      toast.success('Booking created successfully!');
      setStep(5); // success step
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="booking-page">
      <div className="container">
        <div className="booking-header animate-fade-in-up">
          <h1>Book a Service</h1>
          <p>Schedule your AC service in just a few steps</p>
        </div>

        {step < 5 && (
          <div className="booking-progress">
            {['Service', 'Schedule', 'Address', 'Confirm'].map((label, i) => (
              <div key={i} className={`progress-step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
                <div className="progress-dot">{step > i + 1 ? <FaCheckCircle /> : i + 1}</div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="booking-content glass-card animate-fade-in-up">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="booking-step">
              <h2>Select a Service</h2>
              <div className="service-selection-grid">
                {services.map((s) => (
                  <div key={s._id} className={`service-select-card glass-card ${form.serviceId === s._id ? 'selected' : ''}`} onClick={() => handleServiceSelect(s)}>
                    <div className="ssc-header">
                      <h3>{s.name}</h3>
                      {form.serviceId === s._id && <FaCheckCircle className="ssc-check" />}
                    </div>
                    <p>{s.description}</p>
                    <div className="ssc-meta">
                      <span className="ssc-price">₹{s.discountPrice || s.basePrice}</span>
                      {s.discountPrice > 0 && <span className="ssc-original">₹{s.basePrice}</span>}
                      <span className="ssc-duration">{s.duration} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="booking-step">
              <h2>Choose Date & Time</h2>
              <div className="datetime-grid">
                <div className="datetime-section">
                  <label><FiCalendar /> Select Date</label>
                  <input type="date" min={today} value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="date-input" />
                </div>
                <div className="datetime-section">
                  <label><FiClock /> Select Time Slot</label>
                  <div className="timeslot-grid">
                    {timeSlots.map((slot) => (
                      <button key={slot} className={`timeslot-btn ${form.timeSlot === slot ? 'active' : ''}`} onClick={() => setForm({ ...form, timeSlot: slot })}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div className="booking-step">
              <h2><FiMapPin /> Service Address</h2>
              <div className="address-form">
                <div className="input-group">
                  <input type="text" name="street" placeholder="Street / House No / Apartment" value={form.address.street} onChange={handleAddressChange} required />
                </div>
                <div className="address-row">
                  <div className="input-group">
                    <input type="text" name="city" placeholder="City" value={form.address.city} onChange={handleAddressChange} required />
                  </div>
                  <div className="input-group">
                    <input type="text" name="state" placeholder="State" value={form.address.state} onChange={handleAddressChange} required />
                  </div>
                </div>
                <div className="input-group">
                  <input type="text" name="pincode" placeholder="Pincode" value={form.address.pincode} onChange={handleAddressChange} required />
                </div>
                <div className="input-group">
                  <textarea placeholder="Additional notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="3" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="booking-step">
              <h2>Review & Confirm</h2>
              <div className="confirm-card">
                <div className="confirm-row">
                  <span>Service</span>
                  <strong>{selectedService?.name}</strong>
                </div>
                <div className="confirm-row">
                  <span>Date</span>
                  <strong>{new Date(form.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </div>
                <div className="confirm-row">
                  <span>Time</span>
                  <strong>{form.timeSlot}</strong>
                </div>
                <div className="confirm-row">
                  <span>Address</span>
                  <strong>{form.address.street}, {form.address.city}, {form.address.state} - {form.address.pincode}</strong>
                </div>
                {form.notes && (
                  <div className="confirm-row">
                    <span>Notes</span>
                    <strong>{form.notes}</strong>
                  </div>
                )}
                <div className="confirm-total">
                  <span>Total Amount</span>
                  <strong>₹{selectedService?.discountPrice || selectedService?.basePrice}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="booking-success">
              <FaCheckCircle className="success-icon" />
              <h2>Booking Confirmed!</h2>
              <p>Your service has been booked. <strong>To complete your request, please proceed to pay via Razorpay.</strong></p>
              <div className="success-actions">
                <button onClick={() => navigate('/profile')} className="btn-primary-lg">Pay Now / View Bookings</button>
                <button onClick={() => navigate('/')} className="btn-outline-lg">Back to Home</button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="booking-nav">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="btn-outline-lg">
                  <FaArrowLeft /> Back
                </button>
              )}
              {step < 4 ? (
                <button onClick={nextStep} className="btn-primary-lg">
                  Next <FaArrowRight />
                </button>
              ) : (
                <button onClick={handleSubmit} className="btn-primary-lg" disabled={loading}>
                  {loading ? 'Booking...' : 'Confirm Booking'} <FaCheckCircle />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
