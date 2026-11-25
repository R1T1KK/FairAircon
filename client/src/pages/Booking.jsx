import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiChevronRight,
  FiChevronDown,
  FiAlertCircle,
  FiPhoneCall,
  FiMessageCircle,
  FiTool,
  FiSettings,
  FiWind,
  FiDroplet,
  FiShield,
  FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Booking.css';

const timeSlots = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
];

const stepLabels = ['Service', 'Schedule', 'Address', 'Confirm'];

const iconByCategory = {
  repair: <FiTool size={18} aria-hidden="true" />,
  installation: <FiSettings size={18} aria-hidden="true" />,
  'gas-refill': <FiWind size={18} aria-hidden="true" />,
  maintenance: <FiShield size={18} aria-hidden="true" />,
  cleaning: <FiDroplet size={18} aria-hidden="true" />,
  emergency: <FiZap size={18} aria-hidden="true" />
};

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [stepError, setStepError] = useState('');
  const [summaryOpenMobile, setSummaryOpenMobile] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  const [form, setForm] = useState({
    serviceId: '',
    scheduledDate: '',
    timeSlot: '',
    address: { street: '', city: '', state: '', pincode: '' },
    notes: ''
  });
  const [selectedService, setSelectedService] = useState(null);

  const loadServices = useCallback(async () => {
    setServicesError('');
    try {
      const res = await api.get('/services');
      setServices(res.data.services || []);
    } catch {
      setServicesError('Failed to load services. Please try again.');
      toast.error('Failed to load services');
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get('/services')
      .then((res) => {
        if (active) setServices(res.data.services || []);
      })
      .catch(() => {
        if (active) {
          setServicesError('Failed to load services. Please try again.');
          toast.error('Failed to load services');
        }
      })
      .finally(() => {
        if (active) setServicesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleServiceSelect = (service) => {
    setStepError('');
    setForm({ ...form, serviceId: service._id });
    setSelectedService(service);
  };

  const handleAddressChange = (e) => {
    setStepError('');
    setForm({ ...form, address: { ...form.address, [e.target.name]: e.target.value } });
  };

  const nextStep = () => {
    setStepError('');
    if (step === 1 && !form.serviceId) {
      setStepError('Please select a service to continue.');
      return toast.error('Please select a service');
    }
    if (step === 2 && (!form.scheduledDate || !form.timeSlot)) {
      setStepError('Please select both a date and a time slot.');
      return toast.error('Please select date and time');
    }
    if (step === 3) {
      const { street, city, state, pincode } = form.address;
      if (!street || !city || !state || !pincode) {
        setStepError('Please fill in all required address fields.');
        return toast.error('Please fill all address fields');
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setSubmitError('');

    if (!user) {
      toast.error('Please login to book a service');
      return navigate('/login');
    }

    // Phone validation (preserved exactly)
    const phoneRegex = /^[0-9]{10}$/;
    if (!user.phone || !phoneRegex.test(user.phone)) {
      toast.error('Please update your profile with a valid 10-digit phone number before booking.');
      return navigate('/profile');
    }

    setLoading(true);
    try {
      const res = await api.post('/bookings', form);
      setCreatedBooking(res.data?.booking || null);
      toast.success('Booking created successfully');
      setStep(5);
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const activePrice = selectedService
    ? selectedService.discountPrice || selectedService.basePrice
    : null;

  return (
    <main className="booking-page">
      {/* Shared Navy Page Header */}
      <section className="page-header-band">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <FiChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">Book a service</span>
          </nav>
          <h1>Book an AC service</h1>
          <p>
            Select your service, pick a convenient 1-hour slot, and enter your Mumbai address.
          </p>
        </div>
      </section>

      <div className="container booking-shell">
        {step < 5 && (
          <nav className="booking-progress" aria-label="Booking progress">
            {stepLabels.map((label, i) => {
              const stepNum = i + 1;
              const isDone = step > stepNum;
              const isActive = step === stepNum;
              return (
                <div
                  key={label}
                  className={`progress-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="progress-dot tabular-nums">
                    {isDone ? <FiCheckCircle size={15} aria-hidden="true" /> : stepNum}
                  </span>
                  <span className="progress-label">{label}</span>
                </div>
              );
            })}
          </nav>
        )}

        <div className={`booking-layout ${step === 5 ? 'is-complete' : ''}`}>
          <div className="card booking-content">
            {stepError && (
              <div className="booking-inline-alert" role="alert" aria-live="polite">
                <FiAlertCircle size={18} aria-hidden="true" />
                <span>{stepError}</span>
              </div>
            )}

            {/* Step 1: Service Selection */}
            {step === 1 && (
              <div className="booking-step">
                <h2>Select a service</h2>

                {servicesLoading ? (
                  <div className="service-selection-grid" aria-label="Loading services">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="card service-select-card booking-skel" aria-hidden="true">
                        <div className="skel-line title" />
                        <div className="skel-line" />
                        <div className="skel-line short" />
                      </div>
                    ))}
                  </div>
                ) : servicesError ? (
                  <div className="booking-state-box" role="alert">
                    <FiAlertCircle size={22} aria-hidden="true" />
                    <p>{servicesError}</p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setServicesLoading(true);
                        loadServices();
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ) : services.length === 0 ? (
                  <div className="booking-state-box">
                    <p>No services are currently available.</p>
                  </div>
                ) : (
                  <div className="service-selection-grid" role="radiogroup" aria-label="AC services">
                    {services.map((s) => {
                      const isSelected = form.serviceId === s._id;
                      const price = s.discountPrice || s.basePrice;
                      const hasDiscount = s.discountPrice > 0 && s.discountPrice < s.basePrice;
                      return (
                        <button
                          key={s._id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={`card service-select-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleServiceSelect(s)}
                        >
                          <div className="ssc-top">
                            <div className="ssc-icon">
                              {iconByCategory[s.category] || <FiTool size={18} aria-hidden="true" />}
                            </div>
                            {isSelected && (
                              <span className="ssc-selected-pill">
                                <FiCheckCircle size={14} aria-hidden="true" />
                                <span>Selected</span>
                              </span>
                            )}
                          </div>
                          <h3>{s.name}</h3>
                          <p className="ssc-desc">{s.description}</p>
                          <div className="ssc-meta">
                            <div className="ssc-price-group">
                              <span className="ssc-price tabular-nums">₹{price.toLocaleString('en-IN')}</span>
                              {hasDiscount && (
                                <span className="ssc-original tabular-nums">
                                  ₹{s.basePrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            <span className="ssc-duration tabular-nums">{s.duration} min</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div className="booking-step">
                <h2>Choose date &amp; time</h2>
                <div className="datetime-grid">
                  <div className="datetime-section">
                    <label htmlFor="booking-date" className="field-label">
                      <FiCalendar size={16} aria-hidden="true" />
                      <span>Preferred date</span>
                    </label>
                    <input
                      id="booking-date"
                      type="date"
                      min={today}
                      value={form.scheduledDate}
                      onChange={(e) => {
                        setStepError('');
                        setForm({ ...form, scheduledDate: e.target.value });
                      }}
                      className="field-input date-input"
                    />
                  </div>

                  <div className="datetime-section">
                    <span className="field-label">
                      <FiClock size={16} aria-hidden="true" />
                      <span>Time slot (1-hour window)</span>
                    </span>
                    {timeSlots.length === 0 ? (
                      <p className="booking-empty-slots">No slots available for this date.</p>
                    ) : (
                      <div className="timeslot-grid" role="group" aria-label="Time slots">
                        {timeSlots.map((slot) => {
                          const isSelected = form.timeSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              aria-pressed={isSelected}
                              className={`timeslot-btn tabular-nums ${isSelected ? 'active' : ''}`}
                              onClick={() => {
                                setStepError('');
                                setForm({ ...form, timeSlot: slot });
                              }}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Address */}
            {step === 3 && (
              <div className="booking-step">
                <h2>Service address</h2>
                <div className="address-form">
                  <div className="input-group">
                    <label htmlFor="addr-street" className="field-label">
                      Street / House No / Apartment
                    </label>
                    <input
                      id="addr-street"
                      type="text"
                      name="street"
                      autoComplete="street-address"
                      placeholder="Flat 402, Sea View Apartments, Link Road"
                      value={form.address.street}
                      onChange={handleAddressChange}
                      className="field-input"
                      required
                    />
                  </div>

                  <div className="address-row">
                    <div className="input-group">
                      <label htmlFor="addr-city" className="field-label">City</label>
                      <input
                        id="addr-city"
                        type="text"
                        name="city"
                        autoComplete="address-level2"
                        placeholder="Mumbai"
                        value={form.address.city}
                        onChange={handleAddressChange}
                        className="field-input"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="addr-state" className="field-label">State</label>
                      <input
                        id="addr-state"
                        type="text"
                        name="state"
                        autoComplete="address-level1"
                        placeholder="Maharashtra"
                        value={form.address.state}
                        onChange={handleAddressChange}
                        className="field-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="addr-pincode" className="field-label">Pincode</label>
                    <input
                      id="addr-pincode"
                      type="text"
                      name="pincode"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="400053"
                      value={form.address.pincode}
                      onChange={handleAddressChange}
                      className="field-input"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="addr-notes" className="field-label">
                      Additional notes (optional)
                    </label>
                    <textarea
                      id="addr-notes"
                      placeholder="AC type (split/window), floor access, or parking details"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      className="field-input field-textarea"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <div className="booking-step">
                <h2>Review &amp; confirm</h2>
                <div className="confirm-card">
                  <div className="confirm-row">
                    <span>Service</span>
                    <strong>{selectedService?.name}</strong>
                  </div>
                  <div className="confirm-row">
                    <span>Date</span>
                    <strong>
                      {new Date(form.scheduledDate).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </strong>
                  </div>
                  <div className="confirm-row">
                    <span>Time slot</span>
                    <strong className="tabular-nums">{form.timeSlot}</strong>
                  </div>
                  <div className="confirm-row">
                    <span>Address</span>
                    <strong>
                      {form.address.street}, {form.address.city}, {form.address.state} - {form.address.pincode}
                    </strong>
                  </div>
                  {form.notes && (
                    <div className="confirm-row">
                      <span>Notes</span>
                      <strong>{form.notes}</strong>
                    </div>
                  )}
                  <div className="confirm-total">
                    <span>Total amount</span>
                    <strong className="tabular-nums">
                      ₹{activePrice?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {submitError && (
                  <div className="booking-inline-alert" role="alert" aria-live="polite">
                    <FiAlertCircle size={18} aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
              <div className="booking-success">
                <div className="success-badge-icon" aria-hidden="true">
                  <FiCheckCircle size={32} />
                </div>
                <h2>Booking confirmed</h2>
                <p className="success-subtitle">
                  Your service request is recorded. Proceed to your bookings to complete payment via Razorpay or track technician assignment.
                </p>

                <div className="confirm-card success-details">
                  {createdBooking?._id && (
                    <div className="confirm-row">
                      <span>Booking ID</span>
                      <strong className="tabular-nums">{createdBooking._id}</strong>
                    </div>
                  )}
                  <div className="confirm-row">
                    <span>Service</span>
                    <strong>{selectedService?.name}</strong>
                  </div>
                  <div className="confirm-row">
                    <span>Slot</span>
                    <strong className="tabular-nums">
                      {form.scheduledDate} · {form.timeSlot}
                    </strong>
                  </div>
                  <div className="confirm-row">
                    <span>Address</span>
                    <strong>
                      {form.address.street}, {form.address.city} - {form.address.pincode}
                    </strong>
                  </div>
                  <div className="confirm-total">
                    <span>Amount</span>
                    <strong className="tabular-nums">
                      ₹{activePrice?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                <div className="success-actions">
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="btn btn-primary btn-lg"
                  >
                    <span>Pay Now / View Bookings</span>
                    <FiArrowRight size={16} aria-hidden="true" />
                  </button>
                  {createdBooking?._id && (
                    <Link
                      to={`/tracking/${createdBooking._id}`}
                      className="btn btn-secondary btn-lg"
                    >
                      <FiMapPin size={16} aria-hidden="true" />
                      <span>Track booking</span>
                    </Link>
                  )}
                  <a href="tel:+919829454487" className="btn btn-secondary btn-lg">
                    <FiPhoneCall size={16} aria-hidden="true" />
                    <span>Call</span>
                  </a>
                  <a
                    href="https://wa.me/919829454487"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-lg"
                  >
                    <FiMessageCircle size={16} aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 5 && (
              <div className="booking-nav">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStepError('');
                      setStep(step - 1);
                    }}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    <FiArrowLeft size={16} aria-hidden="true" />
                    <span>Back</span>
                  </button>
                ) : (
                  <span />
                )}

                {step < 4 ? (
                  <button type="button" onClick={nextStep} className="btn btn-primary">
                    <span>Continue</span>
                    <FiArrowRight size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className={`btn btn-primary ${loading ? 'is-loading' : ''}`}
                    disabled={loading}
                  >
                    <span>{loading ? 'Confirming...' : 'Confirm booking'}</span>
                    <FiCheckCircle size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sticky Summary Sidebar (Desktop) & Collapsible Summary (Mobile) */}
          {step < 5 && (
            <aside className="card booking-summary-card" aria-label="Booking summary">
              <button
                type="button"
                className="summary-mobile-toggle"
                aria-expanded={summaryOpenMobile}
                onClick={() => setSummaryOpenMobile(!summaryOpenMobile)}
              >
                <div className="summary-mobile-title">
                  <span>Booking summary</span>
                  {activePrice !== null && (
                    <strong className="tabular-nums">₹{activePrice.toLocaleString('en-IN')}</strong>
                  )}
                </div>
                <FiChevronDown
                  size={18}
                  className={summaryOpenMobile ? 'rotated' : ''}
                  aria-hidden="true"
                />
              </button>

              <div className={`summary-body ${summaryOpenMobile ? 'open' : ''}`}>
                <h3 className="summary-desktop-title">Booking summary</h3>
                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Service</span>
                    <strong>{selectedService ? selectedService.name : 'Not selected'}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Date</span>
                    <strong className="tabular-nums">
                      {form.scheduledDate || 'Not selected'}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>Time slot</span>
                    <strong className="tabular-nums">
                      {form.timeSlot || 'Not selected'}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>Warranty</span>
                    <strong>3 months on repairs</strong>
                  </div>
                </div>
                <div className="summary-total">
                  <span>Starting total</span>
                  <strong className="tabular-nums">
                    {activePrice !== null ? `₹${activePrice.toLocaleString('en-IN')}` : '—'}
                  </strong>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
};

export default Booking;
