// src/components/LandingPage/property/QuickStats.jsx
import React from 'react';
import { Bed, Ruler, Shield, Calendar, Home, Building, Users, Hotel, HomeIcon } from 'lucide-react';

export default function QuickStats({ property }) {
  // Determine if we should show exact room count or a capacity indicator
  const getRoomDisplay = () => {
    const propertyType = property.property_type?.toLowerCase();
    
    // Properties where exact room count is appropriate
    const exactRoomTypes = [
      'house', 'living_house', 'ghetto', 'apartment', 'condo', 
      'studio', 'bungalow', 'townhouse', 'penthouse', 'villa',
      'commercial', 'service_apartment', 'upmarket'
    ];
    
    // Properties where we should show capacity/size indicator instead
    const capacityTypes = [
      'guest_house', 'hostel', 'hotel', 'resort', 'motel',
      'inn', 'lodge', 'bed_and_breakfast'
    ];
    
    // If property type matches capacity types, show capacity indicator
    if (capacityTypes.includes(propertyType)) {
      if (property.total_rooms > 10) {
        return { value: 'Large', label: 'Capacity', icon: '🏨', isBadge: false };
      } else if (property.total_rooms > 5) {
        return { value: 'Medium', label: 'Capacity', icon: '🏢', isBadge: false };
      } else {
        return { value: 'Small', label: 'Capacity', icon: '🏠', isBadge: false };
      }
    }
    
    // If property type matches exact room types and has rooms, show exact count
    if (exactRoomTypes.includes(propertyType) && property.total_rooms > 0) {
      return { 
        value: `${property.total_rooms}`, 
        label: property.total_rooms === 1 ? 'Room' : 'Rooms',
        icon: <Bed className="h-3 w-3" />,
        isBadge: false
      };
    }
    
    // Default: show a generic space indicator
    if (property.total_rooms > 0) {
      return { 
        value: '🏠', 
        label: 'Space',
        icon: '',
        isBadge: false
      };
    }
    
    // No rooms data
    return null;
  };

  // Get area display
  const getAreaDisplay = () => {
    if (property.area && property.area > 0) {
      return {
        icon: <Ruler className="h-3 w-3" />,
        label: 'Area',
        value: `${property.area} m²`,
        isBadge: false
      };
    }
    return null;
  };

  // Get verified status
  const getVerifiedDisplay = () => {
    if (property.is_verified === 1 || property.is_verified === true) {
      return {
        icon: '✅',
        label: 'Verified',
        value: '',
        color: 'from-green-50 to-green-100',
        isBadge: true
      };
    }
    return null;
  };

  // Get availability status
  const getAvailabilityDisplay = () => {
    const isAvailable = property.status === 'active';
    return {
      icon: '',
      label: 'Status',
      value: isAvailable ? 'Available' : 'Rented',
      color: isAvailable ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100',
      isBadge: true
    };
  };

  // Get guests capacity (if applicable)
  const getGuestsDisplay = () => {
    const propertyType = property.property_type?.toLowerCase();
    const capacityTypes = ['guest_house', 'hostel', 'hotel', 'resort'];
    
    // Only show guests for capacity-type properties
    if (capacityTypes.includes(propertyType) && property.max_guests > 0) {
      return {
        icon: <Users className="h-3 w-3" />,
        label: 'Guests',
        value: `${property.max_guests}+`,
        isBadge: false
      };
    }
    return null;
  };

  // Property type badge
  const getPropertyTypeDisplay = () => {
    if (property.property_type && property.property_type !== '0') {
      const typeLabel = property.property_type === 'ghetto' ? 'GHETTO' :
        property.property_type === 'upmarket' ? 'UPPERMARKET' :
        property.property_type.replace('_', ' ').toUpperCase();
      return {
        icon: '🏠',
        label: typeLabel,
        value: '',
        color: 'from-[#BC8BBC]/20 to-[#8A5A8A]/20',
        isBadge: true
      };
    }
    return null;
  };

  // Featured badge
  const getFeaturedDisplay = () => {
    if (property.is_featured === 1 || property.is_featured === true) {
      return {
        icon: '⭐',
        label: 'Featured',
        value: '',
        color: 'from-amber-50 to-orange-100',
        isBadge: true
      };
    }
    return null;
  };

  // Collect all stats and badges
  const roomDisplay = getRoomDisplay();
  const areaDisplay = getAreaDisplay();
  const verifiedDisplay = getVerifiedDisplay();
  const availabilityDisplay = getAvailabilityDisplay();
  const guestsDisplay = getGuestsDisplay();
  const propertyTypeDisplay = getPropertyTypeDisplay();
  const featuredDisplay = getFeaturedDisplay();

  // Combine all stats
  const allStats = [
    propertyTypeDisplay,
    featuredDisplay,
    verifiedDisplay,
    availabilityDisplay,
    roomDisplay,
    areaDisplay,
    guestsDisplay
  ].filter(stat => stat !== null);

  // If we have no valid stats, don't show the section
  if (allStats.length === 0) {
    return null;
  }

  // Calculate grid columns based on number of items for better fit
  const getGridCols = () => {
    const count = allStats.length;
    if (count <= 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
    if (count === 5) return 'grid-cols-3 sm:grid-cols-5';
    if (count === 6) return 'grid-cols-3 sm:grid-cols-6';
    return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6';
  };

  return (
    <div className={`grid ${getGridCols()} gap-1.5 sm:gap-2`}>
      {allStats.map((stat, index) => (
        <div 
          key={index}
          className={`bg-white rounded-lg p-1.5 sm:p-2 border border-gray-200 hover:border-gray-300 transition-colors ${
            stat.isBadge ? 'shadow-sm' : ''
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center min-h-[50px] sm:min-h-[55px]">
            {/* Icon/Emoji */}
            <div className={`mb-0.5 ${stat.isBadge ? 'text-lg' : 'text-gray-600'}`}>
              {typeof stat.icon === 'string' ? (
                <span>{stat.icon}</span>
              ) : stat.icon ? (
                <div className="flex items-center justify-center">
                  {stat.icon}
                </div>
              ) : null}
            </div>
            
            {/* Value/Label */}
            <div className="space-y-0.5">
              {stat.value && (
                <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                  {stat.value}
                </div>
              )}
              <div className="text-[10px] sm:text-xs text-gray-500 leading-tight">
                {stat.label}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}