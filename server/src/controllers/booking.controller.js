const Booking = require('../models/Booking');
const Service = require('../models/Service');
const sendEmail = require('../utils/sendEmail');

// @desc    Create new booking
// @route   POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const { serviceId, scheduledDate, timeSlot, address, notes } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Date Validation: Prevent past dates
    const bookingDate = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (bookingDate < today) {
      return res.status(400).json({ success: false, message: 'Cannot book for a past date' });
    }

    const totalAmount = service.discountPrice > 0 ? service.discountPrice : service.basePrice;

    const booking = await Booking.create({
      user: req.user._id,
      service: serviceId,
      scheduledDate,
      timeSlot,
      address,
      totalAmount,
      notes
    });

    const populated = await booking.populate(['service', { path: 'user', select: 'name email phone' }]);

    // Send email to owner
    const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_USER;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e86e9; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">New Booking Alert!</h2>
        </div>
        <div style="padding: 24px; color: #334155;">
          <h3 style="color: #1e86e9; margin-top: 0;">Customer Information</h3>
          <p><strong>Name:</strong> ${populated.user.name}</p>
          <p><strong>Phone:</strong> ${populated.user.phone}</p>
          <p><strong>Email:</strong> ${populated.user.email}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <h3 style="color: #1e86e9;">Service Details</h3>
          <p><strong>Service:</strong> ${populated.service.name}</p>
          <p><strong>Date:</strong> ${new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time Slot:</strong> ${timeSlot}</p>
          <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <h3 style="color: #1e86e9;">Service Address</h3>
          <p style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            ${address.street}, ${address.city}, ${address.state} - ${address.pincode}
          </p>
          ${notes ? `<p><strong>Customer Notes:</strong> ${notes}</p>` : ''}
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.ADMIN_URL || '#'}" style="background: #1e86e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Dashboard</a>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          &copy; ${new Date().getFullYear()} Fair Aircon AC Service Platform
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: ownerEmail,
        subject: `🚨 New Booking: ${populated.service.name} - ${populated.user.name}`,
        html: emailHtml
      });
    } catch (err) {
      console.error('Failed to send booking notification email to owner', err);
    }

    res.status(201).json({ success: true, booking: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/my
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('service')
      .populate('technician', 'name phone')
      .sort('-createdAt');
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service')
      .populate('user', 'name email phone')
      .populate('technician', 'name phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only allow owner or admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};
