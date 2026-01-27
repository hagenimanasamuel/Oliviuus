// src/pages/Booking/BookingProcess.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Coffee, Car, Clock, Bell, Wifi } from 'lucide-react';
import api from '../../api/axios';
import MainHeader from '../../components/LandingPage/Header/Header';
import BottomNav from '../../components/LandingPage/BottomNav/BottomNav';
import Footer from '../../components/ui/Footer';

// Import booking components - Make sure these paths are correct!
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
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Confirm
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

  // Map period names for display
  const periodDisplay = {
    monthly: { label: 'Monthly', unit: 'months' },
    weekly: { label: 'Weekly', unit: 'weeks' },
    daily: { label: 'Daily', unit: 'days' },
    nightly: { label: 'Nightly', unit: 'nights' }
  };

  useEffect(() => {
    fetchPropertyDetails();
    // Auto-set start date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingData(prev => ({
      ...prev,
      startDate: tomorrow.toISOString().split('T')[0]
    }));
  }, [propertyUid]);

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
    const periodMultiplier = {
      monthly: bookingData.duration,
      weekly: bookingData.duration,
      daily: bookingData.duration,
      nightly: bookingData.duration
    }[bookingData.period] || 1;
    
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
    
    if (propertyType === 'guest_house' || propertyType === 'hotel') {
      options.push(
        { id: 'breakfast', label: 'Breakfast Included', icon: <Coffee className="h-4 w-4" />, price: 5000 },
        { id: 'airport_transfer', label: 'Airport Transfer', icon: <Car className="h-4 w-4" />, price: 15000 },
        { id: 'late_checkout', label: 'Late Checkout (2PM)', icon: <Clock className="h-4 w-4" />, price: 10000 }
      );
    }
    
    options.push(
      { id: 'cleaning', label: 'Extra Cleaning Service', icon: <Bell className="h-4 w-4" />, price: 8000 },
      { id: 'wifi_boost', label: 'Premium WiFi Speed', icon: <Wifi className="h-4 w-4" />, price: 3000 }
    );
    
    return options;
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
      navigate(`/booking/success/${propertyUid}?period=${bookingData.period}&amount=${calculateTotal()}`);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const getCustomizationTotal = () => {
    const options = getCustomizationOptions();
    return bookingData.customizations.reduce((total, id) => {
      const option = options.find(opt => opt.id === id);
      return total + (option?.price || 0);
    }, 0);
  };

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (!property) {
    return <ErrorState onBrowseProperties={() => navigate('/')} />;
  }

  const periodInfo = periodDisplay[bookingData.period];
  const basePrice = getPriceForPeriod();
  const customizationTotal = getCustomizationTotal();
  const totalAmount = calculateTotal() + customizationTotal;

  // Step content based on current step
  const renderStepContent = () => {
    const commonProps = {
      property,
      bookingData,
      periodInfo,
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
      basePrice,
      customizationTotal,
      totalAmount,
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
        {/* Progress Bar */}
        <ProgressBar
          step={step}
          onBackStep={handleBackStep}
          steps={['Booking Details', 'Payment Method', 'Confirm & Pay']}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {renderStepContent()}
          </div>

          {/* Right Column - Summary Card */}
          <div className="lg:col-span-1">
            <SummaryCard
              property={property}
              bookingData={bookingData}
              periodInfo={periodInfo}
              formatPrice={formatPrice}
              calculateTotal={calculateTotal}
              getCustomizationTotal={getCustomizationTotal}
              totalAmount={totalAmount}
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