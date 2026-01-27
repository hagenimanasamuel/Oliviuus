// src/pages/Booking/components/ErrorState.jsx
import React from 'react';
import MainHeader from '../LandingPage/Header/Header';
import BottomNav from '../LandingPage/BottomNav/BottomNav';
import Footer from '../ui/Footer';

const ErrorState = ({ onBrowseProperties }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-6xl mb-4">🏚️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
        <button
          onClick={onBrowseProperties}
          className="bg-[#BC8BBC] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Browse Properties
        </button>
      </div>
      <BottomNav />
      <Footer />
    </div>
  );
};

export default ErrorState;