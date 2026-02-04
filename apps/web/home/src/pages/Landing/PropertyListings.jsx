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

// =====================================================
// PROFESSIONAL LOCATION DETECTION SERVICE
// =====================================================
class ProfessionalLocationService {
  constructor() {
    this.geoData = rwandaLocationData;
    this.locationCache = null;
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.cacheTimestamp = null;
    
    // Rwanda province mapping - comprehensive
    this.provinceMapping = {
      'northern': 'North',
      'northern province': 'North',
      'north': 'North',
      'nord': 'North',
      'amajyaruguru': 'North',
      
      'southern': 'South',
      'southern province': 'South',
      'south': 'South',
      'sud': 'South',
      'amajyepfo': 'South',
      
      'eastern': 'East',
      'eastern province': 'East',
      'east': 'East',
      'est': 'East',
      'iburasirazuba': 'East',
      
      'western': 'West',
      'western province': 'West',
      'west': 'West',
      'ouest': 'West',
      'iburengerazuba': 'West',
      
      'kigali': 'Kigali',
      'kigali city': 'Kigali',
      'ville de kigali': 'Kigali',
      'umujyi wa kigali': 'Kigali'
    };
    
    // Major Rwanda cities/districts for quick matching
    this.majorDistricts = [
      'Kigali', 'Gasabo', 'Kicukiro', 'Nyarugenge',
      'Musanze', 'Rubavu', 'Huye', 'Nyanza', 'Rwamagana',
      'Muhanga', 'Karongi', 'Rusizi', 'Bugesera', 'Nyagatare'
    ];
  }

  /**
   * Normalize location names for consistent matching
   */
  normalizeLocationName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/province$/i, '')
      .replace(/district$/i, '')
      .replace(/sector$/i, '')
      .replace(/cell$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Advanced fuzzy matching for location names
   */
  fuzzyMatch(str1, str2, threshold = 0.7) {
    if (!str1 || !str2) return false;
    
    const s1 = this.normalizeLocationName(str1);
    const s2 = this.normalizeLocationName(str2);
    
    // Exact match
    if (s1 === s2) return true;
    
    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return true;
    
    // Levenshtein distance for similarity
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = 1 - (distance / maxLength);
    
    return similarity >= threshold;
  }

  /**
   * Calculate Levenshtein distance for string similarity
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Enhanced search in geo data with multiple strategies
   */
  findMatchInGeoData(locationData, searchTerm, options = {}) {
    if (!searchTerm || !locationData) return null;
    
    const normalizedSearch = this.normalizeLocationName(searchTerm);
    const threshold = options.threshold || 0.7;
    
    // Strategy 1: Exact match
    if (locationData[searchTerm]) {
      return searchTerm;
    }
    
    // Strategy 2: Normalized exact match
    for (const key in locationData) {
      if (this.normalizeLocationName(key) === normalizedSearch) {
        return key;
      }
    }
    
    // Strategy 3: Case-insensitive exact match
    for (const key in locationData) {
      if (key.toLowerCase() === searchTerm.toLowerCase()) {
        return key;
      }
    }
    
    // Strategy 4: Contains match (both directions)
    for (const key in locationData) {
      const normalizedKey = this.normalizeLocationName(key);
      if (normalizedKey.includes(normalizedSearch) || normalizedSearch.includes(normalizedKey)) {
        return key;
      }
    }
    
    // Strategy 5: Word boundary match
    const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
    for (const key in locationData) {
      const keyWords = this.normalizeLocationName(key).split(' ');
      const hasMatch = searchWords.some(sw => keyWords.some(kw => kw.includes(sw) || sw.includes(kw)));
      if (hasMatch) {
        return key;
      }
    }
    
    // Strategy 6: Fuzzy matching
    let bestMatch = null;
    let bestSimilarity = 0;
    
    for (const key in locationData) {
      const s1 = this.normalizeLocationName(key);
      const s2 = normalizedSearch;
      
      const distance = this.levenshteinDistance(s1, s2);
      const maxLength = Math.max(s1.length, s2.length);
      const similarity = 1 - (distance / maxLength);
      
      if (similarity > bestSimilarity && similarity >= threshold) {
        bestSimilarity = similarity;
        bestMatch = key;
      }
    }
    
    return bestMatch;
  }

  /**
   * Enhanced OSM to Rwanda mapping with intelligent multi-source parsing
   */
  async mapOSMToRwandaLocation(osmData) {
    try {
      const address = osmData.address || {};
      
      console.log('🗺️ Raw OSM Address Data:', address);
      
      let province = '';
      let district = '';
      let sector = '';
      let cell = '';
      let village = '';
      
      // ===================================
      // STEP 1: PROVINCE DETECTION
      // ===================================
      const provinceSources = [
        address.state,
        address.region,
        address.province,
        address.county
      ].filter(Boolean);
      
      for (const source of provinceSources) {
        const cleaned = source.replace(/ Province$/i, '').trim();
        const normalized = this.normalizeLocationName(cleaned);
        
        // Try direct mapping first
        if (this.provinceMapping[normalized]) {
          province = this.provinceMapping[normalized];
          break;
        }
        
        // Try finding in geo data
        const match = this.findMatchInGeoData(this.geoData, cleaned);
        if (match) {
          province = match;
          break;
        }
      }
      
      // If still no province, try to infer from other fields
      if (!province) {
        const allFields = Object.values(address).join(' ').toLowerCase();
        for (const [key, value] of Object.entries(this.provinceMapping)) {
          if (allFields.includes(key)) {
            province = value;
            break;
          }
        }
      }
      
      console.log('📍 Detected Province:', province);
      
      // ===================================
      // STEP 2: DISTRICT DETECTION
      // ===================================
      if (province && this.geoData[province]) {
        const districtSources = [
          address.county,
          address.city,
          address.town,
          address.municipality,
          address.city_district,
          address.suburb,
          address.neighbourhood,
          address.locality
        ].filter(Boolean);
        
        // Try each source
        for (const source of districtSources) {
          const match = this.findMatchInGeoData(this.geoData[province], source, { threshold: 0.6 });
          if (match) {
            district = match;
            console.log(`✅ Found district "${district}" from source "${source}"`);
            break;
          }
        }
        
        // If no match, try major districts list
        if (!district) {
          for (const majorDistrict of this.majorDistricts) {
            if (this.geoData[province][majorDistrict]) {
              const allFields = Object.values(address).join(' ');
              if (this.fuzzyMatch(allFields, majorDistrict, 0.6)) {
                district = majorDistrict;
                console.log(`✅ Found major district "${district}" via fuzzy match`);
                break;
              }
            }
          }
        }
      }
      
      console.log('📍 Detected District:', district);
      
      // ===================================
      // STEP 3: SECTOR DETECTION
      // ===================================
      if (province && district && this.geoData[province]?.[district]) {
        const sectorSources = [
          address.suburb,
          address.neighbourhood,
          address.quarter,
          address.hamlet,
          address.village,
          address.city_district,
          address.locality,
          address.road,
          address.residential
        ].filter(Boolean);
        
        // Try each source with progressive threshold relaxation
        for (let threshold = 0.8; threshold >= 0.5 && !sector; threshold -= 0.1) {
          for (const source of sectorSources) {
            const match = this.findMatchInGeoData(
              this.geoData[province][district], 
              source,
              { threshold }
            );
            if (match) {
              sector = match;
              console.log(`✅ Found sector "${sector}" from source "${source}" (threshold: ${threshold})`);
              break;
            }
          }
        }
        
        // If still no sector, try partial word matching
        if (!sector) {
          const allSectorText = sectorSources.join(' ').toLowerCase();
          const sectors = this.geoData[province][district];
          
          for (const sectorKey in sectors) {
            const sectorWords = this.normalizeLocationName(sectorKey).split(' ');
            const hasPartialMatch = sectorWords.some(word => 
              word.length > 3 && allSectorText.includes(word)
            );
            
            if (hasPartialMatch) {
              sector = sectorKey;
              console.log(`✅ Found sector "${sector}" via partial word match`);
              break;
            }
          }
        }
      }
      
      console.log('📍 Detected Sector:', sector);
      
      // ===================================
      // STEP 4: CELL & VILLAGE DETECTION
      // ===================================
      if (province && district && sector && this.geoData[province]?.[district]?.[sector]) {
        const cells = this.geoData[province][district][sector];
        
        // Try to match cell from address
        const cellSources = [
          address.hamlet,
          address.neighbourhood,
          address.quarter,
          address.village
        ].filter(Boolean);
        
        for (const source of cellSources) {
          for (const cellKey in cells) {
            if (this.fuzzyMatch(cellKey, source, 0.6)) {
              cell = cellKey;
              
              // Get village from this cell
              const villages = cells[cellKey];
              if (villages && villages.length > 0) {
                // Try to match village
                for (const source2 of cellSources) {
                  const matchedVillage = villages.find(v => this.fuzzyMatch(v, source2, 0.6));
                  if (matchedVillage) {
                    village = matchedVillage;
                    break;
                  }
                }
                
                // If no match, use first village
                if (!village) {
                  village = villages[0];
                }
              }
              
              console.log(`✅ Found cell "${cell}" and village "${village}"`);
              break;
            }
          }
          if (cell) break;
        }
        
        // If no cell found, use first available cell and village
        if (!cell) {
          const firstCell = Object.keys(cells)[0];
          if (firstCell) {
            cell = firstCell;
            const villages = cells[firstCell];
            if (villages && villages.length > 0) {
              village = villages[0];
            }
            console.log(`📌 Using default cell "${cell}" and village "${village}"`);
          }
        }
      }
      
      const result = {
        province: province || '',
        district: district || '',
        sector: sector || '',
        cell: cell || '',
        village: village || '',
        osmDisplay: osmData.display_name || ''
      };
      
      console.log('🎯 Final Mapped Location:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error mapping OSM data:', error);
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

  /**
   * PRIMARY: GPS-based location detection with OSM reverse geocoding
   */
  async getGPSLocation() {
    return new Promise((resolve, reject) => {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      console.log('🛰️ Requesting GPS location...');
      
      // Request high-accuracy position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const coordinates = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            
            console.log('✅ GPS Coordinates:', coordinates);
            
            // Multiple OSM attempts with different servers
            let osmData = null;
            const osmServers = [
              'https://nominatim.openstreetmap.org',
              'https://nominatim.openstreetmap.org' // Can add backup servers
            ];
            
            for (const server of osmServers) {
              try {
                const url = `${server}/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&addressdetails=1&zoom=18&accept-language=en`;
                
                console.log('🌍 Querying OSM:', url);
                
                const response = await fetch(url, {
                  headers: {
                    'User-Agent': 'IsanzurePropertyApp/1.0',
                    'Accept': 'application/json'
                  }
                });
                
                if (response.ok) {
                  osmData = await response.json();
                  console.log('✅ OSM Response received:', osmData);
                  break;
                }
              } catch (err) {
                console.warn('⚠️ OSM server failed, trying next...', err);
                continue;
              }
            }
            
            if (!osmData) {
              throw new Error('All OSM servers failed');
            }
            
            // Map OSM data to Rwanda location
            const mappedLocation = await this.mapOSMToRwandaLocation(osmData);
            
            resolve({
              coordinates,
              address: mappedLocation,
              source: 'gps_osm',
              displayAddress: osmData.display_name || '',
              accuracy: position.coords.accuracy
            });
            
          } catch (error) {
            console.error('❌ Error processing GPS location:', error);
            reject(error);
          }
        },
        (error) => {
          console.error('❌ GPS Error:', error);
          reject(error);
        },
        {
          timeout: 15000,
          maximumAge: 0,
          enableHighAccuracy: true
        }
      );
    });
  }

  /**
   * FALLBACK 1: IP-based geolocation
   */
  async getIPLocation() {
    console.log('🌐 Attempting IP-based location...');
    
    const ipServices = [
      {
        url: 'https://ipapi.co/json/',
        parse: (data) => ({
          province: this.provinceMapping[this.normalizeLocationName(data.region)] || data.region || '',
          district: data.city || '',
          sector: '',
          cell: '',
          village: '',
          country: data.country_code
        })
      },
      {
        url: 'https://ipinfo.io/json',
        parse: (data) => ({
          province: this.provinceMapping[this.normalizeLocationName(data.region)] || data.region || '',
          district: data.city || '',
          sector: '',
          cell: '',
          village: '',
          country: data.country
        })
      },
      {
        url: 'https://geolocation-db.com/json/',
        parse: (data) => ({
          province: this.provinceMapping[this.normalizeLocationName(data.state)] || data.state || '',
          district: data.city || '',
          sector: '',
          cell: '',
          village: '',
          country: data.country_code
        })
      }
    ];
    
    for (const service of ipServices) {
      try {
        const response = await fetch(service.url);
        const data = await response.json();
        
        console.log('📡 IP Service Response:', data);
        
        const parsed = service.parse(data);
        
        // Only accept if country is Rwanda
        if (parsed.country === 'RW' || parsed.country === 'Rwanda') {
          console.log('✅ IP-based location (Rwanda):', parsed);
          
          // Try to enhance with geo data
          if (parsed.province && this.geoData[parsed.province]) {
            if (parsed.district) {
              const districtMatch = this.findMatchInGeoData(this.geoData[parsed.province], parsed.district);
              if (districtMatch) {
                parsed.district = districtMatch;
              }
            }
          }
          
          return {
            coordinates: null,
            address: parsed,
            source: 'ip',
            displayAddress: `${parsed.district || ''}, ${parsed.province || ''}, Rwanda`.replace(/^,\s*/, '').replace(/,\s*,/g, ',')
          };
        }
      } catch (error) {
        console.warn('⚠️ IP service failed, trying next...', error);
        continue;
      }
    }
    
    throw new Error('All IP services failed');
  }

  /**
   * FALLBACK 2: Browser language/timezone heuristics
   */
  async getBrowserHeuristicLocation() {
    console.log('🕐 Attempting browser heuristic location...');
    
    // Check timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Rwanda is in CAT (Central Africa Time) - UTC+2
    const isLikelyRwanda = timezone.includes('Africa') || 
                           timezone.includes('Kigali') ||
                           new Date().getTimezoneOffset() === -120; // UTC+2
    
    if (isLikelyRwanda) {
      console.log('✅ Browser heuristics suggest Rwanda');
      
      // Return Kigali as default
      return {
        coordinates: null,
        address: {
          province: 'Kigali',
          district: 'Kigali',
          sector: '',
          cell: '',
          village: ''
        },
        source: 'browser_heuristic',
        displayAddress: 'Kigali, Rwanda'
      };
    }
    
    throw new Error('Browser heuristics do not suggest Rwanda');
  }

  /**
   * ULTIMATE FALLBACK: Default to Kigali
   */
  getDefaultLocation() {
    console.log('📍 Using default location (Kigali)');
    
    return {
      coordinates: null,
      address: {
        province: 'Kigali',
        district: 'Kigali',
        sector: '',
        cell: '',
        village: ''
      },
      source: 'default',
      displayAddress: 'Kigali, Rwanda'
    };
  }

  /**
   * MAIN LOCATION DETECTION METHOD
   * Tries multiple methods in sequence with intelligent fallbacks
   */
  async getUserLocation() {
    // Check cache first
    if (this.locationCache && this.cacheTimestamp && 
        (Date.now() - this.cacheTimestamp) < this.cacheExpiry) {
      console.log('💾 Using cached location');
      return this.locationCache;
    }
    
    console.log('🎯 Starting comprehensive location detection...');
    
    const methods = [
      { name: 'GPS + OSM', fn: () => this.getGPSLocation() },
      { name: 'IP Geolocation', fn: () => this.getIPLocation() },
      { name: 'Browser Heuristics', fn: () => this.getBrowserHeuristicLocation() },
      { name: 'Default Fallback', fn: () => this.getDefaultLocation() }
    ];
    
    for (const method of methods) {
      try {
        console.log(`🔄 Trying: ${method.name}...`);
        const result = await method.fn();
        
        if (result && result.address) {
          console.log(`✅ Success with ${method.name}:`, result);
          
          // Cache the result
          this.locationCache = result;
          this.cacheTimestamp = Date.now();
          
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ ${method.name} failed:`, error.message);
        continue;
      }
    }
    
    // Absolute fallback (should never reach here)
    const fallback = this.getDefaultLocation();
    this.locationCache = fallback;
    this.cacheTimestamp = Date.now();
    return fallback;
  }

  /**
   * Enhanced location-based recommendations
   */
  generateLocationRecommendations(userLocation, allProperties) {
    if (!userLocation || !userLocation.address) return allProperties;
    
    const { province, district, sector } = userLocation.address;
    const recommendations = [];
    
    console.log('🎯 Generating recommendations for:', { province, district, sector });
    
    // Group 1: Exact sector matches
    const exactSector = allProperties.filter(p => 
      sector && p.sector && this.fuzzyMatch(p.sector, sector, 0.8)
    );
    
    // Group 2: Same district, different sector
    const sameDistrict = allProperties.filter(p =>
      district && p.district && 
      this.fuzzyMatch(p.district, district, 0.8) &&
      !exactSector.some(sp => sp.id === p.id)
    );
    
    // Group 3: Same province, different district
    const sameProvince = allProperties.filter(p =>
      province && p.province && 
      this.fuzzyMatch(p.province, province, 0.8) &&
      !sameDistrict.some(sp => sp.id === p.id) &&
      !exactSector.some(sp => sp.id === p.id)
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
    
    console.log('✅ Recommendations generated:', {
      exactSector: exactSector.length,
      sameDistrict: sameDistrict.length,
      sameProvince: sameProvince.length,
      featured: featured.length,
      other: other.length,
      total: recommendations.length
    });
    
    return recommendations;
  }

  /**
   * Calculate relevance score for search results
   */
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
    if (searchFilters.district && this.fuzzyMatch(district, searchFilters.district, 0.7)) {
      score += 600;
    }
    
    if (searchFilters.sector && this.fuzzyMatch(sector, searchFilters.sector, 0.7)) {
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

  /**
   * Sort properties by relevance to search
   */
  sortBySearchRelevance(properties, searchQuery, searchFilters) {
    if (!searchQuery && !searchFilters) return properties;
    
    return [...properties].sort((a, b) => {
      const scoreA = this.calculateSearchRelevance(a, searchQuery, searchFilters);
      const scoreB = this.calculateSearchRelevance(b, searchQuery, searchFilters);
      
      return scoreB - scoreA;
    });
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
      
      console.log('🎯 Starting location detection...');
      
      // Get user location for intelligent sorting
      const locationData = await locationService.getUserLocation();
      setUserLocation(locationData);
      
      console.log('✅ Location detected:', locationData);
      
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
            if (filters.district && !locationService.fuzzyMatch(district, filters.district, 0.7)) {
              return false;
            }
            
            // Check sector match
            if (filters.sector && !locationService.fuzzyMatch(sector, filters.sector, 0.7)) {
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
    
    return locationService.fuzzyMatch(property.sector, userLocation.address.sector, 0.8);
  };

  const isInExactDistrict = (property) => {
    if (!userLocation || !userLocation.address || !userLocation.address.district) return false;
    if (!property || !property.district) return false;
    
    return locationService.fuzzyMatch(property.district, userLocation.address.district, 0.8);
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
        {/* Debug Location Info (Remove in production) */}
        {userLocation && userLocation.address && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900">
              📍 Your Location: {userLocation.address.sector || userLocation.address.district || userLocation.address.province || 'Detecting...'}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Source: {userLocation.source} | 
              {userLocation.address.province && ` Province: ${userLocation.address.province}`}
              {userLocation.address.district && ` | District: ${userLocation.address.district}`}
              {userLocation.address.sector && ` | Sector: ${userLocation.address.sector}`}
            </div>
          </div>
        )}
        
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