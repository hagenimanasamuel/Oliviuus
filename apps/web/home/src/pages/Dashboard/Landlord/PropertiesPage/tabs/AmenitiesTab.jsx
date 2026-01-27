// src/pages/Dashboard/Landlord/pages/components/tabs/AmenitiesTab.jsx - UPDATED
import React from 'react';
import { 
  CheckCircle,
  Wifi,
  ParkingCircle,
  ThermometerSun,
  Shield,
  Camera,
  Zap,
  Sun,
  BatteryCharging,
  Trees,
  Briefcase,
  Music,
  Gamepad2,
  BookOpen,
  Coffee,
  Refrigerator,
  Square as Stove,
  WashingMachine,
  Bell,
  Key,
  ShieldCheck,
  Filter,
  CloudRain,
  Square as Microwave,
  Droplets,
  Fan,
  Tv,
  Wind,
  Home
} from 'lucide-react';

const AmenitiesTab = ({ amenities = [] }) => {
  const getAmenityIcon = (amenity) => {
    if (!amenity) return CheckCircle;
    
    // Try different property names
    const amenityKey = amenity.key || amenity.amenityKey || amenity.name?.toLowerCase() || '';
    const amenityName = amenity.name || amenity.amenity_name || '';
    
    const iconMap = {
      'wifi': Wifi,
      'parking': ParkingCircle,
      'air': ThermometerSun,
      'conditioning': ThermometerSun,
      'heating': ThermometerSun,
      'television': Tv,
      'tv': Tv,
      'pool': Trees,
      'gym': Gamepad2,
      'washing': WashingMachine,
      'dryer': WashingMachine,
      'kitchen': Coffee,
      'microwave': Microwave,
      'refrigerator': Refrigerator,
      'stove': Stove,
      'dishwasher': WashingMachine,
      'security': Shield,
      'cctv': Camera,
      'alarm': Bell,
      'generator': Zap,
      'solar': Sun,
      'backup': BatteryCharging,
      'garden': Trees,
      'balcony': Trees,
      'elevator': BatteryCharging,
      'workspace': Briefcase,
      'printer': Briefcase,
      'sound': Music,
      'game': Gamepad2,
      'library': BookOpen,
      'coffee': Coffee,
      'water': Droplets,
      'filter': Filter,
      'rain': CloudRain,
      'gate': Key,
      'guard': ShieldCheck,
      'watchman': ShieldCheck,
      'compound': ShieldCheck,
      'fan': Fan,
      'ac': ThermometerSun,
      'ventilation': Wind,
      'home': Home,
    };

    // Check if any keyword matches
    const searchString = (amenityKey + ' ' + amenityName).toLowerCase();
    for (const [keyword, Icon] of Object.entries(iconMap)) {
      if (searchString.includes(keyword)) {
        return Icon;
      }
    }

    return CheckCircle;
  };

  const getAmenityName = (amenity) => {
    return amenity.name || amenity.amenity_name || amenity.key || 'Unknown Amenity';
  };

  const getAmenityCategory = (amenity) => {
    return amenity.category || 'General';
  };

  if (amenities.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200">
        <Home className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Amenities Added</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          This property doesn't have any amenities listed yet. Add amenities to make your property more attractive to tenants.
        </p>
      </div>
    );
  }

  // Group amenities by category
  const groupedAmenities = amenities.reduce((groups, amenity) => {
    const category = getAmenityCategory(amenity);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(amenity);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => (
        <div key={category} className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 capitalize">{category}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryAmenities.map((amenity, index) => {
              const Icon = getAmenityIcon(amenity);
              return (
                <div 
                  key={index} 
                  className="flex items-center p-3 bg-slate-50 rounded-lg hover:bg-gradient-to-r hover:from-[#8A5A8A]/5 hover:to-[#BC8BBC]/5 hover:border hover:border-[#8A5A8A]/20 transition-all group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#8A5A8A]/10 to-[#BC8BBC]/10 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-[#8A5A8A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">
                      {getAmenityName(amenity)}
                    </h4>
                    {amenity.description && (
                      <p className="text-xs text-slate-500 truncate">{amenity.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AmenitiesTab;