import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSnowflake } from 'react-icons/fa';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
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
      toast.success(`Welcome back, ${user.name}!`);
      
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
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
      </div>
      <div className="auth-card animate-fade-in-up">
        <div className="auth-header">
          <FaSnowflake className="auth-logo-icon" />
          <h1>Welcome Back</h1>
          <p>Log in to your Fair Aircon account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <FiMail className="input-icon" />
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="input-eye" onClick={() => setShowPass(!showPass)}>
              {showPass ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '16px' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary-600)', fontWeight: 500 }}>
              Forgot Password?
            </Link>
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="auth-footer-text">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
