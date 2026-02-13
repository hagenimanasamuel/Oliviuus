// src/pages/Booking/CancelPage.jsx
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const BookingCancelPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const referenceId = searchParams.get('reference');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made.
        </p>
        
        {referenceId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Reference ID</p>
            <p className="text-sm font-mono text-gray-700">{referenceId}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingCancelPage;