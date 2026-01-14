// src/components/KidModeExitHandler.jsx
import React from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { Shield, Lock, Home, ArrowLeft } from "lucide-react";

export default function KidModeExitHandler() {
  const { kidProfile, exitKidMode } = useAuth();

  const handleExitKidMode = async () => {
    const success = await exitKidMode();
    if (success) {
      window.location.href = "/";
    }
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          Parental Control Active
        </h2>
        
        <p className="text-gray-300 mb-6">
          This area is restricted for kids. To access this page, you need to exit kid mode or go back to safe areas.
        </p>
        
        {kidProfile && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center text-white font-bold">
                {kidProfile.name?.charAt(0).toUpperCase()}
              </div>
              <span className="ml-3 text-white font-medium">
                {kidProfile.name}'s Profile
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Age rating: {kidProfile.max_age_rating || 'All ages'}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={handleExitKidMode}
            className="w-full bg-[#BC8BBC] hover:bg-[#BC8BBC]/90 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <Shield size={18} className="mr-2" />
            Exit Kid Mode
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <Home size={18} className="mr-2" />
            Go to Home
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            Go Back
          </button>
        </div>
        
        <p className="text-gray-500 text-sm mt-4">
          You'll need a PIN to exit kid mode if it's enabled for this profile.
        </p>
      </div>
    </div>
  );
}