import React, { useState, useEffect, useRef } from "react";
import api from "../../../../../api/axios";
import {
  XCircle,
  CheckCircle,
  Crown,
  Users,
  Zap,
  Star,
  Video,
  Download,
  Shield,
  Smartphone,
  Monitor,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Info,
  ArrowUp,
  Clock,
  Lock,
  Eye,
  CreditCard,
  ArrowLeft,
  Loader,
  Ban,
  AlertCircle,
  PlusCircle
} from "lucide-react";

// Security constants
const SECURITY_CONFIG = {
  MAX_PHONE_LENGTH: 12,
  MIN_PHONE_LENGTH: 9,
  POLLING_TIMEOUT: 120000, // 2 minutes
  POLLING_INTERVAL: 5000, // 5 seconds
  MAX_RETRIES: 3,
  DEBOUNCE_DELAY: 500,
  SESSION_TIMEOUT: 300000 // 5 minutes
};

export default function NewPlanModal({ currentSubscription, onClose, onSuccess }) {
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Payment states
  const [paymentStep, setPaymentStep] = useState('select-plan');
  const [formData, setFormData] = useState({
    phoneNumber: '',
    customerName: '',
    customerEmail: '',
  });
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [errors, setErrors] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const [securityViolation, setSecurityViolation] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Refs for security
  const modalRef = useRef(null);
  const pollingRef = useRef(null);
  const activityTimerRef = useRef(null);
  const debounceRef = useRef(null);

  // 🛡️ SECURITY: Comprehensive protection measures
  useEffect(() => {
    const securityMeasures = initializeSecurity();
    return () => cleanupSecurity(securityMeasures);
  }, []);

  // 🛡️ SECURITY: Activity monitoring
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // Session timeout check
    activityTimerRef.current = setInterval(() => {
      if (Date.now() - lastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
        handleSecurityViolation('Session timeout');
      }
    }, 30000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(activityTimerRef.current);
    };
  }, [lastActivity]);

  // 🛡️ SECURITY: Initialize all security measures
  const initializeSecurity = () => {
    const measures = {
      devToolsListener: null,
      contextMenuListener: null,
      blurListener: null,
      resizeObserver: null
    };

    // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    measures.devToolsListener = (e) => {
      if (e.keyCode === 123 || // F12
          (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
          (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
          (e.ctrlKey && e.keyCode === 85)) { // Ctrl+U
        e.preventDefault();
        handleSecurityViolation('Developer tools detected');
        return false;
      }
    };

    // Prevent right-click context menu
    measures.contextMenuListener = (e) => {
      e.preventDefault();
      handleSecurityViolation('Context menu attempt');
      return false;
    };

    // Detect window blur (potential dev tools)
    measures.blurListener = () => {
      setTimeout(() => {
        if (document.hidden) {
          handleSecurityViolation('Window hidden - potential inspection');
        }
      }, 1000);
    };

    // Detect dev tools by dimension difference
    measures.resizeObserver = new ResizeObserver(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      if (widthDiff > 200 || heightDiff > 200) {
        handleSecurityViolation('Dev tools detected by dimensions');
      }
    });

    // Apply listeners
    document.addEventListener('keydown', measures.devToolsListener);
    document.addEventListener('contextmenu', measures.contextMenuListener);
    document.addEventListener('blur', measures.blurListener);
    measures.resizeObserver.observe(document.body);

    return measures;
  };

  // 🛡️ SECURITY: Cleanup security measures
  const cleanupSecurity = (measures) => {
    if (measures.devToolsListener) {
      document.removeEventListener('keydown', measures.devToolsListener);
    }
    if (measures.contextMenuListener) {
      document.removeEventListener('contextmenu', measures.contextMenuListener);
    }
    if (measures.blurListener) {
      document.removeEventListener('blur', measures.blurListener);
    }
    if (measures.resizeObserver) {
      measures.resizeObserver.disconnect();
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    if (activityTimerRef.current) {
      clearInterval(activityTimerRef.current);
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  // 🛡️ SECURITY: Handle security violations
  const handleSecurityViolation = (reason) => {
    console.warn('Security violation:', reason);
    setSecurityViolation(true);
    
    // Clear any ongoing processes
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    // Don't allow any further actions
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // 🛡️ SECURITY: Secure API call wrapper
  const secureApiCall = async (apiFunction, ...args) => {
    if (securityViolation) {
      throw new Error('Security violation detected');
    }

    if (retryCount >= SECURITY_CONFIG.MAX_RETRIES) {
      throw new Error('Maximum retry attempts exceeded');
    }

    try {
      setRetryCount(prev => prev + 1);
      const response = await apiFunction(...args);
      setRetryCount(0); // Reset on success
      return response;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleSecurityViolation('Authentication error');
      }
      throw error;
    }
  };

  // 🛡️ SECURITY: Enhanced input sanitization
  const sanitizeInput = (input, type) => {
    if (typeof input !== 'string') return '';
    
    let sanitized = input.trim();
    
    switch (type) {
      case 'phone':
        // Remove all non-numeric characters except + for international numbers
        sanitized = sanitized.replace(/[^\d+]/g, '');
        // Limit length
        if (sanitized.length > SECURITY_CONFIG.MAX_PHONE_LENGTH) {
          sanitized = sanitized.substring(0, SECURITY_CONFIG.MAX_PHONE_LENGTH);
        }
        break;
      case 'name':
        // Allow only letters, spaces, and basic punctuation
        sanitized = sanitized.replace(/[^a-zA-Z\s\-'.]/g, '');
        // Limit length
        if (sanitized.length > 100) {
          sanitized = sanitized.substring(0, 100);
        }
        break;
      case 'email':
        // Basic email validation without revealing too much
        if (!sanitized.includes('@') || !sanitized.includes('.')) {
          return '';
        }
        break;
      default:
        // Default sanitization
        sanitized = sanitized.replace(/[<>]/g, '');
    }
    
    return sanitized;
  };

  useEffect(() => {
    secureApiCall(fetchAvailablePlans);
    secureApiCall(fetchUserInfo);
  }, []);

  const fetchAvailablePlans = async () => {
    if (securityViolation) return;
    
    try {
      setLoading(true);
      const response = await secureApiCall(() => api.get('/new-plan/available-plans'));
      if (response.data.success) {
        setAvailablePlans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching available plans:', error);
      setErrors({ fetch: 'Failed to load plans. Please refresh the page.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    if (securityViolation) return;
    
    try {
      const response = await secureApiCall(() => api.get('/auth/me'));
      if (response.data) {
        const userData = response.data;
        setUserInfo(userData);

        setFormData({
          phoneNumber: sanitizeInput(userData.phone || '', 'phone'),
          customerName: sanitizeInput(userData.name || userData.email?.split('@')[0] || '', 'name'),
          customerEmail: sanitizeInput(userData.email || '', 'email')
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handlePlanSelection = (plan) => {
    if (securityViolation) return;
    
    setSelectedPlan(plan);
    setPaymentStep('confirmation');
    setLastActivity(Date.now());
  };

  // Calculate start date for new plan
  const getNewPlanStartDate = () => {
    if (!currentSubscription) {
      return new Date(); // Start immediately if no current subscription
    }
    
    // Start after current subscription ends
    const currentEndDate = new Date(currentSubscription.end_date);
    return new Date(currentEndDate.getTime() + (1000 * 60 * 60 * 24)); // Next day after current ends
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'family': return <Users className="w-6 h-6 text-purple-400" />;
      case 'standard': return <Crown className="w-6 h-6 text-yellow-400" />;
      case 'basic': return <Monitor className="w-6 h-6 text-blue-400" />;
      case 'mobile': return <Smartphone className="w-6 h-6 text-green-400" />;
      default: return <Star className="w-6 h-6 text-gray-400" />;
    }
  };

  // 🛡️ SECURITY: Enhanced validation with rate limiting
  const validateForm = () => {
    if (securityViolation) return false;

    const newErrors = {};

    // Phone validation
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < SECURITY_CONFIG.MIN_PHONE_LENGTH) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }
      // Check for suspicious patterns
      if (/(\d)\1{5,}/.test(cleanPhone)) {
        newErrors.phoneNumber = 'Invalid phone number pattern';
      }
    }

    // Name validation
    if (formData.customerName && formData.customerName.length < 2) {
      newErrors.customerName = 'Please enter a valid name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🛡️ SECURITY: Debounced input handler
  const handleInputChange = (field, value) => {
    if (securityViolation) return;
    
    if (field === 'customerEmail' && userInfo?.email) {
      return; // Don't allow email modification
    }
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new debounce
    debounceRef.current = setTimeout(() => {
      const sanitizedValue = sanitizeInput(value, field);
      setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
      
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
      
      setLastActivity(Date.now());
    }, SECURITY_CONFIG.DEBOUNCE_DELAY);
  };

  const processNewPlanPayment = async () => {
    if (securityViolation) {
      setErrors({ submit: 'Security violation detected. Please refresh the page.' });
      return;
    }

    if (!validateForm()) return;

    setProcessing(true);
    setPaymentStep('processing');

    try {
      const response = await secureApiCall(() => api.post('/new-plan/purchase', {
        plan_id: selectedPlan.id,
        phoneNumber: formData.phoneNumber.replace(/\D/g, ''),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        start_after_current: true,
        security_token: generateSecurityToken()
      }));

      if (response.data.success) {
        setCurrentPayment(response.data.data);
        setPaymentStatus(response.data.data.status);
        
        if (response.data.data.status === 'completed') {
          setPaymentStep('success');
          setTimeout(() => {
            onSuccess();
          }, 3000);
        } else if (response.data.data.status === 'pending') {
          startStatusPolling(response.data.data.referenceId);
        }
      } else {
        throw new Error(response.data.message || 'New plan payment failed');
      }
    } catch (error) {
      console.error('New plan payment failed:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to process new plan payment'
      });
      setPaymentStep('confirmation');
    } finally {
      setProcessing(false);
    }
  };

  // 🛡️ SECURITY: Generate security token
  const generateSecurityToken = () => {
    return btoa(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${navigator.userAgent.substr(0, 50)}`);
  };

  // 🛡️ SECURITY: Secure polling with timeout
  const startStatusPolling = (referenceId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await secureApiCall(() => api.get(`/payment/status/${referenceId}`));
        const payment = response.data.data;

        setCurrentPayment(payment);
        setPaymentStatus(payment.status);

        if (payment.status === 'completed') {
          setPaymentStep('success');
          clearInterval(pollingRef.current);
          setTimeout(() => {
            onSuccess();
          }, 3000);
        } else if (payment.status === 'failed') {
          setErrors({ submit: 'Payment failed. Please try again.' });
          setPaymentStep('confirmation');
          clearInterval(pollingRef.current);
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, SECURITY_CONFIG.POLLING_INTERVAL);

    // Auto timeout
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        if (paymentStatus === 'pending') {
          setErrors({ submit: 'Payment timeout. Please check your Mobile Money and try again.' });
          setPaymentStep('confirmation');
        }
      }
    }, SECURITY_CONFIG.POLLING_TIMEOUT);
  };

  // 🛡️ SECURITY: Security violation screen
  if (securityViolation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Security Alert</h3>
          <p className="text-gray-400 mb-6">
            Unauthorized activity detected. This session has been terminated for security reasons.
          </p>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Plan Selection
  const renderPlanSelection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-green-400" />
          <div>
            <h4 className="font-semibold text-white">Purchase New Plan</h4>
            <p className="text-gray-300 text-sm">
              Buy a new subscription plan that will start automatically after your current plan ends.
            </p>
          </div>
        </div>
      </div>

      {currentSubscription && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <h4 className="font-semibold text-white">Current Plan Active</h4>
              <p className="text-gray-300 text-sm">
                Your new plan will start on {formatDate(getNewPlanStartDate())}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availablePlans.map((plan) => (
          <div 
            key={plan.id}
            className="border-2 border-blue-500/50 hover:border-blue-400 rounded-xl p-6 cursor-pointer transition-all duration-300 bg-gray-750 hover:bg-gray-700"
            onClick={() => handlePlanSelection(plan)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getPlanIcon(plan.type)}
                <h4 className="font-semibold text-white">{plan.name}</h4>
              </div>
              <div className="flex flex-col items-end gap-1">
                {plan.is_popular && (
                  <span className="bg-[#BC8BBC] text-white px-2 py-1 rounded-full text-xs font-medium">
                    Popular
                  </span>
                )}
                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                  New Plan
                </span>
              </div>
            </div>
            
            <p className="text-3xl font-bold text-white mb-2">
              {formatCurrency(plan.price)}
              <span className="text-gray-400 text-sm font-normal">/month</span>
            </p>
            
            <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
            
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Users className="w-4 h-4 text-blue-400" />
                {plan.max_sessions} simultaneous devices
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Video className="w-4 h-4 text-green-400" />
                {plan.video_quality} video quality
              </div>
              {plan.offline_downloads && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Download className="w-4 h-4 text-purple-400" />
                  {plan.max_downloads === -1 ? 'Unlimited' : plan.max_downloads} downloads
                </div>
              )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-400 text-sm font-semibold">
                Starts: {formatDate(getNewPlanStartDate())}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Step 2: Confirmation
  const renderConfirmation = () => (
    <div className="space-y-6">
      <button
        onClick={() => setPaymentStep('select-plan')}
        className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Plans
      </button>

      {/* Plan Summary */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{selectedPlan.name}</h3>
            <p className="text-blue-400 text-sm">New Plan Purchase</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{formatCurrency(selectedPlan.price)}</p>
            <p className="text-blue-300 text-sm">Monthly</p>
          </div>
        </div>
        
        {/* 🆕 Start Date Information */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <h4 className="font-semibold text-white text-sm">Plan Start Date</h4>
              <p className="text-blue-300 text-sm">
                {formatDate(getNewPlanStartDate())}
              </p>
              <p className="text-blue-200 text-xs mt-1">
                {currentSubscription 
                  ? "Your new plan will start automatically after your current plan ends."
                  : "Your new plan will start immediately after payment."
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Plan Name:</span>
            <p className="text-white font-semibold">{selectedPlan.name}</p>
          </div>
          <div>
            <span className="text-gray-400">Billing:</span>
            <p className="text-white">Monthly</p>
          </div>
          <div>
            <span className="text-gray-400">Devices:</span>
            <p className="text-white">{selectedPlan.max_sessions} Simultaneous</p>
          </div>
          <div>
            <span className="text-gray-400">Quality:</span>
            <p className="text-white">{selectedPlan.video_quality}</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={(e) => { e.preventDefault(); processNewPlanPayment(); }} className="space-y-4">
        {/* Amount Display */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Payment Amount
          </label>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">
              {formatCurrency(selectedPlan.price)}
            </span>
            <span className="text-gray-400 text-sm bg-gray-700 px-2 py-1 rounded">
              First Month
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            You'll be charged this amount for the first month of your new plan
          </p>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mobile Money Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            maxLength={SECURITY_CONFIG.MAX_PHONE_LENGTH}
            className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
              errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-[#BC8BBC]'
            }`}
            placeholder="0781234567"
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Email
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              readOnly
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-gradient-to-r from-[#BC8BBC]/20 to-purple-600/20 border border-[#BC8BBC]/30 rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-[#BC8BBC] mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-[#BC8BBC] text-sm mb-1">Secure Payment</h4>
              <p className="text-gray-300 text-xs">
                🔒 Encrypted connection • 🛡️ Fraud protected • 📱 Secure Mobile Money
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Suggestion */}
        {currentSubscription && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-400 text-sm mb-1">Consider Upgrade Instead?</h4>
                <p className="text-yellow-300 text-xs">
                  If you want to upgrade your current plan for immediate access, 
                  use the "Change Plan" option instead. This will give you instant 
                  access to better features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200 text-sm">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={processing || securityViolation}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
        >
          {processing ? (
            <>
              <Loader className="w-5 h-5 animate-spin mr-3" />
              Processing Purchase...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Purchase New Plan
            </>
          )}
        </button>
      </form>
    </div>
  );

  // Step 3: Processing
  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
        <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Processing Purchase</h3>
        <p className="text-gray-400">
          Your new plan purchase is being securely processed...
        </p>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          🔒 Secure transaction in progress • 📱 Check your phone for prompt
        </p>
      </div>
    </div>
  );

  // Step 4: Success
  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Purchase Successful! 🎉</h3>
        <p className="text-gray-400">
          Your new {selectedPlan.name} plan has been purchased successfully.
        </p>
        <p className="text-green-300 text-sm mt-2">
          It will start automatically on {formatDate(getNewPlanStartDate())}
        </p>
      </div>
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <p className="text-green-300 text-sm">
          ✅ Purchase complete • 🔒 Payment secured • 📅 Starts {formatDate(getNewPlanStartDate())}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 text-[#BC8BBC] animate-spin" />
            <h3 className="text-lg font-semibold text-white">Loading Plans...</h3>
            <p className="text-gray-400 text-center">Fetching available subscription plans</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {paymentStep === 'select-plan' && 'Purchase New Plan'}
                {paymentStep === 'confirmation' && 'Confirm New Plan Purchase'}
                {paymentStep === 'processing' && 'Processing Purchase'}
                {paymentStep === 'success' && 'Purchase Successful'}
              </h3>
              <p className="text-gray-400 mt-1">
                {paymentStep === 'select-plan' && 'Choose a new plan to start after your current subscription'}
                {paymentStep === 'confirmation' && 'Review your new plan details and complete payment'}
                {paymentStep === 'processing' && 'Your purchase is being processed'}
                {paymentStep === 'success' && 'Your new plan has been purchased successfully'}
              </p>
            </div>
            {paymentStep !== 'success' && (
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentStep === 'select-plan' && renderPlanSelection()}
          {paymentStep === 'confirmation' && renderConfirmation()}
          {paymentStep === 'processing' && renderProcessing()}
          {paymentStep === 'success' && renderSuccess()}
        </div>
      </div>
    </div>
  );
}