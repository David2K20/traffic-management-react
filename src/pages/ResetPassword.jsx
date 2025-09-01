import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCar, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import Card from '../components/ui/Card';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  
  const { resetPassword } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if we have the necessary parameters from the reset link
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    if (type !== 'recovery' || !accessToken || !refreshToken) {
      // Invalid or expired reset link
      setIsExpired(true);
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const result = await resetPassword(formData.password);
      
      if (result.success) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } else {
        if (result.message.includes('expired') || result.message.includes('invalid')) {
          setIsExpired(true);
        } else {
          setErrors({ general: result.message });
        }
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({ general: 'An error occurred while resetting your password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate('/login', { replace: true });
  };

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <FaCar className="text-blue-600 text-5xl" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Traffic Management System
            </p>
          </div>

          <Card>
            <div className="text-center">
              <FaExclamationTriangle className="text-red-600 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reset Link Expired</h3>
              <p className="text-gray-600 mb-6">
                This password reset link has expired or is invalid. 
                Please request a new password reset link from the login page.
              </p>
              
              <Button
                onClick={handleRequestNewLink}
                className="w-full"
              >
                Go to Login Page
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <FaCar className="text-blue-600 text-5xl" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Password Reset
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Traffic Management System
            </p>
          </div>

          <Card>
            <div className="text-center">
              <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Updated!</h3>
              <p className="text-gray-600 mb-6">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  Redirecting you to the login page in a few seconds...
                </p>
              </div>
              
              <Button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full"
              >
                Go to Login Page
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center">
            <FaCar className="text-blue-600 text-5xl" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {/* Reset Password Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            <div className="relative">
              <FormInput
                label="New Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                required
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="relative">
              <FormInput
                label="Confirm New Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={errors.confirmPassword}
                required
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Password Requirements:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
                <li>At least 8 characters long</li>
                <li>Use a strong, unique password</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
