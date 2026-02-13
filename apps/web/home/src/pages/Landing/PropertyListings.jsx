import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MapPin, Home, Check, Moon, Calendar, MoreHorizontal, Star, MapPin as MapPinIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

// Import Rwanda geo data
import rwandaLocationData from '../../data/rwandaGeoData.json';

// Professional skeleton loading component that matches actual property cards
const PropertyCardSkeleton = () => (
  <div className="flex flex-col animate-pulse">
    <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
      {/* Image skeleton - matches actual image aspect ratio */}
      <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 relative">
        <div className="absolute top-3 left-3 w-16 h-6 bg-white/80 backdrop-blur-sm rounded-full"></div>
        <div className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full"></div>
        <div className="absolute bottom-3 left-3 w-24 h-7 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-3">
        {/* Title skeleton */}
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        
        {/* Location skeleton */}
        <div className="flex items-start gap-1.5 mb-3">
          <div className="w-3 h-3 bg-gray-200 rounded-full mt-0.5"></div>
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        
        {/* Price skeleton */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Professional Location Detection Service
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
        address.road  // Sometimes roads can indicate sector areas
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
        
        // If no exact match, try partial matches for sector
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
        // Get first cell as fallback
        const firstCell = Object.keys(cells)[0];
        if (firstCell) {
          cell = firstCell;
          // Get first village from this cell
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
      // Get GPS coordinates
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

      // Use OpenStreetMap for reverse geocoding
      const osmResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&addressdetails=1&countrycodes=RW&accept-language=en`
      );

      if (!osmResponse.ok) {
        throw new Error('OpenStreetMap request failed');
      }

      const osmData = await osmResponse.json();
      
      // Map OSM data to Rwanda administrative divisions
      const mappedLocation = await this.mapOSMToRwandaLocation(osmData);
      
      return {
        coordinates,
        address: mappedLocation,
        source: 'gps_osm',
        displayAddress: osmData.display_name || ''
      };

    } catch (error) {
      // Fallback to IP geolocation
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        
        if (ipData.country_code === 'RW') {
          // Map IP location
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
      } catch (ipError) {
        // Silent error
      }

      // Return empty location
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

  // Enhanced location-based recommendations
  generateLocationRecommendations(userLocation, allProperties) {
    if (!userLocation || !userLocation.address) return allProperties;
    
    const { province, district, sector } = userLocation.address;
    const recommendations = [];
    
    // Group 1: Exact sector matches
    const exactSector = allProperties.filter(p => 
      sector && p.sector && this.normalizeLocationName(p.sector) === this.normalizeLocationName(sector)
    );
    
    // Group 2: Same district, different sector
    const sameDistrict = allProperties.filter(p =>
      district && p.district && 
      this.normalizeLocationName(p.district) === this.normalizeLocationName(district) &&
      (!p.sector || this.normalizeLocationName(p.sector) !== this.normalizeLocationName(sector))
    );
    
    // Group 3: Same province, different district
    const sameProvince = allProperties.filter(p =>
      province && p.province && 
      this.normalizeLocationName(p.province) === this.normalizeLocationName(province) &&
      (!p.district || this.normalizeLocationName(p.district) !== this.normalizeLocationName(district))
    );
    
    // Group 4: Featured properties (fillers if needed)
    const featured = allProperties.filter(p => 
      p.is_featured && ![
        ...exactSector, 
        ...sameDistrict, 
        ...sameProvince
      ].some(sp => sp.id === p.id)
    );
    
    // Group 5: All other properties
    const other = allProperties.filter(p => 
      ![
        ...exactSector, 
        ...sameDistrict, 
        ...sameProvince, 
        ...featured
      ].some(sp => sp.id === p.id)
    );
    
    // Sort each group by featured/verified status
    const sortGroup = (group) => {
      return group.sort((a, b) => {
        if (b.is_featured !== a.is_featured) return b.is_featured - a.is_featured;
        if (b.is_verified !== a.is_verified) return b.is_verified - a.is_verified;
        return 0;
      });
    };
    
    // Combine all groups
    recommendations.push(...sortGroup(exactSector));
    recommendations.push(...sortGroup(sameDistrict));
    recommendations.push(...sortGroup(sameProvince));
    recommendations.push(...sortGroup(featured));
    recommendations.push(...sortGroup(other));
    
    return recommendations;
  }

  // Calculate relevance score for search results
  calculateSearchRelevance(property, searchQuery, searchFilters) {
    let score = 0;
    
    // Convert everything to lowercase for comparison
    const title = (property.title || '').toLowerCase();
    const description = (property.description || '').toLowerCase();
    const address = (property.address || '').toLowerCase();
    const district = (property.district || '').toLowerCase();
    const sector = (property.sector || '').toLowerCase();
    const propertyType = (property.property_type || '').toLowerCase();
    
    const query = (searchQuery || '').toLowerCase();
    const queryWords = query.split(' ').filter(word => word.length > 0);
    
    // Exact matches get highest score
    if (title.includes(query)) score += 1000;
    if (description.includes(query)) score += 500;
    if (address.includes(query)) score += 400;
    
    // Partial matches
    queryWords.forEach(word => {
      if (title.includes(word)) score += 300;
      if (description.includes(word)) score += 150;
      if (address.includes(word)) score += 100;
      if (district.includes(word)) score += 200;
      if (sector.includes(word)) score += 250;
      if (propertyType.includes(word)) score += 175;
    });
    
    // Location filter matches
    if (searchFilters.district && district.includes(searchFilters.district.toLowerCase())) {
      score += 600;
    }
    
    if (searchFilters.sector && sector.includes(searchFilters.sector.toLowerCase())) {
      score += 800;
    }
    
    // Property type filter matches
    if (searchFilters.propertyTypes && searchFilters.propertyTypes.length > 0) {
      const searchTypes = searchFilters.propertyTypes.map(t => t.toLowerCase());
      if (searchTypes.includes(propertyType)) {
        score += 400;
      }
    }
    
    // Boost for featured and verified
    if (property.is_featured) score += 150;
    if (property.is_verified) score += 100;
    
    // Boost for having images
    if (property.image_count > 0) score += 50;
    if (property.image_count >= 3) score += 30;
    
    return score;
  }

  // Sort properties by relevance to search
  sortBySearchRelevance(properties, searchQuery, searchFilters) {
    if (!searchQuery && !searchFilters) return properties;
    
    return [...properties].sort((a, b) => {
      const scoreA = this.calculateSearchRelevance(a, searchQuery, searchFilters);
      const scoreB = this.calculateSearchRelevance(b, searchQuery, searchFilters);
      
      return scoreB - scoreA;
    });
  }

  // Find similar properties when no exact matches
  findSimilarProperties(properties, searchQuery, searchFilters) {
    if (properties.length === 0) return [];
    
    // First, try to find properties with any match
    const matched = properties.filter(property => {
      const title = (property.title || '').toLowerCase();
      const district = (property.district || '').toLowerCase();
      const sector = (property.sector || '').toLowerCase();
      const query = (searchQuery || '').toLowerCase();
      
      // Check if any part matches
      return title.includes(query) || 
             district.includes(query) || 
             sector.includes(query);
    });
    
    if (matched.length > 0) return matched;
    
    // If no direct matches, return properties in same province/district
    if (searchFilters.province || searchFilters.district) {
      return properties.filter(property => {
        if (searchFilters.district && property.district) {
          return this.normalizeLocationName(property.district).includes(
            this.normalizeLocationName(searchFilters.district)
          );
        }
        if (searchFilters.province && property.province) {
          return this.normalizeLocationName(property.province).includes(
            this.normalizeLocationName(searchFilters.province)
          );
        }
        return true;
      });
    }
    
    // Return featured properties as fallback
    return properties.filter(p => p.is_featured);
  }
}

// Initialize location service
const locationService = new ProfessionalLocationService();

// Backend Search Service
class BackendSearchService {
  // Advanced search with backend
  static async advancedSearch(filters) {
    try {
      console.log('🔍 Executing backend search with filters:', filters);
      
      const response = await api.get('/isanzure/search/advanced', {
        params: {
          ...filters,
          limit: 50,
          sortBy: 'relevance'
        }
      });
      
      console.log('✅ Backend search response:', response.data?.data?.length || 0, 'properties found');
      return response.data;
    } catch (error) {
      console.error('❌ Backend search error:', error);
      return { 
        success: false, 
        data: [], 
        recommendations: [],
        pagination: { hasMore: false }
      };
    }
  }

  // Get regular properties (original endpoint)
  static async getRegularProperties(limit = 30) {
    try {
      console.log('📦 Fetching regular properties...');
      const response = await api.get('/public/properties', {
        params: {
          limit: limit,
          sort: 'created_at',
          order: 'desc'
        }
      });
      
      if (response.data?.success) {
        console.log('✅ Regular properties fetched:', response.data.data?.length || 0);
        return {
          success: true,
          data: response.data.data || [],
          pagination: response.data.pagination || { hasMore: false }
        };
      }
      
      return { success: false, data: [], pagination: { hasMore: false } };
    } catch (error) {
      console.error('❌ Error fetching regular properties:', error);
      return { success: false, data: [], pagination: { hasMore: false } };
    }
  }

  // Get more properties for infinite scroll
  static async getMoreProperties(offset, limit = 20, isSearch = false, filters = null) {
    try {
      let response;
      
      if (isSearch && filters) {
        // Load more search results
        response = await api.get('/isanzure/search/advanced', {
          params: {
            ...filters,
            limit: limit,
            offset: offset
          }
        });
      } else {
        // Load more regular properties
        response = await api.get('/public/properties/more', {
          params: {
            limit: limit,
            offset: offset
          }
        });
      }
      
      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data || [],
          pagination: response.data.pagination || { hasMore: false }
        };
      }
      
      return { success: false, data: [], pagination: { hasMore: false } };
    } catch (error) {
      console.error('❌ Error loading more properties:', error);
      return { success: false, data: [], pagination: { hasMore: false } };
    }
  }
}

export default function PropertyListings() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchFilters, setSearchFilters] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const observer = useRef();

  // Parse URL search params on mount and when URL changes
  useEffect(() => {
    const parseAndExecuteSearch = async () => {
      const searchParams = new URLSearchParams(location.search);
      const hasSearchParams = searchParams.toString().length > 0;
      
      console.log('📍 Current URL:', location.pathname, 'Search params:', location.search);
      
      if (hasSearchParams) {
        // We have search parameters in URL
        const filters = {
          query: searchParams.get('q') || '',
          province: searchParams.get('province'),
          district: searchParams.get('district'),
          sector: searchParams.get('sector'),
          cell: searchParams.get('cell'),
          village: searchParams.get('village'),
          isibo: searchParams.get('isibo'),
          propertyTypes: searchParams.get('types')?.split(',')?.filter(Boolean) || [],
          minPrice: searchParams.get('minPrice'),
          maxPrice: searchParams.get('maxPrice'),
          pricePeriod: searchParams.get('pricePeriod') || 'monthly',
          minBedrooms: searchParams.get('minBedrooms'),
          minBathrooms: searchParams.get('minBathrooms'),
          minGuests: searchParams.get('minGuests') || '1',
          minArea: searchParams.get('minArea'),
          amenities: searchParams.get('amenities')?.split(',')?.filter(Boolean) || [],
          nearbyAttractions: searchParams.get('nearbyAttractions')?.split(',')?.filter(Boolean) || [],
          isVerified: searchParams.get('isVerified') === 'true',
          isFeatured: searchParams.get('isFeatured') === 'true',
          hasImages: searchParams.get('hasImages') !== 'false',
          utilitiesIncluded: searchParams.get('utilitiesIncluded') === 'true',
          acceptNightly: searchParams.get('acceptNightly') === 'true',
          acceptDaily: searchParams.get('acceptDaily') === 'true',
          acceptWeekly: searchParams.get('acceptWeekly') === 'true',
          acceptMonthly: searchParams.get('acceptMonthly') !== 'false'
        };
        
        console.log('🎯 Search active with filters:', filters);
        setSearchFilters(filters);
        setSearchQuery(filters.query);
        setIsSearchActive(true);
        await performSearch(filters);
      } else {
        // No search parameters, load regular properties
        console.log('🏠 Loading regular properties (no search params)');
        setIsSearchActive(false);
        setSearchFilters(null);
        setSearchQuery('');
        loadRegularProperties();
      }
    };
    
    parseAndExecuteSearch();
  }, [location.search]);

  // Load regular properties (original behavior)
  const loadRegularProperties = async () => {
    try {
      setLoading(true);
      
      // Get user location for intelligent sorting
      const locationData = await locationService.getUserLocation();
      setUserLocation(locationData);
      
      // Get regular properties
      const response = await BackendSearchService.getRegularProperties(30);
      
      if (response.success && response.data.length > 0) {
        // Apply location-based sorting
        const sortedProperties = locationService.generateLocationRecommendations(
          locationData, 
          response.data
        );
        
        setProperties(sortedProperties);
        setHasMore(response.pagination?.hasMore || false);
        
        console.log('✅ Regular properties loaded:', sortedProperties.length);
      } else {
        setProperties([]);
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('❌ Error loading regular properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Perform search with filters
  const performSearch = async (filters) => {
    try {
      setLoading(true);
      console.log('🔍 Performing search with filters:', filters);
      
      // Get user location for intelligent sorting (if not already loaded)
      if (!userLocation) {
        const locationData = await locationService.getUserLocation();
        setUserLocation(locationData);
      }
      
      let searchResults = [];
      let hasExactMatches = false;
      
      // If we have specific search criteria, use backend search
      if (filters.query || filters.district || filters.sector || filters.propertyTypes.length > 0) {
        const searchResponse = await BackendSearchService.advancedSearch(filters);
        
        if (searchResponse.success && searchResponse.data.length > 0) {
          searchResults = searchResponse.data;
          hasExactMatches = true;
          console.log('✅ Backend search returned', searchResults.length, 'exact matches');
        }
      }
      
      // If no exact matches from backend, get regular properties and filter locally
      if (!hasExactMatches) {
        console.log('🔄 No exact matches, fetching regular properties for local filtering');
        const regularResponse = await BackendSearchService.getRegularProperties(50);
        
        if (regularResponse.success && regularResponse.data.length > 0) {
          // Filter properties locally based on search criteria
          searchResults = regularResponse.data.filter(property => {
            // If no filters, include all properties
            if (!filters.query && !filters.district && !filters.sector && filters.propertyTypes.length === 0) {
              return true;
            }
            
            const title = (property.title || '').toLowerCase();
            const description = (property.description || '').toLowerCase();
            const address = (property.address || '').toLowerCase();
            const district = (property.district || '').toLowerCase();
            const sector = (property.sector || '').toLowerCase();
            const propertyType = (property.property_type || '').toLowerCase();
            
            const query = (filters.query || '').toLowerCase();
            
            // Check query matches
            if (query) {
              const queryWords = query.split(' ').filter(word => word.length > 0);
              const hasQueryMatch = queryWords.some(word => 
                title.includes(word) || 
                description.includes(word) || 
                address.includes(word) ||
                district.includes(word) ||
                sector.includes(word) ||
                propertyType.includes(word)
              );
              
              if (!hasQueryMatch) return false;
            }
            
            // Check district match
            if (filters.district && district !== filters.district.toLowerCase()) {
              return false;
            }
            
            // Check sector match
            if (filters.sector && sector !== filters.sector.toLowerCase()) {
              return false;
            }
            
            // Check property type match
            if (filters.propertyTypes.length > 0) {
              const searchTypes = filters.propertyTypes.map(t => t.toLowerCase());
              if (!searchTypes.includes(propertyType)) {
                return false;
              }
            }
            
            return true;
          });
          
          console.log('✅ Local filtering returned', searchResults.length, 'properties');
        }
      }
      
      // Always ensure we have properties to show
      if (searchResults.length === 0) {
        console.log('🔄 No search results, falling back to regular properties');
        const fallbackResponse = await BackendSearchService.getRegularProperties(30);
        
        if (fallbackResponse.success && fallbackResponse.data.length > 0) {
          searchResults = fallbackResponse.data;
          console.log('✅ Fallback loaded', searchResults.length, 'properties');
        }
      }
      
      // Apply location-based sorting
      if (userLocation && searchResults.length > 0) {
        console.log('📍 Applying location-based sorting');
        searchResults = locationService.generateLocationRecommendations(
          userLocation, 
          searchResults
        );
      }
      
      // Apply search relevance sorting
      if (searchResults.length > 0 && (filters.query || filters.district || filters.sector)) {
        console.log('🎯 Applying search relevance sorting');
        searchResults = locationService.sortBySearchRelevance(
          searchResults, 
          filters.query, 
          filters
        );
      }
      
      setProperties(searchResults);
      setHasMore(searchResults.length >= 30); // Assume has more if we got 30+ results
      
      console.log('✅ Search completed with', searchResults.length, 'properties');
      
    } catch (error) {
      console.error('❌ Search error:', error);
      // Fallback to regular properties
      await loadRegularProperties();
    } finally {
      setLoading(false);
    }
  };

  // Load more properties (for infinite scroll)
  const loadMoreProperties = async () => {
    if (loadingMore || !hasMore) return;
    
    console.log('📥 Loading more properties...');
    setLoadingMore(true);
    
    try {
      const response = await BackendSearchService.getMoreProperties(
        properties.length,
        20,
        isSearchActive,
        searchFilters
      );
      
      if (response.success && response.data.length > 0) {
        let newProperties = response.data;
        
        // Apply location-based sorting to new properties
        if (userLocation) {
          newProperties = locationService.generateLocationRecommendations(
            userLocation, 
            newProperties
          );
        }
        
        // Apply search relevance sorting if in search mode
        if (isSearchActive && searchFilters) {
          newProperties = locationService.sortBySearchRelevance(
            newProperties,
            searchFilters.query,
            searchFilters
          );
        }
        
        setProperties(prev => [...prev, ...newProperties]);
        setHasMore(response.pagination?.hasMore || false);
        
        console.log('✅ Loaded', newProperties.length, 'more properties');
      } else {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('❌ Error loading more properties:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Infinite scroll observer
  const lastPropertyRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && properties.length >= 20) {
        loadMoreProperties();
      }
    }, {
      rootMargin: '100px'
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, properties.length]);

  // Utility functions
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Contact';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatPropertyType = (type) => {
    if (!type) return '';
    const typeMap = {
      'apartment': 'APARTMENT',
      'house': 'HOUSE',
      'villa': 'VILLA',
      'condo': 'CONDO',
      'studio': 'STUDIO',
      'ghetto': 'GHETTO',
      'living_house': 'LIVING HOUSE',
      'service_apartment': 'SERVICE APT',
      'guest_house': 'GUEST HOUSE',
      'bungalow': 'BUNGALOW',
      'commercial': 'COMMERCIAL',
      'hostel': 'HOSTEL',
      'penthouse': 'PENTHOUSE',
      'townhouse': 'TOWNHOUSE',
      'upmarket': 'UP MARKET'
    };
    return typeMap[type] || type.toUpperCase().replace('_', ' ');
  };

  const getCompleteLocation = (property) => {
    const parts = [];
    if (property.district) parts.push(property.district);
    if (property.sector) parts.push(property.sector);
    if (property.cell) parts.push(property.cell);
    if (property.village) parts.push(property.village);
    if (property.isibo) parts.push(property.isibo);
    
    return parts.join(' • ');
  };

  const getPriceOptions = (property) => {
    const options = [];
    
    if (property.accept_monthly && property.monthly_price > 0) {
      options.push({
        amount: property.monthly_price,
        period: 'month',
        label: 'Monthly',
        icon: <Calendar size={12} />,
        primary: true
      });
    }
    
    if (property.accept_nightly && property.nightly_price > 0) {
      options.push({
        amount: property.nightly_price,
        period: 'night',
        label: 'Nightly',
        icon: <Moon size={12} />
      });
    }
    
    if (property.accept_weekly && property.weekly_price > 0) {
      options.push({
        amount: property.weekly_price,
        period: 'week',
        label: 'Weekly',
        icon: <Calendar size={12} />
      });
    }
    
    if (property.accept_daily && property.daily_price > 0) {
      options.push({
        amount: property.daily_price,
        period: 'day',
        label: 'Daily',
        icon: <Calendar size={12} />
      });
    }
    
    return options;
  };

  const handlePropertyClick = (propertyUid) => {
    navigate(`/properties/${propertyUid}`);
  };

  const isInExactSector = (property) => {
    if (!userLocation || !userLocation.address || !userLocation.address.sector) return false;
    if (!property || !property.sector) return false;
    
    const userSector = locationService.normalizeLocationName(userLocation.address.sector);
    const propSector = locationService.normalizeLocationName(property.sector);
    
    return userSector === propSector;
  };

  const isInExactDistrict = (property) => {
    if (!userLocation || !userLocation.address || !userLocation.address.district) return false;
    if (!property || !property.district) return false;
    
    const userDistrict = locationService.normalizeLocationName(userLocation.address.district);
    const propDistrict = locationService.normalizeLocationName(property.district);
    
    return userDistrict === propDistrict;
  };

  // Calculate search match relevance for UI
  const calculateMatchScore = (property) => {
    if (!isSearchActive || !searchQuery) return 0;
    
    const title = (property.title || '').toLowerCase();
    const description = (property.description || '').toLowerCase();
    const address = (property.address || '').toLowerCase();
    const district = (property.district || '').toLowerCase();
    const sector = (property.sector || '').toLowerCase();
    
    const query = searchQuery.toLowerCase();
    const queryWords = query.split(' ').filter(word => word.length > 0);
    
    let score = 0;
    
    // Exact title match
    if (title === query) score += 5;
    
    // Contains query in title
    if (title.includes(query)) score += 4;
    
    // Each matching word in title
    queryWords.forEach(word => {
      if (title.includes(word)) score += 3;
    });
    
    // District match
    if (district.includes(query) || query.includes(district)) score += 2;
    
    // Sector match
    if (sector.includes(query) || query.includes(sector)) score += 2;
    
    return score;
  };

  // Loading state with professional skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-3 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(18)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-3 py-6">
        {/* Property Grid */}
        {properties.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {properties.map((property, index) => {
                const priceOptions = getPriceOptions(property);
                const primaryOption = priceOptions[0];
                const secondaryOption = priceOptions[1];
                const propertyType = formatPropertyType(property.property_type);
                
                const inExactSector = isInExactSector(property);
                const inExactDistrict = isInExactDistrict(property);
                const matchScore = calculateMatchScore(property);
                const isHighMatch = matchScore >= 3;
                
                return (
                  <div 
                    key={property.id || index}
                    ref={index === properties.length - 5 ? lastPropertyRef : null}
                    className="group cursor-pointer flex flex-col"
                    onClick={() => handlePropertyClick(property.property_uid)}
                  >
                    <div className="relative rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-[#BC8BBC] hover:shadow-lg transition-all duration-300 flex-1 flex flex-col">
                      {/* Property Image */}
                      <div className="h-40 relative overflow-hidden flex-shrink-0">
                        {property.cover_image ? (
                          <img 
                            src={property.cover_image} 
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] flex items-center justify-center">
                            <Home className="h-10 w-10 text-[#BC8BBC]/50" />
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        
                        {/* Property Type Badge */}
                        <div className="absolute top-3 left-3">
                          <div className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full">
                            <span className="text-[10px] font-bold text-[#BC8BBC] leading-tight tracking-tight">
                              {propertyType.length > 15 ? propertyType.substring(0, 15) + '...' : propertyType}
                            </span>
                          </div>
                        </div>
                        
                        {/* Favorite Button */}
                        <button 
                          className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Heart size={16} className="text-gray-700" />
                        </button>
                        
                        {/* Location Badges */}
                        <div className="absolute bottom-3 left-3 flex flex-col gap-1">
                          {inExactSector && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#8A5A8A] to-[#6A3A6A] text-white rounded-full">
                              <MapPin size={10} />
                              <span className="text-[10px] font-medium">Your Sector</span>
                            </div>
                          )}
                          
                          {inExactDistrict && !inExactSector && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#BC8BBC] to-[#9A6A9A] text-white rounded-full">
                              <MapPin size={10} />
                              <span className="text-[10px] font-medium">Your District</span>
                            </div>
                          )}
                          
                          {/* Search Match Badge */}
                          {isSearchActive && isHighMatch && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white rounded-full">
                              <Star size={10} />
                              <span className="text-[10px] font-medium">Best Match</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Verified Badge */}
                        {property.is_verified && (
                          <div className={`absolute ${inExactSector || inExactDistrict || isHighMatch ? 'bottom-3 right-3' : 'bottom-3 left-3'} flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-full`}>
                            <Check size={12} className="stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                      
                      {/* Property Info */}
                      <div className="p-3 flex-1 flex flex-col">
                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
                          {property.title || 'Beautiful Property'}
                        </h3>
                        
                        {/* Complete Location */}
                        <div className="flex items-start gap-1.5 mb-2 flex-grow">
                          <MapPin size={12} className="text-[#BC8BBC] flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {getCompleteLocation(property) || 'Location not specified'}
                          </span>
                        </div>
                        
                        {/* Price Options */}
                        <div className="pt-2 border-t border-gray-100 mt-auto">
                          {primaryOption ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {primaryOption.icon}
                                  <span className="text-xs text-gray-500">{primaryOption.label}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-gray-900 text-sm">
                                    {formatPrice(primaryOption.amount)}
                                  </div>
                                </div>
                              </div>
                              
                              {secondaryOption && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {secondaryOption.icon}
                                    <span className="text-xs text-gray-500">{secondaryOption.label}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium text-gray-700 text-sm">
                                      {formatPrice(secondaryOption.amount)}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {priceOptions.length > 2 && (
                                <div className="flex items-center justify-center pt-1">
                                  <div className="flex items-center gap-1 text-xs text-[#BC8BBC]">
                                    <MoreHorizontal size={12} />
                                    <span>+{priceOptions.length - 2} more</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-1">
                              <span className="text-sm text-gray-500">Contact for pricing</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Load More Skeletons */}
            {loadingMore && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <PropertyCardSkeleton key={`skeleton-${i}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          // Empty state
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] flex items-center justify-center">
              <Home className="h-10 w-10 text-[#BC8BBC]" />
            </div>
            <div className="text-gray-600">
              {isSearchActive 
                ? 'Searching for properties...' 
                : 'Loading available properties...'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}