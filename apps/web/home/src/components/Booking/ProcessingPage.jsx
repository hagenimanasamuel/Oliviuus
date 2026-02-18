// src/pages/Booking/ProcessingPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';

const BookingProcessingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const reference_id = searchParams.get('reference_id');
    const oms = searchParams.get('oms'); // Sometimes Pesapal sends this
    
    console.log('📍 User redirected to processing page:', { reference_id, oms });

    if (!reference_id) {
      // No reference ID - redirect to home
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    // Check payment status from your backend
    const checkStatus = async () => {
      try {
        // Wait 2 seconds then check status
        setTimeout(async () => {
          try {
            const response = await api.get(`/booking/status/${reference_id}`);
            const paymentStatus = response.data.data?.status;
            
            console.log('📊 Payment status:', paymentStatus);
            
            if (paymentStatus === 'completed') {
              setStatus('success');
              setMessage('Payment successful! Redirecting...');
              setTimeout(() => navigate(`/booking/success?reference=${reference_id}`), 2000);
            } else if (paymentStatus === 'failed') {
              setStatus('failed');
              setMessage('Payment failed. Redirecting...');
              setTimeout(() => navigate(`/booking/cancel?reference=${reference_id}`), 2000);
            } else {
              // Still pending - show pending page
              setStatus('pending');
              setMessage('Your payment is being processed...');
              setTimeout(() => navigate(`/booking/result?reference_id=${reference_id}&status=pending`), 2000);
            }
          } catch (error) {
            console.error('Error checking status:', error);
            setStatus('pending');
            setTimeout(() => navigate(`/booking/result?reference_id=${reference_id}&status=pending`), 2000);
          }
        }, 2000);
        
      } catch (error) {
        console.error('Error:', error);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    checkStatus();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#BC8BBC] mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Your Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="h-10 w-10 text-yellow-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Pending</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingProcessingPage;