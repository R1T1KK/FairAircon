const express = require('express');
const router = express.Router();
const { syncBooking } = require('../controllers/n8nSync.controller');

/**
 * n8n API Secret Authentication Middleware
 * Validates the x-api-secret header against N8N_BOOKING_API_SECRET env var
 */
const n8nAuth = (req, res, next) => {
  const apiSecret = req.headers['x-api-secret'];
  const expectedSecret = process.env.N8N_BOOKING_API_SECRET;

  if (!expectedSecret) {
    console.error('❌ N8N_BOOKING_API_SECRET not configured in environment variables');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: API secret not set'
    });
  }

  if (!apiSecret) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required: x-api-secret header missing'
    });
  }

  if (apiSecret !== expectedSecret) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API credentials'
    });
  }

  next();
};

// POST /api/n8n/booking-sync
router.post('/booking-sync', n8nAuth, syncBooking);

module.exports = router;

