// src/pages/Dashboard/Landlord/pages/components/tabs/LocationTab.jsx
import React from 'react';
import { MapPin, Compass, Map } from 'lucide-react';

const LocationTab = ({ property, nearbyAttractions }) => {
  const getLocationString = () => {
    if (!property) return '';
    const parts = [];
    if (property.address) parts.push(property.address);
    if (property.sector) parts.push(property.sector);
    if (property.district) parts.push(property.district);
    if (property.province) parts.push(property.province);
    if (property.country) parts.push(property.country);
    return parts.join(', ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Location Details</h3>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl">
          <div className="space-y-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-slate-600 mr-3" />
              <div>
                <p className="font-medium text-slate-900">Address</p>
                <p className="text-slate-600">{getLocationString()}</p>
              </div>
            </div>
            
            {property.latitude && property.longitude && (
              <div className="flex items-center">
                <Compass className="h-5 w-5 text-slate-600 mr-3" />
                <div>
                  <p className="font-medium text-slate-900">Coordinates</p>
                  <p className="text-slate-600">
                    {property.latitude}, {property.longitude}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {nearbyAttractions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Nearby Attractions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearbyAttractions.map((attraction, index) => (
              <div key={index} className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center mb-2">
                  <Map className="h-4 w-4 text-slate-600 mr-2" />
                  <span className="font-medium text-slate-900">{attraction.name}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <span className="capitalize mr-2">{attraction.type}</span>
                  {attraction.distance && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{attraction.distance} km away</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationTab;