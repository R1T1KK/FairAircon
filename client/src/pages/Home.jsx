import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiTool,
  FiSettings,
  FiWind,
  FiDroplet,
  FiShield,
  FiZap,
  FiArrowRight,
  FiPhoneCall,
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiMessageCircle,
  FiChevronDown
} from 'react-icons/fi';
import api from '../services/api';
import acPremiumImg from '../assets/ac-premium.png';
import ReviewSection from '../components/reviews/ReviewSection';
import './Home.css';

const fallbackServices = [
  {
    _id: 'repair',
    name: 'AC Repair',
    category: 'repair',
    description: 'Expert diagnosis and repair for compressor, refrigerant leak, and electrical faults across all brands.',
    discountPrice: 399,
    basePrice: 499,
    duration: 90
  },
  {
    _id: 'installation',
    name: 'AC Installation',
    category: 'installation',
    description: 'Professional split and window AC mounting, copper piping, electrical connections, and testing.',
    discountPrice: 1399,
    basePrice: 1499,
    duration: 180
  },
  {
    _id: 'gas-refill',
    name: 'Gas Refill / Recharge',
    category: 'gas-refill',
    description: 'AC gas top-up and complete recharge (R22/R32/R410A) with leak detection and pressure check.',
    discountPrice: 3500,
    basePrice: 3800,
    duration: 60
  },
  {
    _id: 'cleaning',
    name: 'Deep Cleaning',
    category: 'cleaning',
    description: 'Filter deep wash, coil jet cleaning, drain line flush, and sanitization for cleaner airflow.',
    discountPrice: 650,
    basePrice: 800,
    duration: 90
  },
  {
    _id: 'maintenance',
    name: 'Annual Maintenance (AMC)',
    category: 'maintenance',
    description: 'Scheduled 2 wet and dry services quarterly to maintain cooling performance year-round.',
    discountPrice: 1500,
    basePrice: 1800,
    duration: 120
  },
  {
    _id: 'emergency',
    name: 'Emergency Repair',
    category: 'emergency',
    description: 'Urgent AC breakdown support with priority technician dispatch and 2-hour response target.',
    discountPrice: 349,
    basePrice: 400,
    duration: 60
  }
];

const iconByCategory = {
  repair: <FiTool size={20} aria-hidden="true" />,
  installation: <FiSettings size={20} aria-hidden="true" />,
  'gas-refill': <FiWind size={20} aria-hidden="true" />,
  cleaning: <FiDroplet size={20} aria-hidden="true" />,
  maintenance: <FiShield size={20} aria-hidden="true" />,
  emergency: <FiZap size={20} aria-hidden="true" />
};

const stepsList = [
  {
    num: '01',
    title: 'Book online',
    desc: 'Select your AC service, pick a date and time slot, and enter your Mumbai address.'
  },
  {
    num: '02',
    title: 'Technician arrives',
    desc: 'A verified technician is assigned to your request with live GPS tracking to your door.'
  },
  {
    num: '03',
    title: 'Service completed',
    desc: 'Your unit is tested before handoff, backed by a 3-month service warranty.'
  }
];

const faqs = [
  {
    q: 'What warranty is included on AC repairs?',
    a: 'Repair, installation, gas refill, deep cleaning, and AMC services include a 3-month service warranty.'
  },
  {
    q: 'How fast is emergency AC repair?',
    a: 'Emergency repair requests have a 2-hour response target with 24/7 availability across Mumbai.'
  },
  {
    q: 'What does "From ₹399" pricing mean?',
    a: 'The listed amount is the starting base rate for that service category (for example, AC Repair from ₹399, Deep Cleaning from ₹650, Gas Refill from ₹3,500). Any additional spare parts are confirmed before work begins.'
  },
  {
    q: 'How do I book an appointment?',
    a: 'Use the Book Now flow to choose a service, select a date and 1-hour time slot between 09:00 and 18:00, enter your address, and confirm.'
  },
  {
    q: 'How do I pay and get a receipt?',
    a: 'You can pay online via Razorpay or after service completion. A downloadable PDF receipt is available in your Profile under bookings.'
  },
  {
    q: 'Can I track my technician live?',
    a: 'Yes. Once a technician is assigned and marks the job On the Way, live GPS location and status updates appear on your booking tracking page.'
  }
];

const WHATSAPP_URL = 'https://wa.me/919829454487';

const Home = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState(fallbackServices);
  const [selectedServiceId, setSelectedServiceId] = useState(fallbackServices[0]._id);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    let active = true;
    api
      .get('/services')
      .then((res) => {
        if (active && Array.isArray(res.data?.services) && res.data.services.length > 0) {
          setServices(res.data.services);
          setSelectedServiceId(res.data.services[0]._id);
        }
      })
      .catch(() => {
        // Keep fallback real service catalog from seedData if API is unreachable
      });
    return () => {
      active = false;
    };
  }, []);

  // Subtle reveal on scroll; visible by default if JS fails or prefers-reduced-motion
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const sections = root.querySelectorAll('.reveal-section');
    sections.forEach((el) => el.classList.add('reveal-pending'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            entry.target.classList.remove('reveal-pending');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleQuickBook = (e) => {
    e.preventDefault();
    navigate('/booking');
  };

  return (
    <div ref={rootRef}>
      <main className="home-page">
        {/* ======== HERO ======== */}
        <section className="hero">
          <div className="container hero-content">
            <div className="hero-text">
              <p className="hero-eyebrow">Mumbai Residential &amp; Commercial HVAC</p>
              <h1>Reliable AC service and repair across Mumbai</h1>
              <p className="hero-subtitle">
                Certified technicians, upfront pricing, and genuine spare parts. Book a time slot online and track your technician live.
              </p>

              <div className="hero-actions">
                <Link to="/booking" className="btn btn-primary btn-lg">
                  <span>Book a service</span>
                  <FiArrowRight size={16} aria-hidden="true" />
                </Link>
                <a href="tel:+919829454487" className="btn btn-secondary btn-lg">
                  <FiPhoneCall size={16} aria-hidden="true" />
                  <span className="tabular-nums">Call +91 9829454487</span>
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp btn-lg"
                >
                  <FiMessageCircle size={16} aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <ul className="hero-trust-chips" aria-label="Service guarantees">
                <li className="trust-chip">
                  <FiShield size={15} aria-hidden="true" />
                  <span>3-month warranty</span>
                </li>
                <li className="trust-chip">
                  <FiClock size={15} aria-hidden="true" />
                  <span>2-hour emergency response target</span>
                </li>
                <li className="trust-chip">
                  <FiMapPin size={15} aria-hidden="true" />
                  <span>Live technician tracking</span>
                </li>
              </ul>
            </div>

            <div className="hero-visual">
              <div className="hero-photo-frame">
                <img
                  src={acPremiumImg}
                  alt="Split air conditioner indoor unit serviced by Fair Aircon"
                  width="520"
                  height="340"
                  className="hero-photo"
                />
              </div>

              <form onSubmit={handleQuickBook} className="glass-strong quick-book-card">
                <div className="quick-book-header">
                  <label htmlFor="quick-book-select" className="quick-book-title">
                    Quick book a service
                  </label>
                  <span className="quick-book-meta">Slots 09:00–18:00</span>
                </div>
                <div className="quick-book-row">
                  <select
                    id="quick-book-select"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="quick-book-select"
                  >
                    {services.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} — From ₹{s.discountPrice || s.basePrice}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-accent quick-book-btn">
                    <span>Continue</span>
                    <FiArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* ======== SERVICES ======== */}
        <section className="section services-section reveal-section" id="services">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">AC services &amp; upfront pricing</h2>
              <p className="section-subtitle">
                Choose the service you need with clear starting rates and warranty coverage.
              </p>
            </div>

            <div className="services-grid">
              {services.slice(0, 6).map((service) => {
                const price = service.discountPrice || service.basePrice;
                const icon = iconByCategory[service.category] || <FiTool size={20} aria-hidden="true" />;
                return (
                  <article key={service._id} className="glass service-card">
                    <div className="service-card-top">
                      <div className="service-icon-circle">{icon}</div>
                      <span className="service-duration tabular-nums">{service.duration} min</span>
                    </div>
                    <h3>{service.name}</h3>
                    <p className="service-desc">{service.description}</p>
                    <div className="service-card-footer">
                      <div className="service-price-wrap">
                        <span className="service-price-label">From</span>
                        <span className="service-price tabular-nums">₹{price.toLocaleString('en-IN')}</span>
                      </div>
                      <Link to="/booking" className="btn btn-primary btn-sm">
                        <span>Book</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ======== HOW IT WORKS (NAVY BAND) ======== */}
        <section className="section how-it-works reveal-section" aria-labelledby="how-heading">
          <div className="container">
            <div className="section-header">
              <h2 id="how-heading" className="section-title">How it works</h2>
              <p className="section-subtitle">
                From online scheduling to verified completion in three clear steps.
              </p>
            </div>

            <div className="steps-timeline">
              {stepsList.map((step) => (
                <div key={step.num} className="glass-dark step-item">
                  <div className="step-marker">
                    <span className="step-number tabular-nums">{step.num}</span>
                  </div>
                  <div className="step-body">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======== SERVICE AREAS ======== */}
        <section className="section areas-section reveal-section" aria-labelledby="areas-heading">
          <div className="container">
            <div className="glass-strong areas-card">
              <div className="areas-info">
                <div className="areas-icon">
                  <FiMapPin size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 id="areas-heading" className="areas-title">Service coverage: Mumbai, Maharashtra</h2>
                  {/* TODO(owner): Add exact Mumbai suburbs/pincodes served once confirmed by owner */}
                  <p className="areas-desc">
                    Doorstep residential and commercial AC servicing across Mumbai. Enter your street address and pincode during booking to schedule a slot.
                  </p>
                </div>
              </div>
              <Link to="/booking" className="btn btn-secondary">
                <span>Check slot availability</span>
                <FiArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ======== REVIEWS ======== */}
        <div className="reveal-section">
          <ReviewSection />
        </div>

        {/* ======== FAQ ======== */}
        <section className="section faq-section reveal-section" aria-labelledby="faq-heading">
          <div className="container">
            <div className="section-header">
              <h2 id="faq-heading" className="section-title">Frequently asked questions</h2>
              <p className="section-subtitle">
                Clear answers on pricing, warranty, booking slots, and live technician tracking.
              </p>
            </div>

            <div className="faq-list">
              {faqs.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                const panelId = `faq-panel-${idx}`;
                const btnId = `faq-btn-${idx}`;
                return (
                  <div key={idx} className={`${isOpen ? 'glass-strong is-open' : 'glass'} faq-item`}>
                    <h3>
                      <button
                        id={btnId}
                        type="button"
                        className="faq-trigger"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      >
                        <span>{item.q}</span>
                        <FiChevronDown size={18} className="faq-chevron" aria-hidden="true" />
                      </button>
                    </h3>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      hidden={!isOpen}
                      className="faq-panel"
                    >
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ======== FINAL CTA ======== */}
        <section className="section cta-section reveal-section">
          <div className="container">
            <div className="cta-card">
              <div className="cta-copy">
                <h2>Need an AC technician today?</h2>
                <p>
                  Schedule your visit online in a few steps or reach our Mumbai team by phone or WhatsApp.
                </p>
              </div>
              <div className="cta-actions">
                <Link to="/booking" className="btn btn-accent btn-lg">
                  <span>Book a service</span>
                  <FiArrowRight size={16} aria-hidden="true" />
                </Link>
                <a href="tel:+919829454487" className="btn cta-outline-btn btn-lg">
                  <FiPhoneCall size={16} aria-hidden="true" />
                  <span className="tabular-nums">+91 9829454487</span>
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp btn-lg"
                >
                  <FiMessageCircle size={16} aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Desktop floating WhatsApp button */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="desktop-whatsapp-fab"
        aria-label="Chat on WhatsApp"
      >
        <FiMessageCircle size={20} aria-hidden="true" />
        <span>WhatsApp</span>
      </a>

      {/* Mobile sticky bottom action bar */}
      <div className="mobile-sticky-bar" role="region" aria-label="Quick actions">
        <Link to="/booking" className="btn btn-primary mobile-bar-btn">
          <span>Book</span>
        </Link>
        <a href="tel:+919829454487" className="btn btn-secondary mobile-bar-btn">
          <FiPhoneCall size={15} aria-hidden="true" />
          <span>Call</span>
        </a>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="btn btn-whatsapp mobile-bar-btn"
        >
          <FiMessageCircle size={15} aria-hidden="true" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
};

export default Home;
