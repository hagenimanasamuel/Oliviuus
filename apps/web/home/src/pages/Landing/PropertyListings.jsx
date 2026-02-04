import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

// Rwanda geo data import (simplified)
import rwandaLocationData from '../../data/rwandaGeoData.json';

class LocationService {
  constructor() {
    this.geoData = rwandaLocationData;
  }

  async getUserLocation() {
    try {
      // Get GPS coordinates
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      const coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Use OpenStreetMap for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&addressdetails=1&countrycodes=RW&accept-language=en`
      );

      const osmData = await response.json();
      
      // Map OSM data to Rwanda location
      const address = osmData.address || {};
      
      return {
        coordinates,
        displayAddress: osmData.display_name || '',
        province: address.state || '',
        district: address.city || address.county || '',
        sector: address.suburb || address.neighbourhood || ''
      };

    } catch (error) {
      // Fallback to IP geolocation
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        
        if (ipData.country_code === 'RW') {
          return {
            coordinates: null,
            displayAddress: `${ipData.city || ''}, ${ipData.region || ''}, Rwanda`,
            province: ipData.region || '',
            district: ipData.city || '',
            sector: ipData.neighborhood || ''
          };
        }
      } catch (ipError) {
        // Silent fallback
      }

      return {
        coordinates: null,
        displayAddress: 'Location not available',
        province: '',
        district: '',
        sector: ''
      };
    }
  }
}

export default function UserLocationDisplay() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectLocation = async () => {
      const service = new LocationService();
      const userLocation = await service.getUserLocation();
      setLocation(userLocation);
      setLoading(false);
    };

    detectLocation();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="animate-pulse">Detecting location...</div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <MapPin size={16} />
        <span>Location unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 max-w-md">
      <MapPin size={16} className="text-[#BC8BBC] mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-medium text-gray-900">Your Current Location</div>
        
        {location.displayAddress && (
          <div className="text-sm text-gray-600 mt-1">
            {location.displayAddress}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2">
          {location.province && (
            <span className="px-2 py-1 bg-[#f4eaf4] text-[#8A5A8A] text-xs rounded">
              {location.province}
            </span>
          )}
          {location.district && (
            <span className="px-2 py-1 bg-[#f0f4ff] text-[#4a6bda] text-xs rounded">
              {location.district}
            </span>
          )}
          {location.sector && (
            <span className="px-2 py-1 bg-[#f0fff4] text-[#2e7d32] text-xs rounded">
              {location.sector}
            </span>
          )}
        </div>
        
        {location.coordinates && (
          <div className="text-xs text-gray-500 mt-2">
            Coordinates: {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
          </div>
        )}
      </div>
    </div>
  );
}