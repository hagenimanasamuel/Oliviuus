const { isanzureQuery } = require('../../config/isanzureDbConfig');

// Utility: Map province display names to database values
const mapProvinceToDb = (province) => {
  const provinceMap = {
    'Northern': 'North',
    'Southern': 'South', 
    'Eastern': 'East',
    'Western': 'West',
    'Kigali': 'Kigali',
    'North': 'North',
    'South': 'South',
    'East': 'East',
    'West': 'West'
  };
  return provinceMap[province] || province;
};

// Frontend amenities mapping to database
const FRONTEND_AMENITY_MAPPING = {
  // Infrastructure
  'electricity_24_7': 'electricity_24_7',
  'running_water': 'running_water',
  'wifi': 'wifi',
  'borehole': 'borehole',
  'solar_power': 'solar_power',
  'generator': 'generator_backup',
  
  // Security
  'compound_security': 'compound_security',
  'watchman': 'watchman',
  'cctv': 'cctv',
  'alarm': 'alarm',
  'gate': 'gate',
  
  // Comfort
  'air_conditioning': 'air_conditioning',
  'ceiling_fans': 'ceiling_fans',
  'heating': 'heating',
  'fireplace': 'fireplace',
  'tv': 'television',
  
  // Kitchen
  'fridge': 'fridge',
  'oven': 'oven',
  'microwave': 'microwave',
  'dishwasher': 'dishwasher',
  'kitchen_utensils': 'kitchen_utensils',
  
  // Outdoor
  'parking': 'parking',
  'garden': 'garden',
  'balcony': 'balcony',
  'swimming_pool': 'swimming_pool',
  'bbq_area': 'bbq_area',
  
  // Additional
  'gym': 'gym',
  'laundry': 'washing_machine',
  'cleaning': 'cleaning_service',
  'business_center': 'workspace',
  'conference_room': 'conference_room'
};

// Frontend property types mapping
const PROPERTY_TYPE_MAPPING = {
  'apartment': 'apartment',
  'house': 'house',
  'villa': 'villa',
  'condo': 'condo',
  'studio': 'studio',
  'penthouse': 'penthouse',
  'townhouse': 'townhouse',
  'ghetto': 'ghetto',
  'living_house': 'living_house',
  'upmarket': 'upmarket',
  'service_apartment': 'service_apartment',
  'guest_house': 'guest_house',
  'bungalow': 'bungalow',
  'commercial': 'commercial',
  'hostel': 'hostel',
  'farm': 'ghetto' // Map farm to closest match
};

// Parse frontend search query
const parseSearchQuery = (query) => {
  if (!query) return null;
  
  const queryLower = query.toLowerCase();
  const result = {
    original: query,
    terms: queryLower.split(/\s+/).filter(term => term.length > 1),
    locationTerms: [],
    propertyTerms: [],
    priceTerms: [],
    landmarkTerms: []
  };

  // Common Rwanda landmarks from frontend
  const landmarks = [
    'king faisal', 'university', 'hospital', 'market', 'kigali airport',
    'kigali heights', 'kimironko', 'nyabugogo', 'convention', 'radisson',
    'marriott', 'serena', 'volcanoes', 'akagera', 'nyungwe', 'lake kivu'
  ];

  // Property types
  const propertyTypes = Object.keys(PROPERTY_TYPE_MAPPING);

  // Location indicators
  const provinces = ['kigali', 'north', 'south', 'east', 'west'];
  const districts = ['gasabo', 'kicukiro', 'nyarugenge', 'musanze', 'rubavu', 
                    'huye', 'karongi', 'nyamagabe', 'kayonza', 'rusizi'];

  result.terms.forEach(term => {
    if (provinces.some(p => term.includes(p) || p.includes(term)) ||
        districts.some(d => term.includes(d) || d.includes(term))) {
      result.locationTerms.push(term);
    } else if (propertyTypes.some(t => term.includes(t) || t.includes(term))) {
      result.propertyTerms.push(term);
    } else if (landmarks.some(l => term.includes(l) || l.includes(term))) {
      result.landmarkTerms.push(term);
    } else if (term.match(/rwf|frw|\d+[,.]\d+/)) {
      result.priceTerms.push(term);
    } else {
      result.propertyTerms.push(term);
    }
  });

  return result;
};

// Map frontend amenities to database keys
const mapAmenitiesToDb = (frontendAmenities) => {
  if (!frontendAmenities || !Array.isArray(frontendAmenities)) return [];
  
  return frontendAmenities
    .map(amenity => FRONTEND_AMENITY_MAPPING[amenity])
    .filter(amenity => amenity); // Remove undefined mappings
};

// Map frontend property types to database values
const mapPropertyTypesToDb = (frontendTypes) => {
  if (!frontendTypes || !Array.isArray(frontendTypes)) return [];
  
  return frontendTypes
    .map(type => PROPERTY_TYPE_MAPPING[type])
    .filter(type => type); // Remove undefined mappings
};

// Calculate relevance score
const calculateRelevanceScore = (property, parsedQuery) => {
  let score = 100; // Base score
  
  if (!parsedQuery) return score;
  
  const title = property.title?.toLowerCase() || '';
  const description = property.description?.toLowerCase() || '';
  const address = property.address?.toLowerCase() || '';
  const propertyType = property.property_type?.toLowerCase() || '';
  const district = property.district?.toLowerCase() || '';
  const sector = property.sector?.toLowerCase() || '';
  
  parsedQuery.terms.forEach(term => {
    // Exact matches
    if (title === term) score += 100;
    if (district === term) score += 80;
    if (sector === term) score += 70;
    if (propertyType === term) score += 60;
    
    // Contains matches
    if (title.includes(term)) score += 50;
    if (description.includes(term)) score += 40;
    if (address.includes(term)) score += 30;
    if (propertyType.includes(term)) score += 20;
  });
  
  // Boost for featured/verified
  if (property.is_featured) score += 150;
  if (property.is_verified) score += 100;
  
  // Boost for having images
  if (property.image_count > 0) score += 50;
  if (property.image_count >= 3) score += 30;
  
  return score;
};

// Get room count by type
async function getRoomCount(propertyId, roomType) {
  try {
    const sql = `SELECT SUM(count) as total FROM property_rooms WHERE property_id = ? AND room_type = ?`;
    const result = await isanzureQuery(sql, [propertyId, roomType]);
    return result[0]?.total || 0;
  } catch (error) {
    return 0;
  }
}

// Get amenity names for a property
async function getPropertyAmenities(propertyId) {
  try {
    const sql = `
      SELECT pa.amenity_key, pa.amenity_name, pa.category
      FROM property_amenity_junction paj
      JOIN property_amenities pa ON paj.amenity_id = pa.id
      WHERE paj.property_id = ?
    `;
    return await isanzureQuery(sql, [propertyId]);
  } catch (error) {
    return [];
  }
}

// Get nearby attractions for a property
async function getNearbyAttractions(propertyId) {
  try {
    const sql = `SELECT attraction_name, attraction_type, distance_km FROM property_nearby_attractions WHERE property_id = ?`;
    return await isanzureQuery(sql, [propertyId]);
  } catch (error) {
    return [];
  }
}

// 1. ADVANCED SEARCH - Enhanced to handle all frontend filters
exports.advancedSearch = async (req, res) => {
  try {
    const {
      query = '',
      province = null,
      district = null,
      sector = null,
      cell = null,
      village = null,
      isibo = null,
      minPrice = null,
      maxPrice = null,
      pricePeriod = 'monthly',
      propertyTypes = [],
      minBedrooms = null,
      minBathrooms = null,
      minGuests = null,
      minArea = null,
      amenities = [],
      nearbyAttractions = [],
      isVerified = false,
      isFeatured = false,
      hasImages = true,
      utilitiesIncluded = false,
      acceptNightly = null,
      acceptDaily = null,
      acceptWeekly = null,
      acceptMonthly = true,
      sortBy = 'relevance',
      limit = 50,
      offset = 0
    } = req.query;

    console.log('🔍 Advanced Search Request:', {
      query,
      location: { province, district, sector },
      price: { minPrice, maxPrice, period: pricePeriod },
      types: propertyTypes,
      amenities: amenities.length,
      rooms: { minBedrooms, minBathrooms, minGuests }
    });

    // Parse search query
    const parsedQuery = parseSearchQuery(query);
    
    // Map frontend values to database values
    const dbPropertyTypes = mapPropertyTypesToDb(propertyTypes);
    const dbAmenities = mapAmenitiesToDb(amenities);
    
    // Build WHERE conditions
    const conditions = ['p.status = "active"'];
    const values = [];

    // Text search conditions
    if (parsedQuery && parsedQuery.terms.length > 0) {
      const textConditions = [];
      parsedQuery.terms.forEach(term => {
        textConditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ?)');
        values.push(`%${term}%`, `%${term}%`, `%${term}%`);
      });
      
      if (textConditions.length > 0) {
        conditions.push(`(${textConditions.join(' OR ')})`);
      }
    }

    // Location hierarchy conditions
    if (province) {
      const dbProvince = mapProvinceToDb(province);
      conditions.push('p.province = ?');
      values.push(dbProvince);
    }
    
    if (district) {
      conditions.push('p.district = ?');
      values.push(district);
    }
    
    if (sector) {
      conditions.push('p.sector = ?');
      values.push(sector);
    }
    
    if (cell) {
      conditions.push('p.cell = ?');
      values.push(cell);
    }
    
    if (village) {
      conditions.push('p.village = ?');
      values.push(village);
    }
    
    if (isibo) {
      conditions.push('p.isibo LIKE ?');
      values.push(`%${isibo}%`);
    }

    // Price conditions
    const priceColumn = `${pricePeriod}_price`;
    if (minPrice) {
      conditions.push(`pp.${priceColumn} >= ?`);
      values.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push(`pp.${priceColumn} <= ?`);
      values.push(parseFloat(maxPrice));
    }

    // Property type conditions
    if (dbPropertyTypes.length > 0) {
      conditions.push(`p.property_type IN (${dbPropertyTypes.map(() => '?').join(',')})`);
      values.push(...dbPropertyTypes);
    }

    // Room conditions - using subqueries
    if (minBedrooms) {
      conditions.push(`(
        SELECT SUM(pr.count) 
        FROM property_rooms pr 
        WHERE pr.property_id = p.id AND pr.room_type = 'bedroom'
      ) >= ?`);
      values.push(parseInt(minBedrooms));
    }
    
    if (minBathrooms) {
      conditions.push(`(
        SELECT SUM(pr.count) 
        FROM property_rooms pr 
        WHERE pr.property_id = p.id AND pr.room_type = 'bathroom'
      ) >= ?`);
      values.push(parseInt(minBathrooms));
    }

    if (minGuests) {
      conditions.push('p.max_guests >= ?');
      values.push(parseInt(minGuests));
    }

    if (minArea) {
      conditions.push('p.area >= ?');
      values.push(parseFloat(minArea));
    }

    // Amenities conditions
    if (dbAmenities.length > 0) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM property_amenity_junction paj
          JOIN property_amenities pa ON paj.amenity_id = pa.id
          WHERE paj.property_id = p.id
            AND pa.amenity_key IN (${dbAmenities.map(() => '?').join(',')})
          GROUP BY paj.property_id
          HAVING COUNT(DISTINCT pa.amenity_key) = ?
        )
      `);
      values.push(...dbAmenities, dbAmenities.length);
    }

    // Nearby attractions conditions
    if (nearbyAttractions && nearbyAttractions.length > 0) {
      const attractions = Array.isArray(nearbyAttractions) ? nearbyAttractions : [nearbyAttractions];
      conditions.push(`
        EXISTS (
          SELECT 1 FROM property_nearby_attractions pna
          WHERE pna.property_id = p.id
            AND (
              ${attractions.map(() => 'pna.attraction_name LIKE ?').join(' OR ')}
            )
        )
      `);
      attractions.forEach(attraction => {
        values.push(`%${attraction}%`);
      });
    }

    // Boolean conditions
    if (isVerified === 'true' || isVerified === true) {
      conditions.push('p.is_verified = 1');
    }
    
    if (isFeatured === 'true' || isFeatured === true) {
      conditions.push('p.is_featured = 1');
    }
    
    if (hasImages === 'true' || hasImages === true) {
      conditions.push('EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id)');
    }
    
    if (utilitiesIncluded === 'true' || utilitiesIncluded === true) {
      conditions.push('pp.utilities_included = 1');
    }

    // Payment acceptance conditions
    if (acceptNightly === 'true' || acceptNightly === true) {
      conditions.push('pp.accept_nightly = 1');
    }
    
    if (acceptDaily === 'true' || acceptDaily === true) {
      conditions.push('pp.accept_daily = 1');
    }
    
    if (acceptWeekly === 'true' || acceptWeekly === true) {
      conditions.push('pp.accept_weekly = 1');
    }
    
    if (acceptMonthly === 'true' || acceptMonthly === true) {
      conditions.push('pp.accept_monthly = 1');
    }

    // Build main query
    let sql = `
      SELECT 
        p.id,
        p.property_uid,
        p.title,
        p.property_type,
        p.description,
        p.address,
        p.province,
        p.district,
        p.sector,
        p.cell,
        p.village,
        p.isibo,
        p.area,
        p.max_guests,
        p.is_featured,
        p.is_verified,
        p.verification_status,
        p.created_at,
        p.published_at,
        
        pp.monthly_price,
        pp.weekly_price,
        pp.daily_price,
        pp.nightly_price,
        pp.yearly_price,
        pp.accept_monthly,
        pp.accept_weekly,
        pp.accept_daily,
        pp.accept_nightly,
        pp.accept_yearly,
        pp.utilities_included,
        pp.utilities_min,
        pp.utilities_max,
        
        (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image,
        (SELECT COUNT(*) FROM property_images pi2 WHERE pi2.property_id = p.id) as image_count,
        
        -- Room counts
        (SELECT SUM(pr.count) FROM property_rooms pr WHERE pr.property_id = p.id AND pr.room_type = 'bedroom') as bedroom_count,
        (SELECT SUM(pr.count) FROM property_rooms pr WHERE pr.property_id = p.id AND pr.room_type = 'bathroom') as bathroom_count,
        (SELECT SUM(pr.count) FROM property_rooms pr WHERE pr.property_id = p.id AND pr.room_type = 'living_room') as living_room_count,
        
        -- Amenity count
        (SELECT COUNT(*) FROM property_amenity_junction paj WHERE paj.property_id = p.id) as amenity_count,
        
        -- Nearby attraction count
        (SELECT COUNT(*) FROM property_nearby_attractions pna WHERE pna.property_id = p.id) as attraction_count,
        
        -- Initial relevance score
        100 as base_score
        
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
    `;

    // Add WHERE conditions
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
    `;
    
    const countResult = await isanzureQuery(countSql, [...values]);
    const totalCount = countResult[0]?.total || 0;

    // Sorting
    switch(sortBy) {
      case 'price_asc':
        sql += ` ORDER BY pp.${priceColumn} ASC NULLS LAST`;
        break;
      case 'price_desc':
        sql += ` ORDER BY pp.${priceColumn} DESC NULLS LAST`;
        break;
      case 'newest':
        sql += ` ORDER BY p.created_at DESC`;
        break;
      case 'featured':
        sql += ` ORDER BY p.is_featured DESC, p.is_verified DESC, p.created_at DESC`;
        break;
      case 'verified':
        sql += ` ORDER BY p.is_verified DESC, p.created_at DESC`;
        break;
      default: // relevance
        sql += ` ORDER BY 
          p.is_featured DESC,
          p.is_verified DESC,
          (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) DESC,
          p.created_at DESC`;
    }

    // Pagination
    sql += ` LIMIT ? OFFSET ?`;
    values.push(parseInt(limit), parseInt(offset));

    // Execute query
    console.log('📊 Executing advanced search query...');
    const properties = await isanzureQuery(sql, values);

    // Calculate relevance scores and enrich data
    const enrichedProperties = await Promise.all(properties.map(async (property) => {
      // Calculate dynamic relevance score
      const relevanceScore = calculateRelevanceScore(property, parsedQuery);
      
      // Get amenities
      const amenities = await getPropertyAmenities(property.id);
      
      // Get nearby attractions
      const attractions = await getNearbyAttractions(property.id);
      
      return {
        ...property,
        relevance_score: relevanceScore,
        amenities: amenities,
        nearby_attractions: attractions,
        features: {
          has_images: property.image_count > 0,
          is_verified: property.is_verified,
          is_featured: property.is_featured,
          utilities_included: property.utilities_included
        }
      };
    }));

    // Sort by relevance score if that's the sort method
    if (sortBy === 'relevance') {
      enrichedProperties.sort((a, b) => b.relevance_score - a.relevance_score);
    }

    // Generate intelligent recommendations
    const recommendations = await generateIntelligentRecommendations({
      province,
      district,
      propertyTypes: dbPropertyTypes,
      priceRange: { min: minPrice, max: maxPrice, period: pricePeriod },
      amenities: dbAmenities,
      parsedQuery
    });

    // Prepare response matching frontend expectations
    const response = {
      success: true,
      data: enrichedProperties,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + enrichedProperties.length) < totalCount
      },
      filters: {
        query,
        location: { province, district, sector, cell, village, isibo },
        price: { min: minPrice, max: maxPrice, period: pricePeriod },
        requirements: { 
          minBedrooms, 
          minBathrooms, 
          minGuests, 
          minArea 
        },
        propertyTypes,
        amenities,
        nearbyAttractions,
        flags: { 
          isVerified, 
          isFeatured, 
          hasImages, 
          utilitiesIncluded,
          acceptNightly,
          acceptDaily,
          acceptWeekly,
          acceptMonthly
        }
      },
      recommendations,
      statistics: {
        matched: enrichedProperties.length,
        totalAvailable: totalCount,
        priceRange: await getPriceRangeStats(province, district),
        popularLocations: await getPopularLocations(enrichedProperties),
        averagePrice: await getAveragePrice(province, district, pricePeriod)
      },
      meta: {
        searchId: generateSearchId(),
        timestamp: new Date().toISOString(),
        queryComplexity: parsedQuery ? parsedQuery.terms.length : 0
      }
    };

    console.log(`✅ Advanced search completed: ${enrichedProperties.length} properties found`);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error in advancedSearch:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 2. INTELLIGENT QUICK SEARCH (for frontend suggestions)
exports.intelligentSearch = async (req, res) => {
  try {
    const { query = '', userProvince, userDistrict, limit = 15 } = req.query;

    if (!query.trim()) {
      return res.status(200).json({
        success: true,
        suggestions: [],
        categories: []
      });
    }

    console.log(`🤖 Intelligent search for: "${query}"`);

    const parsedQuery = parseSearchQuery(query);
    const searchTerm = `%${query}%`;
    
    // Multi-source search results
    const results = {
      locations: [],
      properties: [],
      landmarks: [],
      propertyTypes: []
    };

    // 1. Search locations (provinces, districts, sectors)
    const locationSql = `
      SELECT 
        province as name,
        province as fullName,
        'province' as type,
        '🗺️' as icon,
        'Province' as description,
        COUNT(*) as count
      FROM properties
      WHERE status = 'active' AND province LIKE ?
      GROUP BY province
      
      UNION ALL
      
      SELECT 
        district as name,
        CONCAT(district, ', ', province) as fullName,
        'district' as type,
        '🏙️' as icon,
        'District' as description,
        COUNT(*) as count
      FROM properties
      WHERE status = 'active' AND district LIKE ?
      GROUP BY district, province
      
      UNION ALL
      
      SELECT 
        sector as name,
        CONCAT(sector, ', ', district) as fullName,
        'sector' as type,
        '📍' as icon,
        'Sector' as description,
        COUNT(*) as count
      FROM properties
      WHERE status = 'active' AND sector LIKE ?
      GROUP BY sector, district
      
      ORDER BY count DESC
      LIMIT 10
    `;

    results.locations = await isanzureQuery(locationSql, [searchTerm, searchTerm, searchTerm]);

    // 2. Search property types
    const typeSql = `
      SELECT 
        property_type as name,
        CONCAT(UPPER(SUBSTRING(property_type, 1, 1)), SUBSTRING(property_type, 2)) as fullName,
        'property_type' as type,
        '🏠' as icon,
        'Property Type' as description,
        COUNT(*) as count
      FROM properties
      WHERE status = 'active' AND property_type LIKE ?
      GROUP BY property_type
      ORDER BY count DESC
      LIMIT 5
    `;

    results.propertyTypes = await isanzureQuery(typeSql, [searchTerm]);

    // 3. Search landmarks (nearby attractions)
    const landmarkSql = `
      SELECT 
        attraction_name as name,
        attraction_name as fullName,
        'landmark' as type,
        CASE attraction_type
          WHEN 'school' THEN '🎓'
          WHEN 'hospital' THEN '🏥'
          WHEN 'market' THEN '🛒'
          WHEN 'transport' THEN '🚌'
          WHEN 'park' THEN '🌳'
          ELSE '📍'
        END as icon,
        CONCAT(UPPER(SUBSTRING(attraction_type, 1, 1)), SUBSTRING(attraction_type, 2)) as description,
        COUNT(*) as count
      FROM property_nearby_attractions
      WHERE attraction_name LIKE ?
      GROUP BY attraction_name, attraction_type
      ORDER BY count DESC
      LIMIT 5
    `;

    results.landmarks = await isanzureQuery(landmarkSql, [searchTerm]);

    // 4. Search properties with quick details
    const propertySql = `
      SELECT 
        p.title as name,
        CONCAT(p.title, ' - ', p.district) as fullName,
        'property' as type,
        '🏠' as icon,
        CONCAT(UPPER(SUBSTRING(p.property_type, 1, 1)), SUBSTRING(p.property_type, 2), ' in ', p.district) as description,
        1 as count,
        p.property_uid,
        p.property_type,
        p.district,
        p.sector,
        pp.monthly_price,
        (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as image
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        AND (p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ?)
      ORDER BY p.is_featured DESC, p.is_verified DESC, p.created_at DESC
      LIMIT 5
    `;

    results.properties = await isanzureQuery(propertySql, [searchTerm, searchTerm, searchTerm]);

    // Combine and score all results
    let allSuggestions = [];
    
    // Add locations with scoring
    results.locations.forEach(loc => {
      let score = 100;
      if (loc.type === 'province' && userProvince && loc.name.toLowerCase() === userProvince.toLowerCase()) score += 50;
      if (loc.type === 'district' && userDistrict && loc.name.toLowerCase() === userDistrict.toLowerCase()) score += 30;
      if (loc.name.toLowerCase().startsWith(query.toLowerCase())) score += 20;
      
      allSuggestions.push({
        ...loc,
        score,
        source: 'location',
        searchable: true
      });
    });

    // Add property types
    results.propertyTypes.forEach(type => {
      allSuggestions.push({
        ...type,
        score: 80,
        source: 'property_type',
        searchable: true
      });
    });

    // Add landmarks
    results.landmarks.forEach(landmark => {
      allSuggestions.push({
        ...landmark,
        score: 70,
        source: 'landmark',
        searchable: true
      });
    });

    // Add properties
    results.properties.forEach(property => {
      allSuggestions.push({
        ...property,
        score: 90,
        source: 'property',
        searchable: false,
        action: 'view_property'
      });
    });

    // Sort by score
    allSuggestions.sort((a, b) => b.score - a.score);

    // Get search categories
    const categories = [
      ...new Set(allSuggestions.map(s => s.type))
    ];

    // Generate "did you mean" suggestions
    const similarTerms = await getSimilarSearchTerms(query);

    res.status(200).json({
      success: true,
      query,
      suggestions: allSuggestions.slice(0, limit),
      categories,
      didYouMean: similarTerms,
      intelligentFeatures: {
        hasLocationContext: !!(userProvince || userDistrict),
        parsedTerms: parsedQuery?.terms || [],
        searchPattern: analyzeSearchPattern(query)
      }
    });

  } catch (error) {
    console.error('❌ Error in intelligentSearch:', error);
    res.status(200).json({
      success: true,
      suggestions: [],
      categories: []
    });
  }
};

// 3. GET POPULAR SEARCHES AND RECOMMENDATIONS
exports.getPopularSearches = async (req, res) => {
  try {
    const { userProvince, userDistrict, limit = 10 } = req.query;

    const recommendations = {
      popularDestinations: [],
      trendingSearches: [],
      nearbySuggestions: [],
      personalized: []
    };

    // Get popular destinations based on property counts
    const destinationsSql = `
      SELECT 
        CONCAT(p.district, ', ', p.province) as name,
        CONCAT(p.district, ', ', p.province) as fullName,
        'destination' as type,
        CASE 
          WHEN p.province = 'Kigali' THEN '🏙️'
          WHEN p.district LIKE '%musanze%' THEN '🌋'
          WHEN p.district LIKE '%rubavu%' THEN '🏖️'
          WHEN p.district LIKE '%huye%' THEN '🏛️'
          ELSE '📍'
        END as icon,
        'Popular area for rentals' as description,
        COUNT(*) as propertyCount,
        ROUND(AVG(pp.monthly_price)) as avgPrice
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
      GROUP BY p.province, p.district
      ORDER BY propertyCount DESC
      LIMIT 8
    `;

    recommendations.popularDestinations = await isanzureQuery(destinationsSql);

    // Get trending searches (based on recently added properties)
    const trendingSql = `
      SELECT DISTINCT
        p.district as name,
        CONCAT(p.district, ', ', p.province) as fullName,
        'trending' as type,
        '🔥' as icon,
        'Trending location' as description,
        COUNT(*) as recentCount
      FROM properties p
      WHERE p.status = 'active'
        AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY p.province, p.district
      ORDER BY recentCount DESC
      LIMIT 5
    `;

    recommendations.trendingSearches = await isanzureQuery(trendingSql);

    // Get nearby suggestions if user location is provided
    if (userProvince) {
      const nearbySql = `
        SELECT DISTINCT
          p.district as name,
          CONCAT(p.district, ', ', p.province) as fullName,
          'nearby' as type,
          '📍' as icon,
          'Near your location' as description,
          COUNT(*) as propertyCount
        FROM properties p
        WHERE p.status = 'active'
          AND p.province = ?
          ${userDistrict ? 'AND p.district != ?' : ''}
        GROUP BY p.district
        ORDER BY propertyCount DESC
        LIMIT 5
      `;

      const nearbyValues = [mapProvinceToDb(userProvince)];
      if (userDistrict) nearbyValues.push(userDistrict);
      
      recommendations.nearbySuggestions = await isanzureQuery(nearbySql, nearbyValues);
    }

    // Get personalized recommendations based on property types distribution
    const personalizedSql = `
      SELECT 
        p.property_type as name,
        CONCAT(UPPER(SUBSTRING(p.property_type, 1, 1)), SUBSTRING(p.property_type, 2), ' (', COUNT(*), ' available)') as fullName,
        'personalized' as type,
        '💎' as icon,
        'Based on availability' as description,
        COUNT(*) as count,
        ROUND(AVG(pp.monthly_price)) as avgPrice
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        ${userProvince ? 'AND p.province = ?' : ''}
      GROUP BY p.property_type
      ORDER BY count DESC
      LIMIT 5
    `;

    const personalizedValues = userProvince ? [mapProvinceToDb(userProvince)] : [];
    recommendations.personalized = await isanzureQuery(personalizedSql, personalizedValues);

    res.status(200).json({
      success: true,
      recommendations,
      locationContext: {
        userProvince,
        userDistrict,
        hasLocation: !!(userProvince || userDistrict)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in getPopularSearches:', error);
    res.status(200).json({
      success: true,
      recommendations: {
        popularDestinations: [],
        trendingSearches: [],
        nearbySuggestions: [],
        personalized: []
      }
    });
  }
};

// 4. GET SEARCH AUTOCOMPLETE (for search bar)
exports.getAutocomplete = async (req, res) => {
  try {
    const { q = '', limit = 8 } = req.query;

    if (!q.trim() || q.length < 2) {
      return res.status(200).json({
        success: true,
        results: []
      });
    }

    const searchTerm = `%${q}%`;

    // Get location autocomplete
    const locationSql = `
      SELECT 
        name,
        fullName,
        type,
        icon,
        description,
        'location' as category
      FROM (
        SELECT 
          province as name,
          province as fullName,
          'province' as type,
          '🗺️' as icon,
          'Province' as description
        FROM properties
        WHERE status = 'active' AND province LIKE ?
        
        UNION
        
        SELECT 
          district as name,
          CONCAT(district, ', ', province) as fullName,
          'district' as type,
          '🏙️' as icon,
          'District' as description
        FROM properties
        WHERE status = 'active' AND district LIKE ?
        
        UNION
        
        SELECT 
          sector as name,
          CONCAT(sector, ', ', district) as fullName,
          'sector' as type,
          '📍' as icon,
          'Sector' as description
        FROM properties
        WHERE status = 'active' AND sector LIKE ?
      ) as locations
      ORDER BY 
        CASE 
          WHEN name LIKE CONCAT(?, '%') THEN 1
          ELSE 2
        END,
        name
      LIMIT ?
    `;

    const locations = await isanzureQuery(locationSql, [searchTerm, searchTerm, searchTerm, q, parseInt(limit)]);

    // Get property type autocomplete
    const typeSql = `
      SELECT 
        property_type as name,
        CONCAT(UPPER(SUBSTRING(property_type, 1, 1)), SUBSTRING(property_type, 2)) as fullName,
        'property_type' as type,
        '🏠' as icon,
        'Property Type' as description,
        'type' as category
      FROM properties
      WHERE status = 'active' AND property_type LIKE ?
      GROUP BY property_type
      ORDER BY 
        CASE 
          WHEN property_type LIKE CONCAT(?, '%') THEN 1
          ELSE 2
        END
      LIMIT 3
    `;

    const types = await isanzureQuery(typeSql, [searchTerm, q]);

    // Combine results
    const results = [...locations, ...types];

    res.status(200).json({
      success: true,
      query: q,
      results: results.slice(0, limit),
      categories: [...new Set(results.map(r => r.category))],
      hasMore: results.length >= limit
    });

  } catch (error) {
    console.error('❌ Error in getAutocomplete:', error);
    res.status(200).json({
      success: true,
      results: []
    });
  }
};

// 5. GET SEARCH FILTERS ENHANCED
exports.getSearchFilters = async (req, res) => {
  try {
    const { province, district, propertyType } = req.query;

    // Get price statistics
    const priceStats = await getPriceRangeStats(province, district);
    
    // Get property types with counts
    const typesSql = `
      SELECT 
        property_type as value,
        CONCAT(UPPER(SUBSTRING(property_type, 1, 1)), SUBSTRING(property_type, 2)) as label,
        COUNT(*) as count,
        ROUND(AVG(pp.monthly_price)) as avgPrice
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
      GROUP BY property_type
      ORDER BY count DESC
    `;

    const typeValues = [];
    if (province) typeValues.push(mapProvinceToDb(province));
    if (district) typeValues.push(district);
    
    const propertyTypes = await isanzureQuery(typesSql, typeValues);

    // Get amenities by category
    const amenitiesSql = `
      SELECT 
        pa.amenity_key as value,
        pa.amenity_name as label,
        pa.category,
        COUNT(paj.id) as count,
        ROUND(COUNT(paj.id) * 100.0 / (SELECT COUNT(*) FROM properties WHERE status = 'active'), 1) as percentage
      FROM property_amenities pa
      LEFT JOIN property_amenity_junction paj ON pa.id = paj.amenity_id
      LEFT JOIN properties p ON paj.property_id = p.id AND p.status = 'active'
      GROUP BY pa.id, pa.category, pa.amenity_name
      ORDER BY pa.category, count DESC
    `;

    const amenities = await isanzureQuery(amenitiesSql);

    // Get nearby attraction types
    const attractionsSql = `
      SELECT 
        DISTINCT attraction_type as value,
        CONCAT(UPPER(SUBSTRING(attraction_type, 1, 1)), SUBSTRING(attraction_type, 2)) as label,
        COUNT(*) as count
      FROM property_nearby_attractions pna
      JOIN properties p ON pna.property_id = p.id AND p.status = 'active'
      GROUP BY attraction_type
      ORDER BY count DESC
    `;

    const attractions = await isanzureQuery(attractionsSql);

    // Get location hierarchy
    const locations = await getLocationHierarchy(province, district);

    res.status(200).json({
      success: true,
      filters: {
        priceRange: {
          min: priceStats.min,
          max: priceStats.max,
          average: priceStats.avg,
          suggestedMin: Math.round(priceStats.min * 1.1),
          suggestedMax: Math.round(priceStats.max * 0.9)
        },
        propertyTypes: propertyTypes.map(t => ({
          ...t,
          popular: t.count > 10,
          priceRange: {
            min: Math.round(t.avgPrice * 0.7),
            max: Math.round(t.avgPrice * 1.3)
          }
        })),
        amenities: amenities.reduce((acc, amenity) => {
          if (!acc[amenity.category]) {
            acc[amenity.category] = [];
          }
          acc[amenity.category].push({
            ...amenity,
            common: amenity.percentage > 20
          });
          return acc;
        }, {}),
        nearbyAttractions: attractions,
        locations,
        roomOptions: {
          bedrooms: [
            { value: '', label: 'Any' },
            { value: '1', label: '1+' },
            { value: '2', label: '2+' },
            { value: '3', label: '3+' },
            { value: '4', label: '4+' },
            { value: '5', label: '5+' }
          ],
          bathrooms: [
            { value: '', label: 'Any' },
            { value: '1', label: '1+' },
            { value: '2', label: '2+' },
            { value: '3', label: '3+' },
            { value: '4', label: '4+' }
          ],
          guests: [
            { value: '1', label: '1+' },
            { value: '2', label: '2+' },
            { value: '3', label: '3+' },
            { value: '4', label: '4+' },
            { value: '5', label: '5+' },
            { value: '6', label: '6+' },
            { value: '8', label: '8+' },
            { value: '10', label: '10+' }
          ]
        },
        pricePeriods: [
          { value: 'monthly', label: 'Monthly' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'daily', label: 'Daily' },
          { value: 'nightly', label: 'Nightly' }
        ],
        sortOptions: [
          { value: 'relevance', label: 'Most Relevant' },
          { value: 'price_asc', label: 'Price: Low to High' },
          { value: 'price_desc', label: 'Price: High to Low' },
          { value: 'newest', label: 'Newest First' },
          { value: 'featured', label: 'Featured' },
          { value: 'verified', label: 'Verified Only' }
        ]
      },
      statistics: {
        totalProperties: await getTotalProperties(province, district),
        averagePrice: priceStats.avg,
        popularType: propertyTypes[0] || null,
        commonAmenities: amenities.filter(a => a.percentage > 30).slice(0, 5)
      }
    });

  } catch (error) {
    console.error('❌ Error in getSearchFilters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load filters'
    });
  }
};

// HELPER FUNCTIONS

// Generate intelligent recommendations
async function generateIntelligentRecommendations(context) {
  const recommendations = {
    similarProperties: [],
    popularNearby: [],
    trending: [],
    priceAlternatives: [],
    typeAlternatives: []
  };

  try {
    // Similar properties based on context
    if (context.province || context.district || context.propertyTypes?.length > 0) {
      const similarSql = `
        SELECT 
          p.id,
          p.property_uid,
          p.title,
          p.property_type,
          p.district,
          p.sector,
          pp.monthly_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
          'similar' as recommendation_type,
          COUNT(*) OVER() as total_similar
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          ${context.province ? 'AND p.province = ?' : ''}
          ${context.district ? 'AND p.district = ?' : ''}
          ${context.propertyTypes?.length > 0 ? `AND p.property_type IN (${context.propertyTypes.map(() => '?').join(',')})` : ''}
        ORDER BY p.is_featured DESC, p.is_verified DESC, RAND()
        LIMIT 6
      `;

      const similarValues = [];
      if (context.province) similarValues.push(mapProvinceToDb(context.province));
      if (context.district) similarValues.push(context.district);
      if (context.propertyTypes?.length > 0) similarValues.push(...context.propertyTypes);
      
      recommendations.similarProperties = await isanzureQuery(similarSql, similarValues);
    }

    // Popular nearby properties
    if (context.province) {
      const popularSql = `
        SELECT 
          p.id,
          p.property_uid,
          p.title,
          p.property_type,
          p.district,
          p.sector,
          pp.monthly_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
          'popular_nearby' as recommendation_type,
          (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) as image_count
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          AND p.province = ?
          AND p.is_featured = 1
        ORDER BY p.is_verified DESC, p.created_at DESC
        LIMIT 4
      `;

      recommendations.popularNearby = await isanzureQuery(popularSql, [mapProvinceToDb(context.province)]);
    }

    // Trending properties (recently added)
    const trendingSql = `
      SELECT 
        p.id,
        p.property_uid,
        p.title,
        p.property_type,
        p.district,
        p.sector,
        pp.monthly_price,
        (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
        'trending' as recommendation_type,
        DATEDIFF(NOW(), p.created_at) as days_ago
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY p.created_at DESC
      LIMIT 4
    `;

    recommendations.trending = await isanzureQuery(trendingSql);

    // Price alternatives (similar price range)
    if (context.priceRange?.min || context.priceRange?.max) {
      const avgPrice = ((parseInt(context.priceRange.min) || 0) + (parseInt(context.priceRange.max) || 500000)) / 2;
      const priceMargin = avgPrice * 0.3;
      
      const priceSql = `
        SELECT 
          p.id,
          p.property_uid,
          p.title,
          p.property_type,
          p.district,
          p.sector,
          pp.monthly_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
          'price_alternative' as recommendation_type,
          ABS(pp.monthly_price - ?) as price_difference
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          AND pp.monthly_price BETWEEN ? AND ?
          AND pp.monthly_price IS NOT NULL
        ORDER BY price_difference ASC
        LIMIT 4
      `;

      recommendations.priceAlternatives = await isanzureQuery(priceSql, [
        avgPrice,
        avgPrice - priceMargin,
        avgPrice + priceMargin
      ]);
    }

  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
  }

  return recommendations;
}

// Get price range statistics
async function getPriceRangeStats(province, district) {
  try {
    const sql = `
      SELECT 
        MIN(pp.monthly_price) as min,
        MAX(pp.monthly_price) as max,
        AVG(pp.monthly_price) as avg,
        STDDEV(pp.monthly_price) as stddev,
        COUNT(*) as count
      FROM property_pricing pp
      JOIN properties p ON pp.property_id = p.id
      WHERE p.status = 'active'
        AND pp.monthly_price > 0
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
    `;

    const values = [];
    if (province) values.push(mapProvinceToDb(province));
    if (district) values.push(district);

    const result = await isanzureQuery(sql, values);
    const stats = result[0] || { min: 0, max: 500000, avg: 150000, stddev: 100000, count: 0 };

    // Calculate quartiles if we have enough data
    if (stats.count > 10) {
      const quartileSql = `
        SELECT 
          MIN(monthly_price) as q0,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY monthly_price) as q1,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY monthly_price) as q2,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY monthly_price) as q3,
          MAX(monthly_price) as q4
        FROM (
          SELECT pp.monthly_price
          FROM property_pricing pp
          JOIN properties p ON pp.property_id = p.id
          WHERE p.status = 'active'
            AND pp.monthly_price > 0
            ${province ? 'AND p.province = ?' : ''}
            ${district ? 'AND p.district = ?' : ''}
          ORDER BY pp.monthly_price
        ) as prices
      `;

      const quartiles = await isanzureQuery(quartileSql, values);
      if (quartiles[0]) {
        stats.quartiles = quartiles[0];
      }
    }

    return {
      min: Math.round(stats.min || 0),
      max: Math.round(stats.max || 500000),
      avg: Math.round(stats.avg || 150000),
      stddev: Math.round(stats.stddev || 100000),
      count: stats.count
    };

  } catch (error) {
    console.error('❌ Error getting price range stats:', error);
    return { min: 0, max: 500000, avg: 150000, stddev: 100000, count: 0 };
  }
}

// Get popular locations from properties
async function getPopularLocations(properties) {
  try {
    if (!properties || properties.length === 0) {
      // Get default popular locations
      const sql = `
        SELECT 
          CONCAT(p.district, ', ', p.province) as name,
          COUNT(*) as count,
          ROUND(AVG(pp.monthly_price)) as avgPrice
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
        GROUP BY p.province, p.district
        ORDER BY count DESC
        LIMIT 5
      `;
      
      return await isanzureQuery(sql);
    }

    const locationCounts = {};
    properties.forEach(property => {
      const key = `${property.district}, ${property.province}`;
      if (property.district && property.province) {
        locationCounts[key] = (locationCounts[key] || 0) + 1;
      }
    });

    return Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

  } catch (error) {
    return [];
  }
}

// Get average price
async function getAveragePrice(province, district, period = 'monthly') {
  try {
    const priceColumn = `${period}_price`;
    const sql = `
      SELECT 
        AVG(pp.${priceColumn}) as avg_price,
        COUNT(*) as count
      FROM property_pricing pp
      JOIN properties p ON pp.property_id = p.id
      WHERE p.status = 'active'
        AND pp.${priceColumn} > 0
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
    `;

    const values = [];
    if (province) values.push(mapProvinceToDb(province));
    if (district) values.push(district);

    const result = await isanzureQuery(sql, values);
    return {
      average: Math.round(result[0]?.avg_price || 0),
      count: result[0]?.count || 0,
      period: period
    };

  } catch (error) {
    return { average: 0, count: 0, period: period };
  }
}

// Get location hierarchy
async function getLocationHierarchy(province, district) {
  try {
    const locations = {};

    // Get provinces
    const provincesSql = `
      SELECT DISTINCT province
      FROM properties
      WHERE status = 'active' AND province IS NOT NULL
      ORDER BY province
    `;
    const provinces = await isanzureQuery(provincesSql);
    locations.provinces = provinces.map(p => p.province);

    // Get districts for selected province
    if (province) {
      const districtsSql = `
        SELECT DISTINCT district
        FROM properties
        WHERE status = 'active' 
          AND province = ? 
          AND district IS NOT NULL
        ORDER BY district
      `;
      const districts = await isanzureQuery(districtsSql, [mapProvinceToDb(province)]);
      locations.districts = districts.map(d => d.district);
    }

    // Get sectors for selected district
    if (district) {
      const sectorsSql = `
        SELECT DISTINCT sector
        FROM properties
        WHERE status = 'active' 
          AND province = ? 
          AND district = ? 
          AND sector IS NOT NULL
        ORDER BY sector
      `;
      const sectors = await isanzureQuery(sectorsSql, [mapProvinceToDb(province), district]);
      locations.sectors = sectors.map(s => s.sector);
    }

    // Get cells for selected sector (if needed)
    if (district) {
      const cellsSql = `
        SELECT DISTINCT cell
        FROM properties
        WHERE status = 'active' 
          AND province = ? 
          AND district = ? 
          AND cell IS NOT NULL
        ORDER BY cell
      `;
      const cells = await isanzureQuery(cellsSql, [mapProvinceToDb(province), district]);
      locations.cells = cells.map(c => c.cell);
    }

    return locations;

  } catch (error) {
    console.error('❌ Error getting location hierarchy:', error);
    return { provinces: [], districts: [], sectors: [], cells: [] };
  }
}

// Get total properties
async function getTotalProperties(province, district) {
  try {
    const sql = `
      SELECT COUNT(*) as total
      FROM properties
      WHERE status = 'active'
        ${province ? 'AND province = ?' : ''}
        ${district ? 'AND district = ?' : ''}
    `;

    const values = [];
    if (province) values.push(mapProvinceToDb(province));
    if (district) values.push(district);

    const result = await isanzureQuery(sql, values);
    return result[0]?.total || 0;

  } catch (error) {
    return 0;
  }
}

// Get similar search terms
async function getSimilarSearchTerms(query) {
  try {
    if (query.length < 3) return [];
    
    const searchTerm = `%${query}%`;
    
    const sql = `
      SELECT 
        term,
        type,
        frequency
      FROM (
        -- District terms
        SELECT 
          district as term,
          'district' as type,
          COUNT(*) as frequency
        FROM properties
        WHERE status = 'active' AND district LIKE ?
        GROUP BY district
        
        UNION
        
        -- Property type terms
        SELECT 
          property_type as term,
          'type' as type,
          COUNT(*) as frequency
        FROM properties
        WHERE status = 'active' AND property_type LIKE ?
        GROUP BY property_type
        
        UNION
        
        -- Sector terms
        SELECT 
          sector as term,
          'sector' as type,
          COUNT(*) as frequency
        FROM properties
        WHERE status = 'active' AND sector LIKE ?
        GROUP BY sector
      ) as terms
      ORDER BY 
        CASE 
          WHEN term LIKE CONCAT(?, '%') THEN 1
          ELSE 2
        END,
        frequency DESC
      LIMIT 5
    `;

    return await isanzureQuery(sql, [searchTerm, searchTerm, searchTerm, query]);

  } catch (error) {
    return [];
  }
}

// Analyze search pattern
function analyzeSearchPattern(query) {
  const patterns = {
    type: 'general',
    confidence: 0.5
  };

  if (!query) return patterns;

  const queryLower = query.toLowerCase();

  // Check for location patterns
  const locationIndicators = ['kigali', 'musanze', 'rubavu', 'huye', 'district', 'sector', 'province'];
  if (locationIndicators.some(indicator => queryLower.includes(indicator))) {
    patterns.type = 'location';
    patterns.confidence = 0.8;
  }

  // Check for property type patterns
  const typeIndicators = ['apartment', 'house', 'villa', 'ghetto', 'hostel', 'studio'];
  if (typeIndicators.some(indicator => queryLower.includes(indicator))) {
    patterns.type = 'property_type';
    patterns.confidence = 0.9;
  }

  // Check for price patterns
  const priceIndicators = ['rwf', 'frw', 'price', 'cheap', 'expensive', 'rent'];
  if (priceIndicators.some(indicator => queryLower.includes(indicator))) {
    patterns.type = 'price';
    patterns.confidence = 0.7;
  }

  // Check for landmark patterns
  const landmarkIndicators = ['near', 'close to', 'hafi', 'university', 'hospital', 'market'];
  if (landmarkIndicators.some(indicator => queryLower.includes(indicator))) {
    patterns.type = 'landmark';
    patterns.confidence = 0.85;
  }

  return patterns;
}

// Generate unique search ID
function generateSearchId() {
  return 'search_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 6. SEARCH INSIGHTS AND ANALYTICS
exports.getSearchInsights = async (req, res) => {
  try {
    const { province, district, timeframe = 'month' } = req.query;

    // Get search trends
    const trendsSql = `
      SELECT 
        DATE(p.created_at) as date,
        COUNT(*) as new_properties,
        AVG(pp.monthly_price) as avg_price
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
      GROUP BY DATE(p.created_at)
      ORDER BY date DESC
    `;

    const trendValues = [];
    if (province) trendValues.push(mapProvinceToDb(province));
    if (district) trendValues.push(district);

    const trends = await isanzureQuery(trendsSql, trendValues);

    // Get price distribution
    const priceDistSql = `
      SELECT 
        CASE
          WHEN pp.monthly_price < 50000 THEN 'Under 50k'
          WHEN pp.monthly_price < 100000 THEN '50k - 100k'
          WHEN pp.monthly_price < 200000 THEN '100k - 200k'
          WHEN pp.monthly_price < 300000 THEN '200k - 300k'
          WHEN pp.monthly_price < 500000 THEN '300k - 500k'
          WHEN pp.monthly_price < 1000000 THEN '500k - 1M'
          ELSE 'Over 1M'
        END as price_range,
        COUNT(*) as property_count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM properties WHERE status = 'active'), 1) as percentage
      FROM property_pricing pp
      JOIN properties p ON pp.property_id = p.id
      WHERE p.status = 'active'
        AND pp.monthly_price > 0
        ${province ? 'AND p.province = ?' : ''}
        ${district ? 'AND p.district = ?' : ''}
      GROUP BY price_range
      ORDER BY MIN(pp.monthly_price)
    `;

    const priceDistribution = await isanzureQuery(priceDistSql, trendValues);

    // Get popular amenities
    const popularAmenitiesSql = `
      SELECT 
        pa.amenity_name,
        pa.category,
        COUNT(paj.id) as count,
        ROUND(COUNT(paj.id) * 100.0 / (SELECT COUNT(*) FROM properties WHERE status = 'active'), 1) as percentage
      FROM property_amenities pa
      JOIN property_amenity_junction paj ON pa.id = paj.amenity_id
      JOIN properties p ON paj.property_id = p.id AND p.status = 'active'
      ${province ? 'AND p.province = ?' : ''}
      ${district ? 'AND p.district = ?' : ''}
      GROUP BY pa.id, pa.amenity_name, pa.category
      ORDER BY count DESC
      LIMIT 10
    `;

    const popularAmenities = await isanzureQuery(popularAmenitiesSql, trendValues);

    // Get verification statistics
    const verificationSql = `
      SELECT 
        verification_status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM properties WHERE status = 'active'), 1) as percentage
      FROM properties
      WHERE status = 'active'
        ${province ? 'AND province = ?' : ''}
        ${district ? 'AND district = ?' : ''}
      GROUP BY verification_status
    `;

    const verificationStats = await isanzureQuery(verificationSql, trendValues);

    res.status(200).json({
      success: true,
      insights: {
        trends: {
          daily: trends,
          totalProperties: trends.reduce((sum, day) => sum + day.new_properties, 0),
          averageDailyNew: Math.round(trends.reduce((sum, day) => sum + day.new_properties, 0) / Math.max(trends.length, 1))
        },
        priceDistribution,
        popularAmenities: popularAmenities.map(amenity => ({
          ...amenity,
          common: amenity.percentage > 30,
          veryCommon: amenity.percentage > 50
        })),
        verification: verificationStats,
        marketHealth: {
          inventoryLevel: trends.length > 0 ? 'good' : 'low',
          priceStability: calculatePriceStability(trends),
          demandIndicator: await calculateDemandIndicator(province, district)
        },
        recommendations: generateMarketRecommendations(priceDistribution, trends, popularAmenities)
      }
    });

  } catch (error) {
    console.error('❌ Error in getSearchInsights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insights'
    });
  }
};

// Calculate price stability
function calculatePriceStability(trends) {
  if (trends.length < 2) return 'unknown';
  
  const prices = trends.map(t => t.avg_price).filter(p => p);
  if (prices.length < 2) return 'unknown';
  
  const average = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((a, b) => a + Math.pow(b - average, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const coefficient = stdDev / average;
  
  if (coefficient < 0.1) return 'very_stable';
  if (coefficient < 0.2) return 'stable';
  if (coefficient < 0.3) return 'moderate';
  return 'volatile';
}

// Calculate demand indicator
async function calculateDemandIndicator(province, district) {
  try {
    // This is a simplified calculation - in production, you'd use actual booking/query data
    const sql = `
      SELECT 
        COUNT(*) as total_properties,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured,
        SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified,
        AVG(DATEDIFF(NOW(), created_at)) as avg_age_days
      FROM properties
      WHERE status = 'active'
        ${province ? 'AND province = ?' : ''}
        ${district ? 'AND district = ?' : ''}
    `;

    const values = [];
    if (province) values.push(mapProvinceToDb(province));
    if (district) values.push(district);

    const result = await isanzureQuery(sql, values);
    const stats = result[0] || { total_properties: 0, featured: 0, verified: 0, avg_age_days: 0 };
    
    // Simple heuristic for demand
    if (stats.total_properties === 0) return 'unknown';
    
    const featuredRatio = stats.featured / stats.total_properties;
    const verifiedRatio = stats.verified / stats.total_properties;
    const avgAge = stats.avg_age_days;
    
    let score = 0;
    if (featuredRatio > 0.3) score += 2;
    if (verifiedRatio > 0.4) score += 2;
    if (avgAge < 30) score += 2; // Newer properties suggest higher demand
    
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
    
  } catch (error) {
    return 'unknown';
  }
}

// Generate market recommendations
function generateMarketRecommendations(priceDistribution, trends, popularAmenities) {
  const recommendations = [];
  
  // Price range recommendation
  if (priceDistribution.length > 0) {
    const largestSegment = priceDistribution.reduce((max, curr) => 
      curr.property_count > max.property_count ? curr : max
    );
    
    if (largestSegment.percentage > 40) {
      recommendations.push({
        type: 'price_range',
        message: `Most properties (${largestSegment.percentage}%) are in the ${largestSegment.price_range} range`,
        suggestion: 'Consider this price range for competitive pricing'
      });
    }
  }
  
  // Amenity recommendation
  if (popularAmenities.length > 0) {
    const topAmenity = popularAmenities[0];
    if (topAmenity.percentage > 60) {
      recommendations.push({
        type: 'amenity',
        message: `${topAmenity.amenity_name} is available in ${topAmenity.percentage}% of properties`,
        suggestion: 'This is an expected feature in most properties'
      });
    }
  }
  
  // Trend recommendation
  if (trends.length >= 7) {
    const recentWeek = trends.slice(0, 7);
    const previousWeek = trends.slice(7, 14);
    
    if (recentWeek.length === 7 && previousWeek.length === 7) {
      const recentAvg = recentWeek.reduce((sum, day) => sum + (day.avg_price || 0), 0) / 7;
      const previousAvg = previousWeek.reduce((sum, day) => sum + (day.avg_price || 0), 0) / 7;
      
      const change = ((recentAvg - previousAvg) / previousAvg) * 100;
      
      if (Math.abs(change) > 10) {
        recommendations.push({
          type: 'trend',
          message: `Prices have ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% in the last week`,
          suggestion: change > 0 ? 'Prices are rising - consider listing soon' : 'Good time to find deals'
        });
      }
    }
  }
  
  return recommendations;
}

module.exports = {
  advancedSearch: exports.advancedSearch,
  intelligentSearch: exports.intelligentSearch,
  getPopularSearches: exports.getPopularSearches,
  getAutocomplete: exports.getAutocomplete,
  getSearchFilters: exports.getSearchFilters,
  getSearchInsights: exports.getSearchInsights
};