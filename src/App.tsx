import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

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

// App Routes Component - MUST be inside AppProvider
const AppRoutes = () => {
  const { state } = useApp();
  const { currentUser, loading } = state;

  // Show loading while determining auth state
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
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
