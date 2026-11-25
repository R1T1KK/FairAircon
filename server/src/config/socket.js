const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');

let io;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
]
  .filter(Boolean)
  .map(origin => origin.toLowerCase().replace(/\/$/, ''));

const initSocket = (server) => {
  io = socketio(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const sanitized = origin.toLowerCase().replace(/\/$/, '');
        if (allowedOrigins.includes(sanitized) || sanitized.includes('fair-aircon.vercel.app')) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS blocked for origin: ${origin}`), false);
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication Middleware for Sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id} (User: ${socket.user.name})`);

    // Auto-join admin room for admin users
    if (socket.user.role === 'admin') {
      socket.join('admin_dashboard');
      console.log(`Admin ${socket.user.name} joined admin_dashboard room`);
    }

    // Join a specific booking room (with ownership / assignment check)
    socket.on('join_booking', async (bookingId) => {
      try {
        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) return;

        const booking = await Booking.findById(bookingId).select('user technician');
        if (!booking) return;

        const isOwner = booking.user.toString() === socket.user._id.toString();
        const isAdmin = socket.user.role === 'admin';
        const isAssignedTech =
          socket.user.role === 'technician' &&
          booking.technician &&
          booking.technician.toString() === socket.user._id.toString();

        if (!isOwner && !isAdmin && !isAssignedTech) {
          socket.emit('tracking_error', { message: 'Not authorized to track this booking' });
          return;
        }

        socket.join(`booking_${bookingId}`);
        console.log(`User ${socket.user.name} joined room: booking_${bookingId}`);
      } catch (err) {
        console.error('Socket join_booking Error:', err.message);
      }
    });

    // Handle Technician location updates
    socket.on('update_location', async (data) => {
      if (socket.user.role !== 'technician') return;

      const { bookingId, lat, lng } = data || {};
      if (
        !bookingId ||
        !mongoose.Types.ObjectId.isValid(bookingId) ||
        typeof lat !== 'number' ||
        typeof lng !== 'number' ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return;
      }

      try {
        // Verify technician is assigned to this booking
        const booking = await Booking.findById(bookingId).select('technician');
        if (
          !booking ||
          !booking.technician ||
          booking.technician.toString() !== socket.user._id.toString()
        ) {
          return;
        }

        // Update technician's location in DB
        await User.findByIdAndUpdate(socket.user._id, {
          currentLocation: { lat, lng, updatedAt: Date.now() }
        });

        // Broadcast to people in the booking room
        io.to(`booking_${bookingId}`).emit('location_update', {
          lat,
          lng,
          technicianId: socket.user._id,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('Socket Location Update Error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
