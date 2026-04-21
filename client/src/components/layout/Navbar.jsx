import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiGrid, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { FaSnowflake } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <FaSnowflake className="brand-icon" />
          <span className="brand-text">Fair Aircon</span>
        </Link>

        <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/services" className={location.pathname === '/services' ? 'active' : ''}>Services</Link>
          <Link to="/booking" className={location.pathname === '/booking' ? 'active' : ''}>Book Now</Link>

          {user ? (
            <div className="navbar-user-section">
              {isAdmin && (
                <Link to="/admin" className="nav-admin-link">
                  <FiGrid size={16} /> Dashboard
                </Link>
              )}
              <Link to="/profile" className="nav-profile-link">
                <FiUser size={16} /> {user.name?.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} className="nav-logout-btn">
                <FiLogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div className="navbar-auth-section">
              <Link to="/login" className="nav-login-btn">
                <FiLogIn size={16} /> Log In
              </Link>
              <Link to="/signup" className="nav-signup-btn">
                <FiUserPlus size={16} /> Sign Up
              </Link>
            </div>
          )}
        </div>

        <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
