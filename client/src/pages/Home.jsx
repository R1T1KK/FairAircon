import { Link } from 'react-router-dom';
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
  FiCheckCircle
} from 'react-icons/fi';
import ReviewSection from '../components/reviews/ReviewSection';
import './Home.css';

const servicesList = [
  {
    icon: <FiTool size={18} aria-hidden="true" />,
    title: 'AC Repair',
    desc: 'Diagnosis and repair for compressor, refrigerant leak, and electrical faults across all brands.',
    price: '₹399',
    duration: '90 min'
  },
  {
    icon: <FiSettings size={18} aria-hidden="true" />,
    title: 'AC Installation',
    desc: 'Split and window AC mounting, copper piping, electrical connections, and pressure testing.',
    price: '₹1,399',
    duration: '180 min'
  },
  {
    icon: <FiWind size={18} aria-hidden="true" />,
    title: 'Gas Refill / Recharge',
    desc: 'Complete refrigerant recharge (R22, R32, R410A) with leak detection and pressure check.',
    price: '₹3,500',
    duration: '60 min'
  },
  {
    icon: <FiDroplet size={18} aria-hidden="true" />,
    title: 'Deep Cleaning',
    desc: 'Filter wash, coil jet cleaning, drain line flush, and sanitization for cleaner airflow.',
    price: '₹650',
    duration: '90 min'
  },
  {
    icon: <FiShield size={18} aria-hidden="true" />,
    title: 'Annual Maintenance (AMC)',
    desc: 'Scheduled quarterly wet and dry servicing to keep cooling efficiency steady year-round.',
    price: '₹1,500',
    duration: '120 min'
  },
  {
    icon: <FiZap size={18} aria-hidden="true" />,
    title: 'Emergency Repair',
    desc: 'Priority dispatch for urgent AC breakdowns with 2-hour response and 24/7 availability.',
    price: '₹349',
    duration: '60 min'
  }
];

const highlights = [
  {
    icon: <FiShield size={18} aria-hidden="true" />,
    value: '3 Months',
    label: 'Warranty on repair services'
  },
  {
    icon: <FiClock size={18} aria-hidden="true" />,
    value: '2 Hours',
    label: 'Emergency response target'
  },
  {
    icon: <FiCheckCircle size={18} aria-hidden="true" />,
    value: 'Upfront',
    label: 'Clear pricing before work starts'
  },
  {
    icon: <FiMapPin size={18} aria-hidden="true" />,
    value: 'Mumbai',
    label: 'Residential & commercial service'
  }
];

const stepsList = [
  {
    num: '01',
    title: 'Book online',
    desc: 'Pick your AC service, select a date and time slot, and enter your Mumbai address.'
  },
  {
    num: '02',
    title: 'Technician arrives',
    desc: 'A verified technician is assigned to your request with live tracking to your doorstep.'
  },
  {
    num: '03',
    title: 'Service completed',
    desc: 'Your unit is tested and verified before handoff, backed by a 3-month service warranty.'
  }
];

const Home = () => {
  return (
    <main className="home-page">
      {/* ======== HERO ======== */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-eyebrow">
              <span className="status-dot" aria-hidden="true" />
              <span>Mumbai HVAC &amp; AC Service</span>
            </div>
            <h1>Reliable AC service and repair across Mumbai</h1>
            <p className="hero-subtitle">
              Certified technicians, upfront pricing, and a 3-month service warranty. Book a time slot online and track your technician live.
            </p>
            <div className="hero-actions">
              <Link to="/booking" className="btn btn-primary btn-lg">
                <span>Book a service</span>
                <FiArrowRight size={16} aria-hidden="true" />
              </Link>
              <a href="tel:+919829454487" className="btn btn-secondary btn-lg">
                <FiPhoneCall size={16} aria-hidden="true" />
                <span className="tabular-nums">+91 9829454487</span>
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Service booking preview">
            <div className="card dispatch-preview">
              <div className="dispatch-header">
                <div>
                  <span className="dispatch-label">Live service dispatch</span>
                  <h2 className="dispatch-title">Deep Cleaning</h2>
                </div>
                <span className="badge badge-in-progress">
                  <span className="status-dot" aria-hidden="true" />
                  On the way
                </span>
              </div>

              <div className="dispatch-meta-row">
                <div className="dispatch-meta-item">
                  <span className="dispatch-meta-key">Starting rate</span>
                  <strong className="dispatch-meta-val tabular-nums">₹650</strong>
                </div>
                <div className="dispatch-meta-item">
                  <span className="dispatch-meta-key">Duration</span>
                  <strong className="dispatch-meta-val tabular-nums">90 min</strong>
                </div>
                <div className="dispatch-meta-item">
                  <span className="dispatch-meta-key">Warranty</span>
                  <strong className="dispatch-meta-val tabular-nums">3 months</strong>
                </div>
              </div>

              <div className="dispatch-checklist">
                <div className="dispatch-check-item">
                  <FiCheckCircle size={16} aria-hidden="true" />
                  <span>Filter deep wash &amp; coil jet cleaning</span>
                </div>
                <div className="dispatch-check-item">
                  <FiCheckCircle size={16} aria-hidden="true" />
                  <span>Drain line flush &amp; sanitization</span>
                </div>
                <div className="dispatch-check-item">
                  <FiMapPin size={16} aria-hidden="true" />
                  <span>Live technician GPS tracking included</span>
                </div>
              </div>

              <div className="dispatch-footer">
                <span className="dispatch-area">Mumbai, Maharashtra</span>
                <Link to="/services" className="dispatch-link">
                  <span>View all services</span>
                  <FiArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======== HIGHLIGHTS ======== */}
      <section className="highlights-section" aria-label="Service guarantees">
        <div className="container">
          <div className="highlights-grid">
            {highlights.map((item, i) => (
              <div key={i} className="card highlight-card">
                <div className="highlight-icon">{item.icon}</div>
                <div>
                  <div className="highlight-value tabular-nums">{item.value}</div>
                  <div className="highlight-label">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== SERVICES ======== */}
      <section className="section services-section" id="services">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">AC services &amp; upfront pricing</h2>
            <p className="section-subtitle">
              Residential and commercial cooling services handled by trained technicians with genuine spare parts.
            </p>
          </div>

          <div className="services-grid">
            {servicesList.map((service, i) => (
              <article key={i} className="card service-card">
                <div className="service-card-top">
                  <div className="service-icon-wrap">{service.icon}</div>
                  <span className="service-duration tabular-nums">{service.duration}</span>
                </div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <div className="service-card-footer">
                  <div className="service-price-wrap">
                    <span className="service-price-label">From</span>
                    <span className="service-price tabular-nums">{service.price}</span>
                  </div>
                  <Link to="/booking" className="btn btn-secondary btn-sm">
                    <span>Book</span>
                    <FiArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ======== HOW IT WORKS ======== */}
      <section className="section how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">
              From booking your slot to verified completion in three clear steps.
            </p>
          </div>

          <div className="steps-grid">
            {stepsList.map((step) => (
              <div key={step.num} className="card step-card">
                <span className="step-number tabular-nums">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== REVIEWS ======== */}
      <ReviewSection />

      {/* ======== CTA ======== */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-copy">
              <h2>Need an AC technician today?</h2>
              <p>
                Schedule your visit online in a few steps or call our Mumbai dispatch line directly.
              </p>
            </div>
            <div className="cta-actions">
              <Link to="/booking" className="btn btn-accent btn-lg">
                <span>Book a service</span>
                <FiArrowRight size={16} aria-hidden="true" />
              </Link>
              <a href="tel:+919829454487" className="btn btn-secondary btn-lg cta-call-btn">
                <FiPhoneCall size={16} aria-hidden="true" />
                <span className="tabular-nums">+91 9829454487</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
