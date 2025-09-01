import React from 'react';

const Home = () => {
  console.log('Home component rendering...');
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Traffic Management System</h1>
        <p className="text-xl mb-8">Test Home Component Working!</p>
        <button className="bg-white text-blue-500 px-6 py-3 rounded-lg font-bold">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Home;
