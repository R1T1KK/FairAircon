const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index to speed up booking lookups
reviewSchema.index({ user: 1, booking: 1 });

module.exports = mongoose.model('Review', reviewSchema);
