// src/pages/Dashboard/Landlord/pages/components/PropertyTabs.jsx - UPDATED
import React from 'react';
import OverviewTab from './tabs/OverviewTab';
import DetailsTab from './tabs/DetailsTab';
import AmenitiesTab from './tabs/AmenitiesTab';
import RulesTab from './tabs/RulesTab';
import LocationTab from './tabs/LocationTab';

const PropertyTabs = ({ activeTab, onTabChange, property }) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'rules', label: 'Rules' },
    { id: 'location', label: 'Location' }
  ];

  const renderTabContent = () => {
    // Safely extract data with defaults
    const rooms = property?.rooms || property?.property_rooms || [];
    const equipment = property?.equipment || property?.property_equipment || [];
    const amenities = property?.amenities || property?.property_amenities || [];
    const nearbyAttractions = property?.nearby_attractions || property?.property_nearby_attractions || [];
    const rules = property?.rules || {};
    
    switch (activeTab) {
      case 'overview':
        return <OverviewTab property={property} />;
      case 'details':
        return <DetailsTab 
          rooms={rooms} 
          equipment={equipment} 
        />;
      case 'amenities':
        return <AmenitiesTab amenities={amenities} />;
      case 'rules':
        return <RulesTab property={{ ...property, ...rules }} />;
      case 'location':
        return <LocationTab 
          property={property}
          nearbyAttractions={nearbyAttractions}
        />;
      default:
        return <OverviewTab property={property} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg">
      <div className="border-b border-slate-200">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-[#8A5A8A] border-b-2 border-[#8A5A8A] bg-gradient-to-t from-[#8A5A8A]/5 to-transparent' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PropertyTabs;