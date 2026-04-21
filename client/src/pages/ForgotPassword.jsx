import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSnowflake } from 'react-icons/fa';
import { FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
      </div>
      <div className="auth-card animate-fade-in-up">
        <div className="auth-header">
          <FaSnowflake className="auth-logo-icon" />
          <h1>Forgot Password</h1>
          <p>{sent ? 'Check your email inbox' : 'Enter your email to receive a reset link'}</p>
        </div>
        
        {sent ? (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>
              We've sent a secure password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
            </p>
            <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <FiMail className="input-icon" />
              <input 
                type="email" 
                placeholder="Email address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        
        {!sent && (
          <p className="auth-footer-text">
            Remembered your password? <Link to="/login">Log In</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
