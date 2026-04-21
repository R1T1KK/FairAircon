const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');


// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
exports.createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    
    // Find the booking
    const booking = await Booking.findById(bookingId).populate('user').populate('service');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to pay for this booking' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    // Razorpay expects amount in paise
    const amountInPaise = booking.totalAmount * 100;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_booking_${booking._id}`,
    };

    const order = await razorpay.orders.create(options);

    // Save order id back to booking to easily verify later if needed
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order,
      user: {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Creating hmac object 
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment is successful
      booking.paymentStatus = 'paid';
      booking.razorpayPaymentId = razorpay_payment_id;
      // also optionally bump booking status
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      }
      await booking.save();

      // Notify owner about payment
      const populated = await Booking.findById(bookingId).populate('user', 'name email phone').populate('service', 'name');
      const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_USER;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Payment Verified!</h2>
          </div>
          <div style="padding: 24px; color: #334155;">
            <p>Payment for booking <strong>#${bookingId.slice(-6).toUpperCase()}</strong> has been successfully verified.</p>
            <p><strong>Amount:</strong> ₹${booking.totalAmount}</p>
            <p><strong>Customer:</strong> ${populated.user.name}</p>
            <p><strong>Service:</strong> ${populated.service.name}</p>
            <p><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.ADMIN_URL || '#'}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order</a>
            </div>
          </div>
        </div>
      `;

      try {
        await sendEmail({
          email: ownerEmail,
          subject: `💰 Payment Confirmed: ₹${booking.totalAmount} from ${populated.user.name}`,
          html: emailHtml
        });
      } catch (err) {
        console.error('Failed to notify owner about verified payment', err);
      }

      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    next(error);
  }
};
