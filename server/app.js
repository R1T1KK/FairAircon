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
  .map(origin => origin.toLowerCase().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow internal/automated requests
    if (!origin) return callback(null, true);
    
    const sanitizedOrigin = origin.toLowerCase().replace(/\/$/, '');
    
    // 2. Check if it's in the allowed list
    if (allowedOrigins.includes(sanitizedOrigin)) {
      return callback(null, true);
    }
    
    // 3. Robust fallback: specifically allow your Vercel domain even if FRONTEND_URL is slightly off
    if (sanitizedOrigin.includes('fair-aircon.vercel.app')) {
      return callback(null, true);
    }

    // 4. If blocked, log exactly why so we can fix it
    console.error(`❌ CORS blocked!`);
    console.error(`Received Origin: ${origin}`);
    console.error(`Allowed List: [${allowedOrigins.join(', ')}]`);
    
    const msg = `CORS blocked. Origin "${origin}" is not in the allowed list.`;
    return callback(new Error(msg), false);
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
