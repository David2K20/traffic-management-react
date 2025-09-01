// OTP utility functions for frontend simulation
// These will be replaced with Supabase authentication later

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Validate OTP format (6 digits)
 * @param {string} otp - The OTP to validate
 * @returns {boolean} True if valid format
 */
export const isValidOTPFormat = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * Verify OTP against the generated one
 * @param {string} inputOTP - User input OTP
 * @param {string} generatedOTP - The generated OTP
 * @returns {boolean} True if OTP matches
 */
export const verifyOTP = (inputOTP, generatedOTP) => {
  return inputOTP === generatedOTP;
};

/**
 * Check if OTP has expired
 * @param {Date} generatedTime - When the OTP was generated
 * @param {number} expiryMinutes - Expiry time in minutes (default 5)
 * @returns {boolean} True if expired
 */
export const isOTPExpired = (generatedTime, expiryMinutes = 5) => {
  const now = new Date();
  const expiryTime = new Date(generatedTime.getTime() + expiryMinutes * 60000);
  return now > expiryTime;
};

/**
 * Get remaining time for OTP in seconds
 * @param {Date} generatedTime - When the OTP was generated
 * @param {number} expiryMinutes - Expiry time in minutes (default 5)
 * @returns {number} Remaining seconds (0 if expired)
 */
export const getRemainingOTPTime = (generatedTime, expiryMinutes = 5) => {
  const now = new Date();
  const expiryTime = new Date(generatedTime.getTime() + expiryMinutes * 60000);
  const remainingMs = expiryTime - now;
  return Math.max(0, Math.floor(remainingMs / 1000));
};

/**
 * Format remaining time as MM:SS
 * @param {number} seconds - Remaining seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }
  
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }
  
  return {
    isValid: true,
    message: ''
  };
};

/**
 * Simulate sending OTP (for demo purposes)
 * In production, this would call Supabase authentication
 * @param {string} email - Email to send OTP to
 * @param {string} otp - The generated OTP
 * @returns {Promise<boolean>} Success status
 */
export const sendOTP = async (email, otp) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, log the OTP to console
  console.log(`📧 OTP sent to ${email}: ${otp}`);
  
  // TEMPORARY: Show OTP in alert for easy testing (remove in production)
  alert(`🔐 Demo OTP sent to ${email}\n\nYour verification code is: ${otp}\n\n(Check browser console for future OTPs)`);
  
  // In production, this would integrate with Supabase auth
  return true;
};
