// src/pages/Booking/BookingSuccessPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Calendar, Download, Share2, MessageCircle } from 'lucide-react';
import MainHeader from '../../components/LandingPage/Header/Header';
import BottomNav from '../../components/LandingPage/BottomNav/BottomNav';
import Footer from '../../components/ui/Footer';

const BookingSuccessPage = () => {
  const { propertyUid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState({
    period: searchParams.get('period') || 'monthly',
    amount: searchParams.get('amount') || 0,
    bookingId: `BK${Date.now().toString().slice(-8)}`,
    date: new Date().toISOString(),
    nextSteps: []
  });

  // Map period names for display
  const periodDisplay = {
    monthly: { label: 'Monthly', unit: 'months' },
    weekly: { label: 'Weekly', unit: 'weeks' },
    daily: { label: 'Daily', unit: 'days' },
    nightly: { label: 'Nightly', unit: 'nights' }
  };

  const formatPrice = (price) => {
    if (!price || price === 0 || price === '0') return 'Contact for price';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getNextSteps = () => {
    const baseSteps = [
      {
        id: 1,
        title: 'Await Host Confirmation',
        description: 'The host will review your booking request within 24 hours',
        icon: '⏳'
      },
      {
        id: 2,
        title: 'Receive Booking Confirmation',
        description: 'You\'ll get an email with all booking details',
        icon: '📧'
      },
      {
        id: 3,
        title: 'Connect with Host',
        description: 'Message the host directly through our platform',
        icon: '💬'
      }
    ];

    if (bookingDetails.period === 'monthly') {
      baseSteps.splice(1, 0, {
        id: 4,
        title: 'Review Rental Agreement',
        description: 'Sign the digital rental agreement sent by host',
        icon: '📝'
      });
    }

    return baseSteps;
  };

  const handleDownloadReceipt = () => {
    // Create a simple receipt download
    const receipt = `
      iSanzure Booking Receipt
      =======================
      Booking ID: ${bookingDetails.bookingId}
      Date: ${new Date(bookingDetails.date).toLocaleDateString()}
      Property: ${propertyUid}
      Period: ${periodDisplay[bookingDetails.period]?.label}
      Amount: ${formatPrice(bookingDetails.amount)}
      Status: Pending Host Approval
      
      Thank you for using iSanzure!
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isanzure-receipt-${bookingDetails.bookingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleShareBooking = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My iSanzure Booking',
        text: `I just booked a property on iSanzure! Booking ID: ${bookingDetails.bookingId}`,
        url: window.location.href,
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`Booking ID: ${bookingDetails.bookingId}\nCheck your booking details on iSanzure.`);
      alert('Booking details copied to clipboard!');
    }
  };

  const periodInfo = periodDisplay[bookingDetails.period];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <MainHeader />

      <main className="container mx-auto px-4 py-8 pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-[#BC8BBC] to-[#8A5A8A] flex items-center justify-center text-white font-bold text-sm">
                ✓
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Booking Submitted Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Your {periodInfo?.label?.toLowerCase()} booking request has been received and is pending host approval.
            </p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Awaiting Host Confirmation
            </div>
          </div>

          {/* Booking Details Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#BC8BBC]" />
              Booking Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Booking ID</div>
                  <div className="font-mono font-bold text-lg text-gray-900">{bookingDetails.bookingId}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Booking Type</div>
                  <div className="font-medium text-gray-900">{periodInfo?.label} Rental</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Submission Date</div>
                  <div className="font-medium text-gray-900">
                    {new Date(bookingDetails.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Property ID</div>
                  <div className="font-medium text-gray-900">{propertyUid}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Amount</div>
                  <div className="font-bold text-2xl text-[#BC8BBC]">
                    {formatPrice(bookingDetails.amount)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Payment Status</div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <CheckCircle className="h-3 w-3" />
                    Payment Authorized
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">What Happens Next?</h2>
            
            <div className="space-y-6">
              {getNextSteps().map((step, index) => (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BC8BBC]/10 to-[#8A5A8A]/10 flex items-center justify-center">
                      <span className="text-xl">{step.icon}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  {index === 0 && (
                    <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      Current Step
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => navigate(`/property/${propertyUid}`)}
                className="p-4 border border-gray-200 rounded-xl hover:border-[#BC8BBC] hover:bg-[#BC8BBC]/5 transition-all flex flex-col items-center justify-center gap-2"
              >
                <Home className="h-6 w-6 text-gray-600" />
                <span className="font-medium text-gray-900">View Property</span>
              </button>
              
              <button
                onClick={handleDownloadReceipt}
                className="p-4 border border-gray-200 rounded-xl hover:border-[#BC8BBC] hover:bg-[#BC8BBC]/5 transition-all flex flex-col items-center justify-center gap-2"
              >
                <Download className="h-6 w-6 text-gray-600" />
                <span className="font-medium text-gray-900">Download Receipt</span>
              </button>
              
              <button
                onClick={handleShareBooking}
                className="p-4 border border-gray-200 rounded-xl hover:border-[#BC8BBC] hover:bg-[#BC8BBC]/5 transition-all flex flex-col items-center justify-center gap-2"
              >
                <Share2 className="h-6 w-6 text-gray-600" />
                <span className="font-medium text-gray-900">Share Booking</span>
              </button>
            </div>
            
            {/* Contact Support */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Need Help?</h4>
                  <p className="text-sm text-gray-600">Our support team is available 24/7</p>
                </div>
                <button
                  onClick={() => navigate('/tenant/messages')}
                  className="px-6 py-2.5 bg-[#BC8BBC] text-white rounded-lg font-medium hover:bg-[#9A6A9A] transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:border-[#BC8BBC] hover:text-[#BC8BBC] transition-colors shadow-sm"
            >
              <Home className="h-5 w-5" />
              Back to Home
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
      <Footer />
    </div>
  );
};

export default BookingSuccessPage;