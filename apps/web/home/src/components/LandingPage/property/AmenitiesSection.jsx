// src/pages/Property/components/AmenitiesSection.jsx
import React, { useState } from 'react';

export default function AmenitiesSection({ amenities }) {
  const [showAll, setShowAll] = useState(false);
  
  const amenitiesByCategory = amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {});

  const getIcon = (category, amenityName) => {
    const emojiMap = {
      'wifi': '📶',
      'electricity': '⚡',
      'water': '💧',
      'parking': '🅿️',
      'security': '🛡️',
      'pool': '🏊',
      'gym': '💪',
      'tv': '📺',
      'ac': '❄️',
      'heating': '🔥',
      'kitchen': '🍳',
      'laundry': '🧺',
      'elevator': '🛗',
      'garden': '🌳',
      'balcony': '🏙️',
      'fitness': '💪',
      'entertainment': '🎮',
      'comfort': '✨',
      'additional': '➕',
      'infrastructure': '🏗️',
      'work': '💼',
      'outdoor': '🌿',
      'accessibility': '♿',
      'default': '✅'
    };

    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (amenityName.toLowerCase().includes(key) || category.toLowerCase().includes(key)) {
        return emoji;
      }
    }

    return emojiMap.default;
  };

  const categoryNames = {
    'infrastructure': '🏗️ Infrastructure',
    'security': '🛡️ Security',
    'comfort': '✨ Comfort',
    'kitchen': '🍳 Kitchen',
    'entertainment': '📺 Entertainment',
    'outdoor': '🌳 Outdoor',
    'laundry': '🧺 Laundry',
    'accessibility': '♿ Accessibility',
    'additional': '➕ Additional',
    'work': '💼 Work',
    'fitness': '💪 Fitness'
  };

  const categories = Object.entries(amenitiesByCategory);
  const visibleCategories = showAll ? categories : categories.slice(0, 3);

  if (!amenities || amenities.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center py-8">
        <div className="text-4xl mb-4">🔧</div>
        <p className="text-gray-600">No amenities listed</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">🔧 Amenities</h3>
        <div className="text-gray-500">
          {amenities.length} available
        </div>
      </div>
      
      <div className="space-y-8">
        {visibleCategories.map(([category, categoryAmenities]) => (
          <div key={category}>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {categoryNames[category] || category}
              <span className="text-sm text-gray-500 font-normal">
                ({categoryAmenities.length})
              </span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categoryAmenities.map((amenity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-2xl">
                    {getIcon(category, amenity.amenity_name)}
                  </div>
                  <span className="text-gray-700 text-sm sm:text-base">{amenity.amenity_name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {categories.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-6 w-full text-center text-[#BC8BBC] hover:text-[#9A6A9A] font-medium py-3 border border-[#BC8BBC] rounded-lg transition-colors"
        >
          {showAll ? '👆 Show Less' : `👇 Show All ${categories.length} Categories`}
        </button>
      )}
    </div>
  );
}