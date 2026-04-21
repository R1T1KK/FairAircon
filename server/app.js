const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/auth.routes');
const serviceRoutes = require('./src/routes/service.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const reviewRoutes = require('./src/routes/review.routes');
const adminRoutes = require('./src/routes/admin.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const technicianRoutes = require('./src/routes/technician.routes');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/technician', technicianRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AirFix API is running' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
