// src/pages/Booking/BookingProcess.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import MainHeader from '../../components/LandingPage/Header/Header';
import BottomNav from '../../components/LandingPage/BottomNav/BottomNav';
import Footer from '../../components/ui/Footer';

import ProgressBar from '../../components/Booking/ProgressBar';
import BookingDetailsStep from '../../components/Booking/BookingDetailsStep';
import PaymentMethodStep from '../../components/Booking/PaymentMethodStep';
import ConfirmPaymentStep from '../../components/Booking/ConfirmPaymentStep';
import SummaryCard from '../../components/Booking/SummaryCard';
import LoadingState from '../../components/Booking/LoadingState';
import ErrorState from '../../components/Booking/ErrorState';

// ✅ ADD THIS IMPORT
import { useAuth } from '../../context/AuthContext';
import { useIsanzureAuth } from '../../context/IsanzureAuthContext';

const BookingProcess = () => {
  const { propertyUid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // ✅ ADD THESE
  const { user } = useAuth();
  const { refreshIsanzureUser } = useIsanzureAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [bookingData, setBookingData] = useState({
    period: searchParams.get('period') || 'monthly',
    guests: 1,
    customizations: [],
    specialRequests: '',
    paymentMethod: '',
    startDate: '',
    duration: 1
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // ✅ ADD THIS - AUTO-CREATE iSanzure user if authenticated but not in iSanzure
  useEffect(() => {
    const ensureIsanzureUser = async () => {
      if (user && !user?.isanzure_user_id) {
        try {
          console.log('🔄 Ensuring iSanzure user exists...');
          await refreshIsanzureUser();
        } catch (error) {
          console.error('Error ensuring iSanzure user:', error);
        }
      }
    };
    
    ensureIsanzureUser();
  }, [user]);

  const periodDisplay = {
    monthly: { label: 'Monthly', unit: 'months' },
    weekly: { label: 'Weekly', unit: 'weeks' },
    daily: { label: 'Daily', unit: 'days' },
    nightly: { label: 'Nightly', unit: 'nights' }
  };

  useEffect(() => {
    fetchPropertyDetails();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingData(prev => ({
      ...prev,
      startDate: tomorrow.toISOString().split('T')[0]
    }));
  }, [propertyUid]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/public/properties/${propertyUid}`);
      if (response.data.success) {
        setProperty(response.data.data.property);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0 || price === '0') return 'Contact for price';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPriceForPeriod = () => {
    if (!property) return 0;
    switch (bookingData.period) {
      case 'monthly': return property.monthly_price || 0;
      case 'weekly': return property.weekly_price || 0;
      case 'daily': return property.daily_price || 0;
      case 'nightly': return property.nightly_price || 0;
      default: return 0;
    }
  };

  const calculateTotal = () => {
    const basePrice = getPriceForPeriod();
    const periodMultiplier = bookingData.duration;
    return basePrice * periodMultiplier;
  };

  const getPropertyType = () => {
    if (!property) return '';
    return property.property_type?.toLowerCase() || '';
  };

  const getGuestOptions = () => {
    const maxGuests = property?.max_guests || 10;
    return Array.from({ length: maxGuests }, (_, i) => i + 1);
  };

  const getCustomizationOptions = () => {
    const options = [];
    const propertyType = getPropertyType();
    
    if (propertyType === 'guest_house' || propertyType === 'hotel' || propertyType === 'hostel') {
      options.push(
        { id: 'breakfast', label: 'Breakfast Included', price: 5000 },
        { id: 'airport_transfer', label: 'Airport Transfer', price: 15000 },
        { id: 'late_checkout', label: 'Late Checkout (2PM)', price: 10000 }
      );
    }
    
    options.push(
      { id: 'cleaning', label: 'Extra Cleaning Service', price: 8000 },
      { id: 'wifi_boost', label: 'Premium WiFi Speed', price: 3000 }
    );
    
    return options;
  };

  const getCustomizationTotal = () => {
    const options = getCustomizationOptions();
    return bookingData.customizations.reduce((total, id) => {
      const option = options.find(opt => opt.id === id);
      return total + (option?.price || 0);
    }, 0);
  };

  const getPaymentSchedule = () => {
    if (!property) return [];
    
    const period = bookingData.period;
    const duration = bookingData.duration;
    const basePrice = getPriceForPeriod();
    
    if (basePrice === 0) return [];
    
    const schedule = [];
    
    const maxAdvance = property.max_advance_months || 3;
    const maxSingle = property.max_single_payment_months || 6;
    
    if (period === 'monthly') {
      if (duration <= maxSingle) {
        schedule.push({
          type: 'full',
          amount: basePrice * duration,
          dueDate: 'Upon Booking',
          description: `Full ${duration} month${duration > 1 ? 's' : ''} upfront`
        });
      } else {
        const firstPaymentMonths = Math.min(maxAdvance, duration);
        const firstPayment = basePrice * firstPaymentMonths;
        
        schedule.push({
          type: 'first',
          amount: firstPayment,
          dueDate: 'Upon Booking',
          description: `First ${firstPaymentMonths} month${firstPaymentMonths > 1 ? 's' : ''} upfront`
        });
        
        const remainingMonths = duration - firstPaymentMonths;
        if (remainingMonths > 0) {
          schedule.push({
            type: 'monthly',
            amount: basePrice,
            dueDate: 'Monthly',
            description: `Then ${remainingMonths} month${remainingMonths > 1 ? 's' : ''} paid monthly`,
            isMonthly: true
          });
        }
      }
    } else {
      schedule.push({
        type: 'full',
        amount: basePrice * duration,
        dueDate: 'Upon Booking',
        description: `Full payment for ${duration} ${periodDisplay[period]?.unit}`
      });
    }
    
    return schedule;
  };

  const getUtilitiesInfo = () => {
    if (!property) return null;
    
    const utilitiesMin = property.utilities_min || 0;
    const utilitiesMax = property.utilities_max || 0;
    const utilitiesIncluded = property.utilities_included === 1;
    
    if (bookingData.period !== 'monthly') {
      return null;
    }
    
    if (utilitiesIncluded) {
      return {
        included: true,
        message: 'All utilities (electricity, water, internet) are included in the rent price.'
      };
    } else if (utilitiesMin > 0 && utilitiesMax > 0) {
      return {
        included: false,
        min: parseFloat(utilitiesMin),
        max: parseFloat(utilitiesMax),
        message: 'Utilities (electricity, water) are paid separately based on actual usage.'
      };
    } else {
      return {
        included: false,
        min: 0,
        max: 0,
        message: 'Contact host for utilities information.'
      };
    }
  };

  const getPaymentLimitsInfo = () => {
    if (bookingData.period !== 'monthly' || !property) return null;
    
    const maxAdvance = property.max_advance_months || 3;
    const maxSingle = property.max_single_payment_months || 6;
    const duration = bookingData.duration;
    
    return {
      maxAdvance,
      maxSingle,
      message: `Select between ${maxAdvance} and ${maxSingle} months`
    };
  };

const getCancellationInfo = () => {
  if (!property) return null;
  
  const policy = property.cancellation_policy || 'moderate';
  
  const startDate = new Date(bookingData.startDate);
  const now = new Date();
  const hoursUntilCheckIn = Math.max(0, Math.floor((startDate - now) / (1000 * 60 * 60)));
  
  // Policy display names
  const policyNames = {
    'flexible': 'Flexible Cancellation',
    'moderate': 'Moderate Cancellation',
    'strict': 'Strict Cancellation'
  };
  
  // Policy descriptions
  const policyDescriptions = {
    'flexible': 'Tenant-friendly – full refund if cancelled at least 24 hours before check-in',
    'moderate': 'Balanced – full refund 48+ hours, 50% refund 24–48 hours, no refund within 24 hours',
    'strict': 'Landlord-protective – 50% refund 48+ hours, no refund within 48 hours'
  };
  
  // Refund percentages based on EXACT policies
  let refund48Plus = 0;
  let refund24to48 = 0;
  let refundLessThan24 = 0;
  
  switch (policy) {
    case 'flexible':
      refund48Plus = 100;      // 48+ hours = 100% (same as 24+ in practice)
      refund24to48 = 100;      // 24-48 hours = 100% (since flexible only has 24+ cutoff)
      refundLessThan24 = 0;     // <24 hours = 0%
      break;
      
    case 'moderate':
      refund48Plus = 100;       // 48+ hours = 100%
      refund24to48 = 50;        // 24-48 hours = 50%
      refundLessThan24 = 0;      // <24 hours = 0%
      break;
      
    case 'strict':
      refund48Plus = 50;        // 48+ hours = 50%
      refund24to48 = 0;         // 24-48 hours = 0% (strict uses 48 cutoff)
      refundLessThan24 = 0;      // <24 hours = 0%
      break;
      
    default:
      refund48Plus = 100;
      refund24to48 = 50;
      refundLessThan24 = 0;
  }
  
  // Determine current refund percentage
  let currentRefundPercentage = 0;
  if (hoursUntilCheckIn >= 48) {
    currentRefundPercentage = refund48Plus;
  } else if (hoursUntilCheckIn >= 24) {
    currentRefundPercentage = refund24to48;
  } else {
    currentRefundPercentage = refundLessThan24;
  }
  
  // Special case for flexible - if between 24-48 hours, still 100%
  if (policy === 'flexible' && hoursUntilCheckIn >= 24) {
    currentRefundPercentage = 100;
  }
  
  return {
    policy,
    policyName: policyNames[policy] || 'Cancellation Policy',
    policyDescription: policyDescriptions[policy] || 'Standard cancellation policy applies',
    refundPercentage: currentRefundPercentage,
    refund48Plus,
    refund24to48,
    refundLessThan24,
    hoursUntilCheckIn
  };
};

const getMonthlyCancellationExample = (policy) => {
  const monthlyRent = property.monthly_price || 60000;
  
  switch (policy) {
    case 'flexible':
      return {
        '48+': `48+ hours before: 100% refund (RF ${formatPrice(monthlyRent)} back)`,
        '24-48': `24-48 hours before: 50% refund (RF ${formatPrice(monthlyRent * 0.5)} back)`,
        '<24': `Less than 24 hours: No refund`
      };
    case 'moderate':
      return {
        '48+': `48+ hours before: 100% refund (RF ${formatPrice(monthlyRent)} back)`,
        '24-48': `24-48 hours before: 50% refund (RF ${formatPrice(monthlyRent * 0.5)} back)`,
        '<24': `Less than 24 hours: No refund`
      };
    case 'strict':
      return {
        '48+': `48+ hours before: 50% refund (RF ${formatPrice(monthlyRent * 0.5)} back)`,
        '<48': `Less than 48 hours: No refund`
      };
    default:
      return {
        '48+': `48+ hours before: 100% refund`,
        '24-48': `24-48 hours before: 50% refund`,
        '<24': `Less than 24 hours: No refund`
      };
  }
};

  const getHouseRulesList = () => {
    if (!property) return [];
    
    const rulesList = [];
    const rules = property;
    
    if (rules.check_in_time) {
      rulesList.push(`Check-in: ${rules.check_in_time}`);
    }
    
    if (rules.check_out_time) {
      rulesList.push(`Check-out: ${rules.check_out_time}`);
    }
    
    if (rules.smoking_allowed === 0) {
      rulesList.push('No smoking allowed');
    } else if (rules.smoking_allowed === 1) {
      rulesList.push('Smoking allowed in designated areas');
    }
    
    if (rules.pets_allowed === 0) {
      rulesList.push('No pets allowed');
    } else if (rules.pets_allowed === 1) {
      rulesList.push('Pets allowed with approval');
    }
    
    if (rules.events_allowed === 0) {
      rulesList.push('No parties or events');
    }
    
    if (rules.guests_allowed === 0) {
      rulesList.push('No overnight guests without approval');
    }
    
    if (rules.house_rules) {
      const additionalRules = rules.house_rules.split('\n').filter(rule => rule.trim());
      rulesList.push(...additionalRules);
    }
    
    return rulesList;
  };

  const calculateFirstPayment = () => {
    const schedule = getPaymentSchedule();
    return schedule.length > 0 ? schedule[0].amount : 0;
  };

  const handleCustomizationToggle = (optionId) => {
    setBookingData(prev => ({
      ...prev,
      customizations: prev.customizations.includes(optionId)
        ? prev.customizations.filter(id => id !== optionId)
        : [...prev.customizations, optionId]
    }));
  };

  const handleNextStep = () => {
    if (step === 1 && !bookingData.startDate) {
      alert('Please select a start date');
      return;
    }
    if (step === 2 && !bookingData.paymentMethod) {
      alert('Please select a payment method');
      return;
    }
    setStep(step + 1);
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate(`/booking/success/${propertyUid}?period=${bookingData.period}&amount=${calculateTotal() + getCustomizationTotal()}`);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!property) {
    return <ErrorState onBrowseProperties={() => navigate('/')} />;
  }

  const periodInfo = periodDisplay[bookingData.period];
  const basePrice = getPriceForPeriod();
  const customizationTotal = getCustomizationTotal();
  const totalAmount = calculateTotal() + customizationTotal;
  const paymentSchedule = getPaymentSchedule();
  const firstPayment = calculateFirstPayment();
  const utilitiesInfo = getUtilitiesInfo();
  const paymentLimitsInfo = getPaymentLimitsInfo();
  const cancellationInfo = getCancellationInfo();
  const houseRules = getHouseRulesList();

  const renderStepContent = () => {
    const commonProps = {
      property,
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
      onUpdateBookingData: setBookingData,
      onNextStep: handleNextStep,
      onBackStep: handleBackStep,
      onPayment: handlePayment,
      formatPrice,
      getCustomizationOptions,
      getCustomizationTotal,
      getGuestOptions,
      getPropertyType,
      calculateTotal,
      paymentProcessing
    };

    switch (step) {
      case 1:
        return (
          <BookingDetailsStep
            {...commonProps}
            propertyUid={propertyUid}
            navigate={navigate}
            onCustomizationToggle={handleCustomizationToggle}
          />
        );
      case 2:
        return <PaymentMethodStep {...commonProps} />;
      case 3:
        return (
          <ConfirmPaymentStep
            {...commonProps}
            propertyUid={propertyUid} // ✅ ONLY THIS LINE ADDED
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />

      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        <ProgressBar
          step={step}
          onBackStep={handleBackStep}
          steps={['Booking Details', 'Payment Method', 'Confirm & Pay']}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {renderStepContent()}
          </div>

          <div className="lg:col-span-1">
            <SummaryCard
              property={property}
              bookingData={bookingData}
              periodInfo={periodInfo}
              formatPrice={formatPrice}
              calculateTotal={calculateTotal}
              getCustomizationTotal={getCustomizationTotal}
              totalAmount={totalAmount}
              getPaymentSchedule={getPaymentSchedule}
              getUtilitiesInfo={getUtilitiesInfo}
              paymentSchedule={paymentSchedule}
              firstPayment={firstPayment}
              utilitiesInfo={utilitiesInfo}
              cancellationInfo={cancellationInfo}
            />
          </div>
        </div>
      </main>

      <BottomNav />
      <Footer />
    </div>
  );
};

export default BookingProcess;