const twilio = require('twilio');

/**
 * Utility to send WhatsApp messages using Twilio
 * @param {Object} options - { phone, message }
 */
const sendWhatsApp = async (options) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      console.warn('⚠️ Twilio credentials missing. WhatsApp message not sent.');
      return;
    }

    const client = twilio(accountSid, authToken);

    // Format phone number (ensure it has + and country code)
    let toPhone = options.phone;
    if (!toPhone.startsWith('+')) {
      toPhone = `+91${toPhone}`; // Default to India for Mumbai services
    }

    const message = await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${toPhone}`,
      body: options.message
    });

    console.log(`✅ WhatsApp sent to ${toPhone}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('❌ WhatsApp send failed:', error.message);
  }
};

module.exports = sendWhatsApp;
