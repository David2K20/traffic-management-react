import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SkeletonLoader from './components/ui/SkeletonLoader';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionMonitor from './components/ConnectionMonitor';
import { useState, useEffect, useCallback } from 'react';

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
  const { state, refreshUserProfile, logout } = useApp();
  const navigate = useNavigate();
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
  const [hasTriggeredTimeout, setHasTriggeredTimeout] = useState(false);

  // Handle authentication timeouts more gracefully
  useEffect(() => {
    let retryTimeoutId: NodeJS.Timeout | null = null;
    let authTimeoutId: NodeJS.Timeout | null = null;
    
    // Only trigger timeout logic if we haven't already triggered it
    if (!hasTriggeredTimeout) {
      // Extend timeout to 10 seconds for better user experience
      // Only trigger if we have no user and auth isn't initialized
      if (!authInitialized && !currentUser && !loading && !profileLoading) {
        authTimeoutId = setTimeout(() => {
          console.warn('Authentication taking longer than expected');
          setHasTriggeredTimeout(true);
          setShowRetryOption(true);
        }, 10000); // Increased to 10 seconds
      }
      
      // Show retry option after 15 seconds if still loading without cached data
      const isActuallyStuck = (loading || profileLoading || !isAuthRestored) && 
                             !currentUser && 
                             !loadingTimeout;
      
      if (isActuallyStuck) {
        retryTimeoutId = setTimeout(() => {
          setShowRetryOption(true);
          setHasTriggeredTimeout(true);
        }, 15000); // Increased to 15 seconds
      }
    }
    
    // Reset retry option if we get a user
    if (currentUser && showRetryOption) {
      setShowRetryOption(false);
      setHasTriggeredTimeout(false);
    }
    
    return () => {
      if (authTimeoutId) clearTimeout(authTimeoutId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [loading, profileLoading, currentUser, isAuthRestored, loadingTimeout, authInitialized, hasTriggeredTimeout, showRetryOption]);

  // Handle retry with better logic
  const handleRetry = useCallback(async () => {
    setRetryAttempts(prev => prev + 1);
    setShowRetryOption(false);
    setHasTriggeredTimeout(false);
    
    try {
      if (state.currentUser?.id) {
        console.log('Refreshing user profile...');
        await refreshUserProfile();
      } else {
        // Only reload page as absolute last resort after many failed attempts
        if (retryAttempts >= 4) {
          console.log('Multiple retry attempts failed, performing page reload as last resort');
          window.location.reload();
          return;
        }
        
        // Try to reinitialize auth with longer wait
        console.log('Attempting to reinitialize authentication...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Longer pause
        
        // Check if we now have a user after waiting
        if (!state.currentUser) {
          // Show retry option again but don't trigger timeout immediately
          setTimeout(() => {
            setShowRetryOption(true);
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Manual retry failed:', error);
      // Show retry option again after a delay
      setTimeout(() => {
        setShowRetryOption(true);
      }, 5000);
    }
  }, [state.currentUser, refreshUserProfile, retryAttempts]);

  // Handle force logout and navigate to login
  const handleForceLogout = useCallback(async () => {
    console.log('Forcing logout and navigating to login');
    try {
      // Use proper logout function which clears data appropriately
      await logout();
      // Navigate using React Router instead of hard redirect
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Only use hard redirect as absolute fallback
      try { sessionStorage.clear(); } catch {}
      try { localStorage.clear(); } catch {}
      window.location.href = '/login';
    }
  }, [logout, navigate]);

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
