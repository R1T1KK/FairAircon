import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSnowflake, FaWrench, FaTools, FaWind, FaBroom, FaBolt, FaStar, FaCheckCircle, FaArrowRight, FaQuoteLeft, FaShieldAlt } from 'react-icons/fa';
import { FiPhoneCall, FiClock, FiMapPin, FiUsers } from 'react-icons/fi';
import api from '../services/api';
import ReviewSection from '../components/reviews/ReviewSection';
import './Home.css';

const servicesList = [
  { icon: <FaWrench />, title: 'AC Repair', desc: 'Expert diagnosis & repair for all brands and models', price: '₹399' },
  { icon: <FaTools />, title: 'AC Installation', desc: 'Professional installation with piping & testing', price: '₹1,399' },
  { icon: <FaWind />, title: 'Gas Refill', desc: 'Refrigerant recharge with leak detection', price: '₹3,500' },
  { icon: <FaBroom />, title: 'Deep Cleaning', desc: 'Complete coil cleaning & sanitization', price: '₹650' },
  { icon: <FaShieldAlt />, title: 'Annual Maintenance', desc: '2 wet and dry services quarterly', price: '₹1,500' },
  { icon: <FaBolt />, title: 'Emergency Repair', desc: '2-hour response, 24/7 availability', price: '₹349' },
];

const Home = () => {
  const stats = [
    { icon: <FiUsers />, value: '5,000+', label: 'Happy Customers' },
    { icon: <FaWrench />, value: '12,000+', label: 'Services Completed' },
    { icon: <FiMapPin />, value: '25+', label: 'Cities Covered' },
    { icon: <FiClock />, value: '2 Hrs', label: 'Avg Response Time' },
  ];

  return (
    <div className="home-page">
      {/* ======== HERO ======== */}
      <section className="hero">
        <div className="hero-bg-elements">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-text animate-fade-in-up">
            <div className="hero-badge">
              <FaSnowflake /> #1 AC Service Platform
            </div>
            <h1>Keep Your <span className="hero-highlight">Cool</span> With Professional AC Services</h1>
            <p className="hero-subtitle">
              Expert technicians, genuine spare parts, and guaranteed satisfaction. Book your AC service in under 60 seconds.
            </p>
            <div className="hero-actions">
              <Link to="/booking" className="btn-primary-lg">
                Book Now <FaArrowRight />
              </Link>
              <a href="tel:+919829454487" className="btn-outline-lg">
                <FiPhoneCall /> Call Us
              </a>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-stars">
                {[...Array(5)].map((_, i) => <FaStar key={i} />)}
              </div>
              <span>4.9/5 from 2,000+ reviews</span>
            </div>
          </div>
          <div className="hero-visual animate-fade-in-up">
            <div className="hero-card-stack">
              <div className="hero-feature-card hfc-1">
                <FaCheckCircle className="hfc-icon" />
                <div>
                  <strong>Same Day Service</strong>
                  <span>Book & get service today</span>
                </div>
              </div>
              <div className="hero-feature-card hfc-2">
                <FaShieldAlt className="hfc-icon" />
                <div>
                  <strong>3 Months Warranty</strong>
                  <span>On all repair services</span>
                </div>
              </div>
              <div className="hero-feature-card hfc-3">
                <FaStar className="hfc-icon" />
                <div>
                  <strong>Certified Experts</strong>
                  <span>Trained & verified techs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======== STATS ======== */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid stagger-children">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card glass-card animate-fade-in-up">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== SERVICES ======== */}
      <section className="section services-section" id="services">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Professional AC solutions tailored to your needs, delivered by certified technicians</p>
          <div className="services-grid stagger-children">
            {servicesList.map((service, i) => (
              <div key={i} className="service-card glass-card animate-fade-in-up">
                <div className="service-icon-wrap">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <div className="service-card-footer">
                  <span className="service-price">From {service.price}</span>
                  <Link to="/booking" className="service-book-btn">Book <FaArrowRight /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== HOW IT WORKS ======== */}
      <section className="section how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Get your AC serviced in 3 simple steps</p>
          <div className="steps-grid">
            <div className="step-card glass-card animate-fade-in-up">
              <div className="step-number">1</div>
              <h3>Book Online</h3>
              <p>Select your service, choose a convenient date & time, and enter your address</p>
            </div>
            <div className="step-connector">
              <FaArrowRight />
            </div>
            <div className="step-card glass-card animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <div className="step-number">2</div>
              <h3>Technician Arrives</h3>
              <p>A certified technician arrives at your doorstep with all required tools & parts</p>
            </div>
            <div className="step-connector">
              <FaArrowRight />
            </div>
            <div className="step-card glass-card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="step-number">3</div>
              <h3>Service Done!</h3>
              <p>Your AC is fixed & running perfectly. Pay after the service is completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======== REVIEWS ======== */}
      <ReviewSection />

      {/* ======== CTA ======== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-bg-snowflakes">
              {[...Array(6)].map((_, i) => (
                <FaSnowflake key={i} className={`cta-sf cta-sf-${i + 1}`} />
              ))}
            </div>
            <h2>Ready to Get Your AC Fixed?</h2>
            <p>Book your service in under 60 seconds. Expert technicians at your doorstep.</p>
            <div className="cta-actions">
              <Link to="/booking" className="btn-primary-lg btn-white">
                Book a Service <FaArrowRight />
              </Link>
              <a href="tel:+919829454487" className="btn-outline-white">
                <FiPhoneCall /> +91 9829454487
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
