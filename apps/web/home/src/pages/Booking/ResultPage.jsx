// src/pages/Booking/ResultPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, ArrowLeft, Home } from 'lucide-react';
import api from '../../api/axios';

const BookingResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [referenceId, setReferenceId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const reference_id = searchParams.get('reference_id') || searchParams.get('reference');
    const paymentStatus = searchParams.get('status');
    const amountParam = searchParams.get('amount');

    setReferenceId(reference_id);
    setAmount(amountParam);

    if (paymentStatus === 'success' || paymentStatus === 'completed') {
      setStatus('success');
    } else if (paymentStatus === 'pending') {
      setStatus('pending');
    } else if (paymentStatus === 'failed') {
      setStatus('failed');
    } else {
      // If no status, fetch from backend
      const fetchStatus = async () => {
        if (reference_id) {
          try {
            const response = await api.get(`/booking/status/${reference_id}`);
            const data = response.data.data;
            setStatus(data.status);
            setAmount(data.amount);
          } catch (error) {
            console.error('Error fetching status:', error);
            setStatus('error');
          }
        }
      };
      fetchStatus();
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">Your booking has been confirmed.</p>
            {amount && (
              <p className="text-sm text-gray-500 mb-4">Amount: {amount} RWF</p>
            )}
          </>
        );
      
      case 'pending':
        return (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="h-10 w-10 text-yellow-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Pending</h1>
            <p className="text-gray-600 mb-6">We're waiting for confirmation.</p>
          </>
        );
      
      case 'failed':
        return (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">Please try again or contact support.</p>
          </>
        );
      
      default:
        return (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#BC8BBC] mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Loading...</h2>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {renderContent()}
        
        {referenceId && (
          <p className="text-xs text-gray-400 mb-6">Reference: {referenceId}</p>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/bookings')}
            className="w-full bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            View My Bookings
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingResultPage;