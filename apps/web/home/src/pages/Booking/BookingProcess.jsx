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

const BookingProcess = () => {
  const { propertyUid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
    // Scroll to top when step changes
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
    
    // Only show for monthly bookings
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
    
    const rules = property;
    const platformCommission = property.platform_commission_rate || 10;
    const policy = rules.cancellation_policy || 'flexible';
    
    // Calculate days until check-in
    const startDate = new Date(bookingData.startDate);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    const isWithinTwoDays = daysUntilCheckIn <= 2;
    
    // Determine refund percentage
    let refundPercentage = 0;
    let showTwoDayProtection = false;
    
    if (isWithinTwoDays && bookingData.period === 'monthly') {
      // Within 2 days for monthly: Full refund (90% after commission)
      refundPercentage = 100;
      showTwoDayProtection = true;
    } else {
      // Use landlord's policy
      switch (policy) {
        case 'flexible':
          refundPercentage = 100;
          break;
        case 'moderate':
          refundPercentage = 50;
          break;
        case 'strict':
          refundPercentage = 0;
          break;
        default:
          refundPercentage = 100;
      }
    }
    
    const refundAfterCommission = refundPercentage > 0 
      ? Math.round(refundPercentage - (refundPercentage * (platformCommission / 100)))
      : 0;
    
    // Get policy description based on type
    let policyDescription = '';
    switch (policy) {
      case 'flexible':
        policyDescription = `Full refund (${refundAfterCommission}% after ${platformCommission}% platform fee) if canceled 24 hours before check-in`;
        break;
      case 'moderate':
        policyDescription = `Partial refund (${refundAfterCommission}% after ${platformCommission}% platform fee) if canceled 7 days before check-in`;
        break;
      case 'strict':
        policyDescription = `No refund for cancellations`;
        break;
      default:
        policyDescription = `Contact host for cancellation details`;
    }
    
    return {
      policy,
      refundPercentage,
      refundAfterCommission,
      platformCommission,
      isWithinTwoDays,
      daysUntilCheckIn,
      showTwoDayProtection,
      policyDescription,
      monthlyExample: getMonthlyCancellationExample(policy, platformCommission, refundAfterCommission)
    };
  };

  const getMonthlyCancellationExample = (policy, commission, refundAfter) => {
    const monthlyRent = property.monthly_price || 50000;
    const accommodationAmount = monthlyRent - (monthlyRent * (commission / 100));
    
    switch (policy) {
      case 'flexible':
        return `Example: For ${formatPrice(monthlyRent)} monthly rent, you'd get ${formatPrice(accommodationAmount)} back if you cancel 24+ hours before check-in.`;
      case 'moderate':
        return `Example: For ${formatPrice(monthlyRent)} monthly rent, you'd get ${formatPrice(accommodationAmount * 0.5)} back if you cancel 7+ days before check-in.`;
      case 'strict':
        return `Example: For ${formatPrice(monthlyRent)} monthly rent, no refund is provided for cancellations.`;
      default:
        return '';
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
      navigate(`/property/${propertyUid}`);
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
        return <ConfirmPaymentStep {...commonProps} />;
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