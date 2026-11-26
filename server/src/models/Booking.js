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
    city: { type: String, required: true, default: 'Mumbai' },
    state: { type: String, default: 'Maharashtra' },
    pincode: { type: String, default: '400001' }
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
  razorpaySignature: {
    type: String
  },
  paidAt: {
    type: Date
  },
  paidAmount: {
    type: Number
  },
  notes: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['website', 'whatsapp', 'phone'],
    default: 'website'
  },
  externalBookingId: {
    type: String,
    unique: true,
    sparse: true  // allows multiple null values
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
