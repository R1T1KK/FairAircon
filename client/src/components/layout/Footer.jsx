import { Link } from 'react-router-dom';
import { FaSnowflake, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { FiInstagram, FiFacebook, FiTwitter } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60L48 55C96 50 192 40 288 45C384 50 480 70 576 75C672 80 768 70 864 60C960 50 1056 40 1152 42.5C1248 45 1344 60 1392 67.5L1440 75V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z" fill="currentColor"/>
        </svg>
      </div>
      <div className="footer-content">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <FaSnowflake className="footer-logo-icon" />
                <span>Fair Aircon</span>
              </div>
              <p className="footer-desc">
                Professional AC service solutions for your home and office. Expert technicians, genuine parts, and guaranteed satisfaction.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook"><FiFacebook /></a>
                <a href="#" aria-label="Instagram"><FiInstagram /></a>
                <a href="#" aria-label="Twitter"><FiTwitter /></a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Quick Links</h4>
              <Link to="/">Home</Link>
              <Link to="/services">Services</Link>
              <Link to="/booking">Book Now</Link>
              <Link to="/login">Login</Link>
            </div>

            <div className="footer-col">
              <h4>Services</h4>
              <Link to="/services">AC Repair</Link>
              <Link to="/services">AC Installation</Link>
              <Link to="/services">Gas Refill</Link>
              <Link to="/services">Deep Cleaning</Link>
            </div>

            <div className="footer-col">
              <h4>Contact Us</h4>
              <div className="footer-contact-item">
                <FaPhone /> <span>+91 9829454487</span>
              </div>
              <div className="footer-contact-item">
                <FaEnvelope /> <span>Fairaircon777@gmail.com</span>
              </div>
              <div className="footer-contact-item">
                <FaMapMarkerAlt /> <span>Mumbai, Maharashtra</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Fair Aircon. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
