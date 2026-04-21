import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSnowflake } from 'react-icons/fa';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      return toast.error('Please fill all fields');
    }
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      setUserId(res.userId);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter OTP');
    setLoading(true);
    try {
      await verifyOtp(userId, otp);
      toast.success('Account verified successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
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
          <h1>{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
          <p>{step === 1 ? 'Join Fair Aircon for the best AC services' : 'Enter the 6-digit OTP sent to your email'}</p>
        </div>
        
        {step === 1 ? (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <FiUser className="input-icon" />
              <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <FiMail className="input-icon" />
              <input type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <FiPhone className="input-icon" />
              <input type="tel" name="phone" placeholder="Phone (10 digits)" value={form.phone} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <FiLock className="input-icon" />
              <input type={showPass ? 'text' : 'password'} name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
              <button type="button" className="input-eye" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <div className="input-group">
              <FiLock className="input-icon" />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Next'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="auth-form">
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Enter 6-digit OTP" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                maxLength="6"
                required 
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', paddingLeft: '14px' }}
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Setup Account'}
            </button>
            <button type="button" onClick={() => setStep(1)} className="auth-submit-btn" style={{ background: 'transparent', border: '1px solid var(--gray-300)', color: 'var(--gray-700)', marginTop: '8px' }}>
              Back
            </button>
          </form>
        )}

        {step === 1 && (
          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Signup;
