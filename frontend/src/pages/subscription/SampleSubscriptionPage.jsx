import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Smartphone, CheckCircle, XCircle, Clock, User, Mail, Calendar, CreditCard, Wifi } from 'lucide-react';
import api from '../../api/axios';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    amount: '',
    phoneNumber: '',
    paymentMethod: 'MPESA' // ADDED: Payment method selection
  });
  
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [errors, setErrors] = useState({});
  const [userInfo, setUserInfo] = useState(null);

  // Check URL parameters for payment status
  useEffect(() => {
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    
    console.log('🔍 URL Parameters:', { status, orderId });
    
    if (status && orderId) {
      // Convert PesaPal status to our status format
      const formattedStatus = status === '200' ? 'completed' : 
                            status === 'COMPLETED' ? 'completed' : 
                            status.toLowerCase();
      setPaymentStatus(formattedStatus);
      fetchPaymentStatus(orderId);
    }
  }, [searchParams]);

  // Fetch user info on component mount
  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data) {
        setUserInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) < 100) {
      newErrors.amount = 'Amount must be at least 100 RWF';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (formData.phoneNumber.replace(/\D/g, '').length < 9) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await api.post('/payment/initiate', formData);
      
      console.log('📨 Backend response:', response.data);
      
      if (response.data.success && response.data.data.redirectUrl) {
        console.log('🔄 Redirecting to:', response.data.data.redirectUrl);
        // Redirect to PesaPal payment page
        window.location.href = response.data.data.redirectUrl;
      } else {
        throw new Error('No redirect URL received from server');
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      setErrors({ 
        submit: error.response?.data?.message || 'Failed to initiate payment' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStatus = async (orderId) => {
    try {
      const response = await api.get(`/payment/status/${orderId}`);
      setCurrentPayment(response.data.data);
      
      // If payment is completed, fetch updated user info
      if (response.data.data.status === 'COMPLETED' || response.data.data.status === 'completed') {
        fetchUserInfo();
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    }
  };

  const resetPayment = () => {
    setFormData({
      amount: '',
      phoneNumber: '',
      paymentMethod: 'MPESA'
    });
    setPaymentStatus(null);
    setCurrentPayment(null);
    setErrors({});
    // Clear URL parameters
    navigate('/payment', { replace: true });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'MPESA':
        return <Smartphone className="w-4 h-4 mr-2" />;
      case 'AIRTEL':
        return <Wifi className="w-4 h-4 mr-2" />;
      default:
        return <CreditCard className="w-4 h-4 mr-2" />;
    }
  };

  const getPaymentMethodDescription = (method) => {
    switch (method) {
      case 'MPESA':
        return 'You will receive an M-Pesa USSD push notification';
      case 'AIRTEL':
        return 'You will receive an Airtel Money USSD push notification';
      default:
        return 'You will be redirected to card/bank payment page';
    }
  };

  const PaymentForm = () => (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Mobile Payment
            </h1>
            <p className="text-gray-400">
              Choose payment method and enter your details
            </p>
          </div>
        </div>

        {/* User Info */}
        {userInfo && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
            <h3 className="font-semibold text-white mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-400" />
              Your Account
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{userInfo.email}</span>
              </div>
              {userInfo.name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{userInfo.name}</span>
                </div>
              )}
              {userInfo.subscription_status && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Subscription:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    userInfo.subscription_status === 'active' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}>
                    {userInfo.subscription_status}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Method Selection - ADDED */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Payment Method *
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MPESA" className="bg-gray-800">M-Pesa</option>
              <option value="AIRTEL" className="bg-gray-800">Airtel Money</option>
              <option value="" className="bg-gray-800">Card/Bank Transfer</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {getPaymentMethodDescription(formData.paymentMethod)}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (RWF) *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
                errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
              }`}
              placeholder="1000"
              min="100"
              step="100"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-400">{errors.amount}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
                errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
              }`}
              placeholder={formData.paymentMethod === 'MPESA' ? "254712345678" : "0781234567"}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {formData.paymentMethod === 'MPESA' 
                ? 'Use Kenyan number format for M-Pesa (254...)'
                : 'Use your local phone number'
              }
            </p>
          </div>

          {/* Payment Method Info */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="font-semibold text-white mb-3 flex items-center">
              {getPaymentMethodIcon(formData.paymentMethod)}
              {formData.paymentMethod === 'MPESA' ? 'M-Pesa Payment' : 
               formData.paymentMethod === 'AIRTEL' ? 'Airtel Money Payment' : 'Card/Bank Payment'}
            </h4>
            <ul className="text-sm text-gray-300 space-y-2">
              {formData.paymentMethod === 'MPESA' && (
                <>
                  <li>• Enter amount and Kenyan phone number (254...)</li>
                  <li>• You'll receive an M-Pesa USSD push</li>
                  <li>• Complete payment on your phone</li>
                  <li>• Get instant confirmation</li>
                </>
              )}
              {formData.paymentMethod === 'AIRTEL' && (
                <>
                  <li>• Enter amount and your Airtel number</li>
                  <li>• You'll receive an Airtel Money USSD push</li>
                  <li>• Complete payment on your phone</li>
                  <li>• Get instant confirmation</li>
                </>
              )}
              {!formData.paymentMethod && (
                <>
                  <li>• Enter amount and your phone number</li>
                  <li>• You'll be redirected to PesaPal secure payment</li>
                  <li>• Complete payment via Card or Bank Transfer</li>
                  <li>• Get instant confirmation</li>
                </>
              )}
            </ul>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
              <p className="text-red-200 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </>
            ) : (
              <>
                {getPaymentMethodIcon(formData.paymentMethod)}
                {`Pay ${formData.amount ? formatCurrency(formData.amount) : ''} with ${
                  formData.paymentMethod === 'MPESA' ? 'M-Pesa' :
                  formData.paymentMethod === 'AIRTEL' ? 'Airtel Money' : 'Card/Bank'
                }`}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const PaymentStatus = () => {
    const getStatusConfig = () => {
      switch (paymentStatus?.toLowerCase()) {
        case 'completed':
        case '200':
          return {
            title: 'Payment Successful! 🎉',
            message: 'Your payment has been processed successfully.',
            icon: <CheckCircle className="w-16 h-16 text-green-500" />,
            color: 'green',
            bgColor: 'bg-green-500'
          };
        case 'pending':
          return {
            title: 'Payment Processing',
            message: 'Your payment is being processed. Please wait for confirmation.',
            icon: <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />,
            color: 'yellow',
            bgColor: 'bg-yellow-500'
          };
        case 'failed':
          return {
            title: 'Payment Failed',
            message: 'We could not process your payment. Please try again.',
            icon: <XCircle className="w-16 h-16 text-red-500" />,
            color: 'red',
            bgColor: 'bg-red-500'
          };
        case 'cancelled':
          return {
            title: 'Payment Cancelled',
            message: 'You cancelled the payment process.',
            icon: <XCircle className="w-16 h-16 text-orange-500" />,
            color: 'orange',
            bgColor: 'bg-orange-500'
          };
        default:
          return {
            title: 'Payment Status',
            message: 'Unable to determine payment status.',
            icon: <div className="text-4xl">❓</div>,
            color: 'gray',
            bgColor: 'bg-gray-500'
          };
      }
    };

    const status = getStatusConfig();

    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className={`bg-gray-800 rounded-2xl p-8 border-l-4 ${status.bgColor} border-l-4`}>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                {status.icon}
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                {status.title}
              </h2>
              <p className="text-gray-300 text-lg">
                {status.message}
              </p>
            </div>

            {/* Payment Details */}
            {currentPayment && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-700 rounded-lg p-6">
                  <h4 className="font-semibold text-white mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-400" />
                    Payment Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Order ID:</span>
                      <span className="text-white font-mono text-sm">{currentPayment.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-semibold">{formatCurrency(currentPayment.amount)}</span>
                    </div>
                    {currentPayment.payment_method && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment Method:</span>
                        <span className="text-white flex items-center">
                          {getPaymentMethodIcon(currentPayment.payment_method)}
                          {currentPayment.payment_method === 'MPESA' ? 'M-Pesa' :
                           currentPayment.payment_method === 'AIRTEL' ? 'Airtel Money' :
                           currentPayment.payment_method || 'Card/Bank'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        currentPayment.status === 'COMPLETED' || currentPayment.status === 'completed' 
                          ? 'bg-green-500 text-white' 
                          : currentPayment.status === 'PENDING' || currentPayment.status === 'pending'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {currentPayment.status}
                      </span>
                    </div>
                    {currentPayment.created_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white text-sm">{formatDate(currentPayment.created_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Information */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h4 className="font-semibold text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-green-400" />
                    Customer Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white">{currentPayment.customer_phone || formData.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{currentPayment.customer_email}</span>
                    </div>
                    {currentPayment.customer_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white">{currentPayment.customer_name}</span>
                      </div>
                    )}
                    {userInfo && userInfo.subscription_status && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Subscription:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          userInfo.subscription_status === 'active' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-500 text-white'
                        }`}>
                          {userInfo.subscription_status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {(paymentStatus === 'completed' || paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
                <button
                  onClick={resetPayment}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex-1"
                >
                  Make Another Payment
                </button>
              )}
              
              <button
                onClick={() => navigate('/browse')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex-1"
              >
                Start Watching
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex-1"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>  
      </div>
    );
  };

  return paymentStatus ? <PaymentStatus /> : <PaymentForm />;
};

export default PaymentPage;