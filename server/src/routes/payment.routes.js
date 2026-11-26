const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');
const { paymentRateLimiter } = require('../middleware/otpRateLimiter');

router.post('/create-order', protect, paymentRateLimiter, createOrder);
router.post('/verify', protect, paymentRateLimiter, verifyPayment);

module.exports = router;
