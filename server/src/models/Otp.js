const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  otpHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastSentAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// TTL index to automatically purge expired records
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to verify candidate OTP
otpSchema.methods.verifyOtp = async function(candidateOtp) {
  if (this.isUsed) return false;
  return await bcrypt.compare(candidateOtp, this.otpHash);
};

// Method to check if resend cooldown has elapsed (60 seconds)
otpSchema.methods.canResend = function(cooldownSeconds = 60) {
  const timeSinceLast = (Date.now() - new Date(this.lastSentAt).getTime()) / 1000;
  return {
    allowed: timeSinceLast >= cooldownSeconds,
    remainingSeconds: Math.max(0, Math.ceil(cooldownSeconds - timeSinceLast))
  };
};

module.exports = mongoose.model('Otp', otpSchema);

