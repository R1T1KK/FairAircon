const express = require('express');
const router = express.Router();
const { createReview, getServiceReviews, getAllReviews } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/', getAllReviews);
router.get('/service/:serviceId', getServiceReviews);

module.exports = router;
