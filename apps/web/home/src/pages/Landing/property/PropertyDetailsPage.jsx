// src/pages/property/PropertyDetailsPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

// Import layout components
import MainHeader from '../../../components/LandingPage/Header/Header';
import BottomNav from '../../../components/LandingPage/BottomNav/BottomNav';
import Footer from '../../../components/ui/Footer';

// Import sub-components
import ImageGallery from '../../../components/LandingPage/property/ImageGallery';
import PropertyHeader from '../../../components/LandingPage/property/PropertyHeader';
import QuickStats from '../../../components/LandingPage/property/QuickStats';
import PropertyTabs from '../../../components/LandingPage/property/PropertyTabs';
import ContactSection from '../../../components/LandingPage/property/ContactSection';
import BookingSummary from '../../../components/LandingPage/property/BookingSummary';
import ShareModal from '../../../components/LandingPage/property/ShareModal';
import LandlordProfileCard from '../../../components/LandingPage/property/LandlordProfileCard';

// Import skeletons
import ImageGallerySkeleton from '../../../components/LandingPage/property/skeletons/ImageGallerySkeleton';
import QuickStatsSkeleton from '../../../components/LandingPage/property/skeletons/QuickStatsSkeleton';
import TabContentSkeleton from '../../../components/LandingPage/property/skeletons/TabContentSkeleton';
import PropertyHeaderSkeleton from '../../../components/LandingPage/property/skeletons/PropertyHeaderSkeleton';

// Price display helper
const formatPrice = (price) => {
  if (!price || price === 0 || price === '0') return 'Contact for price';
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function PropertyDetailsPage() {
  const { propertyUid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [landlord, setLandlord] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  
  const bookingSectionRef = useRef(null);
  const floatingButtonRef = useRef(null);
  const periodSelectorRef = useRef(null);

  const fetchPropertyDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch property with landlord data
      const propertyResponse = await api.get(`/public/properties/${propertyUid}`);

      if (propertyResponse.data.success && propertyResponse.data.data) {
        const responseData = propertyResponse.data.data;

        // Set property data
        setProperty(responseData.property);
        setImages(responseData.images || []);
        setAmenities(responseData.amenities || []);

        // Set landlord data (already includes SSO profile from backend)
        if (responseData.landlord) {
          setLandlord(responseData.landlord);

          // Optionally fetch additional landlord info if needed
          if (responseData.landlord.id) {
            try {
              const landlordResponse = await api.get(`/public/landlord/${responseData.landlord.id}`);
              if (landlordResponse.data.success) {
                setLandlord(prev => ({
                  ...prev,
                  ...landlordResponse.data.data
                }));
              }
            } catch (landlordError) {
              console.log('Additional landlord fetch failed:', landlordError.message);
              // Continue with basic landlord data
            }
          }
        }

        console.log('Property data loaded:', {
          property: responseData.property.title,
          images: responseData.images?.length,
          amenities: responseData.amenities?.length,
          landlord: responseData.landlord ? 'Yes' : 'No'
        });
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  }, [propertyUid]);

  useEffect(() => {
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  // Handle scroll to show/hide floating button on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 1024) { // Mobile only
        if (bookingSectionRef.current) {
          const rect = bookingSectionRef.current.getBoundingClientRect();
          // Show floating button when booking section is out of view
          const isBookingSectionVisible = rect.top < window.innerHeight && rect.bottom > 0;
          setShowFloatingButton(!isBookingSectionVisible);
        }
      } else {
        setShowFloatingButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close period selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodSelectorRef.current && !periodSelectorRef.current.contains(event.target) &&
          floatingButtonRef.current && !floatingButtonRef.current.contains(event.target)) {
        setShowPeriodSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBookNow = () => {
    console.log('Booking property:', propertyUid);
    // Navigate to booking with selected period
    navigate(`/book/${propertyUid}?period=${selectedPeriod}`);
  };

  const handleFavorite = async () => {
    if (!propertyUid) return;

    try {
      if (isFavorite) {
        // Remove from wishlist
        const response = await api.delete(`/wishlist/remove/${propertyUid}`);

        if (response.data.success) {
          setIsFavorite(false);
          toast.success('Removed from wishlist', {
            icon: '💔',
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            }
          });
        }
      } else {
        // Add to wishlist
        const response = await api.post(`/wishlist/add/${propertyUid}`);

        if (response.data.success) {
          setIsFavorite(true);
          toast.success('Added to wishlist!', {
            icon: '❤️',
            style: {
              borderRadius: '10px',
              background: '#BC8BBC',
              color: '#fff',
            }
          });
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error('Please login to save properties', {
          icon: '🔒',
          duration: 4000
        });
      } else if (error.response?.data?.code === 'ALREADY_IN_WISHLIST') {
        // Property already in wishlist - just update UI
        setIsFavorite(true);
        toast('Already in your wishlist', {
          icon: '❤️',
        });
      } else if (error.response?.data?.code === 'NOT_IN_WISHLIST') {
        // Property not in wishlist - just update UI
        setIsFavorite(false);
      } else if (error.response?.data?.code === 'PROPERTY_INACTIVE') {
        toast.error('This property is currently unavailable', {
          icon: '🏠',
        });
      } else {
        toast.error('Something went wrong. Please try again.', {
          icon: '❌',
        });
      }
    }
  };

  // Add this new callback function to sync with header
  const handleFavoriteChange = (newFavoriteState) => {
    setIsFavorite(newFavoriteState);
  };

  // Handle period selection from BookingSummary
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  // Handle period selection from floating button
  const handleFloatingPeriodSelect = (period) => {
    setSelectedPeriod(period);
    setShowPeriodSelector(false);
  };

  // Get all available periods for the floating selector
  const getAvailablePeriods = () => {
    if (!property) return [];
    
    const periods = [];
    if (property.accept_monthly && property.monthly_price > 0) {
      periods.push({ id: 'monthly', label: 'Monthly', price: property.monthly_price, period: 'month' });
    }
    if (property.accept_weekly && property.weekly_price > 0) {
      periods.push({ id: 'weekly', label: 'Weekly', price: property.weekly_price, period: 'week' });
    }
    if (property.accept_daily && property.daily_price > 0) {
      periods.push({ id: 'daily', label: 'Daily', price: property.daily_price, period: 'day' });
    }
    if (property.accept_nightly && property.nightly_price > 0) {
      periods.push({ id: 'nightly', label: 'Nightly', price: property.nightly_price, period: 'night' });
    }
    return periods;
  };

  // Get selected period data for floating button
  const getSelectedPeriodData = () => {
    const periods = getAvailablePeriods();
    return periods.find(p => p.id === selectedPeriod) || periods[0];
  };

  const availablePeriods = getAvailablePeriods();
  const selectedPeriodData = getSelectedPeriodData();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />

        {/* Property Navigation Header - Loading */}
        <header className="bg-white border-b border-gray-200 sticky top-16 z-30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
          {/* Property Header Skeleton */}
          <div className="mb-6">
            <div className="animate-pulse">
              <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
              <div className="h-5 w-full max-w-2xl bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Quick Stats Skeleton */}
          <div className="mb-6">
            <QuickStatsSkeleton />
          </div>

          {/* Image Gallery Skeleton */}
          <ImageGallerySkeleton />

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <TabContentSkeleton />
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 h-64 animate-pulse"></div>
              <div className="bg-white rounded-2xl p-6 h-80 animate-pulse"></div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation - Always visible */}
        <BottomNav />

        <Footer />
      </div>
    );
  }

  // Error state
  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />

        <main className="flex items-center justify-center p-4 min-h-[70vh] pb-24 md:pb-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🏚️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
            <p className="text-gray-600 mb-6">
              The property you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#BC8BBC] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#9A6A9A] transition-colors"
            >
              Browse Properties
            </button>
          </div>
        </main>

        <BottomNav />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Site Header */}
      <MainHeader />

      {/* Property Navigation Header */}
      <PropertyHeader
        navigate={navigate}
        showShareModal={() => setShowShareModal(true)}
        isFavorite={isFavorite}
        handleFavorite={handleFavorite}
        propertyUid={propertyUid}
        onFavoriteChange={handleFavoriteChange}
      />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
        {/* Quick Stats - Moved to be right after PropertyHeader */}
        <div className="mb-4 sm:mb-6">
          <QuickStats property={property} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Left Column - Gallery & Details */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Image Gallery with Title, Location, Price and Badges integrated */}
            <div className="rounded-xl sm:rounded-2xl overflow-hidden">
              <ImageGallery
                images={images}
                propertyTitle={property.title}
                property={property}
              />
            </div>

            <div className="rounded-xl sm:rounded-2xl overflow-hidden">
              <PropertyTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                property={property}
                amenities={amenities}
              />
            </div>
          </div>

          {/* Right Column - Booking & Contact */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6 lg:relative">
            {/* Booking Summary - With ref for scroll detection and sticky positioning */}
            <div ref={bookingSectionRef} className="lg:sticky lg:top-24 lg:z-20">
              <BookingSummary 
                property={property} 
                onPeriodChange={handlePeriodChange}
                selectedPeriod={selectedPeriod}
              />
            </div>
            
            {/* Contact Section - For additional contact info */}
            <ContactSection property={property} landlord={landlord} />
          </div>
        </div>

        {/* Advanced Property Actions & Security Section */}
        <div className="mt-6 sm:mt-8 md:mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column: Property Actions & Host Info */}
            <div className="space-y-4 sm:space-y-6">
              {/* Property Management */}
              <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Property Management</h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => console.log('Report property:', propertyUid)}
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="text-2xl text-gray-600">🚨</div>
                    <span className="text-sm font-medium text-gray-900">Report</span>
                    <span className="text-xs text-gray-500">Inappropriate content</span>
                  </button>

                  <button
                    onClick={handleFavorite}
                    className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                      isFavorite
                        ? 'border-[#BC8BBC] bg-[#BC8BBC]/5'
                        : 'border-gray-200 hover:border-[#BC8BBC]/40 hover:bg-[#BC8BBC]/5'
                    }`}
                  >
                    <div className={`text-2xl transition-colors duration-200 ${
                      isFavorite ? 'text-[#BC8BBC]' : 'text-gray-600'
                    }`}>
                      {isFavorite ? '❤️' : '🤍'}
                    </div>
                    <span className={`text-sm font-medium transition-colors duration-200 ${
                      isFavorite ? 'text-[#BC8BBC]' : 'text-gray-900'
                    }`}>
                      {isFavorite ? 'Saved' : 'Save'}
                    </span>
                    <span className={`text-xs transition-colors duration-200 ${
                      isFavorite ? 'text-[#BC8BBC]/70' : 'text-gray-500'
                    }`}>
                      To wishlist
                    </span>
                  </button>

                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="text-2xl text-gray-600">📤</div>
                    <span className="text-sm font-medium text-gray-900">Share</span>
                    <span className="text-xs text-gray-500">Property details</span>
                  </button>

                  {/* Landlord Profile Card */}
                  <div className="col-span-2 md:col-span-1">
                    <LandlordProfileCard
                      landlord={landlord}
                      propertyUid={propertyUid}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Security & Verification */}
            <div className="space-y-4 sm:space-y-6">
              {/* Security Section */}
              <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                      <span className="text-[#BC8BBC]">🛡️</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Secure Rental Experience</h4>
                    <p className="text-sm text-gray-700 mb-4">
                      To help protect your payment, always use Isanzure to send money and communicate with hosts.
                      Your rental activity builds credit for future property access.
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900">Payment Protection</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-[#BC8BBC]">✓</span>
                          <span>Secure payment processing with transaction records</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-[#BC8BBC]">✓</span>
                          <span>24/7 customer support and dispute resolution</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-900 mb-2">Account Benefits</div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-[#BC8BBC]">📈</span>
                            <span>Build rental history for future property access</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-[#BC8BBC]">🔑</span>
                            <span>Increase rental eligibility with consistent payments</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-[#BC8BBC]">🎫</span>
                            <span>Access to exclusive property listings</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Mobile - Shows only when booking section is scrolled out of view */}
      {showFloatingButton && property.status !== 'rented' && selectedPeriodData && (
        <div 
          ref={floatingButtonRef}
          className="fixed bottom-20 left-4 right-4 z-40 md:hidden"
        >
          <div className="relative">
            {/* Main Floating Button */}
            <div
              onClick={handleBookNow}
              className="w-full bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between px-4 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {/* Dynamic action text based on period */}
                <span className="text-sm">
                  {selectedPeriodData.id === 'monthly' ? 'Proceed to Rent' :
                   selectedPeriodData.id === 'weekly' ? 'Reserve Week' :
                   selectedPeriodData.id === 'daily' ? 'Reserve Day' :
                   selectedPeriodData.id === 'nightly' ? 'Book Night' : 'Book Now'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Period Badge - Completely separate click handler */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowPeriodSelector(!showPeriodSelector);
                  }}
                  className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full cursor-pointer hover:bg-white/30 transition-colors"
                >
                  <span className="text-xs font-medium">{selectedPeriodData.label}</span>
                  <svg 
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${showPeriodSelector ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Price */}
                <span className="text-sm font-bold">
                  {formatPrice(selectedPeriodData.price).replace('RWF', 'RF')}
                </span>
              </div>
            </div>

            {/* Period Selector Dropdown */}
            {showPeriodSelector && (
              <div 
                ref={periodSelectorRef}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 px-3 py-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Select Rental Period</span>
                  </div>
                  
                  {availablePeriods.map((period) => (
                    <button
                      key={period.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleFloatingPeriodSelect(period.id);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all cursor-pointer ${
                        selectedPeriod === period.id
                          ? 'bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10 border border-[#BC8BBC]/30'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Period icon */}
                        <span className="text-lg">
                          {period.id === 'monthly' ? '📅' :
                           period.id === 'weekly' ? '📆' :
                           period.id === 'daily' ? '☀️' : '🌙'}
                        </span>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">{period.label}</div>
                          <div className="text-xs text-gray-500">
                            {period.id === 'monthly' ? 'Long-term commitment' :
                             period.id === 'weekly' ? 'Perfect for stays' :
                             period.id === 'daily' ? 'Flexible booking' : 'Overnight stay'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">
                            {formatPrice(period.price).replace('RWF', 'RF')}
                          </div>
                          <div className="text-xs text-gray-500">per {period.period}</div>
                        </div>
                        {selectedPeriod === period.id && (
                          <svg className="w-5 h-5 text-[#BC8BBC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Quick action hint */}
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tap to select different period
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation - Always visible on mobile */}
      <BottomNav />

      {/* Site Footer */}
      <Footer />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        property={property}
      />

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}