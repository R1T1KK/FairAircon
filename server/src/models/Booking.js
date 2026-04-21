const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required'],
    enum: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
           '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'on-the-way', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
