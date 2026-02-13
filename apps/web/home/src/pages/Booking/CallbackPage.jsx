// src/pages/Booking/CallbackPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../../api/axios';

const BookingCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');

  // Get all parameters from URL
  const reference_id = searchParams.get('reference_id') || searchParams.get('reference');
  const transaction_id = searchParams.get('transaction_id');
  const paymentStatus = searchParams.get('status');
  const amount = searchParams.get('amount');
  const paymentMethod = searchParams.get('payment_method');

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('📨 Callback received:', {
          reference_id,
          transaction_id,
          paymentStatus,
          amount,
          paymentMethod
        });

        // 1. Show appropriate message based on status
        if (paymentStatus === 'success' || paymentStatus === 'completed') {
          setStatus('success');
          setMessage('Payment successful! Your booking is being confirmed.');
        } else if (paymentStatus === 'pending') {
          setStatus('pending');
          setMessage('Payment is being processed. We\'ll update you shortly.');
        } else if (paymentStatus === 'failed') {
          setStatus('failed');
          setMessage('Payment failed. Please try again.');
        } else {
          setStatus('failed');
          setMessage('Payment cancelled.');
        }

        // 2. Call YOUR backend to update payment status
        if (reference_id) {
          await api.post('/booking/callback', {
            reference_id,
            transaction_id,
            status: paymentStatus,
            amount,
            payment_method: paymentMethod
          });
          console.log('✅ Backend updated with payment status');
        }

        // 3. Redirect after delay
        setTimeout(() => {
          if (paymentStatus === 'success' || paymentStatus === 'completed') {
            navigate('/booking/success?reference=' + reference_id);
          } else if (paymentStatus === 'pending') {
            navigate('/booking/pending?reference=' + reference_id);
          } else {
            navigate('/booking/cancel?reference=' + reference_id);
          }
        }, 3000);

      } catch (error) {
        console.error('❌ Error processing callback:', error);
        setStatus('error');
        setMessage('Error processing payment. Please contact support.');
      }
    };

    if (reference_id) {
      processCallback();
    }
  }, [reference_id, transaction_id, paymentStatus]);

  // Render loading, success, or failure UI
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#BC8BBC] mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="h-10 w-10 text-yellow-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Pending</h2>
            <p className="text-gray-600 mb-4">{message}</p>
          </>
        )}

        {(status === 'failed' || status === 'error') && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
          </>
        )}

        {reference_id && (
          <p className="text-xs text-gray-500 mt-4">
            Reference: {reference_id}
          </p>
        )}
      </div>
    </div>
  );
};

export default BookingCallbackPage;