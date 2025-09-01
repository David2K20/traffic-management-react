import React, { useState, useEffect, useRef } from 'react';
import { FaRedo, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../ui/Button';
import { formatTime, getRemainingOTPTime, isOTPExpired, verifyOTP } from '../../utils/otpUtils';

const OTPVerification = ({
  email,
  generatedOTP,
  generatedTime,
  onVerificationSuccess,
  onResendOTP,
  isLoading = false,
  className = ''
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const inputRefs = useRef([]);

  // Initialize timer
  useEffect(() => {
    if (generatedTime) {
      const updateTimer = () => {
        const remaining = getRemainingOTPTime(generatedTime);
        setRemainingTime(remaining);
        
        if (remaining === 0) {
          setError('OTP has expired. Please request a new one.');
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      
      return () => clearInterval(interval);
    }
  }, [generatedTime]);

  // Clear error when user types
  useEffect(() => {
    if (error && otp.some(digit => digit !== '')) {
      setError('');
    }
  }, [otp, error]);

  const handleInputChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        if (digits.length === 6) {
          setOtp(digits);
          handleVerifyOTP(digits.join(''));
        }
      });
    }
  };

  const handleVerifyOTP = async (otpValue) => {
    setIsVerifying(true);
    setError('');

    // Check if OTP is expired
    if (isOTPExpired(generatedTime)) {
      setError('OTP has expired. Please request a new one.');
      setIsVerifying(false);
      return;
    }

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (verifyOTP(otpValue, generatedOTP)) {
      onVerificationSuccess();
    } else {
      setError('Invalid OTP. Please check and try again.');
      setOtp(['', '', '', '', '', '']); // Clear OTP inputs
      inputRefs.current[0]?.focus();
    }

    setIsVerifying(false);
  };

  const handleResendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
    onResendOTP();
  };

  const isExpired = remainingTime === 0;
  const otpValue = otp.join('');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <FaClock className="text-2xl text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-gray-600">
          We've sent a 6-digit verification code to{' '}
          <span className="font-medium text-gray-900">{email}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <div className="flex justify-center space-x-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading || isVerifying}
              className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
              } ${isLoading || isVerifying ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center">
          {remainingTime > 0 ? (
            <p className="text-sm text-gray-600">
              Code expires in{' '}
              <span className="font-medium text-blue-600">
                {formatTime(remainingTime)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-red-600 flex items-center justify-center">
              <FaExclamationTriangle className="mr-1" />
              Code has expired
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            <div className="flex items-center justify-center">
              <FaExclamationTriangle className="mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Success Message */}
        {isVerifying && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Verifying OTP...
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Manual Verify Button (shown when OTP is complete but not auto-verified) */}
        {otpValue.length === 6 && !isVerifying && !isExpired && (
          <Button
            onClick={() => handleVerifyOTP(otpValue)}
            className="w-full"
            disabled={isLoading}
          >
            <FaCheckCircle className="mr-2" />
            Verify Code
          </Button>
        )}

        {/* Resend Button */}
        <Button
          variant="outline"
          onClick={handleResendOTP}
          disabled={isLoading || isVerifying || (remainingTime > 240)} // Disable for first 60 seconds
          className="w-full"
        >
          <FaRedo className="mr-2" />
          {remainingTime > 240 ? `Resend in ${formatTime(remainingTime - 240)}` : 'Resend Code'}
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>Didn't receive the code? Check your spam folder or</p>
        <p>try resending after {remainingTime > 240 ? formatTime(remainingTime - 240) : '0 seconds'}</p>
      </div>
    </div>
  );
};

export default OTPVerification;
