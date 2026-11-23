/**
 * Comprehensive Automated Verification Suite for OTP Authentication System
 * Tests all 10 security & operational criteria specified in user requirements.
 */

const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';
const Otp = require('./src/models/Otp');
const User = require('./src/models/User');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const logPass = (title) => console.log(`${colors.green}✔ PASS:${colors.reset} ${title}`);
const logFail = (title, err) => {
  console.error(`${colors.red}✖ FAIL:${colors.reset} ${title}`);
  if (err) console.error(err);
};

let passedCount = 0;
let failedCount = 0;

const assert = (condition, description) => {
  if (condition) {
    logPass(description);
    passedCount++;
  } else {
    logFail(description);
    failedCount++;
    throw new Error(`Assertion failed: ${description}`);
  }
};

async function runTestSuite() {
  console.log(`\n${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.cyan}   FAIR AIRCON - SECURE OTP SYSTEM AUTOMATED TEST SUITE        ${colors.reset}`);
  console.log(`${colors.cyan}================================================================${colors.reset}\n`);

  await mongoose.connect(process.env.MONGODB_URI);

  const testPhoneExisting = '9820000001';
  const testPhoneNew = '9820000002';
  const testPhoneExpired = '9820000003';
  const testPhoneAttempts = '9820000004';

  // Clean test data before running
  await Otp.deleteMany({ phone: { $in: [testPhoneExisting, testPhoneNew, testPhoneExpired, testPhoneAttempts] } });
  await User.deleteMany({ phone: { $in: [testPhoneExisting, testPhoneNew, testPhoneExpired, testPhoneAttempts] } });

  // Pre-seed an existing user
  const existingUser = new User({
    name: 'Verified Customer',
    email: 'test_existing_customer@fairaircon.com',
    phone: testPhoneExisting,
    password: 'password123',
    role: 'user',
    isVerified: true
  });
  await existingUser.save();

  try {
    // -------------------------------------------------------------
    // TEST 1: Send OTP to Mobile Number
    // -------------------------------------------------------------
    console.log(`\n--- TEST 1: Send OTP to Mobile Number ---`);
    const sendRes = await axios.post(`${API_BASE}/auth/send-otp`, { phone: testPhoneExisting });
    assert(sendRes.status === 200 && sendRes.data.success === true, 'POST /api/auth/send-otp returns 200 OK');
    assert(!sendRes.data.otp, 'Security Check: Raw OTP is NOT exposed in API response');
    assert(sendRes.data.cooldownSeconds === 60, 'Response includes 60-second resend cooldown');

    const dbOtp = await Otp.findOne({ phone: testPhoneExisting, isUsed: false });
    assert(dbOtp !== null, 'OTP document created in MongoDB');
    assert(dbOtp.otpHash && dbOtp.otpHash.startsWith('$2') && dbOtp.otpHash.length >= 60, 'Security Check: OTP is hashed in MongoDB with bcrypt');

    // -------------------------------------------------------------
    // TEST 2: Resend Cooldown Enforcement
    // -------------------------------------------------------------
    console.log(`\n--- TEST 2: Resend Cooldown Enforcement ---`);
    try {
      await axios.post(`${API_BASE}/auth/send-otp`, { phone: testPhoneExisting });
      assert(false, 'Should have rejected resend before cooldown');
    } catch (err) {
      assert(err.response?.status === 429, 'Immediate resend rejected with HTTP 429 Too Many Requests');
      assert(err.response?.data?.remainingSeconds > 0, 'Remaining cooldown seconds returned to client');
    }

    // -------------------------------------------------------------
    // TEST 3: Incorrect OTP verification
    // -------------------------------------------------------------
    console.log(`\n--- TEST 3: Incorrect OTP Verification ---`);
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        phone: testPhoneExisting,
        otp: '000000'
      });
      assert(false, 'Should reject invalid OTP');
    } catch (err) {
      assert(err.response?.status === 400, 'Invalid OTP rejected with HTTP 400 Bad Request');
      assert(err.response?.data?.remainingAttempts === 4, 'Remaining attempts accurately decremented to 4');
    }

    // -------------------------------------------------------------
    // TEST 4: Maximum Verification Attempts (Max 5 attempts)
    // -------------------------------------------------------------
    console.log(`\n--- TEST 4: Maximum Verification Attempts Exhaustion ---`);
    const attemptHash = await bcrypt.hash('123456', 10);
    const attemptOtpDoc = new Otp({
      phone: testPhoneAttempts,
      otpHash: attemptHash,
      attempts: 4, // 4 already used
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    await attemptOtpDoc.save();

    // 5th failed attempt
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        phone: testPhoneAttempts,
        otp: '999999'
      });
    } catch (err) {
      assert(err.response?.status === 400, '5th failed attempt increments attempt counter');
    }

    // 6th attempt should be blocked
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        phone: testPhoneAttempts,
        otp: '123456'
      });
      assert(false, 'Should block after 5 failed attempts');
    } catch (err) {
      assert(err.response?.status === 429, 'Blocked with HTTP 429 after exceeding max 5 attempts');
      assert(err.response?.data?.message.includes('Maximum verification attempts'), 'Clear security warning message returned');
    }

    // -------------------------------------------------------------
    // TEST 5: Expired OTP
    // -------------------------------------------------------------
    console.log(`\n--- TEST 5: Expired OTP Rejection ---`);
    const expiredHash = await bcrypt.hash('654321', 10);
    const expiredDoc = new Otp({
      phone: testPhoneExpired,
      otpHash: expiredHash,
      attempts: 0,
      expiresAt: new Date(Date.now() - 10000) // 10 seconds in the past
    });
    await expiredDoc.save();

    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        phone: testPhoneExpired,
        otp: '654321'
      });
      assert(false, 'Should reject expired OTP');
    } catch (err) {
      assert(err.response?.status === 400, 'Expired OTP rejected with HTTP 400');
      assert(err.response?.data?.message.toLowerCase().includes('expired'), 'Explicit expired OTP notification returned');
    }

    // -------------------------------------------------------------
    // TEST 6: Correct OTP Verification with Existing User
    // -------------------------------------------------------------
    console.log(`\n--- TEST 6: Correct OTP Verification (Existing User) ---`);
    const knownOtp = '556677';
    const knownHash = await bcrypt.hash(knownOtp, 10);
    await Otp.updateMany({ phone: testPhoneExisting }, { isUsed: true });
    const validOtpDoc = new Otp({
      phone: testPhoneExisting,
      otpHash: knownHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    await validOtpDoc.save();

    const verifyExistingRes = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: testPhoneExisting,
      otp: knownOtp
    });
    assert(verifyExistingRes.status === 200, 'Verification successful with valid OTP');
    assert(verifyExistingRes.data.token && typeof verifyExistingRes.data.token === 'string', 'JWT Token generated and returned');
    assert(verifyExistingRes.data.user.email === 'test_existing_customer@fairaircon.com', 'Existing user record reused without duplicates');
    assert(verifyExistingRes.data.isNewUser === false, 'User correctly identified as existing user (isNewUser: false)');

    const countUsers = await User.countDocuments({ phone: testPhoneExisting });
    assert(countUsers === 1, 'No duplicate user created in MongoDB');

    // -------------------------------------------------------------
    // TEST 7: Reused OTP Prevention
    // -------------------------------------------------------------
    console.log(`\n--- TEST 7: OTP Reuse Prevention ---`);
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        phone: testPhoneExisting,
        otp: knownOtp
      });
      assert(false, 'Should reject already-used OTP');
    } catch (err) {
      assert(err.response?.status === 400, 'Reused OTP immediately rejected');
    }

    // -------------------------------------------------------------
    // TEST 8: New User Registration via OTP
    // -------------------------------------------------------------
    console.log(`\n--- TEST 8: New User Instant Registration via OTP ---`);
    const newOtp = '889900';
    const newOtpHash = await bcrypt.hash(newOtp, 10);
    const newOtpDoc = new Otp({
      phone: testPhoneNew,
      otpHash: newOtpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    await newOtpDoc.save();

    const verifyNewRes = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: testPhoneNew,
      otp: newOtp,
      name: 'Rohan Sharma'
    });

    assert(verifyNewRes.status === 200, 'New user verified and created');
    assert(verifyNewRes.data.isNewUser === true, 'Identified as new user (isNewUser: true)');
    assert(verifyNewRes.data.user.name === 'Rohan Sharma', 'User name properly stored');
    assert(verifyNewRes.data.user.role === 'user', 'Default user role assigned');
    assert(verifyNewRes.data.token, 'JWT Token generated for new user');

    const newUserInDb = await User.findOne({ phone: testPhoneNew });
    assert(newUserInDb !== null && newUserInDb.isVerified === true, 'New user saved in MongoDB with isVerified: true');

    // -------------------------------------------------------------
    // TEST 9: Unauthorized Dashboard Access Guard
    // -------------------------------------------------------------
    console.log(`\n--- TEST 9: Unauthorized Dashboard Access Guard ---`);
    // Attempt accessing protected profile without token
    try {
      await axios.get(`${API_BASE}/auth/profile`);
      assert(false, 'Should reject unauthenticated profile request');
    } catch (err) {
      assert(err.response?.status === 401, 'Unauthenticated access rejected with HTTP 401 Unauthorized');
    }

    // Attempt accessing admin route with customer token
    const customerToken = verifyNewRes.data.token;
    try {
      await axios.get(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(false, 'Should reject regular customer from admin routes');
    } catch (err) {
      assert(err.response?.status === 403, 'Customer correctly forbidden from Admin routes (HTTP 403 Forbidden)');
    }

    // Authenticated profile access with valid token
    const profileRes = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(profileRes.status === 200, 'Protected profile successfully accessible with OTP-generated JWT token');
    assert(profileRes.data.user.phone === testPhoneNew, 'Profile data matches OTP authenticated user');

    // -------------------------------------------------------------
    // TEST 10: Phone Number Normalization
    // -------------------------------------------------------------
    console.log(`\n--- TEST 10: Mobile Number Normalization & Validation ---`);
    const { normalizePhone } = require('./src/utils/phoneHelper');
    const p1 = normalizePhone('+91 98201 23456');
    assert(p1.isValid && p1.normalized === '9820123456' && p1.e164 === '+919820123456', '+91 formatted numbers normalized to 10 digits');

    const p2 = normalizePhone('09820123456');
    assert(p2.isValid && p2.normalized === '9820123456', 'Leading zero normalized to 10 digits');

    const p3 = normalizePhone('12345');
    assert(!p3.isValid, 'Short invalid phone numbers rejected');

    const p4 = normalizePhone('2345678901');
    assert(!p4.isValid, 'Phone numbers not starting with 6, 7, 8, or 9 rejected');

    console.log(`\n${colors.green}================================================================${colors.reset}`);
    console.log(`${colors.green}   ALL TESTS PASSED! (${passedCount}/${passedCount})                  ${colors.reset}`);
    console.log(`${colors.green}================================================================${colors.reset}\n`);

  } catch (err) {
    console.error(`\n${colors.red}Test suite encountered error:${colors.reset}`, err.message);
  } finally {
    // Cleanup test data
    await Otp.deleteMany({ phone: { $in: [testPhoneExisting, testPhoneNew, testPhoneExpired, testPhoneAttempts] } });
    await User.deleteMany({ phone: { $in: [testPhoneExisting, testPhoneNew, testPhoneExpired, testPhoneAttempts] } });
    await mongoose.disconnect();
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTestSuite();
