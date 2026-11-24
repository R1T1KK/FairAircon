require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const Booking = require('./src/models/Booking');
const Service = require('./src/models/Service');
const User = require('./src/models/User');

const API_SECRET = process.env.N8N_BOOKING_API_SECRET || 'fairaircon_n8n_secret_2026_xyz';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTestSuite() {
  console.log('==================================================');
  console.log('🧪 Starting n8n WhatsApp ↔ Website Integration Test Suite');
  console.log('==================================================\n');

  let server;
  let baseUrl;

  try {
    // 1. Connect DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB Atlas\n');

    // 2. Start temporary HTTP server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`🚀 Test server listening on ${baseUrl}\n`);
        resolve();
      });
    });

    // Ensure a test service exists
    let testService = await Service.findOne({ name: /general/i });
    if (!testService) {
      testService = await Service.create({
        name: 'AC General Servicing',
        description: 'Comprehensive cleaning and maintenance of your AC unit',
        category: 'cleaning',
        basePrice: 599,
        discountPrice: 499,
        duration: 60,
        features: ['Filter cleaning', 'Cooling coil check']
      });
      console.log('  ℹ️ Created mock AC General Servicing service for testing');
    }

    const uniqueSuffix = Date.now().toString().slice(-4);
    const testBookingId = `FA-261124-1400-${uniqueSuffix}`;
    const testPhone = `98204${uniqueSuffix.padStart(5, '0')}`;

    // --- TEST 1: Missing Authentication Header ---
    console.log('--- TEST 1: Missing API Secret (401 expected) ---');
    const res1 = await fetch(`${baseUrl}/api/n8n/booking-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: testBookingId })
    });
    const body1 = await res1.json();
    assert(res1.status === 401, `Status is 401 Unauthorized (got ${res1.status})`);
    assert(body1.success === false, 'success is false');

    // --- TEST 2: Invalid API Secret ---
    console.log('\n--- TEST 2: Invalid API Secret (403 expected) ---');
    const res2 = await fetch(`${baseUrl}/api/n8n/booking-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': 'wrong_secret_123'
      },
      body: JSON.stringify({ booking_id: testBookingId })
    });
    const body2 = await res2.json();
    assert(res2.status === 403, `Status is 403 Forbidden (got ${res2.status})`);
    assert(body2.message === 'Invalid API credentials', 'Expected error message returned');

    // --- TEST 3: Missing Required Fields ---
    console.log('\n--- TEST 3: Validation Error on Missing Fields (400 expected) ---');
    const res3 = await fetch(`${baseUrl}/api/n8n/booking-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET
      },
      body: JSON.stringify({
        booking_id: testBookingId,
        customer_name: 'Test Customer'
        // Missing phone, service, date, start_time, address
      })
    });
    const body3 = await res3.json();
    assert(res3.status === 400, `Status is 400 Bad Request (got ${res3.status})`);
    assert(Array.isArray(body3.errors), 'Response contains array of missing field errors');
    assert(body3.errors.includes('phone is required'), 'Identifies phone is required');
    assert(body3.errors.includes('service is required'), 'Identifies service is required');

    // --- TEST 4: Successful WhatsApp Booking Sync ---
    console.log('\n--- TEST 4: Valid Booking Creation via n8n (201 expected) ---');
    const bookingPayload = {
      booking_id: testBookingId,
      customer_name: 'Ravi Verma',
      phone: `+91${testPhone}`,
      service: 'AC General Servicing',
      duration_min: 60,
      date: '2026-11-25',
      start_time: '14:00',
      end_time: '15:00',
      address: 'Flat 402, Lake View Apartments, Powai',
      city: 'Mumbai',
      notes: 'Please bring ladder',
      source: 'whatsapp'
    };

    const res4 = await fetch(`${baseUrl}/api/n8n/booking-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET
      },
      body: JSON.stringify(bookingPayload)
    });
    const body4 = await res4.json();

    assert(res4.status === 201, `Status is 201 Created (got ${res4.status})`);
    assert(body4.success === true, 'success is true');
    assert(body4.externalBookingId === testBookingId, `externalBookingId matches ${testBookingId}`);
    assert(body4.duplicate === false, 'duplicate flag is false');
    assert(!!body4.mongoId, 'MongoDB ObjectId is returned');

    // Verify in MongoDB
    const savedBooking = await Booking.findById(body4.mongoId).populate('user service');
    assert(!!savedBooking, 'Booking exists in MongoDB');
    assert(savedBooking.source === 'whatsapp', `Booking source is "whatsapp" (got "${savedBooking?.source}")`);
    assert(savedBooking.externalBookingId === testBookingId, 'externalBookingId matches in DB');
    assert(savedBooking.status === 'confirmed', `Status is "confirmed" (got "${savedBooking?.status}")`);
    assert(savedBooking.user.name === 'Ravi Verma', `User name is "Ravi Verma" (got "${savedBooking?.user?.name}")`);
    assert(savedBooking.address.street === 'Flat 402, Lake View Apartments, Powai', 'Address matches correctly');

    // --- TEST 5: Idempotency (Submit Same Booking ID Twice) ---
    console.log('\n--- TEST 5: Idempotency Check (Duplicate booking_id returns 200 without duplicate row) ---');
    const res5 = await fetch(`${baseUrl}/api/n8n/booking-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET
      },
      body: JSON.stringify(bookingPayload)
    });
    const body5 = await res5.json();

    assert(res5.status === 200, `Status is 200 OK for idempotent duplicate (got ${res5.status})`);
    assert(body5.duplicate === true, 'duplicate flag is true');
    assert(body5.externalBookingId === testBookingId, 'Returns matching externalBookingId');

    const totalMatchingBookings = await Booking.countDocuments({ externalBookingId: testBookingId });
    assert(totalMatchingBookings === 1, `Exact 1 booking document exists in DB (count: ${totalMatchingBookings})`);

    // --- TEST 6: Customer Re-use by Phone ---
    console.log('\n--- TEST 6: Second Booking with Same Customer Reuses User Profile ---');
    const secondBookingId = `FA-261124-1600-${uniqueSuffix}`;
    const res6 = await fetch(`${baseUrl}/api/n8n/booking-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET
      },
      body: JSON.stringify({
        ...bookingPayload,
        booking_id: secondBookingId,
        start_time: '16:00',
        end_time: '17:00'
      })
    });
    const body6 = await res6.json();

    assert(res6.status === 201, `Status is 201 Created (got ${res6.status})`);
    const secondBooking = await Booking.findById(body6.mongoId);
    assert(secondBooking.user.toString() === savedBooking.user._id.toString(), 'Reused existing user ID in MongoDB');

    // --- TEST 7: Fuzzy Service Matching ---
    console.log('\n--- TEST 7: Fuzzy Service Matching (e.g., lowercase "general servicing") ---');
    const thirdBookingId = `FA-261124-1700-${uniqueSuffix}`;
    const res7 = await fetch(`${baseUrl}/api/n8n/booking-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET
      },
      body: JSON.stringify({
        ...bookingPayload,
        booking_id: thirdBookingId,
        service: 'general servicing',
        start_time: '17:00',
        end_time: '18:00'
      })
    });
    assert(res7.status === 201, `Status is 201 Created with fuzzy match (got ${res7.status})`);

    // --- TEST 8: Admin Retrieval & WhatsApp Source Visibility ---
    console.log('\n--- TEST 8: Admin Bookings Query Filters by WhatsApp Source ---');
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Test Admin',
        email: `admin_${uniqueSuffix}@fairaircon.test`,
        phone: '9999999999',
        password: 'Password123!',
        role: 'admin',
        isVerified: true
      });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res8 = await fetch(`${baseUrl}/api/admin/bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const body8 = await res8.json();

    assert(res8.status === 200, `Admin bookings query status is 200 (got ${res8.status})`);
    const foundWhatsappBooking = body8.bookings.find(b => b.externalBookingId === testBookingId);
    assert(!!foundWhatsappBooking, 'WhatsApp booking appears in admin list');
    assert(foundWhatsappBooking?.source === 'whatsapp', 'Admin booking payload preserves source "whatsapp"');

    // --- TEST 9: Health Check Route ---
    console.log('\n--- TEST 9: Existing Backend Health Check ---');
    const res9 = await fetch(`${baseUrl}/api/health`);
    const body9 = await res9.json();
    assert(res9.status === 200 && body9.success === true, 'Health check OK');

    // --- TEST 10: Simultaneous Race Condition (Concurrent Duplicate Requests) ---
    console.log('\n--- TEST 10: Simultaneous Race Condition (Concurrent Requests) ---');
    const raceBookingId = `FA-261124-1800-RACE${uniqueSuffix}`;
    const racePayload = {
      ...bookingPayload,
      booking_id: raceBookingId,
      phone: `+9198205${uniqueSuffix.padStart(5, '0')}`,
      start_time: '18:00',
      end_time: '19:00'
    };

    const [raceRes1, raceRes2] = await Promise.all([
      fetch(`${baseUrl}/api/n8n/booking-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET },
        body: JSON.stringify(racePayload)
      }),
      fetch(`${baseUrl}/api/n8n/booking-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET },
        body: JSON.stringify(racePayload)
      })
    ]);

    const raceBody1 = await raceRes1.json();
    const raceBody2 = await raceRes2.json();
    assert([200, 201].includes(raceRes1.status) && [200, 201].includes(raceRes2.status), 'Both concurrent requests handled safely without 500 error');
    assert((raceBody1.duplicate === false && raceBody2.duplicate === true) || (raceBody1.duplicate === true && raceBody2.duplicate === false), 'Exactly one request created and other flagged as duplicate');
    const raceCount = await Booking.countDocuments({ externalBookingId: raceBookingId });
    assert(raceCount === 1, `Database contains exactly 1 document under concurrent load (count: ${raceCount})`);

    // --- TEST 11: Website Booking Creation Regression Test ---
    console.log('\n--- TEST 11: Website Booking API Regression Check (POST /api/bookings) ---');
    // Create a regular user and token
    const testWebUser = await User.create({
      name: 'Web User Test',
      email: `webuser_${uniqueSuffix}@fairaircon.test`,
      phone: `98333${uniqueSuffix.padStart(5, '0')}`,
      password: 'Password123!',
      isVerified: true
    });
    const webUserToken = jwt.sign({ id: testWebUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res11 = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webUserToken}`
      },
      body: JSON.stringify({
        serviceId: testService._id,
        scheduledDate: tomorrow.toISOString(),
        timeSlot: '10:00-11:00',
        address: {
          street: '123 Marine Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400020'
        },
        notes: 'Website booking test'
      })
    });
    const body11 = await res11.json();
    assert(res11.status === 201, `Website booking status is 201 Created (got ${res11.status})`);
    assert(body11.booking?.source === 'website', `Website booking source defaults to "website" (got "${body11.booking?.source}")`);
    assert(!body11.booking?.externalBookingId, 'Website booking has no externalBookingId (null/undefined)');

    // Cleanup test bookings
    console.log('\n🧹 Cleaning up test artifacts...');
    await Booking.deleteMany({
      externalBookingId: { $in: [testBookingId, secondBookingId, thirdBookingId, raceBookingId] }
    });
    if (body11.booking?._id) {
      await Booking.findByIdAndDelete(body11.booking._id);
    }
    await User.findByIdAndDelete(testWebUser._id);
    await Booking.deleteMany({
      externalBookingId: { $in: [testBookingId, secondBookingId, thirdBookingId] }
    });
    if (adminUser.email.includes('@fairaircon.test')) {
      await User.findByIdAndDelete(adminUser._id);
    }
    console.log('  Cleaned up test bookings');

    console.log('\n==================================================');
    console.log(`🏁 Test Results: ${passedTests}/${totalTests} Passed`);
    console.log('==================================================');

    server.close();
    await mongoose.connection.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('💥 Test suite crashed:', err);
    if (server) server.close();
    process.exit(1);
  }
}

runTestSuite();
