import React from 'react';
import { FaCar } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <FaCar className="text-primary-400" />
            <span className="text-lg font-semibold">Traffic Management System</span>
          </div>
          
          <div className="text-sm text-gray-400">
            <p>&copy; 2024 Traffic Management System. All rights reserved.</p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>Promoting safer roads and better traffic compliance through technology</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
