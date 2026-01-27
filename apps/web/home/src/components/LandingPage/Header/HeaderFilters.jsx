// HeaderFilters.js - Updated with quick filters
import { Home, Star, MapPin, TrendingUp } from 'lucide-react';

export default function HeaderFilters() {
  const quickFilters = [
    { label: 'Homes', icon: <Home size={14} /> },
    { label: 'Top Rated', icon: <Star size={14} /> },
    { label: 'Near Me', icon: <MapPin size={14} /> },
    { label: 'Trending', icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="flex items-center justify-center mt-3 space-x-6">
      {quickFilters.map((filter, index) => (
        <button
          key={index}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          {filter.icon}
          <span>{filter.label}</span>
        </button>
      ))}
    </div>
  );
}