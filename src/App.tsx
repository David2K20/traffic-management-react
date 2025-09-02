import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SkeletonLoader from './components/ui/SkeletonLoader';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionMonitor from './components/ConnectionMonitor';
import { useState, useEffect } from 'react';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import MyComplaints from './pages/MyComplaints';
import ComplaintDetail from './pages/ComplaintDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import AdminSubmitComplaint from './pages/AdminSubmitComplaint';
import EmailVerification from './pages/EmailVerification';
import EmailVerified from './pages/EmailVerified';

// App Routes Component - MUST be inside AppProvider
const AppRoutes = () => {
  const { state, refreshUserProfile } = useApp();
  const { 
    currentUser, 
    loading, 
    profileLoading, 
    isAuthRestored, 
    authInitialized, 
    loadingTimeout,
    backgroundRefreshing
  } = state;

  const [showRetryOption, setShowRetryOption] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Add timeout for authentication to prevent infinite loading
  useEffect(() => {
    let authTimeoutId: NodeJS.Timeout | null = null;
    let retryTimeoutId: NodeJS.Timeout | null = null;
    
    // If auth is not initialized after 3 seconds and we don't have a user, something is wrong
    if (!authInitialized && !currentUser) {
      authTimeoutId = setTimeout(() => {
        console.warn('Authentication taking too long, redirecting to login');
        localStorage.clear(); // Clear any corrupted data
        window.location.href = '/login';
      }, 3000);
    }
    
    // Show retry option after 8 seconds if still loading without cached data
    const isActuallyStuck = (loading || profileLoading || !isAuthRestored) && 
                           !currentUser && 
                           !loadingTimeout;
    
    if (isActuallyStuck) {
      retryTimeoutId = setTimeout(() => {
        setShowRetryOption(true);
      }, 8000);
    } else {
      setShowRetryOption(false);
    }
    
    return () => {
      if (authTimeoutId) clearTimeout(authTimeoutId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [loading, profileLoading, currentUser, isAuthRestored, loadingTimeout, authInitialized]);

  // Handle retry
  const handleRetry = async () => {
    setRetryAttempts(prev => prev + 1);
    setShowRetryOption(false);
    
    try {
      if (state.currentUser?.id) {
        await refreshUserProfile();
      } else {
        // Force page reload as last resort after multiple failed attempts
        if (retryAttempts >= 2) {
          console.log('Multiple retry attempts failed, reloading page');
          window.location.reload();
          return;
        }
        
        // Try to reinitialize auth
        console.log('Attempting to reinitialize authentication...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
        
        // Check if we now have a user after waiting
        if (!state.currentUser) {
          setShowRetryOption(true);
        }
      }
    } catch (error) {
      console.error('Manual retry failed:', error);
      // Show retry option again after a delay
      setTimeout(() => {
        setShowRetryOption(true);
      }, 3000);
    }
  };

  // Handle force logout and redirect to login
  const handleForceLogout = () => {
    console.log('Forcing logout and redirect to login');
    // Clear all stored data and redirect
    localStorage.clear();
    window.location.href = '/login';
  };

  // Simplified loading logic - only show loading if we're actually initializing and don't have cached data
  const shouldShowLoading = !authInitialized && !currentUser;
  
  if (shouldShowLoading) {
    // If we've timed out or have a loading timeout state, show enhanced UI
    if (loadingTimeout || showRetryOption) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            {!loadingTimeout && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            )}
            <div className="space-y-4">
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {loadingTimeout 
                    ? 'Connection Timeout'
                    : profileLoading 
                      ? 'Loading profile...' 
                      : 'Initializing app...'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {loadingTimeout
                    ? 'Unable to connect to the server. Please check your internet connection.'
                    : 'This is taking longer than expected.'}
                </p>
              </div>
              
              {(showRetryOption || loadingTimeout) && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {retryAttempts >= 2 ? 'Reload Page' : 'Retry'}
                    </button>
                    <button
                      onClick={handleForceLogout}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                    >
                      Go to Login
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {retryAttempts >= 2 
                      ? 'Multiple attempts failed. Try reloading the page.'
                      : 'If this continues, try refreshing the page or clearing browser data.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Show skeleton loader for initial loading (first few seconds)
    return (
      <div className="min-h-screen">
        <SkeletonLoader type="profile" />
        {backgroundRefreshing && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-blue-100 border border-blue-200 text-blue-800 px-3 py-2 rounded-md text-sm flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
              <span>Updating...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={currentUser ? (
        <Navigate to={currentUser.userType === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
      ) : (
        <Home />
      )} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/email-verified" element={<EmailVerified />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected User Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/submit-complaint" element={
        <ProtectedRoute>
          <Layout><SubmitComplaint /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/my-complaints" element={
        <ProtectedRoute>
          <Layout><MyComplaints /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/complaint/:id" element={
        <ProtectedRoute>
          <Layout><ComplaintDetail /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Protected Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute adminOnly>
          <Layout><AdminDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/complaints" element={
        <ProtectedRoute adminOnly>
          <Layout><AdminComplaints /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/submit-complaint" element={
        <ProtectedRoute adminOnly>
          <Layout><AdminSubmitComplaint /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <ConnectionMonitor />
            <AppRoutes />
            <ToastContainer />
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
