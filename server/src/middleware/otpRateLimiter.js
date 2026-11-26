/**
 * Memory-based Sliding-Window Rate Limiter for OTP Endpoints
 * Guards against OTP request spamming, brute force, and SMS cost inflation.
 */

const ipRequests = new Map();
const phoneRequests = new Map();

// Periodic cleanup of stale tracking records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipRequests.entries()) {
    if (now - record.startTime > 15 * 60 * 1000) ipRequests.delete(key);
  }
  for (const [key, record] of phoneRequests.entries()) {
    if (now - record.startTime > 15 * 60 * 1000) phoneRequests.delete(key);
  }
}, 10 * 60 * 1000);

/**
 * Rate Limiter for OTP Requests (Send & Resend)
 * Limits:
 * - Max 10 requests per IP within 15 minutes
 * - Max 4 requests per Phone Number within 10 minutes
 */
const otpRateLimiter = (req, res, next) => {
  // Allow test scripts or dev flags if explicitly configured
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return next();
  }

  const now = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const phone = req.body?.phone ? String(req.body.phone).replace(/\D/g, '').slice(-10) : null;

  // 1. IP-level checking (10 requests / 15 mins)
  const ipWindow = 15 * 60 * 1000;
  let ipEntry = ipRequests.get(ip);
  if (!ipEntry || (now - ipEntry.startTime > ipWindow)) {
    ipRequests.set(ip, { count: 1, startTime: now });
  } else {
    if (ipEntry.count >= 10) {
      const waitTime = Math.ceil((ipWindow - (now - ipEntry.startTime)) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many OTP requests from this network. Please try again after ${waitTime} minutes.`
      });
    }
    ipEntry.count += 1;
  }

  // 2. Phone-level checking (4 requests / 10 mins)
  if (phone) {
    const phoneWindow = 10 * 60 * 1000;
    let phoneEntry = phoneRequests.get(phone);
    if (!phoneEntry || (now - phoneEntry.startTime > phoneWindow)) {
      phoneRequests.set(phone, { count: 1, startTime: now });
    } else {
      if (phoneEntry.count >= 4) {
        const waitTime = Math.ceil((phoneWindow - (now - phoneEntry.startTime)) / 60000);
        return res.status(429).json({
          success: false,
          message: `Too many OTP attempts for this phone number. Please wait ${waitTime} minutes.`
        });
      }
      phoneEntry.count += 1;
    }
  }

  next();
};

const paymentIpRequests = new Map();

// Rate limiter for payment endpoints (20 requests / 15 min per IP)
const paymentRateLimiter = (req, res, next) => {
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return next();
  }

  const now = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const windowMs = 15 * 60 * 1000;
  const entry = paymentIpRequests.get(ip);

  if (!entry || now - entry.startTime > windowMs) {
    paymentIpRequests.set(ip, { count: 1, startTime: now });
  } else {
    if (entry.count >= 20) {
      return res.status(429).json({
        success: false,
        message: 'Too many payment requests. Please wait a few minutes and try again.'
      });
    }
    entry.count += 1;
  }

  next();
};

module.exports = { otpRateLimiter, paymentRateLimiter };

