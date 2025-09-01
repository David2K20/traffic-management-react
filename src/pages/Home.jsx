import React from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaShieldAlt, FaUsers, FaClipboard } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <FaCar className="text-6xl text-blue-600 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Traffic Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Promoting safer roads and better traffic compliance through technology. 
            Report violations, track complaints, and help make our roads safer for everyone.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our platform connects citizens and law enforcement to create safer roads
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <FaClipboard className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Report Violations</h3>
            <p className="text-gray-600">
              Easily submit complaints about traffic violations with detailed descriptions and evidence
            </p>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <FaShieldAlt className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Law Enforcement</h3>
            <p className="text-gray-600">
              Officers can review complaints, update statuses, and manage serious traffic offenses
            </p>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <FaUsers className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Community Driven</h3>
            <p className="text-gray-600">
              Building safer communities through citizen participation and transparent processes
            </p>
          </Card>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Making a Difference</h2>
            <p className="text-gray-300">
              See how our platform is improving road safety
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">1,234</div>
              <div className="text-gray-300">Complaints Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">567</div>
              <div className="text-gray-300">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">89</div>
              <div className="text-gray-300">Law Enforcement Officers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">95%</div>
              <div className="text-gray-300">User Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already making their communities safer. 
            Register today and start reporting traffic violations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Register Now
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Already Have an Account?
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;
