import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaCar, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';

const Header = () => {
  const { state, logout } = useApp();
  const { currentUser } = state;
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
            <FaCar className="text-blue-400" />
            <span>Traffic Management</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {currentUser ? (
              <>
                {currentUser.userType === 'admin' ? (
                  <>
                    <Link 
                      to="/admin/dashboard" 
                      className={`hover:text-blue-400 transition-colors ${isActive('/admin/dashboard') ? 'text-blue-400' : ''}`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/admin/complaints" 
                      className={`hover:text-blue-400 transition-colors ${isActive('/admin/complaints') ? 'text-blue-400' : ''}`}
                    >
                      All Complaints
                    </Link>
                    <Link 
                      to="/admin/submit-complaint" 
                      className={`hover:text-blue-400 transition-colors ${isActive('/admin/submit-complaint') ? 'text-blue-400' : ''}`}
                    >
                      Submit Complaint
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/dashboard" 
                      className={`hover:text-blue-400 transition-colors ${isActive('/dashboard') ? 'text-blue-400' : ''}`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/submit-complaint" 
                      className={`hover:text-blue-400 transition-colors ${isActive('/submit-complaint') ? 'text-blue-400' : ''}`}
                    >
                      Submit Complaint
                    </Link>
                    <Link 
                      to="/my-complaints" 
                      className={`hover:text-blue-400 transition-colors ${isActive('/my-complaints') ? 'text-blue-400' : ''}`}
                    >
                      My Complaints
                    </Link>
                  </>
                )}
                
                {/* User Menu */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <FaUser className="text-blue-400" />
                    <span className="text-sm">{currentUser.fullName}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="text-white hover:bg-gray-800"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className={`hover:text-blue-400 transition-colors ${isActive('/login') ? 'text-blue-400' : ''}`}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className={`hover:text-blue-400 transition-colors ${isActive('/register') ? 'text-blue-400' : ''}`}
                >
                  Register
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="text-white hover:bg-gray-800"
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <nav className="flex flex-col space-y-4">
              {currentUser ? (
                <>
                  <div className="flex items-center space-x-2 px-2 py-1 bg-gray-800 rounded">
                    <FaUser className="text-blue-400" />
                    <span className="text-sm">{currentUser.fullName}</span>
                  </div>
                  
                  {currentUser.userType === 'admin' ? (
                    <>
                      <Link 
                        to="/admin/dashboard" 
                        className={`block px-2 py-1 hover:text-blue-400 transition-colors ${isActive('/admin/dashboard') ? 'text-blue-400' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/admin/complaints" 
                        className={`block px-2 py-1 hover:text-blue-400 transition-colors ${isActive('/admin/complaints') ? 'text-blue-400' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        All Complaints
                      </Link>
                      <Link 
                        to="/admin/submit-complaint" 
                        className={`block px-2 py-1 hover:text-blue-400 transition-colors ${isActive('/admin/submit-complaint') ? 'text-blue-400' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Submit Complaint
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/dashboard" 
                        className={`block px-2 py-1 hover:text-blue-400 transition-colors ${isActive('/dashboard') ? 'text-blue-400' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/submit-complaint" 
                        className={`block px-2 py-1 hover:text-blue-400 transition-colors ${isActive('/submit-complaint') ? 'text-blue-400' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Submit Complaint
                      </Link>
                      <Link 
                        to="/my-complaints" 
                        className={`block px-2 py-1 hover:text-blue-400 transition-colors ${isActive('/my-complaints') ? 'text-blue-400' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        My Complaints
                      </Link>
                    </>
                  )}
                  
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block px-2 py-1 text-left hover:text-blue-400 transition-colors"
                  >
                    <FaSignOutAlt className="inline mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={`block px-2 py-1 hover:text-blue-400 transition-colors ${isActive('/login') ? 'text-blue-400' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className={`block px-2 py-1 hover:text-blue-400 transition-colors ${isActive('/register') ? 'text-blue-400' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
