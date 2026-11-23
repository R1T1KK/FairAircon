const axios = require('axios');

/**
 * Universal SMS Service supporting Twilio, Fast2SMS, MSG91, and Development Mocking
 */
const sendOtpSms = async ({ phone, e164, otp }) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const smsMessage = `Your Fair Aircon verification code is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;

  // 1. Check Twilio SMS configuration
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const res = await client.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: e164
      });
      return { success: true, provider: 'twilio', sid: res.sid };
    } catch (err) {
      console.error('❌ Twilio SMS failed:', err.message);
      if (isProduction) throw new Error('Failed to send SMS via primary gateway');
    }
  }

  // 2. Check Fast2SMS (Indian SMS Gateway)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const res = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        variables_values: otp,
        route: 'otp',
        numbers: phone
      }, {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      return { success: true, provider: 'fast2sms', data: res.data };
    } catch (err) {
      console.error('❌ Fast2SMS failed:', err.message);
      if (isProduction) throw new Error('Failed to send SMS via Fast2SMS gateway');
    }
  }

  // 3. Check MSG91 (Indian SMS Gateway)
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    try {
      const res = await axios.get('https://control.msg91.com/api/v5/otp', {
        params: {
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: e164.replace('+', ''),
          authkey: process.env.MSG91_AUTH_KEY,
          otp: otp
        }
      });
      return { success: true, provider: 'msg91', data: res.data };
    } catch (err) {
      console.error('❌ MSG91 failed:', err.message);
      if (isProduction) throw new Error('Failed to send SMS via MSG91 gateway');
    }
  }

  // 4. Safe Development fallback (NEVER logs OTP in production)
  if (!isProduction) {
    console.log('\n========================================');
    console.log(`[DEV MODE - SMS GATEWAY]`);
    console.log(`To: ${e164} (${phone})`);
    console.log(`Secure OTP: ${otp}`);
    console.log(`Valid: 5 Minutes`);
    console.log('========================================\n');
    return { success: true, provider: 'dev-mock' };
  }

  throw new Error('No SMS service provider is configured in production environment.');
};

module.exports = { sendOtpSms };

