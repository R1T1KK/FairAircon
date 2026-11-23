/**
 * Helper to validate and normalize Indian mobile numbers
 */
const normalizePhone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, normalized: '', e164: '', error: 'Phone number is required' };
  }

  // Remove all non-digits
  let digits = rawPhone.replace(/\D/g, '');

  // Handle +91 or 91 country code
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // Leading zero
    digits = digits.slice(1);
  }

  // Validate 10-digit format
  if (digits.length !== 10) {
    return { 
      isValid: false, 
      normalized: '', 
      e164: '', 
      error: 'Please enter a valid 10-digit mobile number' 
    };
  }

  // Validate Indian mobile starting digit (6, 7, 8, 9)
  if (!/^[6-9]/.test(digits)) {
    return { 
      isValid: false, 
      normalized: '', 
      e164: '', 
      error: 'Mobile number must start with 6, 7, 8, or 9' 
    };
  }

  return {
    isValid: true,
    normalized: digits,
    e164: `+91${digits}`,
    error: null
  };
};

module.exports = { normalizePhone };

