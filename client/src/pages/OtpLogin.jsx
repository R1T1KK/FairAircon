import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSnowflake } from 'react-icons/fa';
import { FiPhone, FiUser, FiArrowLeft, FiCheckCircle, FiShield, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import OtpInput from '../components/auth/OtpInput';
import './Auth.css';

const OtpLogin = () => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState(1); // 1 = Phone Input, 2 = OTP Verification
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');

  const { sendOtp, resendOtp, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();

  // Handle Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
    setErrorMsg('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone || phone.length !== 10) {
      const err = 'Please enter a valid 10-digit mobile number';
      setErrorMsg(err);
      return toast.error(err);
    }

    if (!/^[6-9]/.test(phone)) {
      const err = 'Mobile number must start with 6, 7, 8, or 9';
      setErrorMsg(err);
      return toast.error(err);
    }

    setLoading(true);
    try {
      const res = await sendOtp(phone);
      toast.success(res.message || 'OTP sent successfully!');
      setFormattedPhone(`+91 ${phone.slice(0, 5)} ${phone.slice(5)}`);
      setCountdown(res.cooldownSeconds || 60);
      setStep(2);
      setOtp('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setErrorMsg('');
    setResending(true);
    try {
      const res = await resendOtp(phone);
      toast.success(res.message || 'OTP resent successfully!');
      setCountdown(res.cooldownSeconds || 60);
      setOtp('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp || otp.length !== 6) {
      const err = 'Please enter complete 6-digit OTP';
      setErrorMsg(err);
      return toast.error(err);
    }

    setLoading(true);
    try {
      const res = await verifyPhoneOtp(phone, otp, name);
      toast.success(res.message || 'Authenticated successfully!');
      
      const user = res.user;
      if (user?.role === 'admin') navigate('/admin');
      else if (user?.role === 'technician') navigate('/technician');
      else navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please check OTP.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhone = () => {
    setStep(1);
    setOtp('');
    setErrorMsg('');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
      </div>

      <div className="auth-card animate-fade-in-up">
        {/* Navigation Tabs */}
        <div className="auth-mode-tabs">
          <Link to="/login" className="auth-mode-tab">
            Password Login
          </Link>
          <span className="auth-mode-tab active">
            OTP Login
          </span>
        </div>

        <div className="auth-header">
          <FaSnowflake className="auth-logo-icon" />
          <h1>{step === 1 ? 'Instant Mobile Login' : 'Enter Verification Code'}</h1>
          <p>
            {step === 1
              ? 'Enter your mobile number to receive a secure 6-digit OTP'
              : `Code sent to ${formattedPhone}`}
          </p>
        </div>

        {errorMsg && (
          <div className="auth-alert error animate-shake">
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 1 ? (
          /* STEP 1: MOBILE NUMBER INPUT */
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="input-group phone-input-group">
              <span className="country-code-badge">🇮🇳 +91</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={10}
                required
                autoFocus
              />
              <span className="digit-counter">{phone.length}/10</span>
            </div>

            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder="Your Full Name (Optional for new users)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="otp-security-pill">
              <FiShield className="pill-icon" />
              <span>We never share your number. Standard SMS rates may apply.</span>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || phone.length !== 10}
            >
              {loading ? (
                <span className="btn-loading-wrapper">
                  <FiRefreshCw className="spin-icon" /> Sending OTP...
                </span>
              ) : (
                'Send Secure OTP'
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: 6-DIGIT OTP VERIFICATION */
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="otp-phone-display-card">
              <div className="phone-info">
                <FiPhone className="phone-icon" />
                <span className="phone-text">{formattedPhone}</span>
              </div>
              <button
                type="button"
                onClick={handleChangePhone}
                className="change-phone-link"
              >
                Change Number
              </button>
            </div>

            <div className="otp-input-section">
              <label className="otp-input-label">Enter 6-digit code</label>
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  setErrorMsg('');
                }}
                disabled={loading}
                error={Boolean(errorMsg)}
              />
            </div>

            <div className="otp-timer-row">
              {countdown > 0 ? (
                <span className="timer-text">
                  Resend OTP in <strong>{countdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="resend-otp-btn"
                >
                  {resending ? 'Sending...' : 'Resend Code via SMS'}
                </button>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <span className="btn-loading-wrapper">
                  <FiRefreshCw className="spin-icon" /> Verifying...
                </span>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <button
              type="button"
              onClick={handleChangePhone}
              className="back-btn-ghost"
            >
              <FiArrowLeft /> Back to mobile entry
            </button>
          </form>
        )}

        <p className="auth-footer-text">
          Prefer using email and password?{' '}
          <Link to="/login">Sign in with Password</Link>
        </p>
      </div>
    </div>
  );
};

export default OtpLogin;

