import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar, FaUser, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import Card from '../components/ui/Card';

const Register = () => {
  const [userType, setUserType] = useState('user');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    vehiclePlate: '',
    badgeId: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { registerUser } = useApp();
  const navigate = useNavigate();

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
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Phone number is required for all users
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    // Vehicle plate is required for all users
    if (!formData.vehiclePlate.trim()) {
      newErrors.vehiclePlate = 'Vehicle plate number is required';
    }
    
    // Role-specific fields
    if (userType === 'admin') {
      if (!formData.badgeId.trim()) {
        newErrors.badgeId = 'Badge ID is required';
      }
      if (!formData.department.trim()) {
        newErrors.department = 'Department is required';
      }
    }
    
    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
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
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        userType,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        vehiclePlate: formData.vehiclePlate,
        ...(userType === 'admin' ? {
          badgeId: formData.badgeId,
          department: formData.department
        } : {})
      };
      
      const result = await registerUser(userData);
      
      if (result.success) {
        if (result.loggedIn) {
          // User is immediately logged in, redirect to appropriate dashboard
          const redirectPath = userType === 'admin' ? '/admin/dashboard' : '/dashboard';
          console.log('Registration successful, redirecting to:', redirectPath);
          navigate(redirectPath, { replace: true });
        } else {
          // Registration successful but not logged in, show success and redirect to login
          setShowSuccess(true);
        }
      } else {
        // Handle field-specific errors
        if (result.field) {
          setErrors({ [result.field]: result.message });
        } else {
          setErrors({ general: result.message });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'An error occurred during registration. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center">
            <FaCar className="text-blue-600 text-5xl" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the Traffic Management System
          </p>
        </div>

        {/* Success Screen */}
        {showSuccess ? (
          <Card>
            <div className="text-center">
              <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Registration Successful!</h3>
              <p className="text-gray-600 mb-6">
                Your account has been created successfully. You can now sign in with your credentials.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Account created for:</strong> {formData.email}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Click "Go to Login" below to sign in to your account.
                </p>
              </div>
              
              {/* Display messages */}
              {errors.general && (
                <div className={`mb-4 px-4 py-3 rounded ${
                  errors.general.includes('successfully') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {errors.general}
                </div>
              )}
              
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* User Type Selection */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Account Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUserType('user')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    userType === 'user' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <FaUser className="text-2xl mb-2 mx-auto" />
                  <div className="text-sm font-medium">Regular User</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('admin')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    userType === 'admin' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <FaShieldAlt className="text-2xl mb-2 mx-auto" />
                  <div className="text-sm font-medium">Law Enforcement</div>
                </button>
              </div>
            </Card>

            {/* Registration Form */}
            <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {errors.general}
                </div>
              )}

              <FormInput
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                error={errors.fullName}
                required
                placeholder="Enter your full name"
              />

              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                required
                placeholder="Enter your email address"
              />

              <FormInput
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                error={errors.phoneNumber}
                required
                placeholder="Enter your phone number"
              />

              <FormInput
                label="Vehicle Plate Number"
                name="vehiclePlate"
                value={formData.vehiclePlate}
                onChange={handleInputChange}
                error={errors.vehiclePlate}
                required
                placeholder="Enter your vehicle plate number"
              />

              {userType === 'admin' && (
                <>
                  <FormInput
                    label="Badge ID"
                    name="badgeId"
                    value={formData.badgeId}
                    onChange={handleInputChange}
                    error={errors.badgeId}
                    required
                    placeholder="Enter your badge ID"
                  />
                  <FormInput
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    error={errors.department}
                    required
                    placeholder="Enter your department"
                  />
                </>
              )}

              <FormInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                required
                placeholder="Create a password (min. 8 characters)"
              />

              <FormInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={errors.confirmPassword}
                required
                placeholder="Confirm your password"
              />
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="text-sm">
                  <div className={`p-2 rounded ${
                    formData.password.length >= 8 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    Password strength: {formData.password.length >= 8 ? '✓ Strong' : '✗ Too short (min. 8 characters)'}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in here
                </Link>
              </p>
            </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
