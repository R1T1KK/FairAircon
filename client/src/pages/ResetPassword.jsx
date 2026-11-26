import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return toast.error('Please fill all fields');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      toast.success('Password updated successfully');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Set New Password</h1>
          <p>{success ? 'Password successfully updated' : 'Create a strong, new password below'}</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ color: 'var(--text-body)', marginBottom: '24px' }}>
              Your password has been changed securely. You are being redirected to log in.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <FiLock className="input-icon" aria-hidden="true" />
              <input 
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                aria-label="New Password"
                placeholder="New Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button type="button" className="input-eye" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                {showPass ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>
            
            <div className="input-group">
              <FiLock className="input-icon" aria-hidden="true" />
              <input 
                type="password"
                autoComplete="new-password"
                aria-label="Confirm New Password"
                placeholder="Confirm New Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Set Password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default ResetPassword;
