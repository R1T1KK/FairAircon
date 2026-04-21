const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Create review for a completed booking
// @route   POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { bookingId, serviceId, rating, comment } = req.body;

    let targetServiceId = serviceId;

    // If review is tied to a specific booking
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
      }

      // Allowed to review multiple times
      targetServiceId = booking.service;
    } else if (!targetServiceId) {
      return res.status(400).json({ success: false, message: 'Must provide bookingId or serviceId' });
    }

    const review = await Review.create({
      user: req.user._id,
      ...(bookingId && { booking: bookingId }),
      service: targetServiceId,
      rating,
      comment
    });

    const populated = await review.populate('user', 'name');
    res.status(201).json({ success: true, review: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a service
// @route   GET /api/reviews/service/:serviceId
exports.getServiceReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ service: req.params.serviceId })
      .populate('user', 'name')
      .sort('-createdAt');
    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews
// @route   GET /api/reviews
exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name')
      .populate('service', 'name')
      .sort('-createdAt')
      .limit(20);
    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};
