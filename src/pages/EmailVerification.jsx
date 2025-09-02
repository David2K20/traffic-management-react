import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCar, FaEnvelope, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const EmailVerification = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [userEmail, setUserEmail] = useState('');
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state, current user, or session
  useEffect(() => {
    const getEmailFromSession = async () => {
      const email = location.state?.email || state.currentUser?.email;
      if (email) {
        setUserEmail(email);
        return;
      }
      
      // If no email from state/context, try to get it from session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      } catch (error) {
        console.error('Error getting email from session:', error);
      }
    };
    
    getEmailFromSession();
  }, [location.state, state.currentUser]);

  // Start cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Only run a silent initial check - don't show errors
  useEffect(() => {
    if (userEmail && !initialCheckDone) {
      silentVerificationCheck();
    }
  }, [userEmail, initialCheckDone]);

  const silentVerificationCheck = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email_confirmed_at) {
        // User is already verified - we'll handle this manually via button click
        console.log('User already verified, but staying on page for manual confirmation');
      }
      // Don't auto-redirect - let user stay on verification page
    } catch (error) {
      console.error('Silent verification check error:', error);
      // Don't show error to user for silent check
    } finally {
      setInitialCheckDone(true);
    }
  };

  const checkVerificationStatus = async () => {
    setIsChecking(true);
    setMessage('Checking verification status...');
    setMessageType('info');
    
    try {
      if (!userEmail) {
        setMessage('Please register for an account first.');
        setMessageType('error');
        return;
      }

      // Check if we have an active session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // We have an active session, check if email is verified
        if (session.user.email_confirmed_at) {
          // Email is verified! Redirect to sign in page
          setMessage('✅ Email verified! Redirecting to sign in...');
          setMessageType('success');
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Email verified! Please sign in to access your dashboard.',
                email: userEmail 
              } 
            });
          }, 1500);
          return;
        } else {
          setMessage('Please verify your email before continuing.');
          setMessageType('error');
          return;
        }
      }

      // No active session - redirect to login page
      // The login flow will handle checking if the email is verified
      setMessage('✅ Redirecting to sign in...');
      setMessageType('success');
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Please sign in to access your dashboard.',
            email: userEmail,
            fromVerification: true // Flag to indicate this came from verification page
          } 
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error checking verification:', error);
      setMessage('Please verify your email before continuing.');
      setMessageType('error');
    } finally {
      setIsChecking(false);
    }
  };

  const loginVerifiedUser = async (user) => {
    setMessage('✅ Email verified! Logging you in...');
    setMessageType('success');
    
    try {
      // The user is already authenticated and verified
      // Get user metadata to determine redirect path
      const userMetadata = user.user_metadata || {};
      const userType = userMetadata.role || 'user';
      
      // Redirect to appropriate dashboard
      setTimeout(() => {
        const redirectPath = userType === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(redirectPath, { replace: true });
      }, 1500);
      
    } catch (error) {
      console.error('Error during auto-login:', error);
      setMessage('Verification successful! Please refresh the page.');
      setMessageType('success');
    }
  };

  const handleVerifyEmail = async () => {
    await checkVerificationStatus();
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      });

      if (error) {
        setMessage(`Error sending verification email: ${error.message}`);
        setMessageType('error');
      } else {
        setMessage('Verification email sent! Please check your inbox.');
        setMessageType('success');
        setResendCooldown(60); // 60 second cooldown
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      setMessage('Error sending verification email. Please try again.');
      setMessageType('error');
    } finally {
      setResendLoading(false);
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
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Traffic Management System
          </p>
        </div>

        <Card>
          <div className="text-center">
            <FaEnvelope className="text-blue-600 text-4xl mx-auto mb-4" />
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Check Your Email
            </h3>
            
            {userEmail ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  We've sent a verification link to:
                </p>
                <p className="font-semibold text-blue-900 mt-1">
                  {userEmail}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Click the link in your email to verify your account and access the dashboard.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  Please register for an account first or log in to continue.
                </p>
              </div>
            )}

            {/* Status Messages */}
            {message && (
              <div className={`mb-4 px-4 py-3 rounded ${
                messageType === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : messageType === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                <div className="flex items-center">
                  {messageType === 'success' && <FaCheckCircle className="mr-2" />}
                  {messageType === 'error' && <FaExclamationTriangle className="mr-2" />}
                  <span className="text-sm">{message}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Verify Email Button */}
              <Button
                onClick={handleVerifyEmail}
                disabled={isChecking || !userEmail}
                className="w-full"
              >
                {isChecking ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  'I have verified my email'
                )}
              </Button>

              {/* Resend Verification Button */}
              <Button
                onClick={handleResendVerification}
                disabled={resendLoading || resendCooldown > 0 || !userEmail}
                variant="outline"
                className="w-full"
              >
                {resendLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Resend Verification Email'
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-sm text-gray-600">
              <p className="mb-2">Didn't receive the email?</p>
              <ul className="text-xs text-left space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure {userEmail} is correct</li>
                <li>• Wait a few minutes and try resending</li>
              </ul>
            </div>

            {/* Back to Login */}
            <div className="mt-6 text-center border-t pt-4">
              <p className="text-sm text-gray-600">
                Need to use a different email?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Register again
                </button>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerification;
