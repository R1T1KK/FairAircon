const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  sendOtp,
  resendOtp,
  verifyOtp, 
  getProfile, 
  updateProfile, 
  forgotPassword, 
  resetPassword,
  updateAvatar
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { otpRateLimiter } = require('../middleware/otpRateLimiter');

// OTP Endpoints
router.post('/send-otp', otpRateLimiter, sendOtp);
router.post('/resend-otp', otpRateLimiter, resendOtp);
router.post('/verify-otp', verifyOtp);

// Standard Auth Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;
