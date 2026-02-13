// src/components/Booking/PaymentModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Phone, 
  Loader, 
  Check, 
  CreditCard, 
  Wallet, 
  TrendingUp,
  Info,
  Shield,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import api from '../../api/axios';

const PaymentModal = ({
  bookingData,
  totalAmount,
  userBalance,
  userLoanLimit,
  formatPrice,
  onClose,
  onSuccess,
  propertyUid,
  startDate,
  duration,
  bookingPeriod
}) => {
  const [paymentStep, setPaymentStep] = useState(1);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    email: ''
  });
  const [validationError, setValidationError] = useState('');
  const [paymentReference, setPaymentReference] = useState(null);
  const [trackingInterval, setTrackingInterval] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [trackingAttempts, setTrackingAttempts] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState([]);
  const [cardRedirected, setCardRedirected] = useState(false);
  const [trackingStarted, setTrackingStarted] = useState(false);

  const phoneInputRef = useRef(null);
  const firstNameInputRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [trackingInterval]);

  const getPaymentMethodInfo = () => {
    switch (bookingData.paymentMethod) {
      case 'balance':
        return {
          icon: <Wallet className="h-5 w-5 text-[#BC8BBC]" />,
          name: 'iSanzure Balance',
          color: 'from-[#BC8BBC]/10 to-[#8A5A8A]/10',
          borderColor: 'border-[#BC8BBC]/30'
        };
      case 'loan':
        return {
          icon: <TrendingUp className="h-5 w-5 text-[#BC8BBC]" />,
          name: 'iSanzure Loan',
          color: 'from-[#BC8BBC]/10 to-[#8A5A8A]/10',
          borderColor: 'border-[#BC8BBC]/30'
        };
      case 'mobile_money':
        return {
          icon: (
            <div className="flex items-center gap-1">
              <span className="text-lg">🟡</span>
              <span className="text-lg">🔴</span>
            </div>
          ),
          name: 'Mobile Money',
          color: 'from-yellow-50 to-red-50',
          borderColor: 'border-yellow-200'
        };
      case 'card':
        return {
          icon: <CreditCard className="h-5 w-5 text-gray-600" />,
          name: 'Credit/Debit Card',
          color: 'from-gray-50 to-blue-50',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          icon: <CreditCard className="h-5 w-5 text-gray-600" />,
          name: 'Payment Method',
          color: 'from-gray-50 to-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const paymentMethodInfo = getPaymentMethodInfo();

  // ========== SMART TRACKING FUNCTION ==========
  const startSmartTracking = (referenceId) => {
    console.log('🔄 Starting smart tracking for:', referenceId);
    setPaymentReference(referenceId);
    setPaymentStatus('pending');
    setTrackingAttempts(0);
    setCardRedirected(false);
    setTrackingStarted(true);
    
    // Wait 5 seconds before first check (user needs time to see phone prompt)
    setTimeout(() => {
      let attempts = 0;
      const maxAttempts = 24; // 24 attempts = 72 seconds (3s interval) for card payments
      
      const interval = setInterval(async () => {
        attempts++;
        setTrackingAttempts(attempts);
        
        try {
          const response = await api.get(`/booking/status/${referenceId}`);
          const data = response.data.data;
          
          console.log(`📊 Tracking attempt ${attempts}:`, data.status);
          
          if (data.status === 'completed') {
            console.log('🎉 Payment successful!');
            clearInterval(interval);
            setPaymentStatus('success');
            setPaymentStep(3);
            
            setTimeout(() => {
              onClose();
              onSuccess();
            }, 2000);
            
          } else if (data.status === 'failed') {
            console.log('❌ Payment failed');
            clearInterval(interval);
            setPaymentStatus('failed');
            setValidationError('Payment failed. Please try again.');
            setPaymentStep(1);
            setProcessingPayment(false);
            setTrackingStarted(false);
          }
          
        } catch (error) {
          console.error('Tracking error:', error);
        }
        
        // Stop after max attempts
        if (attempts >= maxAttempts) {
          console.log(`⏹️ Stopped tracking after ${maxAttempts} attempts`);
          clearInterval(interval);
          setTrackingStarted(false);
          setShowInstructions(true);
          setProcessingPayment(false);
        }
        
      }, 3000); // Check every 3 seconds
      
      setTrackingInterval(interval);
      
    }, 5000); // 5 second delay before starting
  };

  // ========== MOMO PAYMENT ==========
  const handleMoMoPayment = async () => {
    if (!validatePhoneNumber()) return;
    
    setProcessingPayment(true);
    setValidationError('');
    setShowInstructions(false);
    setTrackingStarted(false);
    
    try {
      const payload = {
        propertyUid,
        bookingPeriod,
        startDate,
        duration,
        totalAmount,
        paymentMethod: 'mobile_money',
        phoneNumber: paymentDetails.phoneNumber,
        specialRequests: bookingData.specialRequests || '',
        optionalServices: bookingData.customizations?.length > 0 ? bookingData.customizations : null
      };
      
      const response = await api.post('/booking/initiate', payload);
      
      if (response.data.success) {
        setPaymentReference(response.data.reference_id);
        setInstructions(response.data.instructions || []);
        setPaymentStep(2);
        
        // Start smart tracking (5s delay, 12 attempts, 3s interval)
        startSmartTracking(response.data.reference_id);
      }
      
    } catch (error) {
      console.error('❌ MoMo payment error:', error);
      setValidationError(error.response?.data?.message || 'Payment failed');
      setPaymentStep(1);
      setProcessingPayment(false);
    }
  };

  // ========== CARD PAYMENT - FIXED ==========
  const handleCardPayment = async () => {
    if (!validateCardDetails()) return;
    
    setProcessingPayment(true);
    setValidationError('');
    setCardRedirected(false);
    setTrackingStarted(false);
    
    try {
      const payload = {
        propertyUid,
        bookingPeriod,
        startDate,
        duration,
        totalAmount,
        paymentMethod: 'card',
        firstName: paymentDetails.firstName,
        lastName: paymentDetails.lastName,
        email: paymentDetails.email,
        phoneNumber: paymentDetails.phoneNumber,
        specialRequests: bookingData.specialRequests || '',
        optionalServices: bookingData.customizations?.length > 0 ? bookingData.customizations : null,
        cancel_url: window.location.href
      };
      
      const response = await api.post('/booking/initiate', payload);
      
      if (response.data.success && response.data.mode === 'card') {
        setPaymentReference(response.data.reference_id);
        setCardRedirected(true);
        setPaymentStep(2);
        
        // Create and submit form to iframe URL
        const { card_url, ...postData } = response.data.postData;
        
        const form = document.createElement('form');
        form.action = card_url;
        form.method = 'POST';
        form.style.display = 'none';
        form.target = '_blank';
        
        Object.keys(postData).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = postData[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        
        // Clean up
        setTimeout(() => form.remove(), 1000);
        
        // ✅ FIX: Start tracking the payment status (DO NOT show success yet!)
        startSmartTracking(response.data.reference_id);
      }
      
    } catch (error) {
      console.error('❌ Card payment error:', error);
      setValidationError(error.response?.data?.message || 'Payment failed');
      setPaymentStep(1);
      setProcessingPayment(false);
    }
  };

  // ========== BALANCE PAYMENT ==========
  const handleBalancePayment = async () => {
    setProcessingPayment(true);
    
    try {
      const payload = {
        propertyUid,
        bookingPeriod,
        startDate,
        duration,
        totalAmount,
        paymentMethod: 'balance',
        specialRequests: bookingData.specialRequests || '',
        optionalServices: bookingData.customizations?.length > 0 ? bookingData.customizations : null
      };
      
      const response = await api.post('/booking/initiate', payload);
      
      if (response.data.success) {
        setPaymentReference(response.data.reference_id);
        setPaymentStep(2);
        // Balance payments are instant
        setTimeout(() => {
          setPaymentStep(3);
          setTimeout(() => {
            onClose();
            onSuccess();
          }, 2000);
        }, 1500);
      }
      
    } catch (error) {
      console.error('❌ Balance payment error:', error);
      setValidationError('Payment failed');
      setPaymentStep(1);
      setProcessingPayment(false);
    }
  };

  // ========== LOAN PAYMENT ==========
  const handleLoanPayment = async () => {
    setProcessingPayment(true);
    
    try {
      const payload = {
        propertyUid,
        bookingPeriod,
        startDate,
        duration,
        totalAmount,
        paymentMethod: 'loan',
        specialRequests: bookingData.specialRequests || '',
        optionalServices: bookingData.customizations?.length > 0 ? bookingData.customizations : null
      };
      
      const response = await api.post('/booking/initiate', payload);
      
      if (response.data.success) {
        setPaymentReference(response.data.reference_id);
        setPaymentStep(2);
        // Loan payments are instant
        setTimeout(() => {
          setPaymentStep(3);
          setTimeout(() => {
            onClose();
            onSuccess();
          }, 2000);
        }, 1500);
      }
      
    } catch (error) {
      console.error('❌ Loan payment error:', error);
      setValidationError('Payment failed');
      setPaymentStep(1);
      setProcessingPayment(false);
    }
  };

  const handleProcessPayment = () => {
    switch (bookingData.paymentMethod) {
      case 'mobile_money':
        handleMoMoPayment();
        break;
      case 'card':
        handleCardPayment();
        break;
      case 'balance':
        handleBalancePayment();
        break;
      case 'loan':
        handleLoanPayment();
        break;
      default:
        break;
    }
  };

  const handleCloseModal = () => {
    if (!processingPayment) {
      if (trackingInterval) {
        clearInterval(trackingInterval);
        setTrackingInterval(null);
      }
      onClose();
    }
  };

  const validatePhoneNumber = () => {
    if (!paymentDetails.phoneNumber) {
      setValidationError('Phone number is required');
      return false;
    }
    
    const cleaned = paymentDetails.phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 9) {
      setValidationError('Please enter a valid phone number (at least 9 digits)');
      return false;
    }
    
    setValidationError('');
    return true;
  };

  const validateCardDetails = () => {
    if (!paymentDetails.firstName) {
      setValidationError('First name is required');
      firstNameInputRef.current?.focus();
      return false;
    }
    if (!paymentDetails.lastName) {
      setValidationError('Last name is required');
      return false;
    }
    if (!paymentDetails.email) {
      setValidationError('Email is required');
      return false;
    }
    if (paymentDetails.email && !paymentDetails.email.includes('@')) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    
    setValidationError('');
    return true;
  };

  useEffect(() => {
    if (paymentStep === 1) {
      if (bookingData.paymentMethod === 'mobile_money' && phoneInputRef.current) {
        setTimeout(() => phoneInputRef.current.focus(), 100);
      }
      if (bookingData.paymentMethod === 'card' && firstNameInputRef.current) {
        setTimeout(() => firstNameInputRef.current.focus(), 100);
      }
    }
  }, [paymentStep, bookingData.paymentMethod]);

  const isPaymentButtonEnabled = () => {
    if (paymentStep !== 1) return false;
    
    switch (bookingData.paymentMethod) {
      case 'mobile_money':
        return paymentDetails.phoneNumber.replace(/\D/g, '').length >= 9;
      case 'card':
        return paymentDetails.firstName && 
               paymentDetails.lastName && 
               paymentDetails.email && 
               paymentDetails.email.includes('@');
      case 'balance':
        return userBalance >= totalAmount;
      case 'loan':
        return userLoanLimit >= totalAmount;
      default:
        return false;
    }
  };

  const renderPaymentContent = () => {
    if (paymentStep === 1) {
      switch (bookingData.paymentMethod) {
        case 'mobile_money':
          return (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-yellow-100 to-red-100 mb-2">
                  {paymentMethodInfo.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Mobile Money Payment</h3>
                <p className="text-sm text-gray-600">Enter your phone number to receive payment prompt</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    value={paymentDetails.phoneNumber}
                    onChange={(e) => {
                      setPaymentDetails({...paymentDetails, phoneNumber: e.target.value});
                      setValidationError('');
                    }}
                    placeholder="0788 XXX XXX"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BC8BBC]/20 outline-none transition-all ${
                      validationError ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-[#BC8BBC]'
                    }`}
                  />
                  {validationError && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationError}
                    </p>
                  )}
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  <div className="font-medium text-blue-800 mb-1 flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    How to Pay:
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-blue-700 text-xs">
                    <li>Enter your phone number above</li>
                    <li>Click "Pay Now"</li>
                    <li>Check your phone for payment prompt</li>
                    <li>Enter your PIN to confirm</li>
                  </ol>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                  <div className="font-medium mb-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Powered by LMBTech
                  </div>
                  <p>Your payment is securely processed.</p>
                </div>
              </div>
            </div>
          );

        case 'card':
          return (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-2">
                  <CreditCard className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Card Payment</h3>
                <p className="text-sm text-gray-600">Enter your details for secure payment</p>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      ref={firstNameInputRef}
                      type="text"
                      value={paymentDetails.firstName}
                      onChange={(e) => {
                        setPaymentDetails({...paymentDetails, firstName: e.target.value});
                        setValidationError('');
                      }}
                      placeholder="John"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC]/20 focus:border-[#BC8BBC] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.lastName}
                      onChange={(e) => {
                        setPaymentDetails({...paymentDetails, lastName: e.target.value});
                        setValidationError('');
                      }}
                      placeholder="Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC]/20 focus:border-[#BC8BBC] outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={paymentDetails.email}
                    onChange={(e) => {
                      setPaymentDetails({...paymentDetails, email: e.target.value});
                      setValidationError('');
                    }}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC]/20 focus:border-[#BC8BBC] outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={paymentDetails.phoneNumber}
                    onChange={(e) => setPaymentDetails({...paymentDetails, phoneNumber: e.target.value})}
                    placeholder="0788 XXX XXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC]/20 focus:border-[#BC8BBC] outline-none transition-all"
                  />
                </div>
                
                {validationError && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationError}
                  </p>
                )}
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  <div className="font-medium text-blue-800 mb-1 flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Secure Processing
                  </div>
                  <p className="text-blue-700 text-xs">
                    You will be redirected to a secure payment page. Complete your payment there, then return here.
                  </p>
                  <p className="text-blue-700 text-xs font-bold mt-2">
                    ⚠️ Do not close this window while you complete payment.
                  </p>
                </div>
              </div>
            </div>
          );

        case 'balance':
          return (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 mb-2">
                  <Wallet className="h-6 w-6 text-[#BC8BBC]" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">iSanzure Balance</h3>
                <p className="text-sm text-gray-600">Pay using your wallet balance</p>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="text-sm text-gray-600">Current Balance</div>
                      <div className="text-xl font-bold text-[#BC8BBC]">{formatPrice(userBalance)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Booking Amount</div>
                      <div className="text-xl font-bold text-gray-900">{formatPrice(totalAmount)}</div>
                    </div>
                  </div>
                  
                  {userBalance >= totalAmount ? (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Sufficient balance available</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Insufficient balance</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );

        case 'loan':
          return (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 mb-2">
                  <TrendingUp className="h-6 w-6 text-[#BC8BBC]" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">iSanzure Loan</h3>
                <p className="text-sm text-gray-600">Pay using your loan limit</p>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="text-sm text-gray-600">Available Limit</div>
                      <div className="text-xl font-bold text-[#BC8BBC]">{formatPrice(userLoanLimit)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Booking Amount</div>
                      <div className="text-xl font-bold text-gray-900">{formatPrice(totalAmount)}</div>
                    </div>
                  </div>
                  
                  {userLoanLimit >= totalAmount ? (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Sufficient loan limit available</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Insufficient loan limit</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                  <div className="font-medium mb-1">Loan Terms</div>
                  <p>This amount will be added to your iSanzure loan balance.</p>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    } else if (paymentStep === 2) {
      return (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#BC8BBC] mx-auto mb-4"></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {bookingData.paymentMethod === 'card' && cardRedirected 
              ? 'Waiting for Payment Confirmation' 
              : 'Processing Payment'}
          </h3>
          
          {bookingData.paymentMethod === 'card' && cardRedirected && (
            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-amber-800 text-sm font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Complete your payment in the opened window
              </p>
              <p className="text-amber-700 text-xs">
                Your payment is being processed. We are waiting for confirmation from the payment gateway.
                <span className="font-bold block mt-1">DO NOT close this window.</span>
              </p>
            </div>
          )}
          
          <p className="text-gray-600 text-sm">
            {bookingData.paymentMethod === 'mobile_money' && 'Please check your phone for the payment prompt...'}
            {bookingData.paymentMethod === 'card' && 'Waiting for payment confirmation from the secure page...'}
            {bookingData.paymentMethod === 'balance' && 'Processing wallet payment...'}
            {bookingData.paymentMethod === 'loan' && 'Processing loan payment...'}
          </p>
          {paymentReference && (
            <p className="text-xs text-gray-500 mt-4">
              Reference: {paymentReference}
            </p>
          )}
          {showInstructions && instructions.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
              <p className="text-xs font-medium text-blue-800 mb-2">Instructions:</p>
              <ul className="list-disc pl-4 text-xs text-blue-700">
                {instructions.map((instruction, i) => (
                  <li key={i} className="mb-1">{instruction}</li>
                ))}
              </ul>
            </div>
          )}
          {trackingStarted && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div 
                  className="bg-[#BC8BBC] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(trackingAttempts / 24) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                Checking status... {trackingAttempts}/24
              </p>
            </div>
          )}
        </div>
      );
    } else if (paymentStep === 3) {
      return (
        <div className="py-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Payment Successful!</h3>
          <p className="text-gray-600 text-sm mb-4">Your payment of {formatPrice(totalAmount)} has been processed.</p>
          <p className="text-xs text-gray-500">Redirecting to confirmation...</p>
        </div>
      );
    }
  };

  const getButtonText = () => {
    if (bookingData.paymentMethod === 'card') {
      return 'Proceed to Secure Payment';
    }
    return `Pay ${formatPrice(totalAmount)} Now`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full animate-fadeIn shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${paymentMethodInfo.color} ${paymentMethodInfo.borderColor} border`}>
              {paymentMethodInfo.icon}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">Complete Payment</h4>
              <div className="text-sm text-gray-500">
                {formatPrice(totalAmount)} • {paymentMethodInfo.name}
              </div>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            disabled={processingPayment}
            className={`p-2 rounded-full transition-colors ${
              processingPayment ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 min-h-[320px] max-h-[60vh] overflow-y-auto">
          {renderPaymentContent()}
        </div>
        
        {paymentStep === 1 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl">
            <button
              onClick={handleProcessPayment}
              disabled={!isPaymentButtonEnabled() || processingPayment}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                isPaymentButtonEnabled() && !processingPayment
                  ? 'bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-200 cursor-not-allowed text-gray-500'
              }`}
            >
              {processingPayment ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                getButtonText()
              )}
            </button>
            
            <button
              onClick={handleCloseModal}
              className="w-full py-3 mt-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        
        {paymentStep === 2 && bookingData.paymentMethod === 'card' && cardRedirected && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl">
            <button
              onClick={() => window.open('', '_blank')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Reopen Payment Window
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Already completed payment? We're checking status automatically.
            </p>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default PaymentModal;