const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getBooking, cancelBooking } = require('../controllers/booking.controller');
const { downloadReceipt } = require('../controllers/receipt.controller');
const { protect } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/:id/receipt', protect, downloadReceipt);

module.exports = router;

