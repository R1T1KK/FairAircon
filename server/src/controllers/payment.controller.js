const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

const safeCompareHex = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (!/^[0-9a-f]+$/i.test(a) || !/^[0-9a-f]+$/i.test(b)) return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
exports.createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body || {};
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'Valid bookingId is required' });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({ success: false, message: 'Payment gateway is not configured' });
    }

    const booking = await Booking.findById(bookingId).populate('user').populate('service');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to pay for this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot pay for a cancelled booking' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    const amountInPaise = Math.round(Number(booking.totalAmount) * 100);
    if (!Number.isInteger(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ success: false, message: 'Invalid payable booking amount' });
    }

    const userPayload = {
      name: booking.user.name,
      email: booking.user.email,
      phone: booking.user.phone
    };

    // Reuse existing unpaid order if status !== 'paid' and amount still matches
    if (booking.razorpayOrderId) {
      try {
        const existingOrder = await razorpay.orders.fetch(booking.razorpayOrderId);
        if (
          existingOrder &&
          existingOrder.status !== 'paid' &&
          Number(existingOrder.amount) === amountInPaise
        ) {
          return res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            order: existingOrder,
            user: userPayload
          });
        }
      } catch {
        // If fetch fails, create a fresh order below
      }
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_booking_${booking._id}`
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order,
      user: userPayload
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body || {};

    if (
      typeof razorpay_order_id !== 'string' ||
      !razorpay_order_id.trim() ||
      typeof razorpay_payment_id !== 'string' ||
      !razorpay_payment_id.trim() ||
      typeof razorpay_signature !== 'string' ||
      !razorpay_signature.trim() ||
      typeof bookingId !== 'string' ||
      !mongoose.Types.ObjectId.isValid(bookingId)
    ) {
      return res.status(400).json({ success: false, message: 'Missing or invalid payment verification fields' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Payment gateway is not configured' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ownership check
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to verify payment for this booking' });
    }

    // Order binding check (prevents amount-swap across bookings)
    if (!booking.razorpayOrderId || booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Order ID does not match this booking' });
    }

    // Idempotent check
    if (booking.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Payment already verified', booking });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!safeCompareHex(generatedSignature, razorpay_signature)) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    booking.paymentStatus = 'paid';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paidAt = new Date();
    booking.paidAmount = booking.totalAmount;
    if (booking.status === 'pending') {
      booking.status = 'confirmed';
    }
    await booking.save();

    // Notify owner about verified payment (non-blocking)
    try {
      const populated = await Booking.findById(bookingId)
        .populate('user', 'name email phone')
        .populate('service', 'name');
      const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_USER;
      if (ownerEmail && populated) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #0f2942; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">Payment Verified</h2>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Payment for booking <strong>#${bookingId.slice(-6).toUpperCase()}</strong> has been verified.</p>
              <p><strong>Amount:</strong> ₹${booking.totalAmount}</p>
              <p><strong>Customer:</strong> ${populated.user?.name || 'Customer'}</p>
              <p><strong>Service:</strong> ${populated.service?.name || 'Service'}</p>
              <p><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
            </div>
          </div>
        `;
        await sendEmail({
          email: ownerEmail,
          subject: `Payment Confirmed: ₹${booking.totalAmount} from ${populated.user?.name || 'Customer'}`,
          html: emailHtml
        });
      }
    } catch {
      // Do not fail payment verification if email fails
    }

    return res.json({ success: true, message: 'Payment verified successfully', booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay Webhook (raw body required)
// @route   POST /api/payments/webhook
exports.handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret || typeof signature !== 'string' || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ success: false, message: 'Invalid webhook configuration or signature' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (!safeCompareHex(expectedSignature, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body.toString('utf8'));
    const paymentEntity = event?.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;

    if (!orderId) {
      return res.status(200).json({ received: true });
    }

    // Look up strictly by razorpayOrderId (never trust notes/bookingId from webhook payload)
    const booking = await Booking.findOne({ razorpayOrderId: orderId });
    if (!booking) {
      return res.status(200).json({ received: true });
    }

    if (event.event === 'payment.captured') {
      if (booking.paymentStatus === 'paid') {
        return res.status(200).json({ received: true });
      }

      const expectedPaise = Math.round(Number(booking.totalAmount) * 100);
      if (Number(paymentEntity.amount) !== expectedPaise) {
        return res.status(200).json({ received: true, ignored: 'amount_mismatch' });
      }

      booking.paymentStatus = 'paid';
      booking.razorpayPaymentId = paymentEntity.id;
      booking.paidAt = new Date();
      booking.paidAmount = booking.totalAmount;
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      }
      await booking.save();
    } else if (event.event === 'payment.failed') {
      // Keep paymentStatus as pending; log non-sensitive failure summary only
      console.warn(`Razorpay payment.failed for order ${orderId}: ${paymentEntity.error_description || 'failed'}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err.message);
    return res.status(400).json({ success: false, message: 'Webhook processing error' });
  }
};
