// src/pages/Booking/components/LoadingState.jsx
import React from 'react';
import MainHeader from '../LandingPage/Header/Header';
import BottomNav from '../LandingPage/BottomNav/BottomNav';
import Footer from '../ui/Footer';

const LoadingState = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
      <BottomNav />
      <Footer />
    </div>
  );
};

export default LoadingState;