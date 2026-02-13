// src/pages/Booking/ResultPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../../api/axios';

const BookingResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // ✅ Read ALL parameters from URL (sent by LMBTech)
    const reference_id = searchParams.get('reference_id') || searchParams.get('reference');
    const transaction_id = searchParams.get('transaction_id');
    const paymentStatus = searchParams.get('status');
    const amount = searchParams.get('amount');

    console.log('📍 Browser redirected to result page:', {
      reference_id,
      transaction_id,
      paymentStatus,
      amount
    });

    // ✅ Show immediate feedback to user
    if (paymentStatus === 'success' || paymentStatus === 'completed') {
      setStatus('success');
    } else if (paymentStatus === 'pending') {
      setStatus('pending');
    } else if (paymentStatus === 'failed') {
      setStatus('failed');
    } else {
      setStatus('cancelled');
    }

    // ✅ OPTIONAL: Call backend to confirm (but webhook already did!)
    // This is just for extra safety
    const confirmPayment = async () => {
      try {
        await api.post('/booking/callback', {
          reference_id,
          transaction_id,
          status: paymentStatus
        });
        console.log('✅ Payment confirmed with backend');
      } catch (error) {
        console.error('❌ Failed to confirm payment:', error);
      }
    };

    if (reference_id) {
      confirmPayment();
    }

    // ✅ Redirect to specific pages after delay
    setTimeout(() => {
      if (paymentStatus === 'success' || paymentStatus === 'completed') {
        navigate(`/booking/success?reference=${reference_id}`);
      } else if (paymentStatus === 'pending') {
        navigate(`/booking/pending?reference=${reference_id}`);
      } else {
        navigate(`/booking/cancel?reference=${reference_id}`);
      }
    }, 3000);

  }, [searchParams, navigate]);

  // Render UI based on status
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#BC8BBC] mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900">Processing...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">Your booking is confirmed. Redirecting...</p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="h-10 w-10 text-yellow-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Pending</h2>
            <p className="text-gray-600">We're waiting for confirmation. Redirecting...</p>
          </>
        )}

        {(status === 'failed' || status === 'cancelled') && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'failed' ? 'Payment Failed' : 'Payment Cancelled'}
            </h2>
            <p className="text-gray-600">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingResultPage;