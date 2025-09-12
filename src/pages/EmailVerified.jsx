import React from 'react';
import { FaCar, FaCheckCircle } from 'react-icons/fa';
import Card from '../components/ui/Card';

const EmailVerified = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center">
            <FaCar className="text-blue-600 text-5xl" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verified
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Traffic Management System
          </p>
        </div>

        <Card>
          <div className="text-center">
            <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Your email has been verified!
            </h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Your email address has been successfully verified.
              </p>
              <p className="text-sm text-green-700 mt-2 font-medium">
                Please return to the web app to continue.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-700">
                You can now close this window and return to the Traffic Management System web app.
                Click "I have verified my email" to access your dashboard.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerified;
