// src/components/LandingPage/property/BookingSummary.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Calendar, DollarSign, ChevronDown, ChevronUp, Home, MessageCircle } from 'lucide-react';

export default function BookingSummary({ property, onBookNow }) {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [isSticky, setIsSticky] = useState(false);
  const [showAllPrices, setShowAllPrices] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 1024) {
        setIsSticky(window.scrollY > 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatPrice = (price) => {
    if (!price || price === 0 || price === '0') return 'Contact for price';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(price);
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
        icon: '📅',
        description: 'Ideal for long-term rental',
        actionText: 'Rent Monthly'
      });
    }
    
    if (property.accept_weekly && isValidPrice(property.weekly_price)) {
      periods.push({
        id: 'weekly',
        label: 'Weekly',
        price: Number(property.weekly_price),
        period: 'week',
        icon: '📅',
        description: 'Perfect for weekly stays',
        actionText: 'Book Weekly'
      });
    }
    
    if (property.accept_daily && isValidPrice(property.daily_price)) {
      periods.push({
        id: 'daily',
        label: 'Daily',
        price: Number(property.daily_price),
        period: 'day',
        icon: '☀️',
        description: 'Flexible daily booking',
        actionText: 'Book Daily'
      });
    }
    
    if (property.accept_nightly && isValidPrice(property.nightly_price)) {
      periods.push({
        id: 'nightly',
        label: 'Nightly',
        price: Number(property.nightly_price),
        period: 'night',
        icon: '🌙',
        description: 'Overnight accommodation',
        actionText: 'Book Nightly'
      });
    }
    
    return periods;
  };

  const availablePeriods = getAvailablePeriods();
  
  // Auto-select the first available period if current selection isn't available
  useEffect(() => {
    if (availablePeriods.length > 0 && !availablePeriods.find(p => p.id === selectedPeriod)) {
      setSelectedPeriod(availablePeriods[0].id);
    }
  }, [availablePeriods, selectedPeriod]);

  const selectedPeriodData = availablePeriods.find(p => p.id === selectedPeriod) || availablePeriods[0];

  // Calculate utilities - FIX NaN issue
  const getUtilitiesAmount = () => {
    if (property.utilities_included) return 0;
    const minUtil = property.utilities_min;
    return minUtil && minUtil > 0 && minUtil !== '0' ? Number(minUtil) : 0;
  };

  const utilitiesAmount = getUtilitiesAmount();
  const selectedPrice = selectedPeriodData?.price || 0;
  const totalAmount = Number(selectedPrice) + Number(utilitiesAmount);

  // Get appropriate title based on property type
  const getTitle = () => {
    const propertyType = property?.property_type?.toLowerCase();
    
    if (propertyType === 'ghetto' || propertyType === 'living_house') {
      return 'Rental Options';
    }
    
    return 'Booking & Rental Options';
  };

  // Get appropriate action button text
  const getActionText = () => {
    if (property.status === 'rented') {
      return '🚫 Currently Unavailable';
    }
    
    if (!selectedPeriodData) {
      return 'Check Availability';
    }
    
    const periodLabel = selectedPeriodData.label.toLowerCase();
    
    if (periodLabel === 'monthly') {
      return 'Proceed with Rental';
    }
    
    if (periodLabel === 'weekly') {
      return 'Book Weekly Stay';
    }
    
    if (periodLabel === 'daily' || periodLabel === 'nightly') {
      return 'Book Now';
    }
    
    return 'Continue';
  };

  // Get secondary action text (simpler)
  const getSecondaryActionText = () => {
    const propertyType = property?.property_type?.toLowerCase();
    
    if (propertyType === 'ghetto' || propertyType === 'living_house') {
      return 'Contact for Rental Details';
    }
    
    return 'Quick Questions? Message Host';
  };

  // Handle booking button click - redirect to booking process
  const handleBookNow = () => {
    if (property.status === 'rented') {
      return; // Don't proceed if rented
    }
    
    // Navigate to booking process with selected period
    navigate(`/book/${property.property_uid}?period=${selectedPeriod}`);
  };

  // Handle message button click
  const handleMessageHost = () => {
    // Navigate to messages or contact page
    navigate(`/tenant/messages?propertyId=${property.id}`);
  };

  if (availablePeriods.length === 0) {
    return (
      <div className={`bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 ${isSticky ? 'lg:sticky lg:top-24 lg:shadow-lg' : ''}`}>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Home className="h-5 w-5 text-[#BC8BBC]" />
          {getTitle()}
        </h3>
        <div className="text-center py-6">
          <div className="text-3xl mb-3 text-gray-300">🏠</div>
          <p className="text-gray-600 mb-4">Contact host for pricing and availability</p>
          <button
            onClick={handleMessageHost}
            disabled={property.status === 'rented'}
            className={`w-full py-3 rounded-lg font-medium transition-opacity ${
              property.status === 'rented'
                ? 'bg-gray-200 cursor-not-allowed text-gray-500'
                : 'bg-[#BC8BBC] text-white hover:opacity-90'
            }`}
          >
            {property.status === 'rented' ? 'Currently Rented' : 'Contact Host'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden ${isSticky ? 'lg:sticky lg:top-24 lg:shadow-lg' : ''}`}>
      <div className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Home className="h-5 w-5 text-[#BC8BBC]" />
          {getTitle()}
        </h3>
        
        {/* Period Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Select Period:</span>
            {availablePeriods.length > 1 && (
              <button
                onClick={() => setShowAllPrices(!showAllPrices)}
                className="text-xs text-[#BC8BBC] hover:text-[#9A6A9A] flex items-center gap-1"
              >
                {showAllPrices ? 'Show Less' : 'View All Options'}
                {showAllPrices ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>
          
          {/* Main Period Options */}
          <div className="flex flex-wrap gap-2 mb-3">
            {availablePeriods.slice(0, showAllPrices ? availablePeriods.length : 4).map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-3 py-2 rounded-lg text-sm transition-all flex-1 min-w-[100px] ${
                  selectedPeriod === period.id
                    ? 'bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <div className="font-medium">{period.label}</div>
                <div className="text-xs mt-1 opacity-90">{formatPrice(period.price)}</div>
              </button>
            ))}
          </div>
          
          {selectedPeriodData && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="font-medium">{selectedPeriodData.icon} {selectedPeriodData.label}:</span>{' '}
              {selectedPeriodData.description}
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-4 mb-6">
          {/* Selected Period Price */}
          {selectedPeriodData && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#BC8BBC]" />
                <span className="text-gray-700">{selectedPeriodData.label} Rate</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {formatPrice(selectedPeriodData.price)}
                </div>
                <div className="text-xs text-gray-500">per {selectedPeriodData.period}</div>
              </div>
            </div>
          )}

          {/* Utilities */}
          {property.utilities_included ? (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-gray-700">Utilities</span>
              </div>
              <span className="font-medium text-green-600">Included</span>
            </div>
          ) : utilitiesAmount > 0 ? (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">Utilities (estimate)</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {formatPrice(utilitiesAmount)}
                </div>
                <div className="text-xs text-gray-500">monthly</div>
              </div>
            </div>
          ) : null}

          {/* Total - Fixed NaN issue */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="font-bold text-gray-900">Estimated Total</div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  {formatPrice(totalAmount)}
                </div>
                <div className="text-xs text-gray-500">
                  for {selectedPeriodData?.label?.toLowerCase() || 'selected period'}
                </div>
              </div>
            </div>
          </div>

          {/* All Prices Summary (Collapsible) */}
          {availablePeriods.length > 1 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2">All Available Rates:</div>
              <div className="grid grid-cols-2 gap-2">
                {availablePeriods.map((period) => (
                  <div 
                    key={period.id}
                    className={`text-xs p-2 rounded border ${
                      period.id === selectedPeriod
                        ? 'bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10 border-[#BC8BBC]/30'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{period.label}</div>
                    <div className="text-gray-700 font-bold">{formatPrice(period.price)}</div>
                    <div className="text-gray-500">per {period.period}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Action Button */}
        <button
          onClick={handleBookNow}
          disabled={property.status === 'rented'}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            property.status === 'rented'
              ? 'bg-gray-200 cursor-not-allowed text-gray-500 border border-gray-300'
              : 'bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]'
          }`}
        >
          {getActionText()}
        </button>

        {/* Secondary Quick Action Button */}
        <button
          onClick={handleMessageHost}
          className="w-full mt-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-[#BC8BBC]/50 hover:text-[#BC8BBC] transition-colors"
        >
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>{getSecondaryActionText()}</span>
          </div>
        </button>

        {/* Additional Info */}
        <div className="mt-4 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <span className="text-[#BC8BBC]">✓</span>
              <span>Secure Process</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <span className="text-[#BC8BBC]">✓</span>
              <span>Flexible Terms</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <span className="text-[#BC8BBC]">✓</span>
              <span>24/7 Support</span>
            </span>
          </div>
          
          {/* Property Type Specific Info */}
          {(property?.property_type === 'ghetto' || property?.property_type === 'living_house') && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <span className="font-medium">🏠 Note:</span> Long-term rental agreements available. Contact host for contract details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}