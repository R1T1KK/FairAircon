const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, verifyOtp, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
