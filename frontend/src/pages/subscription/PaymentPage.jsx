import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Shield,
  Loader,
  RefreshCw,
  CreditCard,
  Star,
  AlertTriangle,
  Info,
  Calendar,
  Users,
  Download,
  Video,
  Check,
  HelpCircle,
  Lock
} from 'lucide-react';
import api from '../../api/axios';
import { useTranslation } from 'react-i18next';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // 🚨 Get plan data from navigation state (passed from subscription page)
  const { plan, currency, calculatedPrice } = location.state || {};

  const [formData, setFormData] = useState({
    phoneNumber: '',
    customerName: '',
    customerEmail: '',
  });

  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [errors, setErrors] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const [statusChecking, setStatusChecking] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [showSecurityTooltip, setShowSecurityTooltip] = useState(false);
  const [showPendingTooltip, setShowPendingTooltip] = useState(false);

  // Refs for tooltip positioning
  const securityTooltipRef = useRef(null);
  const pendingTooltipRef = useRef(null);
  const securityButtonRef = useRef(null);
  const pendingButtonRef = useRef(null);

  // 🛡️ Security: Prevent developer tools and inspect element
  useEffect(() => {
    const preventDevTools = (e) => {
      if (e.keyCode === 123 || // F12
          (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
          (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
          (e.ctrlKey && e.keyCode === 85)) { // Ctrl+U
        e.preventDefault();
        return false;
      }
    };

    // Disable right-click context menu
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Detect if dev tools is open
    const devToolsDetection = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #111827; color: white; font-family: Arial, sans-serif;">Security violation detected. Please refresh the page.</div>';
        throw new Error('Security violation');
      }
    };

    // Add event listeners
    document.addEventListener('keydown', preventDevTools);
    document.addEventListener('contextmenu', preventContextMenu);
    
    // Check for dev tools periodically
    const devToolsCheck = setInterval(devToolsDetection, 1000);

    return () => {
      document.removeEventListener('keydown', preventDevTools);
      document.removeEventListener('contextmenu', preventContextMenu);
      clearInterval(devToolsCheck);
    };
  }, []);

  // Close tooltips when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSecurityTooltip && 
          securityTooltipRef.current && 
          !securityTooltipRef.current.contains(event.target) &&
          securityButtonRef.current &&
          !securityButtonRef.current.contains(event.target)) {
        setShowSecurityTooltip(false);
      }
      
      if (showPendingTooltip && 
          pendingTooltipRef.current && 
          !pendingTooltipRef.current.contains(event.target) &&
          pendingButtonRef.current &&
          !pendingButtonRef.current.contains(event.target)) {
        setShowPendingTooltip(false);
      }
    };

    if (showSecurityTooltip || showPendingTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSecurityTooltip, showPendingTooltip]);

  useEffect(() => {
    // 🚨 Redirect if no plan data (security measure)
    if (!plan) {
      console.error('No plan data found. Redirecting to subscription page.');
      navigate('/subscription');
      return;
    }

    fetchUserInfo();
  }, [plan, navigate]);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data) {
        const userData = response.data;
        setUserInfo(userData);

        // 🚨 Auto-fill form with user data
        setFormData({
          phoneNumber: userData.phone || '',
          customerName: userData.name || userData.email.split('@')[0],
          customerEmail: userData.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // 🚨 Redirect if user not authenticated
      navigate('/login');
    }
  };

  // 🆕 Enhanced error message mapping
  const getUserFriendlyErrorMessage = (errorMessage, plan) => {
    const errorLower = errorMessage.toLowerCase();

    // Insufficient funds errors
    if (errorLower.includes('insufficient') || errorLower.includes('insuffisant') ||
      errorLower.includes('low balance') || errorLower.includes('solde insuffisant') ||
      errorLower.includes('1005')) {
      return {
        title: t('userSubscription.errors.insufficientFunds.title'),
        message: t('userSubscription.errors.insufficientFunds.message', { planType: plan.type }),
        details: t('userSubscription.errors.insufficientFunds.details', { amount: formatCurrency(plan.price), planType: plan.type }),
        type: 'warning',
        actions: [
          {
            text: t('userSubscription.errors.insufficientFunds.actions.addMoney'),
            description: t('userSubscription.errors.insufficientFunds.actions.addMoneyDesc')
          },
          {
            text: t('userSubscription.errors.insufficientFunds.actions.chooseDifferent'),
            description: t('userSubscription.errors.insufficientFunds.actions.chooseDifferentDesc')
          }
        ]
      };
    }

    // Invalid phone number errors
    if (errorLower.includes('invalid phone') || errorLower.includes('invalid number') ||
      errorLower.includes('phone not found') || errorLower.includes('numéro invalide')) {
      return {
        title: t('userSubscription.errors.invalidPhone.title'),
        message: t('userSubscription.errors.invalidPhone.message'),
        details: t('userSubscription.errors.invalidPhone.details'),
        type: 'error',
        actions: [
          {
            text: t('userSubscription.errors.invalidPhone.actions.checkNumber'),
            description: t('userSubscription.errors.invalidPhone.actions.checkNumberDesc')
          }
        ]
      };
    }

    // Network/connection errors
    if (errorLower.includes('network') || errorLower.includes('timeout') ||
      errorLower.includes('connection') || errorLower.includes('unreachable')) {
      return {
        title: t('userSubscription.errors.networkIssue.title'),
        message: t('userSubscription.errors.networkIssue.message'),
        details: t('userSubscription.errors.networkIssue.details'),
        type: 'warning',
        actions: [
          {
            text: t('userSubscription.errors.networkIssue.actions.checkConnection'),
            description: t('userSubscription.errors.networkIssue.actions.checkConnectionDesc')
          },
          {
            text: t('userSubscription.errors.networkIssue.actions.tryAgain'),
            description: t('userSubscription.errors.networkIssue.actions.tryAgainDesc')
          }
        ]
      };
    }

    // Transaction declined errors
    if (errorLower.includes('declined') || errorLower.includes('rejected') ||
      errorLower.includes('failed') || errorLower.includes('refused')) {
      return {
        title: t('userSubscription.errors.paymentDeclined.title'),
        message: t('userSubscription.errors.paymentDeclined.message'),
        details: t('userSubscription.errors.paymentDeclined.details'),
        type: 'error',
        actions: [
          {
            text: t('userSubscription.errors.paymentDeclined.actions.contactOperator'),
            description: t('userSubscription.errors.paymentDeclined.actions.contactOperatorDesc')
          },
          {
            text: t('userSubscription.errors.paymentDeclined.actions.tryDifferentMethod'),
            description: t('userSubscription.errors.paymentDeclined.actions.tryDifferentMethodDesc')
          }
        ]
      };
    }

    // Default error for system/internal issues
    return {
      title: t('userSubscription.errors.defaultError.title'),
      message: t('userSubscription.errors.defaultError.message'),
      details: t('userSubscription.errors.defaultError.details'),
      type: 'error',
      actions: [
        {
          text: t('userSubscription.errors.defaultError.actions.tryAgain'),
          description: t('userSubscription.errors.defaultError.actions.tryAgainDesc')
        },
        {
          text: t('userSubscription.errors.defaultError.actions.contactSupport'),
          description: t('userSubscription.errors.defaultError.actions.contactSupportDesc')
        }
      ]
    };
  };

  const validateForm = () => {
    const newErrors = {};

    // 🚨 Amount validation is handled by server, no user input needed

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t('userSubscription.validation.phoneRequired');
    } else if (formData.phoneNumber.replace(/\D/g, '').length < 9) {
      newErrors.phoneNumber = t('userSubscription.validation.phoneInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    // 🛡️ Prevent editing email field
    if (field === 'customerEmail' && userInfo?.email) {
      return; // Don't allow email modification
    }
    
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
      // 🆕 Send payment request with plan data from navigation state
      const response = await api.post('/payment/initiate', {
        amount: plan.price, // 🚨 Server-controlled amount from plan
        phoneNumber: formData.phoneNumber,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        planId: plan.id, // 🚨 Include plan ID for verification
        planType: plan.type // 🚨 Include plan type for verification
      });

      console.log('💰 MoMo Payment initiation response:', response.data);

      if (response.data.success) {
        setCurrentPayment({
          ...response.data.data,
          reference_id: response.data.data.referenceId
        });
        setPaymentStatus(response.data.data.status);

        // Start polling for status updates if pending
        if (response.data.data.status === 'pending') {
          startStatusPolling(response.data.data.referenceId);
        }
      } else {
        throw new Error(response.data.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);

      // 🆕 Enhanced error handling with user-friendly messages
      let errorMessage = t('userSubscription.payment.initiationFailed');
      let userFriendlyError = null;

      if (error.response?.data?.error) {
        // Use the structured error from backend
        const backendError = error.response.data.error;
        errorMessage = backendError.message;
        userFriendlyError = {
          ...backendError,
          // Add plan context for better messaging
          plan: plan
        };
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        userFriendlyError = getUserFriendlyErrorMessage(errorMessage, plan);
      } else if (error.message) {
        errorMessage = error.message;
        userFriendlyError = getUserFriendlyErrorMessage(errorMessage, plan);
      }

      setErrors({
        submit: errorMessage,
        userFriendly: userFriendlyError
      });
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = (referenceId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/payment/status/${referenceId}`);
        const payment = response.data.data;

        setCurrentPayment(payment);

        // Update status if changed
        if (payment.status !== 'pending') {
          setPaymentStatus(payment.status);

          // 🆕 If payment completed, fetch subscription details
          if (payment.status === 'completed') {
            fetchSubscriptionDetails();
          }

          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 5000);

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 120000);
  };

  const fetchPaymentStatus = async (referenceId) => {
    try {
      setStatusChecking(true);
      const response = await api.get(`/payment/status/${referenceId}`);
      setCurrentPayment(response.data.data);
      setPaymentStatus(response.data.data.status);

      // 🆕 If payment completed, fetch subscription details
      if (response.data.data.status === 'completed') {
        fetchSubscriptionDetails();
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    } finally {
      setStatusChecking(false);
    }
  };

  // 🆕 Fetch subscription details after successful payment
  const fetchSubscriptionDetails = async () => {
    try {
      const response = await api.get('/subscription/user/current');
      if (response.data.success && response.data.data) {
        setSubscriptionDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    }
  };

  const refreshPaymentStatus = () => {
    if (currentPayment?.reference_id) {
      fetchPaymentStatus(currentPayment.reference_id);
    }
  };

  const proceedToDashboard = () => {
    navigate('/');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 🆕 Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 🆕 Calculate subscription end date
  const getSubscriptionEndDate = (startDate) => {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    return formatDate(endDate);
  };

  // 🆕 Enhanced Responsive Tooltip Components
  const SecurityTooltip = () => {
    const [tooltipStyle, setTooltipStyle] = useState({});
    
    useEffect(() => {
      if (securityButtonRef.current) {
        const buttonRect = securityButtonRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Calculate available space
        const spaceOnLeft = buttonRect.left;
        const spaceOnRight = viewportWidth - buttonRect.right;
        const tooltipWidth = 320; // w-80 = 320px
        
        let leftPosition = '50%';
        let transform = 'translateX(-50%)';
        
        // Adjust positioning based on available space
        if (spaceOnRight < tooltipWidth / 2 && spaceOnLeft >= tooltipWidth / 2) {
          // More space on left, align to right
          leftPosition = 'auto';
          transform = 'none';
          setTooltipStyle({ right: '0', left: 'auto' });
        } else if (spaceOnLeft < tooltipWidth / 2 && spaceOnRight >= tooltipWidth / 2) {
          // More space on right, align to left
          leftPosition = 'auto';
          transform = 'none';
          setTooltipStyle({ left: '0', right: 'auto' });
        } else {
          // Center alignment (default)
          setTooltipStyle({ left: leftPosition, transform });
        }
      }
    }, []);

    return (
      <div
        ref={securityTooltipRef}
        className="absolute bottom-full mb-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-4"
        style={tooltipStyle}
      >
        <div className="flex items-start space-x-3">
          <Lock className="w-5 h-5 text-[#BC8BBC] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white text-sm mb-2">{t('userSubscription.security.title')}</h4>
            <p className="text-gray-300 text-xs leading-relaxed">
              {t('userSubscription.security.description')}
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-xs">{t('userSubscription.security.encrypted')}</span>
            </div>
          </div>
        </div>
        {/* Responsive arrow positioning */}
        <div 
          className="absolute top-full w-4 h-4 bg-gray-800 border-b border-r border-gray-600 rotate-45"
          style={{
            left: tooltipStyle.right === '0' ? 'auto' : tooltipStyle.left === '0' ? '12px' : '50%',
            right: tooltipStyle.right === '0' ? '12px' : 'auto',
            transform: tooltipStyle.transform === 'none' ? 'none' : 'translateX(-50%)'
          }}
        ></div>
      </div>
    );
  };

  const PendingTooltip = () => {
    return (
      <div
        ref={pendingTooltipRef}
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-4"
      >
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white text-sm mb-2">{t('userSubscription.pending.title')}</h4>
            <p className="text-gray-300 text-xs leading-relaxed">
              {t('userSubscription.pending.description')}
            </p>
            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <p className="text-yellow-300 text-xs font-medium mb-1">{t('userSubscription.pending.ussdCodes')}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-300">MTN:</span>
                  <span className="text-white font-mono">*182*7*2#</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Airtel:</span>
                  <span className="text-white font-mono">--</span>
                </div>
                <p className="text-yellow-200 text-xs mt-1">{t('userSubscription.pending.cashOutNote')}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Arrow pointing downward to the question icon */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-800 border-b border-r border-gray-600 rotate-45"></div>
      </div>
    );
  };

  // 🚨 Security: Redirect if no plan data
  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t('userSubscription.invalidRequest.title')}</h2>
          <p className="text-gray-400 mb-4">{t('userSubscription.invalidRequest.message')}</p>
          <button
            onClick={() => navigate('/subscription')}
            className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {t('userSubscription.invalidRequest.choosePlan')}
          </button>
        </div>
      </div>
    );
  }

  // Payment Status Display
  if (paymentStatus) {
    const getStatusConfig = () => {
      switch (paymentStatus?.toLowerCase()) {
        case 'completed':
          return {
            title: t('userSubscription.status.success.title'),
            message: t('userSubscription.status.success.message'),
            icon: <CheckCircle className="w-16 h-16 text-green-500" />,
            color: 'green',
            bgColor: 'border-green-500'
          };
        case 'pending':
          return {
            title: t('userSubscription.status.pending.title'),
            message: t('userSubscription.status.pending.message'),
            icon: <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />,
            color: 'yellow',
            bgColor: 'border-yellow-500'
          };
        case 'failed':
          return {
            title: t('userSubscription.status.failed.title'),
            message: t('userSubscription.status.failed.message'),
            icon: <XCircle className="w-16 h-16 text-red-500" />,
            color: 'red',
            bgColor: 'border-red-500'
          };
        default:
          return {
            title: t('userSubscription.status.default.title'),
            message: t('userSubscription.status.default.message'),
            icon: <div className="text-4xl">❓</div>,
            color: 'gray',
            bgColor: 'border-gray-500'
          };
      }
    };

    const status = getStatusConfig();

    // 🆕 Plan features display component
    const PlanFeatures = ({ plan }) => (
      <div className="bg-gradient-to-br from-[#BC8BBC]/10 to-purple-600/10 rounded-xl p-6 border border-[#BC8BBC]/20">
        <h4 className="font-semibold text-white mb-4 flex items-center">
          <Video className="w-5 h-5 mr-2 text-[#BC8BBC]" />
          {t('userSubscription.planFeatures.title')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-gray-300 text-sm">{t('userSubscription.planFeatures.devices', { count: plan.deviceLimit })}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Video className="w-4 h-4 text-green-400" />
            <span className="text-gray-300 text-sm">{t('userSubscription.planFeatures.videoQuality', { quality: plan.video_quality })}</span>
          </div>
          {plan.offline_downloads && (
            <div className="flex items-center space-x-3">
              <Download className="w-4 h-4 text-green-400" />
              <span className="text-gray-300 text-sm">
                {plan.max_downloads === -1 
                  ? t('userSubscription.planFeatures.unlimitedDownloads') 
                  : t('userSubscription.planFeatures.downloads', { count: plan.max_downloads })
                }
              </span>
            </div>
          )}
          {plan.hdr_support && (
            <div className="flex items-center space-x-3">
              <Star className="w-4 h-4 text-green-400" />
              <span className="text-gray-300 text-sm">{t('userSubscription.planFeatures.hdrSupport')}</span>
            </div>
          )}
        </div>
      </div>
    );

    // 🆕 Subscription details component
    const SubscriptionDetails = ({ subscription }) => (
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl p-6 border border-green-500/20">
        <h4 className="font-semibold text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-green-400" />
          {t('userSubscription.subscriptionDetails.title')}
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">{t('userSubscription.subscriptionDetails.plan')}:</span>
            <span className="text-white font-semibold capitalize">{subscription.plan_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('userSubscription.subscriptionDetails.started')}:</span>
            <span className="text-white">{formatDate(subscription.start_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('userSubscription.subscriptionDetails.renews')}:</span>
            <span className="text-white">{getSubscriptionEndDate(subscription.start_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('userSubscription.subscriptionDetails.status')}:</span>
            <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium">
              {t('userSubscription.subscriptionDetails.active')}
            </span>
          </div>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border-l-4 ${status.bgColor} shadow-xl relative`}>
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

              {/* Refresh button for pending payments with tooltip */}
              {paymentStatus === 'pending' && (
                <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                  <div className="relative">
                    <button
                      onClick={refreshPaymentStatus}
                      disabled={statusChecking}
                      className="bg-[#BC8BBC] hover:bg-[#9b69b2] disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${statusChecking ? 'animate-spin' : ''}`} />
                      {statusChecking ? t('userSubscription.status.checking') : t('userSubscription.status.checkStatus')}
                    </button>
                  </div>
                  
                  {/* Help button for pending payments */}
                  <div className="relative">
                    <button
                      ref={pendingButtonRef}
                      onClick={() => setShowPendingTooltip(!showPendingTooltip)}
                      className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center gap-2"
                    >
                      <HelpCircle className="w-5 h-5" />
                      <span className="text-sm hidden sm:inline">{t('userSubscription.status.needHelp')}</span>
                    </button>
                    
                    {/* Pending Tooltip */}
                    {showPendingTooltip && <PendingTooltip />}
                  </div>
                </div>
              )}
            </div>

            {currentPayment && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Payment Information */}
                <div className="space-y-6">
                  <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                    <h4 className="font-semibold text-white mb-4 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-[#BC8BBC]" />
                      {t('userSubscription.paymentInfo.title')}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('userSubscription.paymentInfo.referenceId')}:</span>
                        <span className="text-white font-mono text-sm">{currentPayment.reference_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('userSubscription.paymentInfo.amount')}:</span>
                        <span className="text-white font-semibold">{formatCurrency(currentPayment.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('userSubscription.paymentInfo.method')}:</span>
                        <span className="text-white flex items-center">
                          <Smartphone className="w-5 h-5 mr-2" />
                          <span className="ml-2">{t('userSubscription.paymentInfo.mobileMoney')}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('userSubscription.paymentInfo.status')}:</span>
                        <span className={`px-2 py-1 rounded text-xs ${currentPayment.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : currentPayment.status === 'pending'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                          }`}>
                          {currentPayment.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                    <h4 className="font-semibold text-white mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-[#BC8BBC]" />
                      {t('userSubscription.transactionDetails.title')}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('userSubscription.transactionDetails.date')}:</span>
                        <span className="text-white text-sm">
                          {new Date(currentPayment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('userSubscription.transactionDetails.type')}:</span>
                        <span className="text-white capitalize">{currentPayment.transaction_type}</span>
                      </div>
                      {currentPayment.provider_transaction_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t('userSubscription.transactionDetails.providerId')}:</span>
                          <span className="text-white font-mono text-xs">{currentPayment.provider_transaction_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subscription Information */}
                <div className="space-y-6">
                  {/* Plan Details */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-xl p-6 border border-blue-500/20">
                    <h4 className="font-semibold text-white mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-blue-400" />
                      {t('userSubscription.planDetails.title')}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('userSubscription.planDetails.planName')}:</span>
                        <span className="text-white font-semibold capitalize">{plan.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('userSubscription.planDetails.billingCycle')}:</span>
                        <span className="text-white">{t('userSubscription.planDetails.monthly')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('userSubscription.planDetails.amountPaid')}:</span>
                        <span className="text-white font-semibold">{formatCurrency(plan.price)}</span>
                      </div>
                      {plan.popular && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t('userSubscription.planDetails.special')}:</span>
                          <span className="text-[#BC8BBC] font-medium">{t('userSubscription.planDetails.mostPopular')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Features */}
                  <PlanFeatures plan={plan} />

                  {/* Subscription Details (if available) */}
                  {subscriptionDetails && (
                    <SubscriptionDetails subscription={subscriptionDetails} />
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {paymentStatus === 'completed' && (
                <button
                  onClick={proceedToDashboard}
                  className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#9b69b2] hover:to-purple-500 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {t('userSubscription.actions.proceedToDashboard')}
                </button>
              )}

              {paymentStatus === 'failed' && (
                <button
                  onClick={() => setPaymentStatus(null)}
                  className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-semibold py-3 px-8 rounded-lg transition-colors flex-1"
                >
                  {t('userSubscription.actions.tryAgain')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🆕 Enhanced Error Display Component
  const ErrorDisplay = ({ error }) => {
    if (!error) return null;

    const getIcon = () => {
      switch (error.type) {
        case 'warning':
          return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
        case 'error':
          return <XCircle className="w-6 h-6 text-red-500" />;
        default:
          return <Info className="w-6 h-6 text-blue-500" />;
      }
    };

    const getBorderColor = () => {
      switch (error.type) {
        case 'warning':
          return 'border-yellow-500/30';
        case 'error':
          return 'border-red-500/30';
        default:
          return 'border-blue-500/30';
      }
    };

    const getBackgroundColor = () => {
      switch (error.type) {
        case 'warning':
          return 'bg-yellow-500/10';
        case 'error':
          return 'bg-red-500/10';
        default:
          return 'bg-blue-500/10';
      }
    };

    return (
      <div className={`rounded-xl border-2 ${getBorderColor()} ${getBackgroundColor()} p-6 mb-6`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">
              {error.title}
            </h3>
            <p className="text-gray-200 mb-3">
              {error.message}
            </p>
            <p className="text-gray-300 text-sm mb-4">
              {error.details}
            </p>

            {/* Suggested Actions */}
            <div className="space-y-3">
              {error.actions?.map((action, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 bg-[#BC8BBC] rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium text-sm">{action.text}</p>
                    <p className="text-gray-400 text-xs">{action.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Payment Form
  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/subscription')}
            className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('userSubscription.navigation.backToPlans')}
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('userSubscription.title')}
            </h1>
            <p className="text-gray-400">
              {t('userSubscription.subtitle')}
            </p>
          </div>
        </div>

        {/* Plan Summary Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 mb-6 border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">{plan.type.charAt(0).toUpperCase() + plan.type.slice(1)} {t('userSubscription.planSummary.plan')}</h3>
              <p className="text-[#BC8BBC] text-sm">{t('userSubscription.planSummary.selectedSubscription')}</p>
            </div>
            {plan.popular && (
              <div className="flex items-center bg-[#BC8BBC] text-white px-3 py-1 rounded-full text-xs font-semibold">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {t('userSubscription.planSummary.popular')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">{t('userSubscription.planSummary.amount')}:</span>
              <p className="text-white font-semibold text-lg">{formatCurrency(plan.price)}</p>
            </div>
            <div>
              <span className="text-gray-400">{t('userSubscription.planSummary.billing')}:</span>
              <p className="text-white">{t('userSubscription.planSummary.monthly')}</p>
            </div>
            <div>
              <span className="text-gray-400">{t('userSubscription.planSummary.devices')}:</span>
              <p className="text-white">{t('userSubscription.planSummary.devicesCount', { count: plan.deviceLimit })}</p>
            </div>
            <div>
              <span className="text-gray-400">{t('userSubscription.planSummary.quality')}:</span>
              <p className="text-white">{plan.video_quality}</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {userInfo && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
            <h3 className="font-semibold text-white mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-[#BC8BBC]" />
              {t('userSubscription.userInfo.title')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('userSubscription.userInfo.email')}:</span>
                <span className="text-white">{userInfo.email}</span>
              </div>
              {userInfo.name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('userSubscription.userInfo.name')}:</span>
                  <span className="text-white">{userInfo.name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🆕 Enhanced Error Display - Moved above the form for better visibility */}
        {errors.userFriendly && (
          <ErrorDisplay error={errors.userFriendly} />
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Display (Read-only) */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('userSubscription.paymentForm.amountLabel')}
            </label>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {formatCurrency(plan.price)}
              </span>
              <span className="text-gray-400 text-sm bg-gray-700 px-2 py-1 rounded">
                {t('userSubscription.paymentForm.fixedAmount')}
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              {t('userSubscription.paymentForm.amountDescription')}
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('userSubscription.paymentForm.phoneLabel')} *
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-[#BC8BBC]'
                }`}
              placeholder={t('userSubscription.paymentForm.phonePlaceholder')}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {t('userSubscription.paymentForm.phoneDescription')}
            </p>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('userSubscription.paymentForm.nameLabel')}
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                placeholder={t('userSubscription.paymentForm.namePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('userSubscription.paymentForm.emailLabel')}
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                readOnly
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                placeholder={t('userSubscription.paymentForm.emailPlaceholder')}
              />
              <p className="text-xs text-gray-400 mt-1">
                {t('userSubscription.paymentForm.emailDescription')}
              </p>
            </div>
          </div>

          {/* Security Notice with Tooltip */}
          <div className="bg-gradient-to-r from-[#BC8BBC]/20 to-purple-600/20 border border-[#BC8BBC]/30 rounded-lg p-4 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                <Shield className="w-5 h-5 text-[#BC8BBC] mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#BC8BBC] text-sm mb-1">{t('userSubscription.securityNotice.title')}</h4>
                  <p className="text-gray-300 text-xs">
                    {t('userSubscription.securityNotice.description')}
                  </p>
                </div>
              </div>
              
              {/* Help button */}
              <div className="relative">
                <button
                  ref={securityButtonRef}
                  type="button"
                  onClick={() => setShowSecurityTooltip(!showSecurityTooltip)}
                  className="text-gray-400 hover:text-[#BC8BBC] transition-colors flex-shrink-0 ml-2"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                
                {/* Security Tooltip */}
                {showSecurityTooltip && <SecurityTooltip />}
              </div>
            </div>
          </div>

          {/* Submit Error (Generic) */}
          {errors.submit && !errors.userFriendly && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-200 text-sm">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#9b69b2] hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-3" />
                {t('userSubscription.paymentForm.processing')}
              </>
            ) : (
              <>
                <Smartphone className="w-5 h-5 mr-2" />
                <span className="ml-2">
                  {t('userSubscription.paymentForm.payButton', { amount: formatCurrency(plan.price) })}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;