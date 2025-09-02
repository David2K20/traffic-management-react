import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import SkeletonLoader from './ui/SkeletonLoader';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { state } = useApp();
  const { 
    currentUser, 
    loading, 
    profileLoading, 
    isAuthRestored, 
    sessionCheckComplete, 
    authInitialized,
    loadingTimeout
  } = state;
  const location = useLocation();
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Check email verification status when component mounts or user changes
  useEffect(() => {
    const checkEmailVerification = async () => {
      // Only check verification if we have a user and auth is properly restored
      if (!currentUser || !isAuthRestored || !authInitialized) {
        setCheckingVerification(false);
        return;
      }

      try {
        // First check if we have an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.log('No active session found, skipping email verification check');
          setIsEmailVerified(false);
          setCheckingVerification(false);
          return;
        }
        
        // Only check user details if we have a valid session
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error checking email verification:', error);
          setIsEmailVerified(false);
        } else if (user && user.email_confirmed_at) {
          setIsEmailVerified(true);
        } else {
          setIsEmailVerified(false);
        }
      } catch (error) {
        console.error('Error in email verification check:', error);
        setIsEmailVerified(false);
      } finally {
        setCheckingVerification(false);
      }
    };

    checkEmailVerification();
  }, [currentUser, isAuthRestored, authInitialized]);

  // Determine if we should show loading
  const shouldShowLoading = (
    (loading || profileLoading || !isAuthRestored || !authInitialized || checkingVerification) && 
    !loadingTimeout // Don't show loading if we've timed out - App will handle timeout UI
  );

  if (shouldShowLoading) {
    // If user exists but we're just checking verification, show minimal loading
    if (currentUser && checkingVerification) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Verifying access...</p>
          </div>
        </div>
      );
    }
    
    // For other loading states, use skeleton
    return <SkeletonLoader type="profile" />;
  }

  if (!currentUser) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Temporarily disable automatic email verification check in ProtectedRoute
  // The EmailVerification page will handle this check manually
  // if (!isEmailVerified) {
  //   return <Navigate to="/verify-email" state={{ email: currentUser.email }} replace />;
  // }

  if (adminOnly && currentUser.userType !== 'admin') {
    // Redirect to user dashboard if not admin
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
