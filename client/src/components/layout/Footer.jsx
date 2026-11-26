import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="1.75" />
                <path d="M6 10H18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                <path d="M6 14H14" stroke="#4C92DD" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              <span>Fair Aircon</span>
            </Link>
            <p className="footer-desc">
              AC repair, installation, gas refill, and annual maintenance for homes and commercial spaces in Mumbai.
            </p>
          </div>

          <div className="footer-col">
            <h3>Quick links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/booking">Book Now</Link></li>
              <li><Link to="/login">Log in</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Services</h3>
            <ul>
              <li><Link to="/services">AC Repair</Link></li>
              <li><Link to="/services">AC Installation</Link></li>
              <li><Link to="/services">Gas Refill</Link></li>
              <li><Link to="/services">Deep Cleaning</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Contact</h3>
            <ul className="footer-contact-list">
              <li>
                <a href="tel:+919820454498" className="footer-contact-item">
                  <FiPhone size={15} aria-hidden="true" />
                  <span className="tabular-nums">+91 9820454498</span>
                </a>
              </li>
              <li>
                <a href="mailto:Fairaircon777@gmail.com" className="footer-contact-item">
                  <FiMail size={15} aria-hidden="true" />
                  <span>Fairaircon777@gmail.com</span>
                </a>
              </li>
              <li>
                <span className="footer-contact-item">
                  <FiMapPin size={15} aria-hidden="true" />
                  <span>Mumbai, Maharashtra</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Fair Aircon. All rights reserved.</p>
          <div className="footer-legal-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="footer-legal-dot" aria-hidden="true">•</span>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
