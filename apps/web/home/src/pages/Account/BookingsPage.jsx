// src/pages/Account/pages/BookingsPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar, 
  Home, 
  MapPin, 
  Check, 
  X, 
  Clock,
  DollarSign,
  User,
  Phone,
  Mail,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle,
  CheckCircle,
  XCircle,
  Sun,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Send,
  AlertTriangle,
  Info,
  Wallet,
  CreditCard,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format, differenceInDays, parseISO, differenceInHours } from 'date-fns';

// ============================================
// ERROR TOAST STYLES
// ============================================
const showError = (title, message, details = null, retryAction = null) => {
  toast.error(
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-800">{title}</p>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {details && (
            <p className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded">
              {details}
            </p>
          )}
          {retryAction && (
            <button
              onClick={retryAction}
              className="mt-3 px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>,
    {
      duration: 8000,
      style: {
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        padding: '16px'
      },
      icon: null
    }
  );
};

const showSuccess = (title, message, details = null) => {
  toast.success(
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-800">{title}</p>
          <p className="text-sm text-green-700 mt-1">{message}</p>
          {details && (
            <div className="mt-2 text-xs text-green-600 bg-green-100 p-2 rounded">
              {details}
            </div>
          )}
        </div>
      </div>
    </div>,
    {
      duration: 6000,
      style: {
        background: '#dcfce7',
        border: '1px solid #bbf7d0',
        borderRadius: '12px',
        padding: '16px'
      },
      icon: null
    }
  );
};

const showInfo = (title, message) => {
  toast(
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-blue-800">{title}</p>
          <p className="text-sm text-blue-700 mt-1">{message}</p>
        </div>
      </div>
    </div>,
    {
      duration: 5000,
      style: {
        background: '#dbeafe',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        padding: '16px'
      },
      icon: null
    }
  );
};

// ============================================
// NETWORK STATUS COMPONENT
// ============================================
const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      showError(
        'You are offline',
        'Please check your internet connection',
        'Some features may not be available'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm">
        <WifiOff size={16} />
        <span>You are currently offline. Please check your internet connection.</span>
      </div>
    );
  }

  return null;
};

// ============================================
// CANCEL MODAL COMPONENT
// ============================================
const CancelModal = ({ isOpen, onClose, onConfirm, booking, loading }) => {
  const [reason, setReason] = useState('');
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState('');
  const [refundDetails, setRefundDetails] = useState({
    tenantRefund: 0,
    tenantPercentage: 0,
    landlordKept: 0,
    landlordPercentage: 0,
    platformKept: 0,
    policy: 'moderate',
    hoursUntilCheckIn: 0
  });

  const cancelReasons = [
    { id: 'changed_plans', label: 'Changed my plans', icon: '📅' },
    { id: 'found_better', label: 'Found a better property', icon: '🏠' },
    { id: 'financial', label: 'Financial constraints', icon: '💰' },
    { id: 'landlord_issue', label: 'Issue with landlord', icon: '🤝' },
    { id: 'property_issue', label: 'Issue with property', icon: '🔧' },
    { id: 'booking_mistake', label: 'Booking mistake', icon: '❌' },
    { id: 'other', label: 'Other reason', icon: '💬' }
  ];

  // Calculate refund based on policy
  useEffect(() => {
    if (!booking) return;

    const checkInDate = new Date(booking.dates.start);
    const now = new Date();
    const hoursUntilCheckIn = Math.max(0, Math.floor((checkInDate - now) / (1000 * 60 * 60)));
    const policy = booking.cancellation_policy || 'moderate';
    const amount = booking.amount || 0;
    
    let tenantPercentage = 0;
    let landlordPercentage = 0;

    switch (policy) {
      case 'flexible':
        if (hoursUntilCheckIn >= 24) {
          tenantPercentage = 90;
          landlordPercentage = 0;
        } else {
          tenantPercentage = 45;
          landlordPercentage = 45;
        }
        break;
        
      case 'moderate':
        if (hoursUntilCheckIn >= 48) {
          tenantPercentage = 90;
          landlordPercentage = 0;
        } else if (hoursUntilCheckIn >= 24) {
          tenantPercentage = 45;
          landlordPercentage = 45;
        } else {
          tenantPercentage = 0;
          landlordPercentage = 90;
        }
        break;
        
      case 'strict':
        if (hoursUntilCheckIn >= 48) {
          tenantPercentage = 45;
          landlordPercentage = 45;
        } else {
          tenantPercentage = 0;
          landlordPercentage = 90;
        }
        break;
        
      default:
        if (hoursUntilCheckIn >= 48) {
          tenantPercentage = 90;
          landlordPercentage = 0;
        } else if (hoursUntilCheckIn >= 24) {
          tenantPercentage = 45;
          landlordPercentage = 45;
        } else {
          tenantPercentage = 0;
          landlordPercentage = 90;
        }
    }

    const platformKept = amount * 0.10;
    const tenantRefund = amount * (tenantPercentage / 100);
    const landlordKept = amount * (landlordPercentage / 100);

    setRefundDetails({
      tenantRefund,
      tenantPercentage,
      landlordKept,
      landlordPercentage,
      platformKept,
      policy,
      hoursUntilCheckIn
    });
  }, [booking]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!selectedReason && !reason) {
        showError(
          'Reason Required',
          'Please select or enter a reason for cancellation'
        );
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onClose();
    }
  };

  const handleConfirm = () => {
    const finalReason = selectedReason === 'other' ? reason : cancelReasons.find(r => r.id === selectedReason)?.label;
    onConfirm(finalReason || reason);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Cancel Booking
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Step {step} of 2: {step === 1 ? 'Tell us why' : 'Confirm cancellation'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          ></div>
        </div>

        <div className="p-6">
          {step === 1 ? (
            // Step 1: Select Reason
            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  {booking?.property?.image ? (
                    <img 
                      src={booking.property.image} 
                      alt={booking.property.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Home className="h-8 w-8 text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {booking?.property?.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(booking?.dates?.start), 'MMM d')} - {format(parseISO(booking?.dates?.end), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total amount</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(booking?.amount)}</span>
                </div>
              </div>

              {/* Reason Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Why are you cancelling? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {cancelReasons.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedReason(r.id);
                        if (r.id !== 'other') {
                          setReason('');
                        }
                      }}
                      className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${
                        selectedReason === r.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                      }`}
                    >
                      <span className="text-xl">{r.icon}</span>
                      <span className="flex-1 text-left text-sm font-medium text-gray-900">
                        {r.label}
                      </span>
                      {selectedReason === r.id && (
                        <Check className="h-5 w-5 text-red-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason */}
              {selectedReason === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify your reason
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us why you're cancelling..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent resize-none"
                  />
                </div>
              )}

              {/* Cancellation Policy Info */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      {refundDetails.policy.charAt(0).toUpperCase() + refundDetails.policy.slice(1)} Cancellation Policy
                    </h4>
                    <p className="text-sm text-blue-700">
                      {refundDetails.hoursUntilCheckIn} hours until check-in. 
                      Based on the policy, you'll see your refund amount in the next step.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Step 2: Confirmation
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Are you sure?
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone. Once cancelled, you'll need to make a new booking if you change your mind.
                </p>
              </div>

              {/* Refund Summary */}
              <div className="p-4 bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10 rounded-xl border border-[#BC8BBC]/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Refund Summary</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    refundDetails.policy === 'flexible' ? 'bg-green-100 text-green-700' :
                    refundDetails.policy === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {refundDetails.policy.toUpperCase()} POLICY
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Booking amount</span>
                    <span className="font-medium text-gray-900">{formatCurrency(booking?.amount)}</span>
                  </div>
                  
                  {refundDetails.tenantRefund > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">You'll receive</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(refundDetails.tenantRefund)} ({refundDetails.tenantPercentage}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Landlord keeps</span>
                        <span className="text-gray-600">
                          {formatCurrency(refundDetails.landlordKept)} ({refundDetails.landlordPercentage}%)
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Landlord keeps</span>
                      <span className="font-semibold text-orange-600">
                        {formatCurrency(refundDetails.landlordKept)} ({refundDetails.landlordPercentage}%)
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Platform fee</span>
                    <span className="text-gray-600">{formatCurrency(refundDetails.platformKept)} (10%)</span>
                  </div>
                  
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900">Net to you</span>
                      <span className={refundDetails.tenantRefund > 0 ? 'text-[#BC8BBC]' : 'text-red-600'}>
                        {refundDetails.tenantRefund > 0 ? formatCurrency(refundDetails.tenantRefund) : 'No refund'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason Summary */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Reason:</span> {selectedReason === 'other' ? reason : cancelReasons.find(r => r.id === selectedReason)?.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Hours until check-in: {refundDetails.hoursUntilCheckIn}
                </p>
              </div>

              {/* Warning */}
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>This will cancel your booking immediately. You may lose access to the property.</span>
                </div>
              </div>

              {/* Next Steps if refund applies */}
              {refundDetails.tenantRefund > 0 && (
                <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Wallet className="h-4 w-4 flex-shrink-0" />
                    <span>Your refund will be credited to your balance. Go to Account {'>'} Payments to withdraw.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              {step === 1 ? 'Close' : 'Back'}
            </button>
            
            {step === 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2.5 bg-[#BC8BBC] text-white rounded-xl font-medium hover:bg-[#8A5A8A] transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Cancel Booking
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CHECK-IN INFO MODAL
// ============================================
const CheckInInfoModal = ({ isOpen, onClose, onConfirm, booking }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const startDate = parseISO(booking?.dates?.start);
  const today = new Date();
  const isEarly = startDate > today;
  const isOnTime = startDate.toDateString() === today.toDateString();
  const isLate = startDate < today;
  const daysLate = isLate ? differenceInDays(today, startDate) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isEarly ? 'bg-blue-100' : isOnTime ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {isEarly ? (
                <Clock className="h-10 w-10 text-blue-600" />
              ) : isOnTime ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : (
                <AlertCircle className="h-10 w-10 text-yellow-600" />
              )}
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isEarly ? 'Early Check-in' : isOnTime ? 'Ready to Check In' : 'Late Check-in'}
            </h3>
            
            <p className="text-sm text-gray-600">
              {isEarly 
                ? `You're checking in early. Check-in is officially available from ${format(startDate, 'MMM d, yyyy')}.`
                : isOnTime
                ? "You're checking in on your scheduled start date. Ready to begin your stay?"
                : `You're checking in ${daysLate} day${daysLate > 1 ? 's' : ''} late. A late fee may apply.`
              }
            </p>
          </div>

          {/* What happens when you check in */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#BC8BBC]" />
              What happens when you check in:
            </h4>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Booking status changes from <span className="font-medium">Confirmed</span> to <span className="font-medium">Active</span></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Payment of <span className="font-medium">{formatCurrency(booking?.amount)}</span> is transferred to the landlord</span>
              </li>
              {daysLate > 0 && (
                <li className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Late fee of <span className="font-medium">{daysLate * 5000} RWF</span> may apply (based on property rules)</span>
                </li>
              )}
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">You can now access the property and start your stay</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Check-out will be available on <span className="font-medium">{format(parseISO(booking?.dates?.end), 'MMM d, yyyy')}</span></span>
              </li>
            </ul>
          </div>

          {/* Warning for early check-in */}
          {isEarly && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Note:</p>
                  <p>You're checking in early. While you can complete the check-in process now, the property may not be ready until your official start date. Please coordinate with the landlord.</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-[#BC8BBC] text-white rounded-lg font-medium hover:bg-[#8A5A8A] transition-colors"
            >
              Proceed to Check In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CHECK-OUT INFO MODAL
// ============================================
const CheckOutInfoModal = ({ isOpen, onClose, onConfirm, booking }) => {
  if (!isOpen) return null;

  const endDate = parseISO(booking?.dates?.end);
  const today = new Date();
  const isEarly = endDate > today;
  const isOnTime = endDate.toDateString() === today.toDateString();
  const isOverdue = endDate < today;
  const daysOverdue = isOverdue ? differenceInDays(today, endDate) : 0;
  const daysRemaining = isEarly ? differenceInDays(endDate, today) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isEarly ? 'bg-blue-100' : isOnTime ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isEarly ? (
                <Clock className="h-10 w-10 text-blue-600" />
              ) : isOnTime ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : (
                <AlertCircle className="h-10 w-10 text-red-600" />
              )}
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isEarly ? 'Early Check-out' : isOnTime ? 'Ready to Check Out' : 'Overdue Check-out'}
            </h3>
            
            <p className="text-sm text-gray-600">
              {isEarly 
                ? `You're checking out ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} early.`
                : isOnTime
                ? "You're checking out on your scheduled end date. Thank you for staying with us!"
                : `Your check-out is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue.`
              }
            </p>
          </div>

          {/* What happens when you check out */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#BC8BBC]" />
              What happens when you check out:
            </h4>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Booking status changes from <span className="font-medium">Active</span> to <span className="font-medium">Completed</span></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Your stay is officially ended</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">You can leave a review for the property</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Any security deposit will be processed within 7 days</span>
              </li>
            </ul>
          </div>

          {/* Warning for early check-out */}
          {isEarly && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Early check-out note:</p>
                  <p>You're checking out before your scheduled end date. Please ensure you've coordinated with the landlord and returned all keys/access cards.</p>
                </div>
              </div>
            </div>
          )}

          {/* Overdue warning */}
          {isOverdue && (
            <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">Overdue check-out:</p>
                  <p>Your check-out is overdue by {daysOverdue} day{daysOverdue > 1 ? 's' : ''}. Please check out as soon as possible to avoid additional charges.</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-[#BC8BBC] text-white rounded-lg font-medium hover:bg-[#8A5A8A] transition-colors"
            >
              Proceed to Check Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXTENSION MODAL
// ============================================
const ExtensionModal = ({ isOpen, onClose, onConfirm, booking, loading }) => {
  const [periods, setPeriods] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pricePerPeriod, setPricePerPeriod] = useState(0);

  useEffect(() => {
    if (!booking) return;

    let price = 0;
    switch (booking.period) {
      case 'monthly':
        price = booking.property?.price?.monthly || 0;
        break;
      case 'weekly':
        price = booking.property?.price?.weekly || 0;
        break;
      case 'daily':
        price = booking.property?.price?.daily || 0;
        break;
      default:
        price = 0;
    }

    setPricePerPeriod(price);
    setTotalAmount(price * periods);
  }, [booking, periods]);

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const currentEndDate = parseISO(booking?.dates?.end);
  const newEndDate = new Date(currentEndDate);

  switch (booking?.period) {
    case 'monthly':
      newEndDate.setMonth(newEndDate.getMonth() + periods);
      break;
    case 'weekly':
      newEndDate.setDate(newEndDate.getDate() + (periods * 7));
      break;
    case 'daily':
      newEndDate.setDate(newEndDate.getDate() + periods);
      break;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#BC8BBC]" />
              Extend Stay
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Current booking info */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Current end date</p>
              <p className="font-semibold text-gray-900">{format(currentEndDate, 'MMMM d, yyyy')}</p>
            </div>

            {/* Period selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of additional {booking?.period}(s)
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPeriods(Math.max(1, periods - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <X size={16} />
                </button>
                <span className="flex-1 text-center font-semibold text-lg">{periods}</span>
                <button
                  onClick={() => setPeriods(periods + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <span className="text-lg">+</span>
                </button>
              </div>
            </div>

            {/* New end date */}
            <div className="p-4 bg-[#BC8BBC]/10 rounded-xl border border-[#BC8BBC]/20">
              <p className="text-sm text-gray-600 mb-1">New end date</p>
              <p className="font-bold text-lg text-[#BC8BBC]">{format(newEndDate, 'MMMM d, yyyy')}</p>
            </div>

            {/* Cost breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price per {booking?.period}</span>
                <span className="font-medium">{formatCurrency(pricePerPeriod)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Number of periods</span>
                <span className="font-medium">{periods}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total additional</span>
                <span className="text-[#BC8BBC]">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Info note */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Your extension request will be sent to the landlord for approval. 
                  You'll be notified once they respond.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(periods)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-[#BC8BBC] text-white rounded-lg font-medium hover:bg-[#8A5A8A] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// BOOKING CARD SKELETON
// ============================================
const BookingCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="flex flex-col md:flex-row">
      <div className="md:w-48 h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
      <div className="flex-1 p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// STATUS BADGE COMPONENT
// ============================================
const StatusBadge = ({ status }) => {
  const statusConfig = {
    'pending': {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: <Clock className="h-3 w-3" />,
      label: 'Pending'
    },
    'confirmed': {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: <Check className="h-3 w-3" />,
      label: 'Confirmed'
    },
    'active': {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: <Sun className="h-3 w-3" />,
      label: 'Active'
    },
    'completed': {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      icon: <CheckCircle className="h-3 w-3" />,
      label: 'Completed'
    },
    'cancelled': {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: <XCircle className="h-3 w-3" />,
      label: 'Cancelled'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ============================================
// QUICK STATS COMPONENT
// ============================================
const QuickStats = ({ counts }) => {
  const stats = [
    {
      label: 'Total Bookings',
      value: counts.total,
      icon: <Calendar className="h-5 w-5 text-[#BC8BBC]" />,
      bg: 'bg-[#BC8BBC]/10'
    },
    {
      label: 'Active Stays',
      value: counts.active,
      icon: <Sun className="h-5 w-5 text-green-600" />,
      bg: 'bg-green-50'
    },
    {
      label: 'Upcoming',
      value: counts.upcoming_checkins,
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      bg: 'bg-blue-50'
    },
    {
      label: 'Completed',
      value: counts.completed,
      icon: <CheckCircle className="h-5 w-5 text-gray-600" />,
      bg: 'bg-gray-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">{stat.label}</span>
            {stat.icon}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

// ============================================
// BOOKING CARD COMPONENT
// ============================================
const BookingCard = ({ booking, userRole, onViewDetails, onAction, onMessage }) => {
  const navigate = useNavigate();
  
  const isTenant = userRole === 'tenant';
  const otherParty = isTenant ? booking.landlord : booking.tenant;
  
  const startDate = parseISO(booking.dates.start);
  const endDate = parseISO(booking.dates.end);
  const today = new Date();
  
  // Set times to midnight for date comparison
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  
  const startDateMidnight = new Date(startDate);
  startDateMidnight.setHours(0, 0, 0, 0);
  
  const daysUntilStart = differenceInDays(startDateMidnight, todayMidnight);
  const daysUntilEnd = differenceInDays(endDate, today);
  const isActive = booking.status === 'active';
  const isUpcoming = booking.status === 'confirmed' && daysUntilStart > 0;
  const isOngoing = isActive && daysUntilEnd >= 0;
  const isOverdue = isActive && daysUntilEnd < 0;
  
  // Check-in is available from 00:00 on the start date onwards
  const canCheckIn = booking.status === 'confirmed' && daysUntilStart <= 0 && isTenant;
  
  // Check if check-in is in the future (button will be disabled)
  const isCheckInFuture = booking.status === 'confirmed' && daysUntilStart > 0 && isTenant;
  
  // Format the available check-in time
  const getCheckInAvailabilityText = () => {
    if (daysUntilStart === 1) {
      return 'Available tomorrow';
    } else if (daysUntilStart > 1) {
      return `Available in ${daysUntilStart} days`;
    } else if (daysUntilStart === 0) {
      return 'Available now';
    }
    return '';
  };

  const getStatusMessage = () => {
    if (isOverdue) return 'Check-out overdue';
    if (isOngoing) return `Check-out in ${daysUntilEnd} days`;
    if (isUpcoming) return `Check-in in ${daysUntilStart} days`;
    if (booking.status === 'pending') return 'Awaiting confirmation';
    if (booking.status === 'completed') return 'Stay completed';
    if (booking.status === 'cancelled') return 'Cancelled';
    return null;
  };

  const canCheckOut = booking.status === 'active' && isTenant;
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const canExtend = booking.status === 'active' && isTenant;

  // Navigate to messages with landlord UUID and property UUID
  const handleMessageClick = (e) => {
    e.stopPropagation();
    if (onMessage) {
      onMessage(booking);
    } else {
      const landlordUid = booking.landlord?.id || '';
      const propertyUid = booking.property?.id || '';
      const defaultMessage = `Hi, I'm referring to booking ${booking.reference || booking.id}. Can we discuss?`;
      const encodedMessage = encodeURIComponent(defaultMessage);
      navigate(`/account/messages?landlord=${landlordUid}&property=${propertyUid}&draft=${encodedMessage}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#BC8BBC] hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Property Image */}
        <div 
          className="md:w-48 h-48 relative cursor-pointer group"
          onClick={() => navigate(`/properties/${booking.property.id}`)}
        >
          {booking.property.image ? (
            <img 
              src={booking.property.image} 
              alt={booking.property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] flex items-center justify-center">
              <Home className="h-12 w-12 text-[#BC8BBC]/50" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white text-sm font-medium flex items-center gap-1">
              View Property <ExternalLink size={14} />
            </span>
          </div>
        </div>

        {/* Booking Details */}
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <h3 
                className="font-semibold text-gray-900 hover:text-[#BC8BBC] cursor-pointer transition-colors"
                onClick={() => navigate(`/properties/${booking.property.id}`)}
              >
                {booking.property.title}
              </h3>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <MapPin size={14} className="text-[#BC8BBC]" />
                {booking.property.location.district} • {booking.property.location.sector}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <StatusBadge status={booking.status} />
              <button 
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => onViewDetails(booking)}
              >
                <MoreVertical size={18} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#BC8BBC]" />
              <span className="text-gray-700">
                {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#BC8BBC]" />
              <span className="text-gray-700">
                {booking.dates.duration} {booking.period}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-[#BC8BBC]" />
              <span className="font-semibold text-gray-900">
                {new Intl.NumberFormat('en-RW', {
                  style: 'currency',
                  currency: 'RWF',
                  minimumFractionDigits: 0
                }).format(booking.amount)}
              </span>
            </div>
          </div>

          {/* Status Message */}
          {getStatusMessage() && (
            <div className={`mb-3 text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full ${
              isOverdue ? 'bg-red-50 text-red-700' : 'bg-[#BC8BBC]/10 text-[#8A5A8A]'
            }`}>
              <AlertCircle size={12} />
              {getStatusMessage()}
            </div>
          )}

          {/* Other Party Info */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {otherParty.avatar ? (
                <img 
                  src={otherParty.avatar} 
                  alt={otherParty.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#BC8BBC]/10 flex items-center justify-center">
                  <User size={14} className="text-[#BC8BBC]" />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">{isTenant ? 'Landlord' : 'Tenant'}</p>
                <p className="text-sm font-medium text-gray-900">{otherParty.name}</p>
              </div>
            </div>
            
            {otherParty.phone && (
              <a 
                href={`tel:${otherParty.phone}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={16} className="text-gray-600" />
              </a>
            )}
            
            {otherParty.email && (
              <a 
                href={`mailto:${otherParty.email}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail size={16} className="text-gray-600" />
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {/* Message Button */}
            <button
              onClick={handleMessageClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:text-[#BC8BBC] border border-gray-200 rounded-lg hover:border-[#BC8BBC] transition-colors group"
            >
              <MessageSquare size={14} className="group-hover:text-[#BC8BBC]" />
              Message {isTenant ? 'Landlord' : 'Tenant'}
              <Send size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            {/* Check-in Button - Always visible but disabled when not available */}
            {isTenant && booking.status === 'confirmed' && (
              <div className="relative group">
                <button
                  onClick={() => canCheckIn && onAction('check-in', booking)}
                  disabled={!canCheckIn}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all
                    ${canCheckIn 
                      ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  <Check size={14} />
                  Check In
                  {!canCheckIn && (
                    <span className="ml-1 text-xs opacity-75">
                      ({getCheckInAvailabilityText()})
                    </span>
                  )}
                </button>
                
                {/* Tooltip for disabled state */}
                {!canCheckIn && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      Check-in available from {format(startDate, 'MMM d, yyyy')}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {canCheckOut && (
              <button
                onClick={() => onAction('check-out', booking)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check size={14} />
                Check Out
              </button>
            )}
            
            {canExtend && (
              <button
                onClick={() => onAction('extend', booking)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Calendar size={14} />
                Extend
              </button>
            )}
            
            {canCancel && (
              <button
                onClick={() => onAction('cancel', booking)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================
const EmptyState = ({ navigate }) => (
  <div className="text-center py-16">
    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] flex items-center justify-center">
      <Calendar className="h-10 w-10 text-[#BC8BBC]" />
    </div>
    
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      No bookings yet
    </h3>
    
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      You haven't made any bookings yet. Start by exploring properties!
    </p>
    
    <button
      onClick={() => navigate('/properties')}
      className="bg-[#BC8BBC] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#8A5A8A] transition-colors"
    >
      Browse Properties
    </button>
  </div>
);

// ============================================
// MAIN BOOKINGS PAGE COMPONENT
// ============================================
export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    upcoming_checkins: 0,
    current_stays: 0,
    overdue_checkouts: 0,
    pending_payments: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
    has_more: false
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCheckInInfoModal, setShowCheckInInfoModal] = useState(false);
  const [showCheckOutInfoModal, setShowCheckOutInfoModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [bookingToCheckIn, setBookingToCheckIn] = useState(null);
  const [bookingToCheckOut, setBookingToCheckOut] = useState(null);
  const [bookingToExtend, setBookingToExtend] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();
  const observer = useRef();

  // ============================================
  // FETCH BOOKINGS
  // ============================================
  const fetchBookings = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        status: 'all',
        role: 'all'
      });

      const response = await api.get(`/isanzure/user/bookings?${params}`);

      if (response.data.success) {
        const newBookings = response.data.data.bookings || [];
        
        setBookings(prev => 
          append ? [...prev, ...newBookings] : newBookings
        );
        
        setCounts(response.data.data.counts);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      
      if (error.response?.status === 401) {
        showError(
          'Authentication Required',
          'Please login to view your bookings',
          error.response.data?.message || 'Your session may have expired'
        );
        navigate('/login');
      } else if (error.code === 'ERR_NETWORK') {
        showError(
          'Network Error',
          'Unable to connect to the server',
          'Please check your internet connection and try again',
          () => fetchBookings(pageNum, append)
        );
      } else {
        showError(
          'Failed to Load Bookings',
          error.response?.data?.message || 'An unexpected error occurred',
          error.response?.data?.code || 'Please try again later',
          () => fetchBookings(pageNum, append)
        );
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ============================================
  // LOAD MORE FOR INFINITE SCROLL
  // ============================================
  const loadMore = useCallback(() => {
    if (pagination.has_more && !loadingMore) {
      fetchBookings(pagination.page + 1, true);
    }
  }, [pagination.has_more, loadingMore, pagination.page]);

  // ============================================
  // INFINITE SCROLL OBSERVER
  // ============================================
  const lastItemRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && pagination.has_more) {
        loadMore();
      }
    }, { rootMargin: '100px' });

    if (node) observer.current.observe(node);
  }, [loadingMore, pagination.has_more, loadMore]);

  // ============================================
  // HANDLE MESSAGE NAVIGATION
  // ============================================
  const handleMessage = (booking) => {
    const landlordUid = booking.landlord?.id || '';
    const propertyUid = booking.property?.id || '';
    const bookingRef = booking.reference || booking.id;
    
    const defaultMessage = `Hi, I'm referring to booking ${bookingRef} for ${booking.property.title}. Can we discuss?`;
    const encodedMessage = encodeURIComponent(defaultMessage);
    
    navigate(`/account/messages?landlord=${landlordUid}&property=${propertyUid}&draft=${encodedMessage}`);
  };

  // ============================================
  // HANDLE BOOKING ACTIONS
  // ============================================
  const handleAction = async (action, booking) => {
    switch (action) {
      case 'check-in':
        setBookingToCheckIn(booking);
        setShowCheckInInfoModal(true);
        break;

      case 'check-out':
        setBookingToCheckOut(booking);
        setShowCheckOutInfoModal(true);
        break;

      case 'extend':
        setBookingToExtend(booking);
        setShowExtensionModal(true);
        break;

      case 'cancel':
        setBookingToCancel(booking);
        setShowCancelModal(true);
        break;

      default:
        return;
    }
  };

  // ============================================
  // HANDLE CHECK-IN CONFIRMATION
  // ============================================
  const handleCheckInConfirm = async () => {
    if (!bookingToCheckIn) return;

    const checkInToast = toast.loading('Processing check-in...', {
      icon: '🏨',
      style: { background: '#f3e8f3', color: '#4a1d4a' }
    });
    
    try {
      setActionLoading(true);
      setShowCheckInInfoModal(false);
      
      const response = await api.post(`/isanzure/user/bookings/${bookingToCheckIn.id}/check-in`);
      
      toast.dismiss(checkInToast);
      
      showSuccess(
        'Check-in Successful! 🎉',
        `Welcome to your stay at ${bookingToCheckIn.property.title}`,
        response.data.data?.payment && (
          <div className="mt-1">
            <p>Payment transferred to landlord: RWF {response.data.data.payment.landlord_received?.toLocaleString() || 0}</p>
            {response.data.data.payment?.late_fee > 0 && (
              <p className="text-yellow-600">Late fee applied: RWF {response.data.data.payment.late_fee.toLocaleString()}</p>
            )}
          </div>
        )
      );
      
      fetchBookings(1);
    } catch (error) {
      toast.dismiss(checkInToast);
      
      if (error.response?.status === 400) {
        const errorCode = error.response.data?.code;
        
        switch (errorCode) {
          case 'TOO_EARLY':
            showError(
              'Cannot Check In Yet',
              `Check-in is only available from ${format(parseISO(error.response.data.start_date), 'MMM d, yyyy')}`,
              'You can check in on or after your start date'
            );
            break;
            
          case 'INVALID_STATUS':
            showError(
              'Cannot Check In',
              `Current status: ${error.response.data.current_status}`,
              'Only confirmed bookings can check in'
            );
            break;
            
          case 'BOOKING_NOT_FOUND':
            showError(
              'Booking Not Found',
              'This booking no longer exists or you don\'t have permission',
              error.response.data?.message
            );
            break;
            
          default:
            showError(
              'Check-in Failed',
              error.response.data?.message || 'An unexpected error occurred',
              error.response.data?.code,
              () => handleCheckInConfirm()
            );
        }
      } else if (error.code === 'ERR_NETWORK') {
        showError(
          'Network Error',
          'Unable to connect to the server',
          'Please check your internet connection',
          () => handleCheckInConfirm()
        );
      } else {
        showError(
          'Check-in Failed',
          'An unexpected error occurred',
          error.message,
          () => handleCheckInConfirm()
        );
      }
    } finally {
      setActionLoading(false);
      setBookingToCheckIn(null);
    }
  };

  // ============================================
  // HANDLE CHECK-OUT CONFIRMATION
  // ============================================
  const handleCheckOutConfirm = async () => {
    if (!bookingToCheckOut) return;

    const checkOutToast = toast.loading('Processing check-out...', {
      icon: '👋',
      style: { background: '#f3e8f3', color: '#4a1d4a' }
    });
    
    try {
      setActionLoading(true);
      setShowCheckOutInfoModal(false);
      
      await api.post(`/isanzure/user/bookings/${bookingToCheckOut.id}/check-out`);
      
      toast.dismiss(checkOutToast);
      
      showSuccess(
        'Check-out Successful! 👋',
        `Hope you enjoyed your stay at ${bookingToCheckOut.property.title}`,
        'Leave a review to help other tenants'
      );
      
      fetchBookings(1);
    } catch (error) {
      toast.dismiss(checkOutToast);
      
      if (error.response?.status === 400) {
        const errorCode = error.response.data?.code;
        
        switch (errorCode) {
          case 'INVALID_STATUS':
            showError(
              'Cannot Check Out',
              `Current status: ${error.response.data.current_status}`,
              'Only active bookings can check out'
            );
            break;
            
          default:
            showError(
              'Check-out Failed',
              error.response.data?.message || 'Failed to check out',
              error.response.data?.code,
              () => handleCheckOutConfirm()
            );
        }
      } else if (error.code === 'ERR_NETWORK') {
        showError(
          'Network Error',
          'Unable to connect to the server',
          'Please check your internet connection',
          () => handleCheckOutConfirm()
        );
      } else {
        showError(
          'Check-out Failed',
          'An unexpected error occurred',
          error.message,
          () => handleCheckOutConfirm()
        );
      }
    } finally {
      setActionLoading(false);
      setBookingToCheckOut(null);
    }
  };

  // ============================================
  // HANDLE EXTENSION REQUEST
  // ============================================
  const handleExtensionRequest = async (periods) => {
    if (!bookingToExtend) return;

    const extensionToast = toast.loading('Sending extension request...', {
      icon: '📅',
      style: { background: '#f3e8f3', color: '#4a1d4a' }
    });
    
    try {
      setActionLoading(true);
      setShowExtensionModal(false);
      
      const response = await api.post(`/isanzure/user/bookings/${bookingToExtend.id}/extend`, {
        additional_periods: periods
      });
      
      toast.dismiss(extensionToast);
      
      showSuccess(
        'Extension Request Sent!',
        `Your request to extend by ${periods} ${bookingToExtend.period}(s) has been sent to the landlord`,
        response.data.data?.new_end_date && (
          <p>New proposed end date: {format(parseISO(response.data.data.new_end_date), 'MMM d, yyyy')}</p>
        )
      );
      
      fetchBookings(1);
    } catch (error) {
      toast.dismiss(extensionToast);
      
      if (error.response?.status === 400) {
        showError(
          'Extension Request Failed',
          error.response.data?.message || 'Invalid request',
          error.response.data?.code,
          () => handleExtensionRequest(periods)
        );
      } else if (error.code === 'ERR_NETWORK') {
        showError(
          'Network Error',
          'Unable to connect to the server',
          'Please check your internet connection',
          () => handleExtensionRequest(periods)
        );
      } else {
        showError(
          'Extension Request Failed',
          'An unexpected error occurred',
          error.message,
          () => handleExtensionRequest(periods)
        );
      }
    } finally {
      setActionLoading(false);
      setBookingToExtend(null);
    }
  };

  // ============================================
  // HANDLE CANCEL CONFIRMATION
  // ============================================
  const handleCancelConfirm = async (reason) => {
    if (!bookingToCancel) return;

    const cancelToast = toast.loading('Processing cancellation...', {
      icon: '⏳',
      style: { background: '#f3e8f3', color: '#4a1d4a' }
    });

    try {
      setActionLoading(true);
      setShowCancelModal(false);
      
      const response = await api.post(`/isanzure/user/bookings/${bookingToCancel.id}/cancel`, { reason });
      
      toast.dismiss(cancelToast);
      
      if (response.data.data?.refund?.amount > 0) {
        showSuccess(
          'Booking Cancelled Successfully',
          `Refund of ${new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0
          }).format(response.data.data.refund.amount)} will be credited to your balance`,
          response.data.data.refund.pending_released > 0 
            ? `Pending amount released: RWF ${response.data.data.refund.pending_released.toLocaleString()}`
            : null
        );
      } else {
        showInfo(
          'Booking Cancelled',
          response.data.message || 'Booking cancelled successfully'
        );
      }
      
      fetchBookings(1);
    } catch (error) {
      toast.dismiss(cancelToast);
      
      if (error.response?.status === 400) {
        const errorCode = error.response.data?.code;
        
        switch (errorCode) {
          case 'BOOKING_NOT_FOUND':
            showError(
              'Cannot Cancel',
              'Booking not found or cannot be cancelled at this time',
              'It may have already been cancelled or completed'
            );
            break;
            
          case 'ALREADY_CANCELLED':
            showError(
              'Already Cancelled',
              'This booking has already been cancelled',
              'Refresh the page to see the updated status'
            );
            break;
            
          default:
            showError(
              'Cancellation Failed',
              error.response.data?.message || 'An unexpected error occurred',
              error.response.data?.code,
              () => handleCancelConfirm(reason)
            );
        }
      } else if (error.response?.status === 409) {
        showError(
          'Already Processing',
          'This booking is already being cancelled',
          'Please wait a moment and refresh the page'
        );
      } else if (error.code === 'ERR_NETWORK') {
        showError(
          'Network Error',
          'Unable to connect to the server',
          'Please check your internet connection',
          () => handleCancelConfirm(reason)
        );
      } else {
        showError(
          'Cancellation Failed',
          'An unexpected error occurred',
          error.message,
          () => handleCancelConfirm(reason)
        );
      }
    } finally {
      setActionLoading(false);
      setBookingToCancel(null);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBookings(1);
  }, []);

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NetworkStatus />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl p-4 h-24 animate-pulse"></div>
            ))}
          </div>

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <NetworkStatus />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#BC8BBC]" />
            My Bookings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your stays, check-ins, and booking requests
          </p>
        </div>

        {/* Quick Stats */}
        <QuickStats counts={counts} />

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => fetchBookings(1)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-[#BC8BBC] border border-gray-200 rounded-lg hover:border-[#BC8BBC] transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <EmptyState navigate={navigate} />
        ) : (
          <>
            <div className="space-y-4">
              {bookings.map((booking, index) => {
                // For demo, assuming user is tenant (you'll get this from auth context)
                const userRole = 'tenant';
                
                return (
                  <div
                    key={booking.id}
                    ref={index === bookings.length - 5 ? lastItemRef : null}
                  >
                    <BookingCard
                      booking={booking}
                      userRole={userRole}
                      onViewDetails={(b) => {
                        setSelectedBooking(b);
                        setShowDetailsModal(true);
                      }}
                      onAction={handleAction}
                      onMessage={handleMessage}
                    />
                  </div>
                );
              })}
            </div>

            {/* Loading More */}
            {loadingMore && (
              <div className="mt-6 space-y-4">
                {[...Array(2)].map((_, i) => (
                  <BookingCardSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}

            {/* End of List */}
            {!pagination.has_more && bookings.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  You've reached the end of your bookings
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Modal */}
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setBookingToCancel(null);
        }}
        onConfirm={handleCancelConfirm}
        booking={bookingToCancel}
        loading={actionLoading}
      />

      {/* Check-in Info Modal */}
      <CheckInInfoModal
        isOpen={showCheckInInfoModal}
        onClose={() => {
          setShowCheckInInfoModal(false);
          setBookingToCheckIn(null);
        }}
        onConfirm={handleCheckInConfirm}
        booking={bookingToCheckIn}
      />

      {/* Check-out Info Modal */}
      <CheckOutInfoModal
        isOpen={showCheckOutInfoModal}
        onClose={() => {
          setShowCheckOutInfoModal(false);
          setBookingToCheckOut(null);
        }}
        onConfirm={handleCheckOutConfirm}
        booking={bookingToCheckOut}
      />

      {/* Extension Modal */}
      <ExtensionModal
        isOpen={showExtensionModal}
        onClose={() => {
          setShowExtensionModal(false);
          setBookingToExtend(null);
        }}
        onConfirm={handleExtensionRequest}
        booking={bookingToExtend}
        loading={actionLoading}
      />

      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Booking Reference</p>
                    <p className="font-medium">{selectedBooking.reference || selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <StatusBadge status={selectedBooking.status} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium">{format(parseISO(selectedBooking.dates.start), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium">{format(parseISO(selectedBooking.dates.end), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{selectedBooking.dates.duration} {selectedBooking.period}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('en-RW', {
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0
                      }).format(selectedBooking.amount)}
                    </p>
                  </div>
                </div>

                {selectedBooking.special_requests && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedBooking.special_requests}</p>
                  </div>
                )}

                {/* Quick message button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleMessage(selectedBooking);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#BC8BBC]/10 text-[#BC8BBC] rounded-lg font-medium hover:bg-[#BC8BBC]/20 transition-colors"
                  >
                    <MessageSquare size={16} />
                    Message about this booking
                    <Send size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}