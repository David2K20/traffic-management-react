import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { state } = useApp();
  const { currentUser, loading } = state;
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (loading) {
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

  if (adminOnly && currentUser.userType !== 'admin') {
    // Redirect to user dashboard if not admin
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
