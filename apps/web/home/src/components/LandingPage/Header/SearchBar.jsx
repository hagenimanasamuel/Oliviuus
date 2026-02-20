// SearchBar.js - Professional search with intelligent algorithms
import {
  MapPin, Search, ChevronDown, Navigation, TrendingUp, Clock, X,
  Filter, DollarSign, Home, Bed, Bath, Users, CheckSquare, Sliders, TreePine,
  Star, Wifi, Car, Shield, Thermometer, Coffee, Waves, Snowflake, Wind, Tv,
  Droplets, Utensils, Cloud, Zap, Briefcase, Battery, Building2, Dumbbell,
  Music, Palette, PaletteIcon, Loader2, ChevronLeft
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import rwandaLocationData from '../../../data/rwandaGeoData.json';
import api from '../../../api/axios';

// Define your main color
const MAIN_COLOR = '#BC8BBC';
const MAIN_COLOR_DARK = '#9A6A9A';
const MAIN_COLOR_LIGHT = '#F0E6F0';

// Property types
const PROPERTY_TYPES = [
  'apartment', 'house', 'villa', 'condo', 'studio',
  'penthouse', 'townhouse', 'ghetto', 'living_house',
  'upmarket', 'service_apartment', 'guest_house',
  'bungalow', 'commercial', 'hostel', 'farm'
];

// Comprehensive amenities list matching your database
const AMENITIES = [
  // Infrastructure
  { key: 'electricity_24_7', name: '24/7 Electricity', icon: <Zap size={14} />, category: 'infrastructure' },
  { key: 'running_water', name: 'Running Water', icon: <Droplets size={14} />, category: 'infrastructure' },
  { key: 'wifi', name: 'WiFi Internet', icon: <Wifi size={14} />, category: 'infrastructure' },
  { key: 'borehole', name: 'Borehole Water', icon: <Droplets size={14} />, category: 'infrastructure' },
  { key: 'solar_power', name: 'Solar Power', icon: <Cloud size={14} />, category: 'infrastructure' },
  { key: 'generator', name: 'Generator Backup', icon: <Battery size={14} />, category: 'infrastructure' },

  // Security
  { key: 'compound_security', name: 'Compound Security', icon: <Shield size={14} />, category: 'security' },
  { key: 'watchman', name: 'Watchman/Guard', icon: <Shield size={14} />, category: 'security' },
  { key: 'cctv', name: 'CCTV Cameras', icon: <Shield size={14} />, category: 'security' },
  { key: 'alarm', name: 'Security Alarm', icon: <Shield size={14} />, category: 'security' },
  { key: 'gate', name: 'Electric Gate', icon: <Shield size={14} />, category: 'security' },

  // Comfort & Entertainment
  { key: 'air_conditioning', name: 'Air Conditioning', icon: <Snowflake size={14} />, category: 'comfort' },
  { key: 'ceiling_fans', name: 'Ceiling Fans', icon: <Wind size={14} />, category: 'comfort' },
  { key: 'heating', name: 'Water Heating', icon: <Thermometer size={14} />, category: 'comfort' },
  { key: 'fireplace', name: 'Fireplace', icon: <Thermometer size={14} />, category: 'comfort' },
  { key: 'tv', name: 'TV/Cable', icon: <Tv size={14} />, category: 'comfort' },

  // Kitchen
  { key: 'fridge', name: 'Refrigerator', icon: <Snowflake size={14} />, category: 'kitchen' },
  { key: 'oven', name: 'Oven/Stove', icon: <Thermometer size={14} />, category: 'kitchen' },
  { key: 'microwave', name: 'Microwave', icon: <Thermometer size={14} />, category: 'kitchen' },
  { key: 'dishwasher', name: 'Dishwasher', icon: <Droplets size={14} />, category: 'kitchen' },
  { key: 'kitchen_utensils', name: 'Kitchen Utensils', icon: <Utensils size={14} />, category: 'kitchen' },

  // Outdoor
  { key: 'parking', name: 'Parking Space', icon: <Car size={14} />, category: 'outdoor' },
  { key: 'garden', name: 'Garden/Yard', icon: <TreePine size={14} />, category: 'outdoor' },
  { key: 'balcony', name: 'Balcony/Veranda', icon: <Home size={14} />, category: 'outdoor' },
  { key: 'swimming_pool', name: 'Swimming Pool', icon: <Waves size={14} />, category: 'outdoor' },
  { key: 'bbq_area', name: 'BBQ Area', icon: <Thermometer size={14} />, category: 'outdoor' },

  // Additional
  { key: 'gym', name: 'Gym/Fitness', icon: <Dumbbell size={14} />, category: 'additional' },
  { key: 'laundry', name: 'Laundry Service', icon: <Waves size={14} />, category: 'additional' },
  { key: 'cleaning', name: 'Cleaning Service', icon: <Waves size={14} />, category: 'additional' },
  { key: 'business_center', name: 'Business Center', icon: <Briefcase size={14} />, category: 'additional' },
  { key: 'conference_room', name: 'Conference Room', icon: <Building2 size={14} />, category: 'additional' },
];

// Amenity categories
const AMENITY_CATEGORIES = [
  { id: 'infrastructure', name: 'Infrastructure', icon: <Zap size={14} /> },
  { id: 'security', name: 'Security', icon: <Shield size={14} /> },
  { id: 'comfort', name: 'Comfort', icon: <Thermometer size={14} /> },
  { id: 'kitchen', name: 'Kitchen', icon: <Coffee size={14} /> },
  { id: 'outdoor', name: 'Outdoor', icon: <TreePine size={14} /> },
  { id: 'additional', name: 'Additional', icon: <Star size={14} /> },
];

// Popular destinations with icons
const POPULAR_DESTINATIONS = [
  {
    name: "Kigali",
    fullName: "Kigali, Rwanda",
    description: "Capital city with modern amenities",
    type: "city",
    icon: "🏙️",
    province: "Kigali",
    district: "Gasabo"
  },
  {
    name: "Musanze",
    fullName: "Musanze, Northern Province",
    description: "Gateway to Volcanoes National Park",
    type: "town",
    icon: "🌋",
    province: "North",
    district: "Musanze"
  },
  {
    name: "Rubavu",
    fullName: "Rubavu, Western Province",
    description: "Beautiful lakeside town on Lake Kivu",
    type: "town",
    icon: "🏖️",
    province: "West",
    district: "Rubavu"
  },
  {
    name: "Huye",
    fullName: "Huye, Southern Province",
    description: "Home to the National Museum",
    type: "town",
    icon: "🏛️",
    province: "South",
    district: "Huye"
  },
  {
    name: "Karongi",
    fullName: "Karongi, Western Province",
    description: "Scenic hills and lake views",
    type: "town",
    icon: "⛰️",
    province: "West",
    district: "Karongi"
  },
  {
    name: "Nyamagabe",
    fullName: "Nyamagabe, Southern Province",
    description: "Gateway to Nyungwe Forest",
    type: "town",
    icon: "🌲",
    province: "South",
    district: "Nyamagabe"
  },
  {
    name: "Kayonza",
    fullName: "Kayonza, Eastern Province",
    description: "Gateway to Akagera National Park",
    type: "town",
    icon: "🦁",
    province: "East",
    district: "Kayonza"
  },
  {
    name: "Rusizi",
    fullName: "Rusizi, Western Province",
    description: "Border town with beautiful scenery",
    type: "town",
    icon: "🌅",
    province: "West",
    district: "Rusizi"
  }
];

// Rwanda landmarks for search
const RWANDA_LANDMARKS = [
  // Schools & Universities
  { name: "University of Rwanda", type: "education", icon: "🎓", category: "University" },
  { name: "INES Ruhengeri", type: "education", icon: "🏫", category: "University" },
  { name: "IPRC MUSANZE", type: "education", icon: "🏫", category: "College" },
  { name: "IPRC TUMBA", type: "education", icon: "🏫", category: "College" },
  { name: "IPRC KARONGI", type: "education", icon: "🏫", category: "College" },
  { name: "CST", type: "education", icon: "🏫", category: "College" },
  { name: "ULK", type: "education", icon: "🎓", category: "University" },
  { name: "Carnegie Mellon University Africa", type: "education", icon: "🎓", category: "University" },

  // Hospitals
  { name: "King Faisal Hospital", type: "hospital", icon: "🏥", category: "Hospital" },
  { name: "Rwanda Military Hospital", type: "hospital", icon: "🏥", category: "Hospital" },
  { name: "CHUK Hospital", type: "hospital", icon: "🏥", category: "Hospital" },
  { name: "Kibagabaga Hospital", type: "hospital", icon: "🏥", category: "Hospital" },
  { name: "Muhima Hospital", type: "hospital", icon: "🏥", category: "Hospital" },

  // Hotels
  { name: "Fatima Hotel", type: "hotel", icon: "🏨", category: "Hotel" },
  { name: "Grand Legacy Hotel", type: "hotel", icon: "🏨", category: "Hotel" },
  { name: "Hotel des Mille Collines", type: "hotel", icon: "🏨", category: "Hotel" },
  { name: "Radisson Blu Hotel Kigali", type: "hotel", icon: "🏨", category: "Hotel" },
  { name: "Marriott Hotel Kigali", type: "hotel", icon: "🏨", category: "Hotel" },
  { name: "Ubumwe Grande Hotel", type: "hotel", icon: "🏨", category: "Hotel" },
  { name: "Serena Hotel Kigali", type: "hotel", icon: "🏨", category: "Hotel" },
  { name: "Hiltop Hotel", type: "hotel", icon: "🏨", category: "Hotel" },
  { name: "Heaven Boutique Hotel", type: "hotel", icon: "🏨", category: "Hotel" },

  // Markets
  { name: "Kimironko Market", type: "market", icon: "🛒", category: "Market" },
  { name: "Nyabugogo Market", type: "market", icon: "🛒", category: "Market" },
  { name: "Gikondo Market", type: "market", icon: "🛒", category: "Market" },
  { name: "Kicukiro Market", type: "market", icon: "🛒", category: "Market" },
  { name: "Remera Market", type: "market", icon: "🛒", category: "Market" },
  { name: "Gisozi Market", type: "market", icon: "🛒", category: "Market" },
  { name: "Kwa Mutangana", type: "market", icon: "🛒", category: "Market" },

  // Tourist Attractions
  { name: "Kigali Genocide Memorial", type: "attraction", icon: "🕊️", category: "Memorial" },
  { name: "Kigali Convention Centre", type: "attraction", icon: "🏢", category: "Convention Center" },
  { name: "Volcanoes National Park", type: "attraction", icon: "🌋", category: "National Park" },
  { name: "Akagera National Park", type: "attraction", icon: "🦁", category: "National Park" },
  { name: "Nyungwe National Park", type: "attraction", icon: "🌲", category: "National Park" },
  { name: "Lake Kivu", type: "attraction", icon: "🏖️", category: "Lake" },
  { name: "Nyanza King's Palace", type: "attraction", icon: "🏛️", category: "Historical Site" },

  // Transport
  { name: "Kigali International Airport", type: "transport", icon: "✈️", category: "Airport" },
  { name: "Nyabugogo Bus Station", type: "transport", icon: "🚌", category: "Bus Station" },
  { name: "Kigali Central Taxi Park", type: "transport", icon: "🚕", category: "Taxi Park" },

  // Business Centers
  { name: "Kigali City Tower", type: "business", icon: "🏙️", category: "Business Center" },
  { name: "Kigali Heights", type: "business", icon: "🏬", category: "Shopping Center" },
  { name: "Kigali Business Centre", type: "business", icon: "🏢", category: "Business Center" },
  { name: "Kigali Special Economic Zone", type: "business", icon: "💼", category: "Economic Zone" },

  // Popular Areas
  { name: "Kwa Nyirangarama", type: "area", icon: "🏘️", category: "Neighborhood" },
  { name: "Kwa Kirenge", type: "area", icon: "🏘️", category: "Neighborhood" },
  { name: "Kwa Sina", type: "area", icon: "🏘️", category: "Neighborhood" },
  { name: "Kwa Rubangura", type: "area", icon: "🏘️", category: "Neighborhood" },
  { name: "Kwa Gatare", type: "area", icon: "🏘️", category: "Neighborhood" },
  { name: "Kwa Gikondo", type: "area", icon: "🏘️", category: "Neighborhood" },
  { name: "Kwa Remera", type: "area", icon: "🏘️", category: "Neighborhood" },
  { name: "Kwa Kimihurura", type: "area", icon: "🏘️", category: "Neighborhood" },
  { name: "Kwamakuza", type: "area", icon: "🏘️", category: "Neighborhood" },
];

// Default search configuration
const DEFAULT_SEARCH_CONFIG = {
  province: null,
  district: null,
  sector: null,
  cell: null,
  village: null,
  isibo: null,

  minPrice: '',
  maxPrice: '',
  pricePeriod: 'monthly',

  propertyTypes: [],
  minBedrooms: '',
  minBathrooms: '',
  minGuests: '1',
  minArea: '',

  amenities: [],
  nearbyAttractions: [],

  isVerified: false,
  isFeatured: false,
  hasImages: true,
  utilitiesIncluded: false,
  acceptNightly: false,
  acceptDaily: false,
  acceptWeekly: false,
  acceptMonthly: true
};

// Intelligent Search Service
class ProfessionalLocationService {
  constructor() {
    this.geoData = rwandaLocationData;
    this.provinceMapping = {
      'northern': 'North',
      'southern': 'South',
      'eastern': 'East',
      'western': 'West',
      'kigali': 'Kigali',
      'north': 'North',
      'south': 'South',
      'east': 'East',
      'west': 'West'
    };
  }

  normalizeLocationName(name) {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/province$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Enhanced search in geo data with partial matching
  findMatchInGeoData(locationData, searchTerm) {
    if (!searchTerm || !locationData) return null;

    const normalizedSearch = this.normalizeLocationName(searchTerm);

    // Try exact match first
    if (locationData[searchTerm]) {
      return searchTerm;
    }

    // Try normalized exact match
    for (const key in locationData) {
      if (this.normalizeLocationName(key) === normalizedSearch) {
        return key;
      }
    }

    // Try partial matches
    for (const key in locationData) {
      const normalizedKey = this.normalizeLocationName(key);

      // Check if search term is in key or vice versa
      if (normalizedKey.includes(normalizedSearch) || normalizedSearch.includes(normalizedKey)) {
        return key;
      }

      // Check for word boundaries
      if (normalizedSearch.split(' ').some(word => normalizedKey.includes(word)) ||
        normalizedKey.split(' ').some(word => normalizedSearch.includes(word))) {
        return key;
      }
    }

    return null;
  }

  // Enhanced OSM to Rwanda mapping with intelligent parsing
  async mapOSMToRwandaLocation(osmData) {
    try {
      const address = osmData.address || {};

      let province = '';
      let district = '';
      let sector = '';
      let cell = '';
      let village = '';

      // 1. Province mapping with intelligence
      if (address.state || address.region) {
        const provinceSource = address.state || address.region;
        const provinceName = provinceSource.replace(/ Province$/, '').trim();
        const normalizedProvince = this.normalizeLocationName(provinceName);
        province = this.provinceMapping[normalizedProvince] || provinceName;
      }

      // Find exact match in geo data
      if (province) {
        province = this.findMatchInGeoData(this.geoData, province) || province;
      }

      // 2. District mapping with multiple source checks
      const districtSources = [address.county, address.city, address.town, address.municipality];
      for (const source of districtSources) {
        if (source) {
          if (province && this.geoData[province]) {
            const match = this.findMatchInGeoData(this.geoData[province], source);
            if (match) {
              district = match;
              break;
            }
          }
        }
      }

      // 3. Sector mapping with extended sources
      const sectorSources = [
        address.city_district,
        address.suburb,
        address.town,
        address.village,
        address.neighbourhood,
        address.hamlet,
        address.quarter,
        address.road
      ].filter(Boolean);

      if (sectorSources.length > 0 && province && district && this.geoData[province]?.[district]) {
        for (const candidate of sectorSources) {
          const foundSector = this.findMatchInGeoData(
            this.geoData[province][district],
            candidate
          );
          if (foundSector) {
            sector = foundSector;
            break;
          }
        }

        if (!sector) {
          for (const candidate of sectorSources) {
            for (const sectorKey in this.geoData[province][district] || {}) {
              if (this.normalizeLocationName(sectorKey).includes(this.normalizeLocationName(candidate)) ||
                this.normalizeLocationName(candidate).includes(this.normalizeLocationName(sectorKey))) {
                sector = sectorKey;
                break;
              }
            }
            if (sector) break;
          }
        }
      }

      // 4. Try to get cell and village from geo data
      if (province && district && sector && this.geoData[province]?.[district]?.[sector]) {
        const cells = this.geoData[province][district][sector];
        const firstCell = Object.keys(cells)[0];
        if (firstCell) {
          cell = firstCell;
          const villages = cells[firstCell];
          if (villages && villages.length > 0) {
            village = villages[0];
          }
        }
      }

      return {
        province: province || '',
        district: district || '',
        sector: sector || '',
        cell: cell || '',
        village: village || '',
        osmDisplay: osmData.display_name || ''
      };

    } catch (error) {
      return {
        province: '',
        district: '',
        sector: '',
        cell: '',
        village: '',
        osmDisplay: ''
      };
    }
  }

  // Main location detection method
  async getUserLocation() {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 0,
          enableHighAccuracy: true
        });
      });

      const coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      const osmResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&addressdetails=1&countrycodes=RW&accept-language=en`
      );

      if (!osmResponse.ok) {
        throw new Error('OpenStreetMap request failed');
      }

      const osmData = await osmResponse.json();
      const mappedLocation = await this.mapOSMToRwandaLocation(osmData);

      return {
        coordinates,
        address: mappedLocation,
        source: 'gps_osm',
        displayAddress: osmData.display_name || ''
      };

    } catch (error) {
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();

        if (ipData.country_code === 'RW') {
          let province = '';
          if (ipData.region) {
            const normalizedRegion = this.normalizeLocationName(ipData.region);
            province = this.provinceMapping[normalizedRegion] || ipData.region;
          }

          return {
            coordinates: null,
            address: {
              province: province || '',
              district: ipData.city || '',
              sector: ipData.neighborhood || '',
              cell: '',
              village: ''
            },
            source: 'ip',
            displayAddress: `${ipData.city || ''}, ${ipData.region || ''}, Rwanda`
          };
        }
      } catch (ipError) { }

      return {
        coordinates: null,
        address: {
          province: '',
          district: '',
          sector: '',
          cell: '',
          village: ''
        },
        source: 'unknown',
        displayAddress: ''
      };
    }
  }
}

// Initialize location service
const locationService = new ProfessionalLocationService();

// Intelligent Search Service
class IntelligentSearchService {
  constructor() {
    this.geoData = rwandaLocationData;
    this.buildLocationIndex();
  }

  buildLocationIndex() {
    this.locationIndex = [];
    this.provinceDistricts = {};

    Object.keys(this.geoData).forEach(province => {
      this.locationIndex.push({
        name: province,
        fullName: province,
        type: 'province',
        description: 'Province',
        icon: '🗺️',
        searchTerms: [province.toLowerCase()]
      });

      this.provinceDistricts[province] = [];

      Object.keys(this.geoData[province]).forEach(district => {
        this.locationIndex.push({
          name: district,
          fullName: `${district}, ${province}`,
          type: 'district',
          description: `District in ${province}`,
          icon: '🏙️',
          searchTerms: [district.toLowerCase(), `${district} ${province}`.toLowerCase()]
        });

        this.provinceDistricts[province].push(district);

        Object.keys(this.geoData[province][district]).forEach(sector => {
          this.locationIndex.push({
            name: sector,
            fullName: `${sector}, ${district}`,
            type: 'sector',
            description: `Sector in ${district}`,
            icon: '📍',
            searchTerms: [sector.toLowerCase(), `${sector} ${district}`.toLowerCase()]
          });

          Object.keys(this.geoData[province][district][sector]).forEach(cell => {
            this.locationIndex.push({
              name: cell,
              fullName: `${cell}, ${sector}`,
              type: 'cell',
              description: `Cell in ${sector}`,
              icon: '🏘️',
              searchTerms: [cell.toLowerCase()]
            });

            this.geoData[province][district][sector][cell].forEach(village => {
              this.locationIndex.push({
                name: village,
                fullName: `${village}, ${cell}`,
                type: 'village',
                description: `Village in ${cell}`,
                icon: '🏠',
                searchTerms: [village.toLowerCase()]
              });
            });
          });
        });
      });
    });
  }

  normalizeText(text) {
    return text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  intelligentSearch(query, userLocation = null) {
    if (!query.trim()) return [];

    const normalizedQuery = this.normalizeText(query);
    const queryWords = normalizedQuery.split(' ');
    const results = [];
    const seen = new Set();

    const searchPatterns = this.analyzeQueryPatterns(normalizedQuery);

    this.locationIndex.forEach(location => {
      let score = 0;

      location.searchTerms.forEach(term => {
        if (term === normalizedQuery) score += 100;
        else if (term.startsWith(normalizedQuery)) score += 80;
        else if (normalizedQuery.startsWith(term)) score += 70;
        else if (term.includes(normalizedQuery)) score += 60;
        else if (normalizedQuery.includes(term)) score += 50;
        else if (normalizedQuery.length === 1 && term.startsWith(normalizedQuery)) {
          score += 40;
        } else {
          const termWords = term.split(' ');
          let wordMatches = 0;
          queryWords.forEach(qWord => {
            termWords.forEach(tWord => {
              if (tWord.startsWith(qWord)) wordMatches++;
              else if (qWord.startsWith(tWord)) wordMatches++;
            });
          });
          if (wordMatches > 0) score += wordMatches * 30;
        }
      });

      if (userLocation && userLocation.address) {
        if (location.type === 'province' && location.name === userLocation.address.province) score += 50;
        if (location.type === 'district' && location.name === userLocation.address.district) score += 100;
        if (location.type === 'sector' && location.name === userLocation.address.sector) score += 150;
      }

      if (score > 30) {
        const result = { ...location, score, source: 'geo_data' };
        const key = `${location.type}:${location.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push(result);
        }
      }
    });

    RWANDA_LANDMARKS.forEach(landmark => {
      let score = 0;
      const landmarkName = this.normalizeText(landmark.name);
      const landmarkCategory = this.normalizeText(landmark.category);

      if (landmarkName.includes(normalizedQuery)) score += 70;
      if (normalizedQuery.includes(landmarkName)) score += 60;
      if (landmarkCategory.includes(normalizedQuery)) score += 50;
      if (this.normalizeText(landmark.type).includes(normalizedQuery)) score += 40;

      queryWords.forEach(word => {
        if (landmarkName.includes(word)) score += 30;
        if (landmarkCategory.includes(word)) score += 20;
      });

      if (score > 30) {
        results.push({
          name: landmark.name,
          fullName: landmark.name,
          type: landmark.type,
          description: `${landmark.category} in Rwanda`,
          icon: landmark.icon,
          score,
          source: 'landmark'
        });
      }
    });

    PROPERTY_TYPES.forEach(type => {
      const normalizedType = this.normalizeText(type.replace('_', ' '));
      if (normalizedType.includes(normalizedQuery) || normalizedQuery.includes(normalizedType)) {
        results.push({
          name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
          fullName: `${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} Properties`,
          type: 'property_type',
          description: 'Type of property',
          icon: '🏠',
          score: 60,
          source: 'property_type'
        });
      }
    });

    if (searchPatterns.nearby && userLocation) {
      const nearbyLocations = this.searchNearbyLocations(searchPatterns.nearby, userLocation);
      results.push(...nearbyLocations);
    }

    if (searchPatterns.location) {
      const locationResults = this.searchByLocationPattern(searchPatterns.location);
      results.push(...locationResults);
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 15);
  }

  analyzeQueryPatterns(query) {
    const patterns = {
      nearby: null,
      location: null,
      propertyType: null
    };

    const nearPatterns = ['near', 'hafi', 'hafi ya', 'hafi na', 'close to', 'around'];
    nearPatterns.forEach(pattern => {
      if (query.includes(pattern)) {
        const parts = query.split(pattern);
        if (parts[1]) {
          patterns.nearby = parts[1].trim();
        }
      }
    });

    const inPatterns = ['in', 'mu', 'iya', 'at', 'ziri mu'];
    inPatterns.forEach(pattern => {
      if (query.includes(pattern)) {
        const parts = query.split(pattern);
        if (parts[1]) {
          patterns.location = parts[1].trim();
        }
      }
    });

    const propertyWords = ['house', 'houses', 'inzu', 'apartment', 'villa', 'ghetto', 'hostel', 'guest house'];
    propertyWords.forEach(word => {
      if (query.includes(word)) {
        patterns.propertyType = word;
      }
    });

    return patterns;
  }

  searchNearbyLocations(nearbyQuery, userLocation) {
    const results = [];
    const normalizedNearby = this.normalizeText(nearbyQuery);

    RWANDA_LANDMARKS.forEach(landmark => {
      const landmarkName = this.normalizeText(landmark.name);

      if (landmarkName.includes(normalizedNearby) || normalizedNearby.includes(landmarkName)) {
        let score = 60;
        if (userLocation.address?.province && landmarkName.includes(this.normalizeText(userLocation.address.province))) score += 30;
        if (userLocation.address?.district && landmarkName.includes(this.normalizeText(userLocation.address.district))) score += 50;

        results.push({
          name: landmark.name,
          fullName: `Near ${landmark.name}`,
          type: 'nearby_landmark',
          description: `${landmark.category} near your location`,
          icon: landmark.icon,
          score,
          source: 'nearby_search'
        });
      }
    });

    return results;
  }

  searchByLocationPattern(locationQuery) {
    const results = [];
    const normalizedLocation = this.normalizeText(locationQuery);

    this.locationIndex.forEach(location => {
      location.searchTerms.forEach(term => {
        if (term.includes(normalizedLocation) || normalizedLocation.includes(term)) {
          results.push({
            ...location,
            score: 70,
            source: 'location_pattern'
          });
        }
      });
    });

    return results;
  }

  generateNearbyRecommendations(userLocation) {
    if (!userLocation || !userLocation.address) return POPULAR_DESTINATIONS.slice(0, 4);

    const recommendations = [];

    if (userLocation.address.district && this.provinceDistricts[userLocation.address.province]) {
      if (this.geoData[userLocation.address.province]?.[userLocation.address.district]) {
        Object.keys(this.geoData[userLocation.address.province][userLocation.address.district])
          .filter(sector => sector !== userLocation.address.sector)
          .slice(0, 2)
          .forEach(sector => {
            recommendations.push({
              name: sector,
              fullName: `${sector}, ${userLocation.address.district}`,
              type: 'sector',
              description: `Sector in ${userLocation.address.district}`,
              icon: '📍',
              score: 100
            });
          });
      }
    }

    if (userLocation.address.province && this.provinceDistricts[userLocation.address.province]) {
      this.provinceDistricts[userLocation.address.province]
        .filter(district => district !== userLocation.address.district)
        .slice(0, 2)
        .forEach(district => {
          recommendations.push({
            name: district,
            fullName: `${district}, ${userLocation.address.province}`,
            type: 'district',
            description: `Nearby district in ${userLocation.address.province}`,
            icon: '🏙️',
            score: 80
          });
        });
    }

    POPULAR_DESTINATIONS
      .filter(dest => dest.province === userLocation.address.province && dest.district !== userLocation.address.district)
      .slice(0, 2)
      .forEach(dest => {
        recommendations.push({
          ...dest,
          score: 70
        });
      });

    if (recommendations.length < 4) {
      POPULAR_DESTINATIONS
        .filter(dest => !recommendations.some(r => r.name === dest.name))
        .slice(0, 4 - recommendations.length)
        .forEach(dest => {
          recommendations.push({
            ...dest,
            score: 50
          });
        });
    }

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, 4);
  }

  getLocationsStartingWith(letter, userLocation = null) {
    const normalizedLetter = letter.toLowerCase();
    const results = [];

    this.locationIndex.forEach(location => {
      if (location.name.toLowerCase().startsWith(normalizedLetter)) {
        let score = 50;

        if (userLocation && userLocation.address) {
          if (location.type === 'sector' && userLocation.address.district &&
            this.geoData[userLocation.address.province]?.[userLocation.address.district]?.[location.name]) {
            score += 100;
          }
          if (location.type === 'village' && userLocation.address.sector) {
            score += 80;
          }
        }

        results.push({ ...location, score });
      }
    });

    RWANDA_LANDMARKS.forEach(landmark => {
      if (landmark.name.toLowerCase().startsWith(normalizedLetter)) {
        results.push({
          name: landmark.name,
          fullName: landmark.name,
          type: landmark.type,
          description: landmark.category,
          icon: landmark.icon,
          score: 40,
          source: 'landmark'
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10);
  }
}

// Initialize search service
const searchService = new IntelligentSearchService();

// Backend Search Service
class BackendSearchService {
  static async getSearchSuggestions(query, userLocation) {
    try {
      const response = await api.get('/isanzure/search/intelligent', {
        params: {
          query,
          userProvince: userLocation?.address?.province,
          userDistrict: userLocation?.address?.district,
          limit: 15
        }
      });

      return response.data;
    } catch (error) {
      console.error('Backend suggestions error:', error);
      return { success: false, suggestions: [] };
    }
  }

  static async getPopularSearches(userLocation) {
    try {
      const response = await api.get('/isanzure/search/popular', {
        params: {
          userProvince: userLocation?.address?.province,
          userDistrict: userLocation?.address?.district,
          limit: 10
        }
      });

      return response.data;
    } catch (error) {
      console.error('Backend popular searches error:', error);
      return { success: false, recommendations: {} };
    }
  }

  static async getNearbyAttractions(userLocation) {
    try {
      const response = await api.get('/isanzure/search/location-intelligent', {
        params: {
          userProvince: userLocation?.address?.province,
          userDistrict: userLocation?.address?.district,
          userSector: userLocation?.address?.sector,
          limit: 6
        }
      });

      return response.data;
    } catch (error) {
      console.error('Backend nearby attractions error:', error);
      return { success: false, data: [] };
    }
  }
}

// Format number with commas
const formatNumber = (num) => {
  if (!num) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Parse formatted number
const parseFormattedNumber = (str) => {
  if (!str) return '';
  return str.replace(/,/g, '');
};

// Skeleton loading components
const SkeletonLoader = () => (
  <div className="animate-pulse p-4 md:p-6">
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:ml-13">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-3 border border-gray-200 rounded-xl">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-gray-200 rounded mr-2"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="mb-8">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-28"></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 md:ml-13">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-24 h-8 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const SearchResultSkeleton = () => (
  <div className="p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse p-3 mb-2 border border-gray-200 rounded-xl">
        <div className="flex items-start">
          <div className="w-6 h-6 bg-gray-200 rounded mr-3"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchConfig, setSearchConfig] = useState(DEFAULT_SEARCH_CONFIG);
  const [selectedAmenityCategory, setSelectedAmenityCategory] = useState('infrastructure');
  const [landmarkSearchQuery, setLandmarkSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [backendRecommendations, setBackendRecommendations] = useState(null);
  const [backendNearbyAttractions, setBackendNearbyAttractions] = useState([]);
  const [isGettingLocation, setIsGettingLocation] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const customizeRef = useRef(null);
  const searchDropdownRef = useRef(null);

  // Detect user location
  useEffect(() => {
    const detectUserLocation = async () => {
      setIsGettingLocation(true);
      try {
        const locationData = await locationService.getUserLocation();
        setUserLocation(locationData);
        console.log('📍 User location detected:', locationData);
      } catch (error) {
        console.error('❌ Error detecting location:', error);
        setUserLocation(null);
      } finally {
        setIsGettingLocation(false);
      }
    };

    detectUserLocation();
  }, []);

  // Load backend recommendations and nearby attractions
  useEffect(() => {
    if (userLocation && userLocation.address) {
      loadBackendRecommendations();
      loadBackendNearbyAttractionsData();
    }
  }, [userLocation]);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setIsCustomizeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll when any modal is open on mobile
  useEffect(() => {
    if (isMobile && (isSearchOpen || isCustomizeOpen)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isSearchOpen, isCustomizeOpen]);

  // Load recent searches
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      const parsedSearches = JSON.parse(savedSearches);
      setRecentSearches(parsedSearches.slice(0, 5));
      setSearchHistory(parsedSearches.slice(0, 10));
    }

    const savedConfig = localStorage.getItem('searchConfig');
    if (savedConfig) {
      setSearchConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Save search config
  useEffect(() => {
    localStorage.setItem('searchConfig', JSON.stringify(searchConfig));
  }, [searchConfig]);

  // Load backend recommendations
  const loadBackendRecommendations = async () => {
    try {
      const response = await BackendSearchService.getPopularSearches(userLocation);
      if (response.success) {
        setBackendRecommendations(response.recommendations);
      }
    } catch (error) {
      // Silent error
    }
  };

  // Load backend nearby attractions
  const loadBackendNearbyAttractionsData = async () => {
    try {
      if (!userLocation || !userLocation.address) return;

      const response = await BackendSearchService.getNearbyAttractions(userLocation);
      if (response.success && response.data) {
        setBackendNearbyAttractions(response.data.slice(0, 4));
      }
    } catch (error) {
      // Silent error
    }
  };

  // Intelligent search with debouncing
  useEffect(() => {
    if (!isSearchOpen) return;

    if (searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setShowLoadingState(true);

    const timeoutId = setTimeout(async () => {
      try {
        let results = [];

        if (searchQuery.trim().length === 1) {
          results = searchService.getLocationsStartingWith(searchQuery.trim(), userLocation);
        } else {
          const backendResponse = await BackendSearchService.getSearchSuggestions(searchQuery, userLocation);

          if (backendResponse.success && backendResponse.suggestions && backendResponse.suggestions.length > 0) {
            results = backendResponse.suggestions.map(suggestion => ({
              ...suggestion,
              score: suggestion.score || 100,
              source: 'backend'
            }));
          } else {
            results = searchService.intelligentSearch(searchQuery, userLocation);
          }
        }

        setSuggestions(results);
      } catch (error) {
        const results = searchService.intelligentSearch(searchQuery, userLocation);
        setSuggestions(results);
      } finally {
        setIsLoading(false);
        setShowLoadingState(false);
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setShowLoadingState(false);
    };
  }, [searchQuery, isSearchOpen, userLocation]);

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      saveToRecentSearches(searchQuery);
    }

    const searchParams = new URLSearchParams();

    if (searchQuery.trim()) {
      searchParams.set('q', searchQuery.trim());
    }

    if (searchConfig.province) searchParams.set('province', searchConfig.province);
    if (searchConfig.district) searchParams.set('district', searchConfig.district);
    if (searchConfig.sector) searchParams.set('sector', searchConfig.sector);
    if (searchConfig.cell) searchParams.set('cell', searchConfig.cell);
    if (searchConfig.village) searchParams.set('village', searchConfig.village);
    if (searchConfig.isibo) searchParams.set('isibo', searchConfig.isibo);

    if (searchConfig.propertyTypes.length > 0) {
      searchParams.set('types', searchConfig.propertyTypes.join(','));
    }

    if (searchConfig.minPrice) searchParams.set('minPrice', searchConfig.minPrice);
    if (searchConfig.maxPrice) searchParams.set('maxPrice', searchConfig.maxPrice);
    searchParams.set('pricePeriod', searchConfig.pricePeriod);

    if (searchConfig.minBedrooms) searchParams.set('minBedrooms', searchConfig.minBedrooms);
    if (searchConfig.minBathrooms) searchParams.set('minBathrooms', searchConfig.minBathrooms);
    if (searchConfig.minGuests !== '1') searchParams.set('minGuests', searchConfig.minGuests);
    if (searchConfig.minArea) searchParams.set('minArea', searchConfig.minArea);

    if (searchConfig.isVerified) searchParams.set('isVerified', 'true');
    if (searchConfig.isFeatured) searchParams.set('isFeatured', 'true');
    if (searchConfig.utilitiesIncluded) searchParams.set('utilitiesIncluded', 'true');
    if (searchConfig.acceptNightly) searchParams.set('acceptNightly', 'true');
    if (searchConfig.acceptDaily) searchParams.set('acceptDaily', 'true');
    if (searchConfig.acceptWeekly) searchParams.set('acceptWeekly', 'true');
    if (!searchConfig.acceptMonthly) searchParams.set('acceptMonthly', 'false');

    if (searchConfig.amenities.length > 0) {
      searchParams.set('amenities', searchConfig.amenities.join(','));
    }

    if (searchConfig.nearbyAttractions.length > 0) {
      searchParams.set('nearbyAttractions', searchConfig.nearbyAttractions.join(','));
    }

    const queryString = searchParams.toString();
    navigate(`/search${queryString ? `?${queryString}` : ''}`);

    setIsSearchOpen(false);
    setIsCustomizeOpen(false);
  };

  const saveToRecentSearches = (query) => {
    const newSearch = {
      query: query,
      timestamp: new Date().toISOString(),
      config: { ...searchConfig }
    };

    const updatedSearches = [
      newSearch,
      ...recentSearches.filter(s => s.query.toLowerCase() !== query.toLowerCase())
    ].slice(0, 5);

    setRecentSearches(updatedSearches);

    const updatedHistory = [
      newSearch,
      ...searchHistory.filter(s => s.query.toLowerCase() !== query.toLowerCase())
    ].slice(0, 10);

    setSearchHistory(updatedHistory);
    localStorage.setItem('recentSearches', JSON.stringify(updatedHistory));
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.fullName || suggestion.name);
    saveToRecentSearches(suggestion.fullName || suggestion.name);
    setIsSearchOpen(false);
    inputRef.current?.blur();
    setTimeout(() => {
      handleSearch(new Event('submit'));
    }, 100);
  };

  const handleRecentSearchClick = (search) => {
    setSearchQuery(search.query);
    if (search.config) {
      setSearchConfig(search.config);
    }
    setIsSearchOpen(false);
    setTimeout(() => {
      handleSearch(new Event('submit'));
    }, 100);
  };

  const handleInputFocus = () => {
    setIsSearchOpen(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const resetFilters = () => {
    setSearchConfig(DEFAULT_SEARCH_CONFIG);
  };

  const handleConfigChange = (key, value) => {
    setSearchConfig(currentConfig => {
      const newConfig = {
        ...currentConfig,
        [key]: value
      };

      if (key === 'province' && value !== currentConfig.province) {
        newConfig.district = null;
        newConfig.sector = null;
        newConfig.cell = null;
        newConfig.village = null;
        newConfig.isibo = null;
      }
      if (key === 'district' && value !== currentConfig.district) {
        newConfig.sector = null;
        newConfig.cell = null;
        newConfig.village = null;
        newConfig.isibo = null;
      }
      if (key === 'sector' && value !== currentConfig.sector) {
        newConfig.cell = null;
        newConfig.village = null;
        newConfig.isibo = null;
      }
      if (key === 'cell' && value !== currentConfig.cell) {
        newConfig.village = null;
        newConfig.isibo = null;
      }

      return newConfig;
    });
  };

  const handlePriceChange = (key, value) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    handleConfigChange(key, cleanValue);
  };

  const togglePropertyType = (type) => {
    setSearchConfig(currentConfig => ({
      ...currentConfig,
      propertyTypes: currentConfig.propertyTypes.includes(type)
        ? currentConfig.propertyTypes.filter(t => t !== type)
        : [...currentConfig.propertyTypes, type]
    }));
  };

  const toggleAmenity = (amenityKey) => {
    setSearchConfig(currentConfig => ({
      ...currentConfig,
      amenities: currentConfig.amenities.includes(amenityKey)
        ? currentConfig.amenities.filter(a => a !== amenityKey)
        : [...currentConfig.amenities, amenityKey]
    }));
  };

  const toggleNearbyAttraction = (landmarkName) => {
    setSearchConfig(currentConfig => ({
      ...currentConfig,
      nearbyAttractions: currentConfig.nearbyAttractions.includes(landmarkName)
        ? currentConfig.nearbyAttractions.filter(a => a !== landmarkName)
        : [...currentConfig.nearbyAttractions, landmarkName]
    }));
  };

  const getLocationOptions = (level) => {
    if (!rwandaLocationData) return [];

    if (level === 'province') {
      return Object.keys(rwandaLocationData);
    }

    if (level === 'district' && searchConfig.province) {
      return Object.keys(rwandaLocationData[searchConfig.province] || {});
    }

    if (level === 'sector' && searchConfig.province && searchConfig.district) {
      return Object.keys(rwandaLocationData[searchConfig.province]?.[searchConfig.district] || {});
    }

    if (level === 'cell' && searchConfig.province && searchConfig.district && searchConfig.sector) {
      return Object.keys(rwandaLocationData[searchConfig.province]?.[searchConfig.district]?.[searchConfig.sector] || {});
    }

    if (level === 'village' && searchConfig.province && searchConfig.district && searchConfig.sector && searchConfig.cell) {
      return rwandaLocationData[searchConfig.province]?.[searchConfig.district]?.[searchConfig.sector]?.[searchConfig.cell] || [];
    }

    return [];
  };

  // Generate nearby recommendations based on user location
  const nearbyRecommendations = useMemo(() => {
    if (backendNearbyAttractions.length > 0) {
      return backendNearbyAttractions.map(attraction => ({
        name: attraction.name || attraction.district || attraction.sector,
        fullName: attraction.fullName || attraction.name,
        description: attraction.description || 'Nearby location with available properties',
        icon: attraction.icon || '📍',
        type: 'nearby',
        score: 100,
        propertyCount: attraction.propertyCount || 0
      })).slice(0, 4);
    }

    if (userLocation && userLocation.address && userLocation.address.province) {
      const { province, district, sector } = userLocation.address;

      const recommendations = [];

      if (district) {
        recommendations.push({
          name: `${district} District`,
          fullName: `${district} District`,
          description: `Properties in your district`,
          icon: '🏙️',
          type: 'district',
          score: 90
        });
      }

      if (province) {
        const popularDistricts = {
          'Kigali': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
          'North': ['Musanze', 'Gicumbi', 'Burera'],
          'South': ['Huye', 'Muhanga', 'Nyamagabe'],
          'East': ['Kayonza', 'Nyagatare', 'Rwamagana'],
          'West': ['Rubavu', 'Rusizi', 'Karongi']
        };

        const districts = popularDistricts[province] || [];
        districts.slice(0, 2).forEach(dist => {
          if (dist !== district) {
            recommendations.push({
              name: dist,
              fullName: `${dist}, ${province}`,
              description: `Popular area in your province`,
              icon: '📍',
              type: 'nearby_district',
              score: 70
            });
          }
        });
      }

      const popularTypes = [
        { name: 'Apartments', type: 'apartment', icon: '🏢' },
        { name: 'Houses', type: 'house', icon: '🏠' },
        { name: 'Studios', type: 'studio', icon: '🏪' }
      ];

      popularTypes.forEach((type, index) => {
        if (index < 2) {
          recommendations.push({
            name: type.name,
            fullName: `${type.name} near you`,
            description: `Available in ${district || 'your area'}`,
            icon: type.icon,
            type: 'property_type',
            score: 60
          });
        }
      });

      return recommendations.slice(0, 4);
    }

    return POPULAR_DESTINATIONS.slice(0, 4).map(dest => ({
      ...dest,
      score: 50,
      description: 'Popular destination in Rwanda'
    }));
  }, [userLocation, backendNearbyAttractions]);

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'province': return '#4F46E5';
      case 'district': return '#059669';
      case 'sector': return '#DC2626';
      case 'cell': return '#D97706';
      case 'village': return '#7C3AED';
      case 'city': return '#1D4ED8';
      case 'town': return '#0D9488';
      case 'education': return '#2563EB';
      case 'hospital': return '#DC2626';
      case 'market': return '#059669';
      case 'hotel': return '#D97706';
      case 'attraction': return '#7C3AED';
      case 'transport': return '#9333EA';
      case 'business': return '#1D4ED8';
      case 'area': return '#6B7280';
      case 'property_type': return '#BC8BBC';
      case 'nearby_landmark': return '#9333EA';
      case 'nearby': return '#9333EA';
      case 'popular': return '#DC2626';
      case 'trending': return '#D97706';
      case 'destination': return '#059669';
      case 'personalized': return '#BC8BBC';
      default: return '#6B7280';
    }
  };

  const getTypeDisplayName = (type) => {
    const names = {
      'province': 'Province',
      'district': 'District',
      'sector': 'Sector',
      'cell': 'Cell',
      'village': 'Village',
      'city': 'City',
      'town': 'Town',
      'education': 'Education',
      'hospital': 'Hospital',
      'market': 'Market',
      'hotel': 'Hotel',
      'attraction': 'Attraction',
      'transport': 'Transport',
      'business': 'Business',
      'area': 'Area',
      'property_type': 'Property Type',
      'nearby_landmark': 'Nearby Landmark',
      'nearby': 'Nearby',
      'popular': 'Popular',
      'trending': 'Trending',
      'destination': 'Destination',
      'personalized': 'For You'
    };
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const renderEmptyState = () => {
    const popularDestinations = backendRecommendations?.popularDestinations || POPULAR_DESTINATIONS;
    const trendingSearches = backendRecommendations?.trendingSearches || [];
    const personalized = backendRecommendations?.personalized || [];

    const userDistrict = userLocation?.address?.district || 'your area';
    const hasUserLocation = userLocation && userLocation.address && userLocation.address.province;

    return (
      <div className="p-4 md:p-6">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: `${MAIN_COLOR}15` }}>
              <Navigation size={20} style={{ color: MAIN_COLOR }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {hasUserLocation ? 'Near Your Location' : 'Popular Near You'}
              </div>
              <div className="text-xs text-gray-500">
                {hasUserLocation
                  ? `Based on properties in ${userDistrict}`
                  : isGettingLocation ? 'Detecting your location...' : 'Enable location for personalized recommendations'
                }
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {nearbyRecommendations.map((destination, index) => (
              <button
                key={`nearby-${index}`}
                type="button"
                onClick={() => handleSuggestionClick(destination)}
                className="p-3 text-left hover:bg-gray-50 rounded-xl transition-all border border-gray-200 hover:border-gray-300 hover:shadow-sm flex items-start group relative"
              >
                <div className="text-lg mr-2">{destination.icon || '📍'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 group-hover:text-gray-700 text-sm truncate">
                    {destination.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {destination.description}
                  </div>
                  {destination.propertyCount > 0 && (
                    <div className="text-[10px] mt-1 font-medium"
                      style={{ color: MAIN_COLOR }}>
                      {destination.propertyCount} properties available
                    </div>
                  )}
                </div>
                {destination.score >= 90 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: `${MAIN_COLOR}15` }}>
                <Clock size={20} style={{ color: MAIN_COLOR }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Recent searches</div>
                <div className="text-xs text-gray-500">Your search history</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={`recent-${index}`}
                  type="button"
                  onClick={() => handleRecentSearchClick(search)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                  <Clock size={12} className="mr-2" />
                  <span className="truncate max-w-[120px]">{search.query}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {trendingSearches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: `${MAIN_COLOR}15` }}>
                <TrendingUp size={20} style={{ color: MAIN_COLOR }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Trending now</div>
                <div className="text-xs text-gray-500">Popular searches this week</div>
              </div>
            </div>

            <div className="space-y-2">
              {trendingSearches.slice(0, 5).map((destination, index) => (
                <button
                  key={`trending-${index}`}
                  type="button"
                  onClick={() => handleSuggestionClick(destination)}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-start group"
                >
                  <div className="text-lg mr-3">{destination.icon || '🔥'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-gray-900 group-hover:text-gray-700 text-sm">
                        {destination.name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">{destination.description}</div>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 transform -rotate-90 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: `${MAIN_COLOR}15` }}>
              <Star size={20} style={{ color: MAIN_COLOR }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Popular across Rwanda</div>
              <div className="text-xs text-gray-500">Top destinations to explore</div>
            </div>
          </div>

          <div className="space-y-2">
            {popularDestinations.slice(0, 5).map((destination, index) => (
              <button
                key={`popular-${index}`}
                type="button"
                onClick={() => handleSuggestionClick(destination)}
                className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-start group"
              >
                <div className="text-lg mr-3">{destination.icon || '📍'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-gray-900 group-hover:text-gray-700 text-sm">
                      {destination.name}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{destination.description}</div>
                </div>
                <ChevronDown size={16} className="text-gray-400 transform -rotate-90 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {personalized.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: `${MAIN_COLOR}15` }}>
                <PaletteIcon size={20} style={{ color: MAIN_COLOR }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">For you</div>
                <div className="text-xs text-gray-500">Personalized recommendations</div>
              </div>
            </div>

            <div className="space-y-2">
              {personalized.slice(0, 5).map((item, index) => (
                <button
                  key={`personalized-${index}`}
                  type="button"
                  onClick={() => handleSuggestionClick({
                    ...item,
                    fullName: item.fullName || item.name
                  })}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-start group"
                >
                  <div className="text-lg mr-3">{item.icon || '💎'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-gray-900 group-hover:text-gray-700 text-sm">
                        {item.name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</div>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 transform -rotate-90 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSearchResults = () => {
    if (showLoadingState) {
      return <SearchResultSkeleton />;
    }

    return (
      <div className="p-4">
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={`result-${index}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full p-3 text-left hover:bg-gray-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm flex items-start group"
            >
              <div className="text-lg mr-3">{suggestion.icon || '📍'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <div className="font-medium text-gray-900 group-hover:text-gray-700 text-sm truncate">
                    {suggestion.fullName || suggestion.name}
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: `${getTypeBadgeColor(suggestion.type)}15`,
                      color: getTypeBadgeColor(suggestion.type)
                    }}>
                    {getTypeDisplayName(suggestion.type)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 line-clamp-1">{suggestion.description}</div>
              </div>
              <ChevronDown size={16} className="text-gray-400 transform -rotate-90 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {suggestions.length === 0 && !showLoadingState && (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
              style={{ backgroundColor: `${MAIN_COLOR}15` }}>
              <Search size={24} style={{ color: MAIN_COLOR }} />
            </div>
            <div className="text-gray-600 font-medium">Search for locations or landmarks</div>
            <div className="text-gray-500 text-sm mt-1">Try a place name or landmark in Rwanda</div>
          </div>
        )}
      </div>
    );
  };

  const renderCustomizePanel = () => {
    const filteredLandmarks = RWANDA_LANDMARKS.filter(landmark =>
      landmark.name.toLowerCase().includes(landmarkSearchQuery.toLowerCase()) ||
      landmark.category.toLowerCase().includes(landmarkSearchQuery.toLowerCase())
    );

    const currentAmenities = AMENITIES.filter(a => a.category === selectedAmenityCategory);

    const panelContent = (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: `${MAIN_COLOR}15` }}>
              <Filter size={20} style={{ color: MAIN_COLOR }} />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">Refine Your Search</div>
              <div className="text-sm text-gray-500">Filter properties by your preferences</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCustomizeOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Location Hierarchy */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin size={16} className="mr-2" />
            Location
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['province', 'district', 'sector', 'cell', 'village'].map((level) => (
              <div key={level} className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </label>
                <select
                  value={searchConfig[level] || ''}
                  onChange={(e) => handleConfigChange(level, e.target.value || null)}
                  disabled={level !== 'province' && !getLocationOptions(level).length}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    focusRingColor: MAIN_COLOR,
                    ...(level !== 'province' && !getLocationOptions(level).length ? { backgroundColor: '#F9FAFB' } : {})
                  }}
                >
                  <option value="">Any {level}</option>
                  {getLocationOptions(level).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Isibo
              </label>
              <input
                type="text"
                value={searchConfig.isibo || ''}
                onChange={(e) => handleConfigChange('isibo', e.target.value || null)}
                placeholder="Optional"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: MAIN_COLOR }}
              />
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <DollarSign size={16} className="mr-2" />
            Price Range (RWF)
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Minimum Price
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatNumber(searchConfig.minPrice)}
                    onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: MAIN_COLOR }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Maximum Price
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatNumber(searchConfig.maxPrice)}
                    onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                    placeholder="5,000,000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: MAIN_COLOR }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {['monthly', 'weekly', 'daily', 'yearly'].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => handleConfigChange('pricePeriod', period)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${searchConfig.pricePeriod === period
                    ? 'text-white font-medium'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                    }`}
                  style={searchConfig.pricePeriod === period ? {
                    backgroundColor: MAIN_COLOR
                  } : {}}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Property Types */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Home size={16} className="mr-2" />
            Property Types
          </h3>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => togglePropertyType(type)}
                className={`px-3 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${searchConfig.propertyTypes.includes(type)
                  ? 'text-white font-medium shadow-sm'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                style={searchConfig.propertyTypes.includes(type) ? {
                  backgroundColor: MAIN_COLOR,
                  boxShadow: `0 2px 8px 0 ${MAIN_COLOR}40`
                } : {}}
              >
                <Home size={14} />
                <span className="truncate">
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Sliders size={16} className="mr-2" />
            Requirements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bedrooms</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={searchConfig.minBedrooms}
                  onChange={(e) => handleConfigChange('minBedrooms', e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: MAIN_COLOR }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bathrooms</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={searchConfig.minBathrooms}
                  onChange={(e) => handleConfigChange('minBathrooms', e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: MAIN_COLOR }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Guests</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={searchConfig.minGuests}
                  onChange={(e) => handleConfigChange('minGuests', e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: MAIN_COLOR }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Area (m²)</label>
              <input
                type="text"
                value={searchConfig.minArea}
                onChange={(e) => handleConfigChange('minArea', e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: MAIN_COLOR }}
              />
            </div>
          </div>
        </div>

        {/* Nearby Attractions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <TreePine size={16} className="mr-2" />
            Nearby Attractions
          </h3>
          <div className="mb-3">
            <input
              type="text"
              value={landmarkSearchQuery}
              onChange={(e) => setLandmarkSearchQuery(e.target.value)}
              placeholder="Search landmarks..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ focusRingColor: MAIN_COLOR }}
            />
          </div>
          <div className="max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
            {filteredLandmarks.length > 0 ? (
              filteredLandmarks.map((landmark) => (
                <label
                  key={landmark.name}
                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={searchConfig.nearbyAttractions.includes(landmark.name)}
                    onChange={() => toggleNearbyAttraction(landmark.name)}
                    className="w-4 h-4 rounded border-gray-300 mr-3"
                    style={{ accentColor: MAIN_COLOR }}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-base">{landmark.icon}</span>
                    <div>
                      <div className="text-sm text-gray-700 truncate">{landmark.name}</div>
                      <div className="text-xs text-gray-500">{landmark.category}</div>
                    </div>
                  </div>
                </label>
              ))
            ) : (
              <div className="text-center py-2">
                <div className="text-sm text-gray-500">Search for landmarks</div>
              </div>
            )}
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <CheckSquare size={16} className="mr-2" />
            Amenities
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {AMENITY_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedAmenityCategory(category.id)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${selectedAmenityCategory === category.id
                  ? 'text-white font-medium'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                style={selectedAmenityCategory === category.id ? {
                  backgroundColor: MAIN_COLOR
                } : {}}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
            {currentAmenities.map((amenity) => (
              <label
                key={amenity.key}
                className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={searchConfig.amenities.includes(amenity.key)}
                  onChange={() => toggleAmenity(amenity.key)}
                  className="w-4 h-4 rounded border-gray-300 mr-3"
                  style={{ accentColor: MAIN_COLOR }}
                />
                <div className="flex items-center gap-2">
                  {amenity.icon}
                  <span className="text-sm text-gray-700">{amenity.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={searchConfig.isVerified}
                onChange={(e) => handleConfigChange('isVerified', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 mr-3"
                style={{ accentColor: MAIN_COLOR }}
              />
              <span className="text-sm text-gray-700">Verified Only</span>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={searchConfig.isFeatured}
                onChange={(e) => handleConfigChange('isFeatured', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 mr-3"
                style={{ accentColor: MAIN_COLOR }}
              />
              <span className="text-sm text-gray-700">Featured Only</span>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={searchConfig.utilitiesIncluded}
                onChange={(e) => handleConfigChange('utilitiesIncluded', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 mr-3"
                style={{ accentColor: MAIN_COLOR }}
              />
              <span className="text-sm text-gray-700">Utilities Included</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Reset All
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustomizeOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${MAIN_COLOR}, ${MAIN_COLOR_DARK})`,
                boxShadow: '0 4px 14px 0 rgba(188, 139, 188, 0.3)'
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsCustomizeOpen(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
            {panelContent}
          </div>
        </>
      );
    }

    return (
      <div className="absolute top-full mt-2 right-0 w-full md:w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
        ref={customizeRef}>
        {panelContent}
      </div>
    );
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <div
            className={`bg-white rounded-full border transition-all duration-300 ${isSearchOpen && !isMobile
              ? 'shadow-xl border-gray-300 ring-2'
              : 'shadow-lg border-gray-200 hover:border-gray-300 hover:shadow-xl'
              }`}
            style={{
              borderColor: isSearchOpen && !isMobile ? MAIN_COLOR : undefined,
              ringColor: isSearchOpen && !isMobile ? `${MAIN_COLOR}30` : undefined
            }}
          >
            <div className="p-2">
              <div className="flex items-center">
                <div className="pl-4 pr-3">
                  <Search
                    size={20}
                    style={{ color: isSearchOpen && !isMobile ? MAIN_COLOR : '#6B7280' }}
                  />
                </div>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder={isMobile ? "Search Rwanda..." : "Search anywhere in Rwanda..."}
                    className="w-full py-4 bg-transparent outline-none text-gray-900 placeholder-gray-500 text-base font-medium"
                    autoComplete="off"
                  />
                </div>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-2 mr-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-full"
                  >
                    <X size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
                  className="h-[52px] px-4 mr-2 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 border"
                  style={{
                    borderColor: MAIN_COLOR_LIGHT,
                    backgroundColor: Object.values(searchConfig).some(val =>
                      Array.isArray(val) ? val.length > 0 :
                        typeof val === 'boolean' ? val :
                          (typeof val === 'string' && val.trim() !== '' && val !== '1') ||
                          (typeof val === 'number' && val > 0)
                    ) ? `${MAIN_COLOR}15` : 'white',
                    color: MAIN_COLOR
                  }}
                >
                  <Filter size={18} />
                  {!isMobile && <span className="font-medium">Filters</span>}
                </button>

                <button
                  type="submit"
                  className="h-[52px] px-6 text-white font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${MAIN_COLOR}, ${MAIN_COLOR_DARK})`,
                    boxShadow: '0 4px 14px 0 rgba(188, 139, 188, 0.3)'
                  }}
                >
                  <Search size={18} />
                  {!isMobile && <span className="font-bold">Search</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Search Suggestions Dropdown */}
          {isSearchOpen && (
            <>
              {isMobile ? (
                // Mobile full-screen overlay - Matching desktop design exactly
                <div className="fixed inset-0 z-50 bg-white flex flex-col">
                  {/* Mobile Header with Search Bar - Exactly like desktop */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
                    <div className="flex items-center gap-2">
                      {/* Search Input - Matching desktop exactly */}
                      <div className="flex-1 relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Search size={20} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search anywhere in Rwanda..."
                          className="w-full h-[52px] pl-12 pr-12 bg-gray-100 rounded-full outline-none text-gray-900 text-base placeholder-gray-500 font-medium"
                          autoFocus
                        />
                        {searchQuery && (
                          <button
                            onClick={clearSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      {/* Filter Button - Opens advanced filters modal (NOT search) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsCustomizeOpen(true);
                          // Do NOT close search or trigger any other actions
                        }}
                        className="h-[52px] px-4 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 border"
                        style={{
                          borderColor: MAIN_COLOR_LIGHT,
                          backgroundColor: Object.values(searchConfig).some(val =>
                            Array.isArray(val) ? val.length > 0 :
                              typeof val === 'boolean' ? val :
                                (typeof val === 'string' && val.trim() !== '' && val !== '1') ||
                                (typeof val === 'number' && val > 0)
                          ) ? `${MAIN_COLOR}15` : 'white',
                          color: MAIN_COLOR
                        }}
                      >
                        <Filter size={18} />
                      </button>

                      {/* Close Button - Closes search overlay */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsSearchOpen(false);
                        }}
                        className="h-[52px] px-4 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50"
                      >
                        <X size={18} className="text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Content - Exactly like desktop dropdown */}
                  <div className="flex-1 overflow-y-auto">
                    {searchQuery ? (
                      // Search Results - Matching desktop exactly
                      <div className="p-4">
                        {showLoadingState ? (
                          <SearchResultSkeleton />
                        ) : (
                          <div className="space-y-2">
                            {suggestions.map((suggestion, index) => (
                              <button
                                key={`mobile-result-${index}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="w-full p-3 text-left hover:bg-gray-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm flex items-start group"
                              >
                                <div className="text-lg mr-3">{suggestion.icon || '📍'}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <div className="font-medium text-gray-900 group-hover:text-gray-700 text-sm truncate">
                                      {suggestion.fullName || suggestion.name}
                                    </div>
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor: `${getTypeBadgeColor(suggestion.type)}15`,
                                        color: getTypeBadgeColor(suggestion.type)
                                      }}>
                                      {getTypeDisplayName(suggestion.type)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 line-clamp-1">{suggestion.description}</div>
                                </div>
                                <ChevronDown size={16} className="text-gray-400 transform -rotate-90 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}

                            {suggestions.length === 0 && !showLoadingState && (
                              <div className="py-8 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                                  style={{ backgroundColor: `${MAIN_COLOR}15` }}>
                                  <Search size={24} style={{ color: MAIN_COLOR }} />
                                </div>
                                <div className="text-gray-600 font-medium">Search for locations or landmarks</div>
                                <div className="text-gray-500 text-sm mt-1">Try a place name or landmark in Rwanda</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Empty State - Matching desktop exactly
                      <div className="p-4">
                        {/* Nearby Section */}
                        <div className="mb-8">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                              style={{ backgroundColor: `${MAIN_COLOR}15` }}>
                              <Navigation size={20} style={{ color: MAIN_COLOR }} />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {userLocation?.address?.province ? 'Near Your Location' : 'Popular Near You'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {userLocation?.address?.province
                                  ? `Based on properties in ${userLocation.address.district || 'your area'}`
                                  : isGettingLocation ? 'Detecting your location...' : 'Enable location for personalized recommendations'
                                }
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {nearbyRecommendations.map((destination, index) => (
                              <button
                                key={`nearby-${index}`}
                                onClick={() => handleSuggestionClick(destination)}
                                className="p-3 text-left hover:bg-gray-50 rounded-xl transition-all border border-gray-200 hover:border-gray-300 hover:shadow-sm flex items-start group relative"
                              >
                                <div className="text-lg mr-2">{destination.icon || '📍'}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 group-hover:text-gray-700 text-sm truncate">
                                    {destination.name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                    {destination.description}
                                  </div>
                                  {destination.propertyCount > 0 && (
                                    <div className="text-[10px] mt-1 font-medium"
                                      style={{ color: MAIN_COLOR }}>
                                      {destination.propertyCount} properties available
                                    </div>
                                  )}
                                </div>
                                {destination.score >= 90 && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                          <div className="mb-8">
                            <div className="flex items-center mb-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                                style={{ backgroundColor: `${MAIN_COLOR}15` }}>
                                <Clock size={20} style={{ color: MAIN_COLOR }} />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">Recent searches</div>
                                <div className="text-xs text-gray-500">Your search history</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {recentSearches.map((search, index) => (
                                <button
                                  key={`recent-${index}`}
                                  onClick={() => handleRecentSearchClick(search)}
                                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center"
                                >
                                  <Clock size={12} className="mr-2" />
                                  <span className="truncate max-w-[120px]">{search.query}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Popular Destinations */}
                        <div className="mb-8">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                              style={{ backgroundColor: `${MAIN_COLOR}15` }}>
                              <Star size={20} style={{ color: MAIN_COLOR }} />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">Popular across Rwanda</div>
                              <div className="text-xs text-gray-500">Top destinations to explore</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {POPULAR_DESTINATIONS.slice(0, 5).map((destination, index) => (
                              <button
                                key={`popular-${index}`}
                                onClick={() => handleSuggestionClick(destination)}
                                className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-start group"
                              >
                                <div className="text-lg mr-3">{destination.icon || '📍'}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="font-medium text-gray-900 group-hover:text-gray-700 text-sm">
                                      {destination.name}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{destination.description}</div>
                                </div>
                                <ChevronDown size={16} className="text-gray-400 transform -rotate-90 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Desktop dropdown (unchanged)
                <div
                  ref={searchDropdownRef}
                  className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[70vh] overflow-y-auto"
                >
                  {searchQuery ? renderSearchResults() : renderEmptyState()}

                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        Search anywhere you want
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSearchOpen(false)}
                        className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Customize Panel */}
          {isCustomizeOpen && renderCustomizePanel()}
        </div>
      </form>
    </div>
  );
}