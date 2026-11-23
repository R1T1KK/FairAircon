import { useRef, useEffect } from 'react';

/**
 * Modern 6-digit split OTP input component
 * Supports auto-focus, paste distribution, backspace navigation, and arrow keys.
 */
const OtpInput = ({ value = '', onChange, disabled = false, error = false }) => {
  const inputsRef = useRef([]);

  // Ensure digits array has 6 items
  const digits = (value + '      ').slice(0, 6).split('');

  useEffect(() => {
    // Focus first input initially
    if (!disabled && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (e, index) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) return;

    // If user pasted or typed multiple digits
    if (rawVal.length > 1) {
      const newOtp = rawVal.slice(0, 6);
      onChange(newOtp);
      const nextFocus = Math.min(newOtp.length, 5);
      inputsRef.current[nextFocus]?.focus();
      return;
    }

    // Single digit input
    const char = rawVal.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('').trim();
    onChange(combined);

    // Auto advance to next box
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      if (newDigits[index] && newDigits[index] !== ' ') {
        newDigits[index] = ' ';
        onChange(newDigits.join('').trim());
      } else if (index > 0) {
        newDigits[index - 1] = ' ';
        onChange(newDigits.join('').trim());
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      onChange(pastedData);
      const focusIndex = Math.min(pastedData.length, 5);
      inputsRef.current[focusIndex]?.focus();
    }
  };

  return (
    <div className={`otp-grid ${error ? 'otp-has-error' : ''}`}>
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete="one-time-code"
          value={digits[idx] === ' ' ? '' : digits[idx]}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`otp-digit-box ${digits[idx] && digits[idx] !== ' ' ? 'filled' : ''}`}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;

