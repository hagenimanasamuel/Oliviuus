import React, { useState, useEffect, useRef } from "react";
import api from "../../../../../api/axios";
import { useTranslation } from "react-i18next";
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
  AlertCircle
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

export default function PlanChangeModal({ currentSubscription, onClose, onSuccess, t }) {
  const { t: translate } = useTranslation();
  const tFunc = t || translate;

  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradePlans, setUpgradePlans] = useState([]);
  const [upgradeCalculation, setUpgradeCalculation] = useState(null);

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
        handleSecurityViolation(tFunc('planChangeModal.security.sessionTimeout'));
      }
    }, 30000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(activityTimerRef.current);
    };
  }, [lastActivity, tFunc]);

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
        handleSecurityViolation(tFunc('planChangeModal.security.devToolsDetected'));
        return false;
      }
    };

    // Prevent right-click context menu
    measures.contextMenuListener = (e) => {
      e.preventDefault();
      handleSecurityViolation(tFunc('planChangeModal.security.contextMenuAttempt'));
      return false;
    };

    // Detect window blur (potential dev tools)
    measures.blurListener = () => {
      setTimeout(() => {
        if (document.hidden) {
          handleSecurityViolation(tFunc('planChangeModal.security.windowHidden'));
        }
      }, 1000);
    };

    // Detect dev tools by dimension difference
    measures.resizeObserver = new ResizeObserver(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > 200 || heightDiff > 200) {
        handleSecurityViolation(tFunc('planChangeModal.security.dimensionDevTools'));
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
      throw new Error(tFunc('planChangeModal.security.violationDetected'));
    }

    if (retryCount >= SECURITY_CONFIG.MAX_RETRIES) {
      throw new Error(tFunc('planChangeModal.security.maxRetries'));
    }

    try {
      setRetryCount(prev => prev + 1);
      const response = await apiFunction(...args);
      setRetryCount(0); // Reset on success
      return response;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleSecurityViolation(tFunc('planChangeModal.security.authenticationError'));
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
    secureApiCall(fetchAvailableUpgrades);
    secureApiCall(fetchUserInfo);
  }, []);

  // 🆕 Fetch available upgrades from backend
  const fetchAvailableUpgrades = async () => {
    if (securityViolation) return;

    try {
      setLoading(true);
      const response = await secureApiCall(() => api.get('/upgrade/available'));
      if (response.data.success) {
        const upgradeData = response.data.data;
        setAvailablePlans(upgradeData.availableUpgrades);
        setUpgradePlans(upgradeData.availableUpgrades);
      }
    } catch (error) {
      console.error('Error fetching available upgrades:', error);
      setErrors({ fetch: tFunc('planChangeModal.errors.fetchUpgrades') });
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Calculate upgrade cost from backend
  const calculateUpgradeCost = async (planId) => {
    if (securityViolation) return;

    try {
      const response = await secureApiCall(() => api.post('/upgrade/calculate-cost', {
        planId: planId
      }));

      if (response.data.success) {
        setUpgradeCalculation(response.data.data);
        return response.data.data.finalAmount;
      }
    } catch (error) {
      console.error('Error calculating upgrade cost:', error);
      throw error;
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

  const handlePlanSelection = async (plan) => {
    if (securityViolation) return;

    try {
      setSelectedPlan(plan);
      setPaymentStep('calculating');

      // 🆕 Calculate upgrade cost from backend
      await calculateUpgradeCost(plan.id);

      setPaymentStep('payment-details');
      setLastActivity(Date.now());
    } catch (error) {
      console.error('Error calculating upgrade:', error);
      setErrors({
        submit: error.response?.data?.message || tFunc('planChangeModal.errors.calculateCost')
      });
      setPaymentStep('select-plan');
    }
  };

  // 🛡️ SECURITY: Enhanced validation with rate limiting
  const validateForm = () => {
    if (securityViolation) return false;

    const newErrors = {};

    // Phone validation
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = tFunc('planChangeModal.validation.phoneRequired');
    } else {
      const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < SECURITY_CONFIG.MIN_PHONE_LENGTH) {
        newErrors.phoneNumber = tFunc('planChangeModal.validation.phoneInvalid');
      }
      // Check for suspicious patterns
      if (/(\d)\1{5,}/.test(cleanPhone)) {
        newErrors.phoneNumber = tFunc('planChangeModal.validation.phonePattern');
      }
    }

    // Name validation
    if (formData.customerName && formData.customerName.length < 2) {
      newErrors.customerName = tFunc('planChangeModal.validation.nameInvalid');
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

  // 🆕 Updated upgrade payment process using new backend endpoint
  const processUpgradePayment = async () => {
    if (securityViolation) {
      setErrors({ submit: tFunc('planChangeModal.security.violationRefresh') });
      return;
    }

    if (!validateForm()) return;

    setUpgrading(true);
    setPaymentStep('processing');

    try {
      const response = await secureApiCall(() => api.post('/upgrade/initiate', {
        plan_id: selectedPlan.id,
        phoneNumber: formData.phoneNumber.replace(/\D/g, ''),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
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
          // 🆕 Use upgrade-specific status polling
          startUpgradeStatusPolling(response.data.data.paymentReference);
        }
      } else {
        throw new Error(response.data.message || tFunc('planChangeModal.errors.upgradeFailed'));
      }
    } catch (error) {
      console.error('Upgrade payment failed:', error);
      setErrors({
        submit: error.response?.data?.message || tFunc('planChangeModal.errors.upgradeFailed')
      });
      setPaymentStep('payment-details');
    } finally {
      setUpgrading(false);
    }
  };

  // 🛡️ SECURITY: Generate security token
  const generateSecurityToken = () => {
    return btoa(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${navigator.userAgent.substr(0, 50)}`);
  };

  // 🆕 Updated status polling for upgrades
  const startUpgradeStatusPolling = (referenceId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await secureApiCall(() => api.get(`/upgrade/status/${referenceId}`));
        const upgradeStatus = response.data.data;

        setCurrentPayment(upgradeStatus.payment);
        setPaymentStatus(upgradeStatus.payment.status);

        if (upgradeStatus.upgradeCompleted) {
          setPaymentStep('success');
          clearInterval(pollingRef.current);
          setTimeout(() => {
            onSuccess();
          }, 3000);
        } else if (upgradeStatus.payment.status === 'failed') {
          setErrors({ submit: tFunc('planChangeModal.errors.paymentFailed') });
          setPaymentStep('payment-details');
          clearInterval(pollingRef.current);
        }
      } catch (error) {
        console.error('Upgrade status polling error:', error);
      }
    }, SECURITY_CONFIG.POLLING_INTERVAL);

    // Auto timeout
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        if (paymentStatus === 'pending') {
          setErrors({ submit: tFunc('planChangeModal.errors.paymentTimeout') });
          setPaymentStep('payment-details');
        }
      }
    }, SECURITY_CONFIG.POLLING_TIMEOUT);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
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

  const getDaysRemaining = () => {
    if (!currentSubscription) return 0;
    const end = new Date(currentSubscription.end_date);
    const now = new Date();
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 🛡️ SECURITY: Security violation screen
  if (securityViolation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {tFunc('planChangeModal.security.alertTitle')}
          </h3>
          <p className="text-gray-400 mb-6">
            {tFunc('planChangeModal.security.alertDescription')}
          </p>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {tFunc('common.close')}
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Plan Selection
  const renderPlanSelection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 border border-[#BC8BBC] rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-[#BC8BBC]" />
          <div>
            <h4 className="font-semibold text-white">
              {tFunc('planChangeModal.secureUpgrade')}
            </h4>
            <p className="text-gray-300 text-sm">
              {tFunc('planChangeModal.secureDescription')}
            </p>
          </div>
        </div>
      </div>

      {currentSubscription && (
        <div className="bg-[#BC8BBC]/10 border border-[#BC8BBC] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-[#BC8BBC]" />
            <div>
              <h4 className="font-semibold text-white">
                {tFunc('planChangeModal.currentPlanLabel')}: {currentSubscription?.subscription_name || "N/A"}
              </h4>
              <p className="text-gray-300 text-sm">
                {tFunc('planChangeModal.upgradeImmediate')}
              </p>
            </div>
          </div>
        </div>
      )}

      {upgradePlans.length === 0 ? (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
          <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h4 className="font-semibold text-yellow-400 mb-2">
            {tFunc('planChangeModal.highestPlan')}
          </h4>
          <p className="text-yellow-300 text-sm">
            {tFunc('planChangeModal.noUpgradesAvailable')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upgradePlans.map((plan) => (
            <div
              key={plan.id}
              className="border-2 border-green-500/50 hover:border-green-400 rounded-xl p-6 cursor-pointer transition-all duration-300 bg-gray-750 hover:bg-gray-700"
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
                      {tFunc('subscription.plans.standard.popular')}
                    </span>
                  )}
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                    {tFunc('planChangeModal.upgrade')}
                  </span>
                </div>
              </div>

              <p className="text-3xl font-bold text-white mb-2">
                {formatCurrency(plan.price)}
                <span className="text-gray-400 text-sm font-normal">
                  {tFunc('subscription.perMonth')}
                </span>
              </p>

              <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="w-4 h-4 text-blue-400" />
                  {tFunc('subscription.comparison.devices', {
                    count: plan.max_sessions,
                    devices: tFunc('subscription.comparison.devices')
                  })}
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Video className="w-4 h-4 text-green-400" />
                  {plan.video_quality} {tFunc('subscription.comparison.videoQuality')}
                </div>
                {plan.offline_downloads && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Download className="w-4 h-4 text-purple-400" />
                    {plan.max_downloads === -1
                      ? tFunc('subscription.comparison.unlimited')
                      : tFunc('subscription.comparison.downloadItems', { count: plan.max_downloads })
                    } {tFunc('subscription.comparison.downloads')}
                  </div>
                )}
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-green-400 text-sm font-semibold">
                  {tFunc('planChangeModal.upgradeAvailable')}
                </p>
                <p className="text-green-300 text-xs">
                  {tFunc('planChangeModal.clickToCalculate')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Step 1.5: Calculating Upgrade Cost
  const renderCalculating = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
        <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">
          {tFunc('planChangeModal.calculatingUpgrade')}
        </h3>
        <p className="text-gray-400">
          {tFunc('planChangeModal.calculatingDescription')}
        </p>
      </div>
    </div>
  );

  // Step 2: Payment Details
  const renderPaymentDetails = () => (
    <div className="space-y-6">
      <button
        onClick={() => setPaymentStep('select-plan')}
        className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {tFunc('planChangeModal.backToPlans')}
      </button>

      {/* Plan Summary */}
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{selectedPlan.name}</h3>
            <p className="text-green-400 text-sm">{tFunc('planChangeModal.planUpgrade')}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {upgradeCalculation ? formatCurrency(upgradeCalculation.finalAmount) : tFunc('planChangeModal.calculating')}
            </p>
            <p className="text-green-300 text-sm">{tFunc('planChangeModal.proratedUpgrade')}</p>
          </div>
        </div>

        {/* 🆕 Upgrade Cost Breakdown */}
        {upgradeCalculation && (
          <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <h4 className="font-semibold text-white text-sm mb-3">
              {tFunc('planChangeModal.costBreakdown')}:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">{tFunc('planChangeModal.baseUpgrade')}:</span>
                <span className="text-white">{formatCurrency(upgradeCalculation.baseUpgradeAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{tFunc('planChangeModal.operationalAdjustment')} (10%):</span>
                <span className="text-yellow-400">{formatCurrency(upgradeCalculation.adjustmentAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2">
                <span className="text-gray-300 font-semibold">{tFunc('planChangeModal.total')}:</span>
                <span className="text-green-400 font-bold">{formatCurrency(upgradeCalculation.finalAmount)}</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-3">
              {tFunc('planChangeModal.basedOnDays', { days: upgradeCalculation.daysRemaining })}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <span className="text-gray-400">{tFunc('planChangeModal.currentPlanLabel')}:</span>
            <p className="text-white">{currentSubscription.subscription_name}</p>
          </div>
          <div>
            <span className="text-gray-400">{tFunc('planChangeModal.newPlan')}:</span>
            <p className="text-white font-semibold">{selectedPlan.name}</p>
          </div>
          <div>
            <span className="text-gray-400">{tFunc('planChangeModal.effective')}:</span>
            <p className="text-white">{tFunc('planChangeModal.immediately')}</p>
          </div>
          <div>
            <span className="text-gray-400">{tFunc('planChangeModal.remainingDays')}:</span>
            <p className="text-white">{upgradeCalculation?.daysRemaining || getDaysRemaining()} {tFunc('planChangeModal.days')}</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={(e) => { e.preventDefault(); processUpgradePayment(); }} className="space-y-4">
        {/* Amount Display */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {tFunc('planChangeModal.upgradeAmount')}
          </label>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">
              {upgradeCalculation ? formatCurrency(upgradeCalculation.finalAmount) : tFunc('planChangeModal.calculating')}
            </span>
            <span className="text-gray-400 text-sm bg-gray-700 px-2 py-1 rounded">
              {tFunc('planChangeModal.serverCalculated')}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            {tFunc('planChangeModal.amountSecure')}
          </p>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {tFunc('userSubscription.paymentForm.phoneLabel')} *
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            maxLength={SECURITY_CONFIG.MAX_PHONE_LENGTH}
            className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-[#BC8BBC]'
              }`}
            placeholder={tFunc('userSubscription.paymentForm.phonePlaceholder')}
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {tFunc('userSubscription.paymentForm.nameLabel')}
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
              placeholder={tFunc('userSubscription.paymentForm.namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {tFunc('userSubscription.paymentForm.emailLabel')}
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
              <h4 className="font-semibold text-[#BC8BBC] text-sm mb-1">
                {tFunc('planChangeModal.securePayment')}
              </h4>
              <p className="text-gray-300 text-xs">
                {tFunc('planChangeModal.securityFeatures')}
              </p>
            </div>
          </div>
        </div>

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
          disabled={upgrading || securityViolation || !upgradeCalculation}
          className="w-full bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#9b69b2] hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
        >
          {upgrading ? (
            <>
              <Loader className="w-5 h-5 animate-spin mr-3" />
              {tFunc('planChangeModal.processingUpgrade')}
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              {tFunc('planChangeModal.securePaymentUpgrade')}
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
        <h3 className="text-xl font-bold text-white mb-2">
          {tFunc('planChangeModal.processingUpgradeTitle')}
        </h3>
        <p className="text-gray-400">
          {tFunc('planChangeModal.processingDescription')}
        </p>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          {tFunc('planChangeModal.processingFeatures')}
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
        <h3 className="text-xl font-bold text-white mb-2">
          {tFunc('planChangeModal.upgradeSuccessful')} 🎉
        </h3>
        <p className="text-gray-400">
          {tFunc('planChangeModal.upgradeSuccessDescription', { plan: selectedPlan.name })}
        </p>
      </div>
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <p className="text-green-300 text-sm">
          {tFunc('planChangeModal.successFeatures')}
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
            <h3 className="text-lg font-semibold text-white">
              {tFunc('planChangeModal.loadingUpgradeOptions')}
            </h3>
            <p className="text-gray-400 text-center">
              {tFunc('planChangeModal.fetchingUpgradePlans')}
            </p>
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
                {paymentStep === 'select-plan' && tFunc('planChangeModal.title')}
                {paymentStep === 'calculating' && tFunc('planChangeModal.calculatingUpgrade')}
                {paymentStep === 'payment-details' && tFunc('planChangeModal.completeUpgrade')}
                {paymentStep === 'processing' && tFunc('planChangeModal.processingUpgradeTitle')}
                {paymentStep === 'success' && tFunc('planChangeModal.upgradeSuccessful')}
              </h3>
              <p className="text-gray-400 mt-1">
                {paymentStep === 'select-plan' && tFunc('planChangeModal.subtitle')}
                {paymentStep === 'calculating' && tFunc('planChangeModal.calculatingDescription')}
                {paymentStep === 'payment-details' && tFunc('planChangeModal.paymentDescription')}
                {paymentStep === 'processing' && tFunc('planChangeModal.processingDescription')}
                {paymentStep === 'success' && tFunc('planChangeModal.successDescription')}
              </p>
            </div>
            {paymentStep !== 'success' && paymentStep !== 'calculating' && (
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
          {paymentStep === 'calculating' && renderCalculating()}
          {paymentStep === 'payment-details' && renderPaymentDetails()}
          {paymentStep === 'processing' && renderProcessing()}
          {paymentStep === 'success' && renderSuccess()}
        </div>
      </div>
    </div>
  );
}