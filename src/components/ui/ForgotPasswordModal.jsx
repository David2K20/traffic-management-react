import React, { useState } from 'react';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import { useApp } from '../../context/AppContext';
import Button from './Button';
import FormInput from './FormInput';
import Modal from './Modal';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { requestPasswordReset } = useApp();

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
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
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        setIsSuccess(true);
      } else {
        // Handle specific error messages
        if (result.message.includes('User not found') || result.message.includes('not found')) {
          setErrors({ email: 'No account found with this email address' });
        } else {
          setErrors({ general: result.message });
        }
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      setErrors({ general: 'An error occurred while requesting password reset. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setErrors({});
    setIsSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Your Password">
      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <div className="text-center mb-6">
            <FaEnvelope className="text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">
              Enter your registered email address and we'll send you a link to reset your password.
            </p>
          </div>

          <FormInput
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={handleInputChange}
            error={errors.email}
            required
            placeholder="Enter your email address"
          />

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center">
          <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Reset Link Sent!</h3>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your email and click the link to reset your password.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The reset link will expire in 1 hour. If you don't see the email, 
              please check your spam folder or try again.
            </p>
          </div>
          
          <Button
            onClick={handleClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;
