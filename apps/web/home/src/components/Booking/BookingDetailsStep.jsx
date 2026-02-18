import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Users,
  Check,
  Shield,
  FileText,
  Info,
  Clock,
  DollarSign,
  Power,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Home,
  Coffee,
  Car,
  Bell,
  Wifi,
  X,
  ChevronRight,
  CalendarDays,
  Calculator,
  Lock,
  Key,
  Bed,
  Bath,
  Users as UsersIcon,
  Star,
  MapPin,
  ChevronLeft,
  Loader,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../../api/axios';

const BookingDetailsStep = ({
  property,
  propertyUid,
  navigate,
  bookingData,
  periodInfo,
  basePrice,
  totalAmount,
  firstPayment,
  utilitiesInfo,
  paymentLimitsInfo,
  cancellationInfo,
  houseRules,
  paymentSchedule,
  onUpdateBookingData,
  onNextStep,
  onBackStep,
  onCustomizationToggle,
  formatPrice,
  getGuestOptions,
  getPropertyType,
  getCustomizationOptions,
  getCustomizationTotal,
  calculateTotal
}) => {
  // ============================================
  // EXISTING STATE - KEPT EXACTLY AS IS
  // ============================================
  const [showUtilitiesDetails, setShowUtilitiesDetails] = useState(false);
  const [showPaymentRules, setShowPaymentRules] = useState(false);
  const [showHouseRules, setShowHouseRules] = useState(false);
  const [showCancellationDetails, setShowCancellationDetails] = useState(false);
  const [showCustomizations, setShowCustomizations] = useState(false);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [errors, setErrors] = useState({});
  const [durationValidation, setDurationValidation] = useState({ isValid: true, message: '' });

  // ============================================
  // STATE FOR AVAILABILITY CHECK
  // ============================================
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Refs for scrolling to errors
  const startDateRef = useRef(null);
  const durationRef = useRef(null);
  const errorsRef = useRef(null);

  // Customization options
  const customizationOptions = getCustomizationOptions();
  const customizationTotal = getCustomizationTotal();

  // Get all available periods
  const availablePeriods = [
    {
      id: 'monthly',
      label: 'Monthly',
      price: property.monthly_price || 0,
      unit: 'month',
      description: 'Long-term rental'
    },
    {
      id: 'weekly',
      label: 'Weekly',
      price: property.weekly_price || 0,
      unit: 'week',
      description: 'Weekly stay'
    },
    {
      id: 'daily',
      label: 'Daily',
      price: property.daily_price || 0,
      unit: 'day',
      description: 'Daily rental'
    },
    {
      id: 'nightly',
      label: 'Nightly',
      price: property.nightly_price || 0,
      unit: 'night',
      description: 'Night stay'
    }
  ].filter(period => period.price > 0);

  // ============================================
  // REAL-TIME AVAILABILITY CHECK
  // ============================================
  useEffect(() => {
    if (!bookingData.startDate || !bookingData.duration) {
      setAvailabilityStatus(null);
      return;
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      checkAvailability();
    }, 800);

    setDebounceTimer(timer);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [bookingData.startDate, bookingData.duration, bookingData.period]);

  const checkAvailability = async () => {
    if (!bookingData.startDate || !bookingData.duration) return;

    setCheckingAvailability(true);
    setAvailabilityError('');
    setAvailabilityStatus(null);

    try {
      const endDate = new Date(bookingData.startDate);
      switch (bookingData.period) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + bookingData.duration);
          break;
        case 'weekly':
          endDate.setDate(endDate.getDate() + (bookingData.duration * 7));
          break;
        case 'daily':
        case 'nightly':
          endDate.setDate(endDate.getDate() + bookingData.duration);
          break;
      }

      const response = await api.post('/booking/check-availability', {
        propertyUid,
        startDate: bookingData.startDate,
        endDate: endDate.toISOString().split('T')[0],
        bookingPeriod: bookingData.period,
        duration: bookingData.duration
      });

      if (response.data.success) {
        setAvailabilityStatus({
          available: true,
          message: '✓ Available for your dates',
          type: 'available'
        });
      }
    } catch (error) {
      console.error('Availability check error:', error);

      if (error.response?.status === 409) {
        const errorData = error.response.data;

        if (errorData.code === 'DUPLICATE_BOOKING') {
          setAvailabilityStatus({
            available: false,
            message: 'You already have a booking for these dates.',
            type: 'duplicate'
          });
        } else {
          setAvailabilityStatus({
            available: false,
            message: 'This property is already booked for the selected dates',
            type: 'unavailable'
          });
        }
      } else {
        setAvailabilityError('Unable to check availability');
      }
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCheckAvailability = () => {
    checkAvailability();
  };

  // Set initial duration to max_advance_months when component mounts for monthly
  useEffect(() => {
    if (bookingData.period === 'monthly' && property.max_advance_months) {
      const maxAdvance = property.max_advance_months;
      if (bookingData.duration < maxAdvance) {
        onUpdateBookingData({ ...bookingData, duration: maxAdvance });
      }
      validateDuration(maxAdvance);

      setTimeout(() => checkAvailability(), 100);
    }
  }, [property]);

  // Validate duration based on payment limits
  const validateDuration = (duration) => {
    if (bookingData.period !== 'monthly') {
      return { isValid: true, message: '' };
    }

    const maxAdvance = property.max_advance_months || 3;
    const maxSingle = property.max_single_payment_months || 6;

    if (duration < maxAdvance) {
      return {
        isValid: false,
        message: `Minimum ${maxAdvance} months required`
      };
    }

    if (duration > maxSingle) {
      return {
        isValid: false,
        message: `Maximum ${maxSingle} months allowed`
      };
    }

    return { isValid: true, message: '' };
  };

  // Validate all booking details
  const validateBooking = () => {
    const newErrors = {};

    if (!bookingData.startDate) {
      newErrors.startDate = 'Please select a start date';
    } else {
      const startDate = new Date(bookingData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    if (basePrice === 0 || basePrice === null) {
      newErrors.price = 'This property requires you to contact the host for pricing';
    }

    // Validate duration for monthly bookings
    if (bookingData.period === 'monthly') {
      const durationValidation = validateDuration(bookingData.duration);
      if (!durationValidation.isValid) {
        newErrors.duration = durationValidation.message;
      }
    }

    // Check if availability is confirmed
    if (!availabilityStatus?.available) {
      newErrors.availability = 'Please check availability and confirm dates are available';
    }

    setErrors(newErrors);

    // Scroll to first error if any
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        if (newErrors.startDate && startDateRef.current) {
          startDateRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          startDateRef.current.focus();
        } else if (newErrors.duration && durationRef.current) {
          durationRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errorsRef.current) {
          errorsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }

    return Object.keys(newErrors).length === 0;
  };

  // Handle duration change with validation
  const handleDurationChange = (newDuration) => {
    if (newDuration < 1) return;

    if (bookingData.period === 'monthly') {
      const maxAdvance = property.max_advance_months || 3;
      const maxSingle = property.max_single_payment_months || 6;

      if (newDuration < maxAdvance) {
        newDuration = maxAdvance;
      }

      if (newDuration > maxSingle) {
        newDuration = maxSingle;
      }
    }

    const validation = validateDuration(newDuration);
    setDurationValidation(validation);

    onUpdateBookingData({ ...bookingData, duration: newDuration });

    setAvailabilityStatus(null);
  };

  // Handle period change
  const handlePeriodChange = (periodId) => {
    const newPeriodData = { period: periodId };

    if (periodId === 'monthly') {
      const maxAdvance = property.max_advance_months || 3;
      newPeriodData.duration = maxAdvance;

      const validation = validateDuration(maxAdvance);
      setDurationValidation(validation);
    } else {
      newPeriodData.duration = 1;
      setDurationValidation({ isValid: true, message: '' });
    }

    onUpdateBookingData({ ...bookingData, ...newPeriodData });
    setShowPeriodSelector(false);

    setAvailabilityStatus(null);
  };

  // Handle start date change
  const handleStartDateChange = (e) => {
    onUpdateBookingData({ ...bookingData, startDate: e.target.value });
    if (errors.startDate) {
      setErrors(prev => ({ ...prev, startDate: '' }));
    }
    setAvailabilityStatus(null);
  };

  // Handle next step with validation and scroll to top
  const handleNext = () => {
    if (validateBooking()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onNextStep();
    }
  };

  // Check if property accepts the selected period
  const isPeriodAccepted = () => {
    switch (bookingData.period) {
      case 'monthly': return property.accept_monthly === 1;
      case 'weekly': return property.accept_weekly === 1;
      case 'daily': return property.accept_daily === 1;
      case 'nightly': return property.accept_nightly === 1;
      default: return false;
    }
  };

  // Get simple property type display
  const getSimplePropertyType = () => {
    const type = getPropertyType();
    switch (type) {
      case 'ghetto': return 'Basic House';
      case 'living_house': return 'Family House';
      case 'guest_house': return 'Guest House';
      case 'hotel': return 'Hotel Room';
      case 'hostel': return 'Hostel Bed';
      case 'apartment': return 'Apartment';
      default: return 'Property';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="h-6 w-6 text-[#BC8BBC]" />
            Booking Details
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Complete your booking for {property.title}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Property Type</div>
          <div className="text-sm font-medium text-gray-900 capitalize">
            {getSimplePropertyType()}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Rental Period and Start Date in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rental Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rental Period
            </label>

            <div
              onClick={() => setShowPeriodSelector(true)}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-[#BC8BBC]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{periodInfo?.label}</span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span className="text-[#BC8BBC] font-bold text-sm">
                      {basePrice > 0 ? formatPrice(basePrice) : 'Contact'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    per {periodInfo?.unit?.slice(0, -1)} • Click to change
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Start Date */}
          <div ref={startDateRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date
            </label>
            <input
              type="date"
              value={bookingData.startDate}
              onChange={handleStartDateChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BC8BBC]/20 outline-none transition-all ${errors.startDate
                ? 'border-red-300 bg-red-50 focus:border-red-500'
                : 'border-gray-300 focus:border-[#BC8BBC]'
                }`}
            />

            {/* Availability Status */}
            {bookingData.startDate && bookingData.duration && (
              <div className="mt-1.5 text-xs">
                {checkingAvailability ? (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Loader className="h-3 w-3 animate-spin" />
                    <span>Checking availability...</span>
                  </div>
                ) : availabilityStatus?.available ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>✓ Available for your dates</span>
                  </div>
                ) : availabilityStatus?.type === 'duplicate' ? (
                  <div className="flex items-start gap-1 text-orange-600">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <span>You already have a booking for these dates.</span>
                      <button
                        onClick={() => navigate('/bookings')}
                        className="ml-1 text-[#BC8BBC] hover:text-[#9A6A9A] font-medium underline"
                      >
                        View booking
                      </button>
                    </div>
                  </div>
                ) : availabilityStatus?.available === false ? (
                  <div className="flex items-start gap-1 text-red-600">
                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div>This property is already booked for the selected dates</div>
                      <div className="text-gray-500 mt-0.5">
                        Please select different dates or contact the host.
                      </div>
                    </div>
                  </div>
                ) : availabilityError ? (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Unable to check availability. </span>
                    <button
                      onClick={handleCheckAvailability}
                      className="text-[#BC8BBC] hover:text-[#9A6A9A] font-medium underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Info className="h-3 w-3" />
                    <span>Click "Continue to Payment" to check availability</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Duration and Payment Summary in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Duration with Validation */}
          <div ref={durationRef}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration ({periodInfo?.unit})
              </label>
              {bookingData.period === 'monthly' && paymentLimitsInfo && (
                <div className="text-xs">
                  <button
                    onClick={() => setShowPaymentRules(!showPaymentRules)}
                    className="text-[#BC8BBC] hover:text-[#9A6A9A] flex items-center gap-1"
                  >
                    <Calculator className="h-3 w-3" />
                    {showPaymentRules ? 'Hide Rules' : 'Rules'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => handleDurationChange(bookingData.duration - 1)}
                disabled={bookingData.duration <= (property.max_advance_months || 3)}
                className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${bookingData.duration <= (property.max_advance_months || 3)
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 hover:border-[#BC8BBC] hover:text-[#BC8BBC]'
                  }`}
              >
                -
              </button>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-gray-900">{bookingData.duration}</div>
                <div className="text-sm text-gray-500">
                  {periodInfo?.unit} • {basePrice > 0 ? formatPrice(calculateTotal()) : 'Contact'} total
                </div>
              </div>
              <button
                onClick={() => handleDurationChange(bookingData.duration + 1)}
                disabled={bookingData.period === 'monthly' && bookingData.duration >= (property.max_single_payment_months || 6)}
                className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${bookingData.period === 'monthly' && bookingData.duration >= (property.max_single_payment_months || 6)
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 hover:border-[#BC8BBC] hover:text-[#BC8BBC]'
                  }`}
              >
                +
              </button>
            </div>

            {errors.duration && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 animate-pulse">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.duration}</span>
                </div>
              </div>
            )}

            {!durationValidation.isValid && !errors.duration && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{durationValidation.message}</span>
                </div>
              </div>
            )}

            {errors.price && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.price}</span>
                </div>
              </div>
            )}

            {errors.startDate && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 animate-pulse">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.startDate}</span>
                </div>
              </div>
            )}

            {/* Payment limits info - Only for monthly */}
            {bookingData.period === 'monthly' && paymentLimitsInfo && showPaymentRules && showDetails && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">
                      Min duration:
                    </span>
                    <span className="font-bold text-blue-900">
                      {paymentLimitsInfo.maxAdvance} months
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">
                      Max duration:
                    </span>
                    <span className="font-bold text-blue-900">
                      {paymentLimitsInfo.maxSingle} months
                    </span>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <div className="font-medium text-blue-900">
                      {paymentLimitsInfo.message}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          {basePrice > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Summary
              </label>
              <div className="p-4 bg-gradient-to-r from-[#BC8BBC]/5 to-[#8A5A8A]/5 rounded-lg border border-[#BC8BBC]/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-700">First Payment</div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#BC8BBC]">
                      {formatPrice(firstPayment)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-gray-900">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                {customizationTotal > 0 && (
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500">+ Services:</span>
                    <span className="font-medium text-gray-700">{formatPrice(customizationTotal)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SIMPLE VIEW - Only "Know More" link */}
        {!showDetails && (
          <div className="pt-2">
            <div className="text-center">
              <button
                onClick={() => setShowDetails(true)}
                className="text-[#BC8BBC] hover:text-[#9A6A9A] text-sm font-medium inline-flex items-center gap-1 transition-colors"
              >
                <Info className="h-4 w-4" />
                Want to know more about this before payment?
              </button>
            </div>
          </div>
        )}

        {/* DETAILED VIEW - Expanded when user clicks "Know More" */}
        {showDetails && (
          <div className="space-y-6">
            {/* Utilities Information - ONLY for monthly */}
            {utilitiesInfo && bookingData.period === 'monthly' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Power className="h-4 w-4" />
                    Utilities Information
                  </label>
                  <button
                    onClick={() => setShowUtilitiesDetails(!showUtilitiesDetails)}
                    className="text-xs text-[#BC8BBC] hover:text-[#9A6A9A] flex items-center gap-1"
                  >
                    {showUtilitiesDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {showUtilitiesDetails ? 'Less' : 'Details'}
                  </button>
                </div>

                <div className={`p-4 border rounded-lg transition-all ${utilitiesInfo.included
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
                  }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        {utilitiesInfo.included
                          ? '✅ Utilities Included'
                          : '⚠️ Utilities Not Included'
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        {utilitiesInfo.message}
                      </div>

                      {showUtilitiesDetails && !utilitiesInfo.included && utilitiesInfo.min > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-900 mb-2">Estimated Monthly Range:</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">Minimum:</div>
                              <div className="font-medium text-gray-900">{formatPrice(utilitiesInfo.min)}</div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">Maximum:</div>
                              <div className="font-medium text-gray-900">{formatPrice(utilitiesInfo.max)}</div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Based on actual usage. Paid directly to utility providers.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      {utilitiesInfo.included ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Included
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Separate</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* ✅ UPDATED: Cancellation Policy - NO FEES */}
            {/* ============================================ */}
            {cancellationInfo && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Cancellation Policy
                  </label>
                  <button
                    onClick={() => setShowCancellationDetails(!showCancellationDetails)}
                    className="text-xs text-[#BC8BBC] hover:text-[#9A6A9A]"
                  >
                    {showCancellationDetails ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="space-y-3">
                    {/* Policy Summary */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 mb-1">
                          {cancellationInfo.policyName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {cancellationInfo.policyDescription}
                        </div>
                      </div>
                      <div className={`text-sm font-bold px-3 py-1 rounded-full ${cancellationInfo.refundPercentage === 100 ? 'bg-green-100 text-green-700' :
                          cancellationInfo.refundPercentage === 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {cancellationInfo.refundPercentage}% refund
                      </div>
                    </div>

                    {/* Timing breakdown based on exact policies */}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      {/* 48+ hours column */}
                      <div className={`p-2 rounded-lg border ${cancellationInfo.hoursUntilCheckIn >= 48
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                        }`}>
                        <div className="font-medium mb-1">48+ hours</div>
                        <div className="text-gray-600">
                          {cancellationInfo.refund48Plus}% refund
                        </div>
                        {cancellationInfo.policy === 'flexible' && cancellationInfo.refund48Plus === 100 && (
                          <div className="mt-1 text-[10px] text-gray-500">(Same as 24+ hours)</div>
                        )}
                      </div>

                      {/* 24-48 hours column */}
                      <div className={`p-2 rounded-lg border ${cancellationInfo.hoursUntilCheckIn >= 24 && cancellationInfo.hoursUntilCheckIn < 48
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50'
                        }`}>
                        <div className="font-medium mb-1">24-48 hours</div>
                        <div className="text-gray-600">
                          {cancellationInfo.policy === 'flexible' ? '100%' :
                            cancellationInfo.policy === 'moderate' ? '50%' :
                              '0%'} refund
                        </div>
                        {cancellationInfo.policy === 'strict' && (
                          <div className="mt-1 text-[10px] text-gray-500">No refund</div>
                        )}
                      </div>

                      {/* <24 hours column */}
                      <div className={`p-2 rounded-lg border ${cancellationInfo.hoursUntilCheckIn < 24
                          ? 'border-red-200 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                        }`}>
                        <div className="font-medium mb-1">{'<24 hours'}</div>
                        <div className="text-gray-600">0% refund</div>
                      </div>
                    </div>

                    {/* Current timing indicator */}
                    {bookingData.startDate && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-800">Current:</span>
                          <span className="font-medium text-blue-900">
                            {cancellationInfo.hoursUntilCheckIn} hours until check-in
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Examples based on policy */}
                    {showCancellationDetails && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                        {/* Flexible Policy Examples */}
                        {cancellationInfo.policy === 'flexible' && (
                          <div className="space-y-2">
                            <div className="p-3 bg-gray-100 rounded-lg text-xs text-gray-700">
                              <div className="font-medium mb-2">📋 Examples (based on 60,000 RWF):</div>
                              <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                  <span className="text-green-600 font-bold">•</span>
                                  <span><span className="font-medium">24+ hours before check-in:</span> 100% refund (60,000 RWF back)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-600 font-bold">•</span>
                                  <span><span className="font-medium">Less than 24 hours before check-in:</span> No refund (0 RWF)</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Moderate Policy Examples */}
                        {cancellationInfo.policy === 'moderate' && (
                          <div className="space-y-2">
                            <div className="p-3 bg-gray-100 rounded-lg text-xs text-gray-700">
                              <div className="font-medium mb-2">📋 Examples (based on 60,000 RWF):</div>
                              <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                  <span className="text-green-600 font-bold">•</span>
                                  <span><span className="font-medium">48+ hours before check-in:</span> 100% refund (60,000 RWF back)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-600 font-bold">•</span>
                                  <span><span className="font-medium">24-48 hours before check-in:</span> 50% refund (30,000 RWF back)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-600 font-bold">•</span>
                                  <span><span className="font-medium">Less than 24 hours before check-in:</span> No refund (0 RWF)</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Strict Policy Examples */}
                        {cancellationInfo.policy === 'strict' && (
                          <div className="space-y-2">
                            <div className="p-3 bg-gray-100 rounded-lg text-xs text-gray-700">
                              <div className="font-medium mb-2">📋 Examples (based on 60,000 RWF):</div>
                              <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                  <span className="text-green-600 font-bold">•</span>
                                  <span><span className="font-medium">48+ hours before check-in:</span> 50% refund (30,000 RWF back)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-600 font-bold">•</span>
                                  <span><span className="font-medium">Less than 48 hours before check-in:</span> No refund (0 RWF)</span>
                                </li>
                              </ul>
                              <div className="mt-2 text-gray-500 italic">
                                Note: For strict policy, the 24-48 hour window does not apply.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Important Notes */}
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-gray-700">
                          <div className="flex items-start gap-1">
                            <Info className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium mb-1">Important Notes:</div>
                              <div>
                                • All times are based on Rwanda local time (CAT)<br />
                                • Refunds are processed within 5-7 business days<br />
                                • Cancellation applies to the entire booking
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* House Rules with Simple Explanations */}
            {houseRules.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    House Rules
                  </label>
                  <button
                    onClick={() => setShowHouseRules(!showHouseRules)}
                    className="text-xs text-[#BC8BBC] hover:text-[#9A6A9A] flex items-center gap-1"
                  >
                    {showHouseRules ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {showHouseRules ? 'Hide' : `View ${houseRules.length} Rules`}
                  </button>
                </div>

                {showHouseRules ? (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="space-y-4">
                      {houseRules.map((rule, index) => {
                        let explanation = '';
                        if (rule.includes('Check-in')) {
                          explanation = 'This is when you can start staying in the house. For example, if you book starting Monday and check-in is 2:00 PM, you can move in from 2:00 PM on Monday.';
                        } else if (rule.includes('Check-out')) {
                          explanation = 'This is when you must leave the house. For example, if your booking ends Friday and check-out is 11:00 AM, you should be completely out by 11:00 AM on Friday.';
                        } else if (rule.includes('smoking')) {
                          explanation = 'This rule tells you if you can smoke inside the house or not.';
                        } else if (rule.includes('pets')) {
                          explanation = 'This rule tells you if you can bring animals like dogs or cats.';
                        }

                        return (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-sm text-gray-700">{rule}</span>
                              {explanation && (
                                <div className="mt-1 text-xs text-gray-500">
                                  {explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">
                    {houseRules.length} rules apply to this property
                  </div>
                )}
              </div>
            )}

            {/* Special Requests (Detailed View) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={bookingData.specialRequests}
                onChange={(e) => onUpdateBookingData({ ...bookingData, specialRequests: e.target.value })}
                placeholder="Any special requirements or requests for the host..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/20 outline-none transition-all resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Example: "I need early check-in at 1 PM" or "Please provide extra blankets"
              </p>
            </div>

            {/* Show Less as clickable text link */}
            <div className="pt-2 text-center">
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium inline-flex items-center gap-1 transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
                Show Less Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error summary ref */}
      <div ref={errorsRef}></div>

      {/* Action Button */}
      <div className="mt-6">
        <button
          onClick={handleNext}
          disabled={
            Object.keys(errors).length > 0 ||
            basePrice === 0 ||
            !durationValidation.isValid ||
            !availabilityStatus?.available ||
            checkingAvailability ||
            !bookingData.startDate
          }
          className={`w-full py-4 rounded-lg font-medium transition-all ${Object.keys(errors).length === 0 &&
            basePrice > 0 &&
            durationValidation.isValid &&
            availabilityStatus?.available &&
            !checkingAvailability &&
            bookingData.startDate
            ? 'bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]'
            : 'bg-gray-200 cursor-not-allowed text-gray-500'
            }`}
        >
          Continue to Payment - {formatPrice(firstPayment)} Now
        </button>

        {/* Small helper text when disabled */}
        {!availabilityStatus?.available && bookingData.startDate && !checkingAvailability && availabilityStatus && (
          <p className="text-xs text-red-500 text-center mt-2">
            Property is not available for selected dates
          </p>
        )}
        {checkingAvailability && (
          <p className="text-xs text-blue-500 text-center mt-2">
            Checking availability...
          </p>
        )}
        {!bookingData.startDate && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Select a start date to continue
          </p>
        )}
      </div>

      {/* Period Selector Modal */}
      {showPeriodSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-lg">Select Rental Period</h4>
              <button
                onClick={() => setShowPeriodSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {availablePeriods.map((period) => (
                <div
                  key={period.id}
                  onClick={() => handlePeriodChange(period.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${bookingData.period === period.id
                    ? 'bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10 border-[#BC8BBC]'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bookingData.period === period.id
                        ? 'bg-[#BC8BBC] text-white'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{period.label}</div>
                        <div className="text-sm text-gray-600">{period.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 text-lg">
                        {formatPrice(period.price)}
                      </div>
                      <div className="text-xs text-gray-500">per {period.unit}</div>
                    </div>
                  </div>

                  {bookingData.period === period.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        <span>Currently selected</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {availablePeriods.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3 text-gray-300">📅</div>
                  <div className="font-medium text-gray-900 mb-2">No Pricing Available</div>
                  <div className="text-sm text-gray-600">
                    Please contact the host directly for pricing.
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={() => setShowPeriodSelector(false)}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailsStep;