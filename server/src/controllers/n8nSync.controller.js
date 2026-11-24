const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const { getIO } = require('../config/socket');

/**
 * Service name mapping: n8n service names → fuzzy match keywords
 * This maps the service names from n8n's Validate Booking node
 * to find the matching MongoDB Service document
 */
const SERVICE_NAME_KEYWORDS = {
  'ac general servicing': ['general', 'servicing'],
  'ac deep cleaning': ['deep', 'clean'],
  'ac repair and troubleshooting': ['repair', 'troubleshoot'],
  'ac gas refilling': ['gas', 'refill'],
  'ac installation': ['install'],
  'ac uninstallation': ['uninstall'],
  'ac maintenance': ['maintenance'],
};

/**
 * Find a MongoDB Service by fuzzy matching the n8n service name
 */
async function findServiceByName(n8nServiceName) {
  const lowerName = (n8nServiceName || '').toLowerCase();
  
  // Try exact match first
  let service = await Service.findOne({ 
    name: { $regex: new RegExp('^' + lowerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
    isActive: true 
  });
  if (service) return service;

  // Try keyword-based fuzzy match
  for (const [n8nName, keywords] of Object.entries(SERVICE_NAME_KEYWORDS)) {
    if (keywords.every(kw => lowerName.includes(kw))) {
      service = await Service.findOne({
        name: { $regex: new RegExp(keywords.join('.*'), 'i') },
        isActive: true
      });
      if (service) return service;
    }
  }

  // Final fallback: search with individual words
  const words = lowerName.replace(/^ac\s+/i, '').split(/\s+/).filter(w => w.length > 2);
  for (const word of words) {
    service = await Service.findOne({
      name: { $regex: new RegExp(word, 'i') },
      isActive: true
    });
    if (service) return service;
  }

  return null;
}

/**
 * Map n8n time format (HH:mm start_time + end_time) to Booking.timeSlot enum
 * Booking timeSlot enum: '09:00-10:00', '10:00-11:00', etc.
 */
function mapToTimeSlot(startTime, endTime) {
  const validSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
  ];

  if (startTime && endTime) {
    // Normalize to HH:mm format
    const start = startTime.padStart(5, '0');
    const end = endTime.padStart(5, '0');
    const slot = `${start}-${end}`;
    if (validSlots.includes(slot)) return slot;
  }

  // If the n8n slot doesn't match exactly, find the closest matching start
  if (startTime) {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const match = validSlots.find(s => parseInt(s.split(':')[0], 10) === startHour);
    if (match) return match;
  }

  // Default to a valid slot if no match
  return '09:00-10:00';
}

/**
 * Find or create a user by phone number
 * For WhatsApp bookings, we create a minimal user if one doesn't exist
 */
async function findOrCreateUser(phone, customerName) {
  // Normalize phone to 10 digits (strip 91 prefix if present)
  let normalizedPhone = phone.replace(/[^0-9]/g, '');
  if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
    normalizedPhone = normalizedPhone.substring(2);
  }
  if (normalizedPhone.startsWith('0') && normalizedPhone.length === 11) {
    normalizedPhone = normalizedPhone.substring(1);
  }

  // Try to find existing user by phone
  let user = await User.findOne({ phone: normalizedPhone });
  if (user) return user;

  // Create a new user for WhatsApp customer
  const crypto = require('crypto');
  const randomPassword = crypto.randomBytes(16).toString('hex');
  
  user = await User.create({
    name: customerName || 'WhatsApp Customer',
    email: `wa_${normalizedPhone}@placeholder.fairaircon.com`,
    phone: normalizedPhone,
    password: randomPassword,
    isVerified: false
  });

  return user;
}

// @desc    Sync booking from n8n WhatsApp workflow
// @route   POST /api/n8n/booking-sync
// @access  Protected via API secret
exports.syncBooking = async (req, res) => {
  try {
    const {
      booking_id,
      customer_name,
      phone,
      service,
      date,
      start_time,
      end_time,
      address,
      city,
      notes,
      source
    } = req.body;

    // --- Validation ---
    const errors = [];
    if (!booking_id) errors.push('booking_id is required');
    if (!customer_name) errors.push('customer_name is required');
    if (!phone) errors.push('phone is required');
    if (!service) errors.push('service is required');
    if (!date) errors.push('date is required');
    if (!start_time) errors.push('start_time is required');
    if (!address) errors.push('address is required');

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // --- Idempotency Check ---
    const existingBooking = await Booking.findOne({ externalBookingId: booking_id });
    if (existingBooking) {
      return res.status(200).json({
        success: true,
        message: 'Booking already synced (idempotent)',
        booking: existingBooking._id,
        externalBookingId: booking_id,
        duplicate: true
      });
    }

    // --- Find Service ---
    const matchedService = await findServiceByName(service);
    if (!matchedService) {
      return res.status(400).json({
        success: false,
        message: `Service "${service}" not found in database. Available services may need to be seeded.`,
        hint: 'Run the seed script or create services in admin panel first.'
      });
    }

    // --- Find or Create User ---
    const user = await findOrCreateUser(phone, customer_name);

    // --- Map Time Slot ---
    const timeSlot = mapToTimeSlot(start_time, end_time);

    // --- Parse Address ---
    const pincodeMatch = (address || '').match(/\b\d{6}\b/);
    const bookingAddress = {
      street: address || '',
      city: city || 'Mumbai',
      state: 'Maharashtra',
      pincode: pincodeMatch ? pincodeMatch[0] : '400001'
    };

    // --- Calculate Amount ---
    const totalAmount = matchedService.discountPrice > 0 
      ? matchedService.discountPrice 
      : matchedService.basePrice;

    // --- Create Booking ---
    const booking = await Booking.create({
      user: user._id,
      service: matchedService._id,
      scheduledDate: new Date(date),
      timeSlot,
      address: bookingAddress,
      totalAmount,
      notes: notes || '',
      status: 'confirmed',  // WhatsApp bookings come pre-confirmed
      paymentStatus: 'pending',
      source: source || 'whatsapp',
      externalBookingId: booking_id
    });

    // Populate for response and notification
    const populated = await booking.populate([
      'service',
      { path: 'user', select: 'name email phone' }
    ]);

    // --- Emit Socket.IO notification to admin ---
    try {
      const io = getIO();
      io.emit('new_whatsapp_booking', {
        booking: {
          _id: populated._id,
          user: populated.user,
          service: { name: populated.service.name },
          scheduledDate: populated.scheduledDate,
          timeSlot: populated.timeSlot,
          totalAmount: populated.totalAmount,
          status: populated.status,
          source: populated.source,
          externalBookingId: populated.externalBookingId,
          createdAt: populated.createdAt
        }
      });
    } catch (socketErr) {
      console.error('Socket.IO notification failed:', socketErr.message);
      // Don't fail the booking creation due to socket error
    }

    console.log(`✅ WhatsApp booking synced: ${booking_id} → MongoDB ID: ${booking._id}`);

    res.status(201).json({
      success: true,
      message: 'Booking synced successfully',
      booking: populated._id,
      externalBookingId: booking_id,
      mongoId: populated._id,
      duplicate: false
    });

  } catch (error) {
    console.error('❌ n8n booking sync error:', error);

    // Handle duplicate key error (race condition safety)
    if (error.code === 11000 && error.keyPattern?.externalBookingId) {
      const existing = await Booking.findOne({ externalBookingId: req.body.booking_id });
      return res.status(200).json({
        success: true,
        message: 'Booking already synced (concurrent duplicate)',
        booking: existing?._id,
        externalBookingId: req.body.booking_id,
        duplicate: true
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during booking sync',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

