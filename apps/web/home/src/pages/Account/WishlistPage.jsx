import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MapPin, Home, Check, Moon, Calendar, MoreHorizontal, Star, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// Professional skeleton loading component that matches actual property cards
const WishlistCardSkeleton = () => (
  <div className="flex flex-col animate-pulse">
    <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
      {/* Image skeleton */}
      <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 relative">
        <div className="absolute top-3 left-3 w-16 h-6 bg-white/80 backdrop-blur-sm rounded-full"></div>
        <div className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-3">
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="flex items-start gap-1.5 mb-3">
          <div className="w-3 h-3 bg-gray-200 rounded-full mt-0.5"></div>
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyWishlistState = ({ navigate }) => (
  <div className="min-h-[70vh] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-4">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] flex items-center justify-center">
        <Heart className="h-12 w-12 text-[#BC8BBC]" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Your wishlist is empty
      </h2>
      
      <p className="text-gray-600 mb-8">
        Save properties you love by tapping the heart icon. They'll appear here for easy access when you're ready to book.
      </p>
      
      <div className="space-y-4">
        <button
          onClick={() => navigate('/properties')}
          className="w-full bg-[#BC8BBC] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#8A5A8A] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <ShoppingBag size={18} />
          Browse Properties
        </button>
        
        <div className="grid grid-cols-3 gap-3 mt-8">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#BC8BBC]/10 flex items-center justify-center">
              <Heart size={18} className="text-[#BC8BBC]" />
            </div>
            <p className="text-xs text-gray-600">Save favorites</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#BC8BBC]/10 flex items-center justify-center">
              <Star size={18} className="text-[#BC8BBC]" />
            </div>
            <p className="text-xs text-gray-600">Get updates</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#BC8BBC]/10 flex items-center justify-center">
              <MapPin size={18} className="text-[#BC8BBC]" />
            </div>
            <p className="text-xs text-gray-600">Quick access</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({
    total: 0,
    verified: 0,
    added_today: 0
  });
  
  const navigate = useNavigate();
  const observer = useRef();
  const limit = 20;

  // Fetch wishlist items
  const fetchWishlist = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await api.get('/wishlist', {
        params: {
          page: pageNum,
          limit: limit,
          sort: 'saved_at',
          order: 'DESC'
        }
      });

      if (response.data.success) {
        const newItems = response.data.data.items || [];
        const pagination = response.data.data.pagination;
        
        setWishlistItems(prev => 
          append ? [...prev, ...newItems] : newItems
        );
        
        setHasMore(pagination?.has_more || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to view your wishlist', { icon: '🔒' });
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch wishlist summary
  const fetchSummary = async () => {
    try {
      const response = await api.get('/wishlist/summary');
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Load more items for infinite scroll
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchWishlist(page + 1, true);
    }
  }, [hasMore, loadingMore, page]);

  // Infinite scroll observer
  const lastItemRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, { rootMargin: '100px' });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, loadMore]);

  // Remove from wishlist
  const handleRemove = async (propertyUid, event) => {
    event.stopPropagation();
    
    try {
      const response = await api.delete(`/wishlist/remove/${propertyUid}`);
      
      if (response.data.success) {
        // Find the item before removing to update summary correctly
        const removedItem = wishlistItems.find(item => item.property?.id === propertyUid || item.property?.uid === propertyUid);
        
        // Remove from local state
        setWishlistItems(prev => prev.filter(item => {
          const itemId = item.property?.id || item.property?.uid;
          return itemId !== propertyUid;
        }));
        
        // Update summary
        setSummary(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          verified: removedItem?.property?.verified ? Math.max(0, prev.verified - 1) : prev.verified
        }));
        
        toast.success('Removed from wishlist', {
          icon: '💔',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          }
        });
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove', { icon: '❌' });
    }
  };

  // Clear entire wishlist
  const handleClearWishlist = async () => {
    if (wishlistItems.length === 0) return;
    
    if (!window.confirm(`Clear all ${wishlistItems.length} items from your wishlist?`)) {
      return;
    }
    
    try {
      const response = await api.delete('/wishlist/clear');
      
      if (response.data.success) {
        setWishlistItems([]);
        setSummary(prev => ({ ...prev, total: 0, verified: 0 }));
        toast.success('Wishlist cleared', { icon: '🗑️' });
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist', { icon: '❌' });
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWishlist(1);
    fetchSummary();
  }, []);

  // Utility functions (matching PropertyListings)
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Contact';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatPropertyType = (type) => {
    if (!type) return '';
    const typeMap = {
      'apartment': 'APARTMENT',
      'house': 'HOUSE',
      'villa': 'VILLA',
      'condo': 'CONDO',
      'studio': 'STUDIO',
      'ghetto': 'GHETTO',
      'living_house': 'LIVING HOUSE',
      'service_apartment': 'SERVICE APT',
      'guest_house': 'GUEST HOUSE',
      'bungalow': 'BUNGALOW',
      'commercial': 'COMMERCIAL',
      'hostel': 'HOSTEL',
      'penthouse': 'PENTHOUSE',
      'townhouse': 'TOWNHOUSE',
      'upmarket': 'UP MARKET'
    };
    return typeMap[type] || type.toUpperCase().replace('_', ' ');
  };

  const getCompleteLocation = (property) => {
    const location = property.location || property;
    const parts = [];
    if (location.district) parts.push(location.district);
    if (location.sector) parts.push(location.sector);
    if (location.cell) parts.push(location.cell);
    if (location.village) parts.push(location.village);
    return parts.join(' • ') || 'Location not specified';
  };

  const getPriceOptions = (property) => {
    const pricing = property.pricing || property;
    const options = [];
    
    if (pricing.monthly > 0) {
      options.push({
        amount: pricing.monthly,
        period: 'month',
        label: 'Monthly',
        icon: <Calendar size={12} />,
        primary: true
      });
    }
    
    if (pricing.weekly > 0) {
      options.push({
        amount: pricing.weekly,
        period: 'week',
        label: 'Weekly',
        icon: <Calendar size={12} />
      });
    }
    
    if (pricing.daily > 0) {
      options.push({
        amount: pricing.daily,
        period: 'day',
        label: 'Daily',
        icon: <Calendar size={12} />
      });
    }
    
    return options;
  };

  const handlePropertyClick = (propertyUid) => {
    navigate(`/properties/${propertyUid}`);
  };

  // Format relative time
  const formatSavedTime = (savedAt) => {
    const saved = new Date(savedAt);
    const now = new Date();
    const diffDays = Math.floor((now - saved) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return saved.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-3 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <WishlistCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-3 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-6 w-6 text-[#BC8BBC] fill-[#BC8BBC]" />
              My Wishlist
            </h1>
            <p className="text-gray-600 mt-1">
              Save your favorite properties for later
            </p>
          </div>
          
          <EmptyWishlistState navigate={navigate} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-3 py-8">
        {/* Header with Summary */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-6 w-6 text-[#BC8BBC] fill-[#BC8BBC]" />
              My Wishlist
            </h1>
          </div>
          
          {/* Clear All Button */}
          {wishlistItems.length > 0 && (
            <button
              onClick={handleClearWishlist}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-200 hover:bg-red-50 transition-all duration-200 self-start"
            >
              <Trash2 size={16} />
              Clear all
            </button>
          )}
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {wishlistItems.map((item, index) => {
            const property = item.property;
            if (!property) return null;
            
            const priceOptions = getPriceOptions(property);
            const primaryOption = priceOptions[0];
            const secondaryOption = priceOptions[1];
            const propertyType = formatPropertyType(property.type);
            const propertyId = property.id || property.uid;
            
            return (
              <div 
                key={item.id || index}
                ref={index === wishlistItems.length - 5 ? lastItemRef : null}
                className="group cursor-pointer flex flex-col"
                onClick={() => handlePropertyClick(propertyId)}
              >
                <div className="relative rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-[#BC8BBC] hover:shadow-lg transition-all duration-300 flex-1 flex flex-col">
                  {/* Property Image */}
                  <div className="h-40 relative overflow-hidden flex-shrink-0">
                    {property.images?.cover ? (
                      <img 
                        src={property.images.cover} 
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] flex items-center justify-center">
                        <Home className="h-10 w-10 text-[#BC8BBC]/50" />
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    
                    {/* Property Type Badge */}
                    <div className="absolute top-3 left-3">
                      <div className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full">
                        <span className="text-[10px] font-bold text-[#BC8BBC] leading-tight tracking-tight">
                          {propertyType}
                        </span>
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button 
                      className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all duration-200 group/remove"
                      onClick={(e) => handleRemove(propertyId, e)}
                      title="Remove from wishlist"
                    >
                      <Heart size={16} className="text-[#BC8BBC] fill-[#BC8BBC] group-hover/remove:text-red-500 group-hover/remove:fill-red-500 transition-colors" />
                    </button>
                    
                    {/* Saved Time Badge */}
                    <div className="absolute bottom-3 left-3">
                      <div className="px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                        <span className="text-[10px] text-white">
                          Saved {formatSavedTime(item.saved_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Verified Badge */}
                    {property.verified && (
                      <div className="absolute bottom-3 right-3">
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-full">
                          <Check size={12} className="stroke-[2.5]" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Property Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
                      {property.title || 'Beautiful Property'}
                    </h3>
                    
                    {/* Complete Location */}
                    <div className="flex items-start gap-1.5 mb-2 flex-grow">
                      <MapPin size={12} className="text-[#BC8BBC] flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {getCompleteLocation(property)}
                      </span>
                    </div>
                    
                    {/* Price Options */}
                    <div className="pt-2 border-t border-gray-100 mt-auto">
                      {primaryOption ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {primaryOption.icon}
                              <span className="text-xs text-gray-500">{primaryOption.label}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900 text-sm">
                                {formatPrice(primaryOption.amount)}
                              </div>
                            </div>
                          </div>
                          
                          {secondaryOption && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {secondaryOption.icon}
                                <span className="text-xs text-gray-500">{secondaryOption.label}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-700 text-sm">
                                  {formatPrice(secondaryOption.amount)}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {priceOptions.length > 2 && (
                            <div className="flex items-center justify-center pt-1">
                              <div className="flex items-center gap-1 text-xs text-[#BC8BBC]">
                                <MoreHorizontal size={12} />
                                <span>+{priceOptions.length - 2} more</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-1">
                          <span className="text-sm text-gray-500">Contact for pricing</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading More Skeletons */}
        {loadingMore && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <WishlistCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}