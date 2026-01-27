import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';

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

  const handleBookNow = () => {
    console.log('Booking property:', propertyUid);
    // Navigate to booking or show booking modal
    // navigate(`/book/${propertyUid}`);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Add to favorites API call here
    // api.post(`/user/favorites/${propertyUid}`, { isFavorite: !isFavorite });
  };

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

          {/* Right Column - Contact & Booking */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <ContactSection property={property} landlord={landlord} />
            <BookingSummary property={property} />
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
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-2xl text-gray-600">🚨</div>
                    <span className="text-sm font-medium text-gray-900">Report</span>
                    <span className="text-xs text-gray-500">Inappropriate content</span>
                  </button>

                  <button
                    onClick={handleFavorite}
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`text-2xl ${isFavorite ? 'text-red-500' : 'text-gray-600'}`}>
                      {isFavorite ? '❤️' : '🤍'}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {isFavorite ? 'Saved' : 'Save'}
                    </span>
                    <span className="text-xs text-gray-500">To wishlist</span>
                  </button>

                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
    </div>
  );
}