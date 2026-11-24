const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

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

    // Join a specific booking room
    socket.on('join_booking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
      console.log(`User ${socket.user.name} joined room: booking_${bookingId}`);
    });

    // Handle Technician location updates
    socket.on('update_location', async (data) => {
      const { bookingId, lat, lng } = data;

      if (socket.user.role !== 'technician') return;

      try {
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
        console.error('Socket Location Update Error:', err);
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
