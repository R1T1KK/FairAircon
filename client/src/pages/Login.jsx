import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiSmartphone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}`);

      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'technician') navigate('/technician');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-mode-tabs">
          <span className="auth-mode-tab active">Password Login</span>
          <Link to="/otp-login" className="auth-mode-tab">
            OTP Login
          </Link>
        </div>

        <div className="auth-header">
          <h1>Sign in to Fair Aircon</h1>
          <p>Access your bookings, receipts, and live technician tracking</p>
        </div>

        <Link to="/otp-login" className="otp-switch-banner">
          <FiSmartphone className="switch-icon" size={16} aria-hidden="true" />
          <span>
            Prefer passwordless? <strong>Log in with Mobile OTP</strong>
          </span>
        </Link>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <FiMail className="input-icon" aria-hidden="true" />
            <input
              type="email"
              aria-label="Email address"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <FiLock className="input-icon" aria-hidden="true" />
            <input
              type={showPass ? 'text' : 'password'}
              aria-label="Password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-eye"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <FiEyeOff size={16} aria-hidden="true" /> : <FiEye size={16} aria-hidden="true" />}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: '0.875rem', color: 'var(--cobalt)', fontWeight: 500 }}
            >
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footer-text">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
