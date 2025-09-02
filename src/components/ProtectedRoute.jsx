import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { state } = useApp();
  const { currentUser, loading } = state;
  const location = useLocation();
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Check email verification status when component mounts or user changes
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!currentUser) {
        setCheckingVerification(false);
        return;
      }

      try {
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
  }, [currentUser]);

  // Show loading spinner while auth state or email verification is being determined
  if (loading || checkingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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
