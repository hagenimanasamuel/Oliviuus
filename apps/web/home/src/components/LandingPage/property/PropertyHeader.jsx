// src/components/LandingPage/property/PropertyHeader.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Share2, Loader } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

export default function PropertyHeader({ 
  navigate, 
  showShareModal, 
  propertyUid,
  isFavorite: propIsFavorite,
  handleFavorite: propHandleFavorite,
  onFavoriteChange 
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFavorite, setIsFavorite] = useState(propIsFavorite || false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const colors = {
    primary: '#BC8BBC',
    primaryDark: '#8A5A8A',
    primaryLight: '#E6D3E6'
  };

  // Sync with prop when it changes
  useEffect(() => {
    setIsFavorite(propIsFavorite);
  }, [propIsFavorite]);

  // Check if property is in wishlist on mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!propertyUid) {
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        const response = await api.get(`/wishlist/check/${propertyUid}`);
        
        if (response.data.success) {
          const isFav = response.data.data.in_wishlist;
          setIsFavorite(isFav);
          if (onFavoriteChange) {
            onFavoriteChange(isFav);
          }
        }
      } catch (error) {
        // Silently fail - user might not be authenticated
        console.log('Not authenticated or error checking wishlist');
        setIsFavorite(false);
      } finally {
        setChecking(false);
      }
    };

    checkWishlistStatus();
  }, [propertyUid, onFavoriteChange]);

  // Handle favorite toggle
  const handleFavoriteClick = async () => {
    if (checking || loading || !propertyUid) return;

    try {
      setLoading(true);

      if (isFavorite) {
        const response = await api.delete(`/wishlist/remove/${propertyUid}`);
        
        if (response.data.success) {
          setIsFavorite(false);
          if (onFavoriteChange) onFavoriteChange(false);
          if (propHandleFavorite) propHandleFavorite();
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
        const response = await api.post(`/wishlist/add/${propertyUid}`);
        
        if (response.data.success) {
          setIsFavorite(true);
          if (onFavoriteChange) onFavoriteChange(true);
          if (propHandleFavorite) propHandleFavorite();
          toast.success('Added to wishlist!', {
            icon: '❤️',
            style: {
              borderRadius: '10px',
              background: colors.primary,
              color: '#fff',
            }
          });
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please login to save properties', {
          icon: '🔒',
          duration: 4000
        });
      } else if (error.response?.data?.code === 'ALREADY_IN_WISHLIST') {
        setIsFavorite(true);
        if (onFavoriteChange) onFavoriteChange(true);
        toast('Already in your wishlist', { icon: '❤️' });
      } else if (error.response?.data?.code === 'NOT_IN_WISHLIST') {
        setIsFavorite(false);
        if (onFavoriteChange) onFavoriteChange(false);
      } else if (error.response?.data?.code === 'PROPERTY_INACTIVE') {
        toast.error('This property is currently unavailable', { icon: '🏠' });
      } else {
        toast.error('Something went wrong. Please try again.', { icon: '❌' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If still checking initial status, show skeleton
  if (checking) {
    return (
      <div className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm' 
          : 'bg-white border-b border-gray-100'
      }`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section - Back Button Skeleton */}
            <div className="flex items-center gap-4">
              <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>

            {/* Right Section - Actions Skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sticky top-0 z-30 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm' 
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-3 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-white border border-gray-200 hover:border-[#BC8BBC]/40 hover:bg-[#BC8BBC]/5 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-[#BC8BBC] transition-colors" />
              <span className="hidden sm:inline font-medium text-gray-700 group-hover:text-[#BC8BBC] transition-colors">
                Back
              </span>
            </button>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <button 
              onClick={showShareModal}
              className="group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-white border border-gray-200 hover:border-[#BC8BBC]/40 hover:bg-[#BC8BBC]/5 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Share2 className="h-5 w-5 text-gray-600 group-hover:text-[#BC8BBC] transition-colors" />
              <span className="hidden sm:inline font-medium text-gray-700 group-hover:text-[#BC8BBC] transition-colors">
                Share
              </span>
            </button>

            {/* Save Button */}
            <button 
              onClick={handleFavoriteClick}
              disabled={loading}
              className={`group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-white border transition-all duration-200 shadow-sm hover:shadow-md ${
                isFavorite 
                  ? 'border-[#BC8BBC] bg-[#BC8BBC]/10' 
                  : 'border-gray-200 hover:border-[#BC8BBC] hover:bg-[#BC8BBC]/10'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <Loader className="h-5 w-5 animate-spin" style={{ color: colors.primary }} />
              ) : (
                <Heart className={`h-5 w-5 transition-all duration-300 ${
                  isFavorite 
                    ? 'fill-[#BC8BBC] text-[#BC8BBC]' 
                    : 'text-gray-600 group-hover:text-[#BC8BBC]'
                }`} />
              )}
              <span className={`hidden sm:inline font-medium transition-colors ${
                isFavorite 
                  ? 'text-[#BC8BBC]' 
                  : 'text-gray-700 group-hover:text-[#BC8BBC]'
              }`}>
                {isFavorite ? 'Saved' : 'Save'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}