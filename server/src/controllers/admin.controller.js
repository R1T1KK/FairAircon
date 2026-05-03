const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const Review = require('../models/Review');
const { getIO } = require('../config/socket');
const sendWhatsApp = require('../utils/sendWhatsApp');

// @desc    Get dashboard analytics
// @route   GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTechnicians = await User.countDocuments({ role: 'technician' });

    // Weekly bookings for chart (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const weeklyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: eightWeeksAgo } } },
      {
        $group: {
          _id: { $week: '$createdAt' },
          year: { $first: { $year: '$createdAt' } },
          count: { $sum: 1 },
          startDate: { $min: '$createdAt' }
        }
      },
      { $sort: { year: 1, _id: 1 } }
    ]);

    // Revenue from completed or paid bookings
    const revenueResult = await Booking.aggregate([
      { $match: { $or: [{ status: 'completed' }, { paymentStatus: 'paid' }] } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Monthly bookings for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ['$status', 'completed'] }, { $eq: ['$paymentStatus', 'paid'] }] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email phone')
      .populate('service', 'name')
      .populate('technician', 'name')
      .sort('-createdAt')
      .limit(5);

    res.json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalUsers,
        totalTechnicians,
        totalRevenue,
        monthlyBookings,
        weeklyBookings,
        recentBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (with filters)
// @route   GET /api/admin/bookings
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, date, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.scheduledDate = { $gte: start, $lt: end };
    }

    let query = Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('service', 'name category basePrice')
      .populate('technician', 'name phone')
      .sort('-createdAt');

    const total = await Booking.countDocuments(filter);
    const bookings = await query.skip((page - 1) * limit).limit(parseInt(limit));

    res.json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / limit),
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking (status, technician)
// @route   PUT /api/admin/bookings/:id
exports.updateBooking = async (req, res, next) => {
  try {
    const { status, technician, notes } = req.body;
    const update = {};
    
    // Explicitly handle technician assignment/unassignment
    if (technician === "") {
      update.technician = null;
    } else if (technician) {
      update.technician = technician;
      
      // Auto-assign status when a technician is first assigned
      const currentBooking = await Booking.findById(req.params.id);
      if (currentBooking && (currentBooking.status === 'pending' || currentBooking.status === 'confirmed')) {
        update.status = 'assigned';
      }
    }

    // Overwrite with explicit status if provided
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;

    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name email phone')
      .populate('service', 'name category basePrice')
      .populate('technician', 'name phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Broadcast update via Socket.io
    try {
      const io = getIO();
      io.to(`booking_${booking._id}`).emit('status_update', {
        status: booking.status,
        technician: booking.technician,
        updatedAt: booking.updatedAt
      });

      // Notify Technician via WhatsApp if assigned
      if (update.technician && booking.technician) {
        await sendWhatsApp({
          phone: booking.technician.phone,
          message: `🛠️ *New Job Assigned!*\n\nHello ${booking.technician.name},\n\nYou have been assigned a new job:\nService: ${booking.service.name}\nCustomer: ${booking.user.name}\nAddress: ${booking.address.street}, ${booking.address.city}\nDate: ${new Date(booking.scheduledDate).toLocaleDateString()}\n\nPlease check your Field Tech Portal for details.`
        });
      }
    } catch (socketErr) {
      console.error('Notification failed:', socketErr.message);
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    CRUD for services (admin)
exports.createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, service });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, service });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get technicians
// @route   GET /api/admin/technicians
exports.getTechnicians = async (req, res, next) => {
  try {
    const technicians = await User.find({ role: 'technician' }).sort('name');
    res.json({ success: true, technicians });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'technician', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
