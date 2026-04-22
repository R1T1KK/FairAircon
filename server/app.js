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
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
]
  .filter(Boolean)
  .map(origin => origin.replace(/\/$/, '')); // Strip trailing slashes safely

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const sanitizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.indexOf(sanitizedOrigin) === -1) {
      console.warn(`⚠️ CORS blocked for origin: ${origin}`);
      const msg = `The CORS policy for this site does not allow access from ${origin}. Please check your FRONTEND_URL environment variable.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
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
