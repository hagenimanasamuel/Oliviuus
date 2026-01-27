// SearchBar.js - Professional search with intelligent algorithms
import { 
  MapPin, Search, ChevronDown, Navigation, TrendingUp, Clock, X, 
  Filter, DollarSign, Home, Bed, Bath, Users, CheckSquare, Sliders, TreePine,
  Star, Wifi, Car, Shield, Thermometer, Coffee, Waves, Snowflake, Wind, Tv, 
  Droplets, Utensils, Cloud, Zap, Briefcase, Battery, Building2, Dumbbell,
  Music, Palette, PaletteIcon, Loader2
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
class IntelligentSearchService {
  constructor() {
    this.geoData = rwandaLocationData;
    this.buildLocationIndex();
  }

  buildLocationIndex() {
    this.locationIndex = [];
    this.provinceDistricts = {};
    
    // Build comprehensive location index
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
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  // Advanced search with fuzzy matching and intelligent parsing
  intelligentSearch(query, userLocation = null) {
    if (!query.trim()) return [];
    
    const normalizedQuery = this.normalizeText(query);
    const queryWords = normalizedQuery.split(' ');
    const results = [];
    const seen = new Set();
    
    // Common search patterns
    const searchPatterns = this.analyzeQueryPatterns(normalizedQuery);
    
    // 1. Search in location index (fuzzy matching)
    this.locationIndex.forEach(location => {
      let score = 0;
      
      // Check each search term
      location.searchTerms.forEach(term => {
        // Exact match at start
        if (term === normalizedQuery) score += 100;
        
        // Starts with query
        else if (term.startsWith(normalizedQuery)) score += 80;
        
        // Query starts with term
        else if (normalizedQuery.startsWith(term)) score += 70;
        
        // Contains query
        else if (term.includes(normalizedQuery)) score += 60;
        
        // Query contains term
        else if (normalizedQuery.includes(term)) score += 50;
        
        // Fuzzy match for single letters
        else if (normalizedQuery.length === 1 && term.startsWith(normalizedQuery)) {
          score += 40;
        }
        
        // Word-by-word matching
        else {
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
      
      // Location-based boosting
      if (userLocation) {
        if (location.type === 'province' && location.name === userLocation.province) score += 50;
        if (location.type === 'district' && location.name === userLocation.district) score += 100;
        if (location.type === 'sector' && location.name === userLocation.sector) score += 150;
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
    
    // 2. Search landmarks (fuzzy matching)
    RWANDA_LANDMARKS.forEach(landmark => {
      let score = 0;
      const landmarkName = this.normalizeText(landmark.name);
      const landmarkCategory = this.normalizeText(landmark.category);
      
      // Check name
      if (landmarkName.includes(normalizedQuery)) score += 70;
      if (normalizedQuery.includes(landmarkName)) score += 60;
      
      // Check category
      if (landmarkCategory.includes(normalizedQuery)) score += 50;
      
      // Check type
      if (this.normalizeText(landmark.type).includes(normalizedQuery)) score += 40;
      
      // Check partial matches
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
    
    // 3. Search property types
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
    
    // 4. Process search patterns
    if (searchPatterns.nearby && userLocation) {
      // Search for locations near user's location
      const nearbyLocations = this.searchNearbyLocations(searchPatterns.nearby, userLocation);
      results.push(...nearbyLocations);
    }
    
    if (searchPatterns.location) {
      // Search for properties in specific location
      const locationResults = this.searchByLocationPattern(searchPatterns.location);
      results.push(...locationResults);
    }
    
    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 15);
  }

  analyzeQueryPatterns(query) {
    const patterns = {
      nearby: null,
      location: null,
      propertyType: null
    };
    
    // Check for "near" patterns (Kinyarwanda and English)
    const nearPatterns = ['near', 'hafi', 'hafi ya', 'hafi na', 'close to', 'around'];
    nearPatterns.forEach(pattern => {
      if (query.includes(pattern)) {
        const parts = query.split(pattern);
        if (parts[1]) {
          patterns.nearby = parts[1].trim();
        }
      }
    });
    
    // Check for "in" patterns
    const inPatterns = ['in', 'mu', 'iya', 'at', 'ziri mu'];
    inPatterns.forEach(pattern => {
      if (query.includes(pattern)) {
        const parts = query.split(pattern);
        if (parts[1]) {
          patterns.location = parts[1].trim();
        }
      }
    });
    
    // Check for property type patterns
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
    
    // Search landmarks near user location
    RWANDA_LANDMARKS.forEach(landmark => {
      const landmarkName = this.normalizeText(landmark.name);
      
      // Check if landmark matches nearby query
      if (landmarkName.includes(normalizedNearby) || normalizedNearby.includes(landmarkName)) {
        // Boost score if in same province/district
        let score = 60;
        if (userLocation.province && landmarkName.includes(this.normalizeText(userLocation.province))) score += 30;
        if (userLocation.district && landmarkName.includes(this.normalizeText(userLocation.district))) score += 50;
        
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
    
    // Search in location index
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

  // Generate nearby recommendations based on user location
  generateNearbyRecommendations(userLocation) {
    if (!userLocation) return POPULAR_DESTINATIONS.slice(0, 4);
    
    const recommendations = [];
    
    // 1. Same district recommendations
    if (userLocation.district && this.provinceDistricts[userLocation.province]) {
      // Add other sectors in same district
      if (this.geoData[userLocation.province]?.[userLocation.district]) {
        Object.keys(this.geoData[userLocation.province][userLocation.district])
          .filter(sector => sector !== userLocation.sector)
          .slice(0, 2)
          .forEach(sector => {
            recommendations.push({
              name: sector,
              fullName: `${sector}, ${userLocation.district}`,
              type: 'sector',
              description: `Sector in ${userLocation.district}`,
              icon: '📍',
              score: 100
            });
          });
      }
    }
    
    // 2. Same province, different districts
    if (userLocation.province && this.provinceDistricts[userLocation.province]) {
      this.provinceDistricts[userLocation.province]
        .filter(district => district !== userLocation.district)
        .slice(0, 2)
        .forEach(district => {
          recommendations.push({
            name: district,
            fullName: `${district}, ${userLocation.province}`,
            type: 'district',
            description: `Nearby district in ${userLocation.province}`,
            icon: '🏙️',
            score: 80
          });
        });
    }
    
    // 3. Popular destinations in same province
    POPULAR_DESTINATIONS
      .filter(dest => dest.province === userLocation.province && dest.district !== userLocation.district)
      .slice(0, 2)
      .forEach(dest => {
        recommendations.push({
          ...dest,
          score: 70
        });
      });
    
    // 4. Fill with general popular destinations if needed
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
    
    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, 4);
  }

  // Get all locations starting with a letter
  getLocationsStartingWith(letter, userLocation = null) {
    const normalizedLetter = letter.toLowerCase();
    const results = [];
    
    // Search in location index
    this.locationIndex.forEach(location => {
      if (location.name.toLowerCase().startsWith(normalizedLetter)) {
        let score = 50;
        
        // Boost based on user location
        if (userLocation) {
          if (location.type === 'sector' && userLocation.district && 
              this.geoData[userLocation.province]?.[userLocation.district]?.[location.name]) {
            score += 100;
          }
          if (location.type === 'village' && userLocation.sector) {
            score += 80;
          }
        }
        
        results.push({ ...location, score });
      }
    });
    
    // Search landmarks
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
    
    // Sort and limit
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10);
  }
}

// Initialize search service
const searchService = new IntelligentSearchService();

// Backend Search Service
class BackendSearchService {
  // Get search suggestions from backend
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

  // Get popular searches from backend
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

  // Get nearby attractions from backend
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
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const customizeRef = useRef(null);

  // Detect user location
  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        let location = null;
        
        // Try GPS
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000
              });
            });
            
            if (position) {
              location = {
                province: 'North',
                district: 'Musanze',
                sector: 'Muhoza'
              };
            }
          } catch (error) {
            // Silent fail
          }
        }
        
        setUserLocation(location);
      } catch (error) {
        // Silent fail
      }
    };
    
    detectUserLocation();
  }, []);

  // Load backend recommendations and nearby attractions
  useEffect(() => {
    if (userLocation) {
      loadBackendRecommendations();
      loadBackendNearbyAttractions();
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
      }
      if (customizeRef.current && !customizeRef.current.contains(event.target)) {
        setIsCustomizeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const loadBackendNearbyAttractions = async () => {
    try {
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
        
        // Single letter search - use local only
        if (searchQuery.trim().length === 1) {
          results = searchService.getLocationsStartingWith(searchQuery.trim(), userLocation);
        } else {
          // Try backend first for intelligent search
          const backendResponse = await BackendSearchService.getSearchSuggestions(searchQuery, userLocation);
          
          if (backendResponse.success && backendResponse.suggestions && backendResponse.suggestions.length > 0) {
            // Use backend suggestions
            results = backendResponse.suggestions.map(suggestion => ({
              ...suggestion,
              score: suggestion.score || 100,
              source: 'backend'
            }));
          } else {
            // Fallback to local intelligent search
            results = searchService.intelligentSearch(searchQuery, userLocation);
          }
        }
        
        setSuggestions(results);
      } catch (error) {
        // Fallback to local search
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
    
    // Build search URL with parameters
    const searchParams = new URLSearchParams();
    
    if (searchQuery.trim()) {
      searchParams.set('q', searchQuery.trim());
    }
    
    // Add location filters
    if (searchConfig.province) searchParams.set('province', searchConfig.province);
    if (searchConfig.district) searchParams.set('district', searchConfig.district);
    if (searchConfig.sector) searchParams.set('sector', searchConfig.sector);
    if (searchConfig.cell) searchParams.set('cell', searchConfig.cell);
    if (searchConfig.village) searchParams.set('village', searchConfig.village);
    if (searchConfig.isibo) searchParams.set('isibo', searchConfig.isibo);
    
    // Add property types
    if (searchConfig.propertyTypes.length > 0) {
      searchParams.set('types', searchConfig.propertyTypes.join(','));
    }
    
    // Add price filters
    if (searchConfig.minPrice) searchParams.set('minPrice', searchConfig.minPrice);
    if (searchConfig.maxPrice) searchParams.set('maxPrice', searchConfig.maxPrice);
    searchParams.set('pricePeriod', searchConfig.pricePeriod);
    
    // Add other filters
    if (searchConfig.minBedrooms) searchParams.set('minBedrooms', searchConfig.minBedrooms);
    if (searchConfig.minBathrooms) searchParams.set('minBathrooms', searchConfig.minBathrooms);
    if (searchConfig.minGuests !== '1') searchParams.set('minGuests', searchConfig.minGuests);
    if (searchConfig.minArea) searchParams.set('minArea', searchConfig.minArea);
    
    // Add boolean filters
    if (searchConfig.isVerified) searchParams.set('isVerified', 'true');
    if (searchConfig.isFeatured) searchParams.set('isFeatured', 'true');
    if (searchConfig.utilitiesIncluded) searchParams.set('utilitiesIncluded', 'true');
    if (searchConfig.acceptNightly) searchParams.set('acceptNightly', 'true');
    if (searchConfig.acceptDaily) searchParams.set('acceptDaily', 'true');
    if (searchConfig.acceptWeekly) searchParams.set('acceptWeekly', 'true');
    if (!searchConfig.acceptMonthly) searchParams.set('acceptMonthly', 'false');
    
    // Add amenities
    if (searchConfig.amenities.length > 0) {
      searchParams.set('amenities', searchConfig.amenities.join(','));
    }
    
    // Add nearby attractions
    if (searchConfig.nearbyAttractions.length > 0) {
      searchParams.set('nearbyAttractions', searchConfig.nearbyAttractions.join(','));
    }
    
    // Navigate to search results
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
  };

  const handleRecentSearchClick = (search) => {
    setSearchQuery(search.query);
    if (search.config) {
      setSearchConfig(search.config);
    }
    setIsSearchOpen(false);
  };

  const handleInputFocus = () => {
    setIsSearchOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
      
      // Clear lower level location selections when a higher level changes
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

  // Handle price input with formatting
  const handlePriceChange = (key, value) => {
    // Remove non-digits
    const cleanValue = value.replace(/[^\d]/g, '');
    // Format with commas
    const formattedValue = formatNumber(cleanValue);
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

  // Get location options
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

  // Generate nearby recommendations
  const nearbyRecommendations = useMemo(() => {
    // Use backend nearby attractions if available
    if (backendNearbyAttractions.length > 0) {
      return backendNearbyAttractions.map(attraction => ({
        name: attraction.name || attraction.district || attraction.sector,
        fullName: attraction.fullName || attraction.name,
        description: attraction.description || 'Nearby attraction',
        icon: '📍',
        type: 'nearby',
        score: 100
      })).slice(0, 4);
    }
    
    // Fallback to local recommendations
    return searchService.generateNearbyRecommendations(userLocation);
  }, [userLocation, backendNearbyAttractions]);

  const getTypeBadgeColor = (type) => {
    switch(type) {
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
    // Use backend recommendations if available
    const popularDestinations = backendRecommendations?.popularDestinations || POPULAR_DESTINATIONS;
    const trendingSearches = backendRecommendations?.trendingSearches || [];
    const nearbySuggestions = backendRecommendations?.nearbySuggestions || [];
    const personalized = backendRecommendations?.personalized || [];

    return (
      <div className="p-4 md:p-6">
        {/* Personalized Nearby Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                 style={{ backgroundColor: `${MAIN_COLOR}15` }}>
              <Navigation size={20} style={{ color: MAIN_COLOR }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Near your location</div>
              <div className="text-xs text-gray-500">Suggestions based on where you are</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 md:ml-13">
            {nearbyRecommendations.map((destination, index) => (
              <button
                key={`nearby-${index}`}
                type="button"
                onClick={() => handleSuggestionClick(destination)}
                className="p-3 text-left hover:bg-gray-50 rounded-xl transition-all border border-gray-200 hover:border-gray-300 hover:shadow-sm flex items-start group"
              >
                <div className="text-lg mr-2">{destination.icon || '📍'}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 group-hover:text-gray-700 text-sm">
                    {destination.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{destination.description}</div>
                </div>
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
            
            <div className="flex flex-wrap gap-2 md:ml-13">
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

        {/* Trending Searches from Backend */}
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
            
            <div className="space-y-2 md:ml-13">
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
          
          <div className="space-y-2 md:ml-13">
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

        {/* Personalized Recommendations from Backend */}
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
            
            <div className="space-y-2 md:ml-13">
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
    // Show loading skeleton
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
        
        {/* Professional empty state */}
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

    return (
      <div className="absolute top-full mt-2 right-0 w-full md:w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
           ref={customizeRef}>
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
              {/* Isibo field */}
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

          {/* Price Range with formatting */}
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
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      searchConfig.pricePeriod === period
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
                  className={`px-3 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${
                    searchConfig.propertyTypes.includes(type)
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
                  className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                    selectedAmenityCategory === category.id
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
      </div>
    );
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          <div 
            className={`bg-white rounded-full border transition-all duration-300 ${
              isSearchOpen 
                ? 'shadow-xl border-gray-300 ring-2' 
                : 'shadow-lg border-gray-200 hover:border-gray-300 hover:shadow-xl'
            }`}
            style={{ 
              borderColor: isSearchOpen ? MAIN_COLOR : undefined,
              ringColor: isSearchOpen ? `${MAIN_COLOR}30` : undefined
            }}
          >
            <div className="p-2">
              <div className="flex items-center">
                {/* Search Icon */}
                <div className="pl-4 pr-3">
                  <Search 
                    size={20} 
                    style={{ color: isSearchOpen ? MAIN_COLOR : '#6B7280' }}
                  />
                </div>
                
                {/* Main Search Input */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Search anywhere in Rwanda..."
                    className="w-full py-4 bg-transparent outline-none text-gray-900 placeholder-gray-500 text-base font-medium"
                  />
                </div>
                
                {/* Clear Button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-2 mr-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-full"
                  >
                    <X size={16} />
                  </button>
                )}
                
                {/* Customize Button */}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(188, 139, 188, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Filter size={18} />
                  {!isMobile && (
                    <span className="font-medium">Filters</span>
                  )}
                </button>
                
                {/* Search Button */}
                <button
                  type="submit"
                  className="h-[52px] px-6 text-white font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2"
                  style={{ 
                    background: `linear-gradient(135deg, ${MAIN_COLOR}, ${MAIN_COLOR_DARK})`,
                    boxShadow: '0 4px 14px 0 rgba(188, 139, 188, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(188, 139, 188, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(188, 139, 188, 0.3)';
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
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
              {searchQuery ? (
                renderSearchResults()
              ) : (
                renderEmptyState()
              )}
              
              {/* Clean footer */}
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

          {/* Customize Panel */}
          {isCustomizeOpen && renderCustomizePanel()}
        </div>
      </form>
    </div>
  );
}