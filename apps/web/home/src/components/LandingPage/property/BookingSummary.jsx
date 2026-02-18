// src/components/LandingPage/property/BookingSummary.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ChevronDown, ChevronUp, Calendar, Clock, Sun, Moon } from 'lucide-react';

export default function BookingSummary({ property, onPeriodChange, selectedPeriod: externalSelectedPeriod }) {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState(externalSelectedPeriod || 'monthly');
  const [isSticky, setIsSticky] = useState(false);
  const [showAllPrices, setShowAllPrices] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 1024) {
        // On desktop, make the whole section sticky
        const bookingSection = document.getElementById('booking-summary');
        if (bookingSection) {
          const rect = bookingSection.getBoundingClientRect();
          const headerHeight = 80; // Height of the main header
          const shouldBeSticky = window.scrollY > headerHeight + 100 && rect.bottom > window.innerHeight;
          
          if (shouldBeSticky !== isSticky) {
            setIsSticky(shouldBeSticky);
          }
        }
      } else {
        if (isSticky) setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky]);

  // Update local state when external selected period changes
  useEffect(() => {
    if (externalSelectedPeriod) {
      setSelectedPeriod(externalSelectedPeriod);
    }
  }, [externalSelectedPeriod]);

  const formatPrice = (price) => {
    if (!price || price === 0 || price === '0') return 'Contact';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(price).replace('RWF', 'RF');
  };

  // Get all available booking periods with their prices
  const getAvailablePeriods = () => {
    const periods = [];
    
    // Check if price is valid (not 0 or null)
    const isValidPrice = (price) => price && price > 0 && price !== '0';
    
    if (property.accept_monthly && isValidPrice(property.monthly_price)) {
      periods.push({
        id: 'monthly',
        label: 'Monthly',
        price: Number(property.monthly_price),
        period: 'month',
        icon: <Calendar className="w-3 h-3" />,
        actionText: 'Proceed to Rent',
        actionSubtext: 'Long-term commitment'
      });
    }
    
    if (property.accept_weekly && isValidPrice(property.weekly_price)) {
      periods.push({
        id: 'weekly',
        label: 'Weekly',
        price: Number(property.weekly_price),
        period: 'week',
        icon: <Clock className="w-3 h-3" />,
        actionText: 'Reserve Week',
        actionSubtext: 'Perfect for stays'
      });
    }
    
    if (property.accept_daily && isValidPrice(property.daily_price)) {
      periods.push({
        id: 'daily',
        label: 'Daily',
        price: Number(property.daily_price),
        period: 'day',
        icon: <Sun className="w-3 h-3" />,
        actionText: 'Reserve Day',
        actionSubtext: 'Flexible booking'
      });
    }
    
    if (property.accept_nightly && isValidPrice(property.nightly_price)) {
      periods.push({
        id: 'nightly',
        label: 'Nightly',
        price: Number(property.nightly_price),
        period: 'night',
        icon: <Moon className="w-3 h-3" />,
        actionText: 'Book Night',
        actionSubtext: 'Overnight stay'
      });
    }
    
    return periods;
  };

  const availablePeriods = getAvailablePeriods();
  
  // Auto-select the first available period if current selection isn't available
  useEffect(() => {
    if (availablePeriods.length > 0 && !availablePeriods.find(p => p.id === selectedPeriod)) {
      const firstPeriod = availablePeriods[0].id;
      setSelectedPeriod(firstPeriod);
      if (onPeriodChange) onPeriodChange(firstPeriod);
    }
  }, [availablePeriods, selectedPeriod, onPeriodChange]);

  const selectedPeriodData = availablePeriods.find(p => p.id === selectedPeriod) || availablePeriods[0];

  // Notify parent of period changes
  const handlePeriodSelect = (periodId) => {
    setSelectedPeriod(periodId);
    if (onPeriodChange) onPeriodChange(periodId);
  };

  // Get appropriate action button text
  const getActionText = () => {
    if (property.status === 'rented') {
      return 'Currently Unavailable';
    }
    
    if (!selectedPeriodData) {
      return 'Check Availability';
    }
    
    return selectedPeriodData.actionText;
  };

  // Get action subtext
  const getActionSubtext = () => {
    if (property.status === 'rented' || !selectedPeriodData) return '';
    return selectedPeriodData.actionSubtext;
  };

  // Handle booking button click - redirect to booking process
  const handleBookNow = () => {
    if (property.status === 'rented') {
      return; // Don't proceed if rented
    }
    
    // Navigate to booking process with selected period
    navigate(`/book/${property.property_uid}?period=${selectedPeriod}`);
  };

  if (availablePeriods.length === 0) {
    return (
      <div 
        id="booking-summary"
        className={`bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 transition-all duration-300 ${
          isSticky 
            ? 'lg:sticky lg:top-24 lg:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] lg:border-[#BC8BBC]/20' 
            : 'lg:shadow-md hover:shadow-lg'
        }`}
      >
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Home className="h-5 w-5 text-[#BC8BBC]" />
          Rental Options
        </h3>
        <div className="text-center py-6">
          <div className="text-3xl mb-3 text-gray-300">🏠</div>
          <p className="text-gray-600 mb-4">Contact host for pricing</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="booking-summary"
      className={`
        bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden 
        transition-all duration-300 
        ${isSticky 
          ? 'lg:sticky lg:top-24 lg:shadow-[0_20px_40px_-10px_rgba(188,139,188,0.4)] lg:border-[#BC8BBC]/30 lg:z-40' 
          : 'lg:shadow-md hover:shadow-lg'
        }
      `}
    >
      <div className={`p-4 sm:p-6 ${isSticky ? 'lg:py-4' : ''}`}>
        <h3 className={`font-bold text-gray-900 mb-4 flex items-center gap-2 ${
          isSticky ? 'lg:text-base' : 'text-lg sm:text-xl'
        }`}>
          <Home className={`${isSticky ? 'lg:h-4 lg:w-4' : 'h-5 w-5'} text-[#BC8BBC]`} />
          Rental Options
        </h3>
        
        {/* Period Selection - Compact and professional */}
        <div className={`mb-4 ${isSticky ? 'lg:mb-3' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium text-gray-700 ${
              isSticky ? 'lg:text-xs' : 'text-xs sm:text-sm'
            }`}>
              Select Period:
            </span>
            {availablePeriods.length > 1 && (
              <button
                onClick={() => setShowAllPrices(!showAllPrices)}
                className={`text-[#BC8BBC] hover:text-[#9A6A9A] flex items-center gap-1 transition-colors cursor-pointer ${
                  isSticky ? 'lg:text-[10px]' : 'text-[10px] sm:text-xs'
                }`}
              >
                {showAllPrices ? 'Show Less' : 'View All'}
                {showAllPrices ? 
                  <ChevronUp className={`${isSticky ? 'lg:h-2.5 lg:w-2.5' : 'h-2.5 w-2.5 sm:h-3 sm:w-3'}`} /> : 
                  <ChevronDown className={`${isSticky ? 'lg:h-2.5 lg:w-2.5' : 'h-2.5 w-2.5 sm:h-3 sm:w-3'}`} />
                }
              </button>
            )}
          </div>
          
          {/* Period Options - Compact buttons with icons */}
          <div className="flex flex-nowrap sm:flex-wrap gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {availablePeriods.slice(0, showAllPrices ? availablePeriods.length : 4).map((period) => (
              <button
                key={period.id}
                onClick={() => handlePeriodSelect(period.id)}
                className={`
                  flex-shrink-0 rounded-lg transition-all cursor-pointer
                  ${selectedPeriod === period.id
                    ? 'bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }
                  ${isSticky 
                    ? 'lg:px-2 lg:py-1.5 lg:min-w-[60px]' 
                    : 'px-2 sm:px-3 py-1.5 sm:py-2 min-w-[65px] sm:min-w-[80px]'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className={`${isSticky ? 'lg:text-[8px]' : 'text-[10px] sm:text-xs'}`}>
                    {period.icon}
                  </span>
                  <span className={`font-medium ${
                    isSticky ? 'lg:text-[9px]' : 'text-[10px] sm:text-xs'
                  }`}>
                    {period.label}
                  </span>
                </div>
                <div className={`font-bold ${
                  isSticky ? 'lg:text-[9px]' : 'text-[9px] sm:text-[10px]'
                } ${selectedPeriod === period.id ? 'text-white' : 'text-gray-900'}`}>
                  {formatPrice(period.price)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Action Button - Pro styling with subtext */}
        <button
          onClick={handleBookNow}
          disabled={property.status === 'rented'}
          className={`
            w-full rounded-lg font-bold transition-all cursor-pointer
            ${property.status === 'rented'
              ? 'bg-gray-200 cursor-not-allowed text-gray-500 border border-gray-300'
              : 'bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]'
            }
            ${isSticky 
              ? 'lg:py-2.5 lg:text-sm' 
              : 'py-2.5 sm:py-3.5 text-sm sm:text-base'
            }
          `}
        >
          <div className="flex flex-col items-center">
            <span>{getActionText()}</span>
            {getActionSubtext() && (
              <span className={`font-normal opacity-90 ${
                isSticky ? 'lg:text-[9px]' : 'text-[9px] sm:text-xs'
              }`}>
                {getActionSubtext()}
              </span>
            )}
          </div>
        </button>

        {/* Quick price badge for sticky mode */}
        {isSticky && selectedPeriodData && (
          <div className="hidden lg:block mt-2 text-center animate-fade-in">
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10 px-2 py-1 rounded-full border border-[#BC8BBC]/20">
              <span className="text-[9px] font-medium text-gray-600">{selectedPeriodData.label}</span>
              <span className="text-[10px] font-bold text-[#BC8BBC]">{formatPrice(selectedPeriodData.price)}</span>
              <span className="text-[8px] text-gray-500">/{selectedPeriodData.period}</span>
            </div>
          </div>
        )}
      </div>

      {/* Add custom scrollbar hiding for mobile */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
} 