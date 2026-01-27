import React from 'react';
import PriceBreakdown from './PriceBreakdown';
import AmenitiesSection from './AmenitiesSection';

export default function PropertyTabs({ 
  activeTab, 
  setActiveTab, 
  property, 
  amenities 
}) {
  const getCompleteLocation = (property) => {
    const parts = [];
    if (property.province) parts.push(property.province);
    if (property.district) parts.push(property.district);
    if (property.sector) parts.push(property.sector);
    if (property.cell) parts.push(property.cell);
    if (property.village) parts.push(property.village);
    if (property.isibo) parts.push(property.isibo);
    return parts.join(', ');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="prose max-w-none">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📝 Property Description</h3>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line space-y-4">
              {property.description ? (
                property.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="text-base sm:text-lg">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-gray-500 italic">No description available.</p>
              )}
            </div>
          </div>
        );
      
      case 'amenities':
        return <AmenitiesSection amenities={amenities} />;
      
      case 'pricing':
        return <PriceBreakdown property={property} />;
      
      case 'location':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Location Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.province && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Province</h4>
                  <p className="text-gray-600">{property.province}</p>
                </div>
              )}
              {property.district && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">District</h4>
                  <p className="text-gray-600">{property.district}</p>
                </div>
              )}
              {property.sector && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Sector</h4>
                  <p className="text-gray-600">{property.sector}</p>
                </div>
              )}
              {property.cell && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Cell</h4>
                  <p className="text-gray-600">{property.cell}</p>
                </div>
              )}
              {property.village && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Village</h4>
                  <p className="text-gray-600">{property.village}</p>
                </div>
              )}
              {property.isibo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Isibo/Agace</h4>
                  <p className="text-gray-600">{property.isibo}</p>
                </div>
              )}
            </div>
            
            {property.address && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Full Address/Exact Location</h4>
                <p className="text-gray-600 text-lg">{property.address}</p>
              </div>
            )}
          </div>
        );
      
      case 'rules':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📜 House Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[#BC8BBC]">⏰</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Check-in</h4>
                    <p className="text-gray-600">{property.check_in_time || '14:00'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#BC8BBC]">⏰</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Check-out</h4>
                    <p className="text-gray-600">{property.check_out_time || '11:00'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={property.smoking_allowed ? 'text-green-500' : 'text-red-500'}>
                    {property.smoking_allowed ? '✅' : '❌'}
                  </span>
                  <div>
                    <h4 className="font-medium text-gray-900">Smoking</h4>
                    <p className="text-gray-600">
                      {property.smoking_allowed ? 'Allowed' : 'Not allowed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={property.pets_allowed ? 'text-green-500' : 'text-red-500'}>
                    {property.pets_allowed ? '✅' : '❌'}
                  </span>
                  <div>
                    <h4 className="font-medium text-gray-900">Pets</h4>
                    <p className="text-gray-600">
                      {property.pets_allowed ? 'Allowed' : 'Not allowed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {property.house_rules && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Additional Rules</h4>
                <p className="text-gray-700 whitespace-pre-line">
                  {property.house_rules}
                </p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex">
          {['overview', 'amenities', 'pricing', 'location', 'rules'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#BC8BBC] text-[#BC8BBC]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 sm:p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}