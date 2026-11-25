import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiGrid } from 'react-icons/fi';
import './Navbar.css';

const BrandMark = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="brand-mark"
  >
    <rect x="2" y="4" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="1.75" />
    <path d="M6 10H18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M6 14H14" stroke="#1E6FD9" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/');
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <nav className="container navbar-inner" aria-label="Primary navigation">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <BrandMark />
          <span className="brand-text">Fair Aircon</span>
        </Link>

        <div
          id="primary-nav-menu"
          className={`navbar-links ${isOpen ? 'open' : ''}`}
        >
          <div className="navbar-nav-group">
            <Link to="/" onClick={closeMenu} className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/services" onClick={closeMenu} className={`nav-link ${location.pathname === '/services' ? 'active' : ''}`}>
              Services
            </Link>
            <Link to="/booking" onClick={closeMenu} className={`nav-link ${location.pathname === '/booking' ? 'active' : ''}`}>
              Book Now
            </Link>
          </div>

          {user ? (
            <div className="navbar-user-section">
              {isAdmin && (
                <Link to="/admin" onClick={closeMenu} className="nav-link nav-admin-link">
                  <FiGrid size={16} aria-hidden="true" />
                  <span>Dashboard</span>
                </Link>
              )}
              <Link to="/profile" onClick={closeMenu} className="nav-link nav-profile-link">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || 'Profile'} className="nav-avatar-img" width="24" height="24" />
                ) : (
                  <FiUser size={16} aria-hidden="true" />
                )}
                <span>{user.name?.split(' ')[0]}</span>
              </Link>
              <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm nav-logout-btn">
                <FiLogOut size={15} aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div className="navbar-auth-section">
              <Link to="/login" onClick={closeMenu} className="nav-link nav-login-link">
                Log in
              </Link>
              <Link to="/booking" onClick={closeMenu} className="btn btn-primary btn-sm nav-cta-btn">
                Book Service
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          aria-controls="primary-nav-menu"
        >
          {isOpen ? <FiX size={20} aria-hidden="true" /> : <FiMenu size={20} aria-hidden="true" />}
        </button>
      </nav>

      {isOpen && (
        <div
          className="navbar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Navbar;
