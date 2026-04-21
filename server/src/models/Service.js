const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    enum: ['repair', 'installation', 'maintenance', 'gas-refill', 'cleaning'],
    required: true
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: 0
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    required: true,
    default: 60 // in minutes
  },
  icon: {
    type: String,
    default: 'wrench'
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
