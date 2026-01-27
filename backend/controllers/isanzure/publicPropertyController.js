const { isanzureQuery } = require('../../config/isanzureDbConfig');
const { query: oliviuusQuery } = require('../../config/dbConfig');

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

// Debug helper function
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🔍 ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 🔍 ${message}`);
  }
};

// Helper function to fetch SSO profile safely
const fetchSsoProfile = async (oliviuusUserId) => {
  if (!oliviuusUserId) {
    debugLog('No oliviuus_user_id provided for SSO fetch');
    return null;
  }

  debugLog(`Attempting to fetch SSO profile for oliviuus_user_id: ${oliviuusUserId}`);

  try {
    // IMPORTANT: oliviuus_user_id in isanzure_db references the `id` field in oliviuus_db.users
    const ssoQuery = `
      SELECT 
        id,
        first_name,
        last_name,
        username,
        email,
        phone,
        profile_avatar_url,
        created_at
      FROM users 
      WHERE id = ?
      LIMIT 1
    `;

    debugLog('Executing SSO query:', { query: ssoQuery, params: [oliviuusUserId] });
    const ssoUsers = await oliviuusQuery(ssoQuery, [oliviuusUserId]);

    debugLog(`SSO query results: ${ssoUsers.length} users found`);

    if (ssoUsers.length > 0) {
      debugLog('SSO profile found:', ssoUsers[0]);
      return ssoUsers[0];
    } else {
      debugLog('No SSO profile found for the given ID');
      return null;
    }
  } catch (error) {
    debugLog('SSO profile fetch FAILED with error:', error.message);
    console.error('SSO Query Error Details:', error);
    return null; // Return null on error, don't crash
  }
};


// 1. Get all active properties (simple version)
exports.getPublicProperties = async (req, res) => {
  try {
    const query = `
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
        p.total_rooms,
        p.is_featured,
        p.is_verified,
        p.status,
        COALESCE(pp.monthly_price, 0) as monthly_price,
        COALESCE(pp.weekly_price, 0) as weekly_price,
        COALESCE(pp.daily_price, 0) as daily_price,
        COALESCE(pp.nightly_price, 0) as nightly_price,
        pp.accept_nightly,
        pp.accept_daily,
        pp.accept_weekly,
        pp.accept_monthly,
        (SELECT pi.image_url 
         FROM property_images pi 
         WHERE pi.property_id = p.id 
         LIMIT 1) as cover_image
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT 50
    `;

    const properties = await isanzureQuery(query);

    console.log(`✅ getPublicProperties: ${properties.length} properties`);

    res.status(200).json({
      success: true,
      data: properties || []
    });
  } catch (error) {
    console.error('❌ Error in getPublicProperties:', error.message);
    res.status(200).json({
      success: true,
      data: []
    });
  }
};

// 2. Simple properties list (alias for getPublicProperties)
exports.getSimpleProperties = async (req, res) => {
  return exports.getPublicProperties(req, res);
};

// 3. Get properties by province
exports.getPropertiesByProvince = async (req, res) => {
  try {
    const { province } = req.query;

    if (!province) {
      return res.status(400).json({
        success: false,
        message: 'Province is required'
      });
    }

    const dbProvince = mapProvinceToDb(province);

    const query = `
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
        p.is_featured,
        p.is_verified,
        COALESCE(pp.monthly_price, 0) as monthly_price,
        COALESCE(pp.weekly_price, 0) as weekly_price,
        COALESCE(pp.daily_price, 0) as daily_price,
        COALESCE(pp.nightly_price, 0) as nightly_price,
        pp.accept_nightly,
        pp.accept_daily,
        pp.accept_weekly,
        pp.accept_monthly,
        (SELECT pi.image_url 
         FROM property_images pi 
         WHERE pi.property_id = p.id 
         LIMIT 1) as cover_image
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        AND p.province = ?
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT 20
    `;

    const properties = await isanzureQuery(query, [dbProvince]);

    console.log(`✅ getPropertiesByProvince(${dbProvince}): ${properties.length} properties`);

    res.status(200).json({
      success: true,
      data: properties || [],
      province: dbProvince,
      count: properties.length
    });
  } catch (error) {
    console.error('❌ Error in getPropertiesByProvince:', error.message);
    res.status(200).json({
      success: true,
      data: [],
      province: req.query.province || '',
      count: 0
    });
  }
};

// 4. Get properties by district (WORKING)
exports.getPropertiesByDistrict = async (req, res) => {
  try {
    const { district } = req.query;

    if (!district) {
      return res.status(400).json({
        success: false,
        message: 'District is required'
      });
    }

    const query = `
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
        p.is_featured,
        p.is_verified,
        COALESCE(pp.monthly_price, 0) as monthly_price,
        COALESCE(pp.weekly_price, 0) as weekly_price,
        COALESCE(pp.daily_price, 0) as daily_price,
        COALESCE(pp.nightly_price, 0) as nightly_price,
        pp.accept_nightly,
        pp.accept_daily,
        pp.accept_weekly,
        pp.accept_monthly,
        (SELECT pi.image_url 
         FROM property_images pi 
         WHERE pi.property_id = p.id 
         LIMIT 1) as cover_image
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        AND p.district = ?
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT 20
    `;

    const properties = await isanzureQuery(query, [district]);

    console.log(`✅ getPropertiesByDistrict(${district}): ${properties.length} properties`);

    res.status(200).json({
      success: true,
      data: properties || [],
      district: district,
      count: properties.length
    });
  } catch (error) {
    console.error('❌ Error in getPropertiesByDistrict:', error.message);
    res.status(200).json({
      success: true,
      data: [],
      district: req.query.district || '',
      count: 0
    });
  }
};

// 5. Get properties by location (SMART ALGORITHM)
exports.getPropertiesByLocation = async (req, res) => {
  try {
    const { province, district, sector, limit = 30 } = req.query;

    if (!province) {
      return res.status(400).json({
        success: false,
        message: 'Province is required'
      });
    }

    const dbProvince = mapProvinceToDb(province);
    console.log(`🔍 PRO Search: ${sector || ''}${sector ? ', ' : ''}${district || ''}${district ? ', ' : ''}${dbProvince}`);

    const result = {
      success: true,
      data: [],
      recommendations: [],
      location: { province: dbProvince, district, sector },
      matchedLevel: null,
      message: ''
    };

    // PHASE 1: Try exact matches
    let exactMatches = [];

    // 1A. Try exact sector match
    if (sector && district) {
      const sectorQuery = `
        SELECT *, 'exact_sector' as match_type, 100 as priority_score
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          AND p.province = ?
          AND p.district = ?
          AND p.sector = ?
        LIMIT 5
      `;

      try {
        const sectorProperties = await isanzureQuery(sectorQuery, [dbProvince, district, sector]);
        if (sectorProperties.length > 0) {
          console.log(`✅ Exact sector: ${sectorProperties.length} properties`);
          exactMatches.push(...sectorProperties);
          result.matchedLevel = 'sector';
        }
      } catch (error) {
        console.log('⚠️ Sector query error:', error.message);
      }
    }

    // 1B. Try exact district match
    if (district) {
      const districtQuery = `
        SELECT *, 'exact_district' as match_type, 90 as priority_score
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          AND p.province = ?
          AND p.district = ?
        LIMIT 10
      `;

      try {
        const districtProperties = await isanzureQuery(districtQuery, [dbProvince, district]);
        if (districtProperties.length > 0) {
          console.log(`✅ Exact district: ${districtProperties.length} properties`);
          exactMatches.push(...districtProperties);
          if (!result.matchedLevel) result.matchedLevel = 'district';
        }
      } catch (error) {
        console.log('⚠️ District query error:', error.message);
      }
    }

    // 1C. Try exact province match
    const provinceQuery = `
      SELECT *, 'exact_province' as match_type, 80 as priority_score
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        AND p.province = ?
      LIMIT 15
    `;

    try {
      const provinceProperties = await isanzureQuery(provinceQuery, [dbProvince]);
      if (provinceProperties.length > 0) {
        console.log(`✅ Exact province: ${provinceProperties.length} properties`);
        exactMatches.push(...provinceProperties);
        if (!result.matchedLevel) result.matchedLevel = 'province';
      }
    } catch (error) {
      console.log('⚠️ Province query error:', error.message);
    }

    // PHASE 2: Get nearby/similar properties
    let similarProperties = [];

    // 2A. Get properties from nearby provinces
    const nearbyProvinces = {
      'North': ['Kigali', 'East'],
      'South': ['Kigali', 'East'],
      'East': ['Kigali', 'North'],
      'West': ['North', 'South'],
      'Kigali': ['East', 'North']
    };

    const nearby = nearbyProvinces[dbProvince] || ['Kigali', 'North', 'South'];

    for (const nearbyProvince of nearby) {
      const nearbyQuery = `
        SELECT *, 'nearby_province' as match_type, 70 as priority_score
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.status = 'active'
          AND p.province = ?
        LIMIT 5
      `;

      try {
        const nearbyProps = await isanzureQuery(nearbyQuery, [nearbyProvince]);
        if (nearbyProps.length > 0) {
          similarProperties.push(...nearbyProps);
        }
      } catch (error) {
        console.log('⚠️ Nearby province query error:', error.message);
      }
    }

    // PHASE 3: Get trending/featured properties
    const trendingQuery = `
      SELECT *, 'trending' as match_type, 60 as priority_score
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
        AND (p.is_featured = 1 OR p.is_verified = 1)
      LIMIT 10
    `;

    try {
      const trendingProperties = await isanzureQuery(trendingQuery);
      similarProperties.push(...trendingProperties);
    } catch (error) {
      console.log('⚠️ Trending query error:', error.message);
    }

    // Combine and deduplicate
    const allProperties = [...exactMatches, ...similarProperties];
    const uniqueProperties = [];
    const seenIds = new Set();

    for (const property of allProperties) {
      if (!seenIds.has(property.id)) {
        seenIds.add(property.id);

        // Add cover image if missing
        if (!property.cover_image) {
          const imageQuery = `
            SELECT image_url FROM property_images WHERE property_id = ? LIMIT 1
          `;
          const images = await isanzureQuery(imageQuery, [property.id]);
          property.cover_image = images[0]?.image_url || null;
        }

        uniqueProperties.push(property);
      }
    }

    // Sort by priority
    uniqueProperties.sort((a, b) => {
      if (b.priority_score !== a.priority_score) {
        return b.priority_score - a.priority_score;
      }
      if (b.is_featured !== a.is_featured) {
        return b.is_featured - a.is_featured;
      }
      if (b.is_verified !== a.is_verified) {
        return b.is_verified - a.is_verified;
      }
      return 0;
    });

    // Apply limit
    result.data = uniqueProperties.slice(0, limit);

    // Get recommendations (first 5 of each type)
    result.recommendations = {
      exactMatches: exactMatches.slice(0, 5),
      nearby: similarProperties.filter(p => p.match_type === 'nearby_province').slice(0, 5),
      trending: similarProperties.filter(p => p.match_type === 'trending').slice(0, 5)
    };

    result.message = `Found ${result.data.length} properties (${result.matchedLevel || 'mixed'})`;
    console.log(`🎯 ${result.message}`);

    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in getPropertiesByLocation:', error.message);
    res.status(200).json({
      success: true,
      data: [],
      recommendations: [],
      location: { province: '', district: '', sector: '' },
      matchedLevel: 'error',
      message: 'Showing available properties'
    });
  }
};

// 6. Get more properties (for infinite scroll)
exports.getMoreProperties = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const query = `
      SELECT 
        p.id, 
        p.property_uid, 
        p.title, 
        p.property_type,
        p.address, 
        p.province, 
        p.district, 
        p.sector,
        p.cell,
        p.village,
        p.isibo,
        p.is_featured,
        p.is_verified,
        COALESCE(pp.monthly_price, 0) as monthly_price,
        COALESCE(pp.weekly_price, 0) as weekly_price,
        COALESCE(pp.daily_price, 0) as daily_price,
        COALESCE(pp.nightly_price, 0) as nightly_price,
        pp.accept_nightly,
        pp.accept_daily,
        pp.accept_weekly,
        pp.accept_monthly,
        (SELECT pi.image_url 
         FROM property_images pi 
         WHERE pi.property_id = p.id 
         LIMIT 1) as cover_image
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const properties = await isanzureQuery(query, [parseInt(limit), parseInt(offset)]);

    res.status(200).json({
      success: true,
      data: properties || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: properties.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error in getMoreProperties:', error.message);
    res.status(200).json({
      success: true,
      data: [],
      pagination: { limit: 20, offset: 0, hasMore: false }
    });
  }
};

// 7. Get popular locations
exports.getPopularLocations = async (req, res) => {
  try {
    const query = `
      SELECT 
        province,
        district,
        COUNT(*) as property_count
      FROM properties 
      WHERE status = 'active'
        AND province IS NOT NULL
        AND district IS NOT NULL
      GROUP BY province, district
      ORDER BY property_count DESC
      LIMIT 10
    `;

    const locations = await isanzureQuery(query);

    const formattedLocations = locations.map(loc => ({
      province: loc.province,
      district: loc.district,
      propertyCount: loc.property_count,
      displayName: `${loc.district}, ${loc.province === 'Kigali' ? 'Kigali' : loc.province}`
    }));

    console.log(`✅ getPopularLocations: ${formattedLocations.length} locations`);

    res.status(200).json({
      success: true,
      data: formattedLocations || []
    });
  } catch (error) {
    console.error('❌ Error in getPopularLocations:', error.message);
    res.status(200).json({
      success: true,
      data: []
    });
  }
};

// 8. Additional endpoints that might be needed (empty implementations)
exports.getPropertiesBySector = async (req, res) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Use /by-location endpoint instead'
  });
};

exports.getPropertiesNearby = async (req, res) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Use /by-location endpoint instead'
  });
};

exports.searchProperties = async (req, res) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Search feature coming soon'
  });
};

exports.getPropertyStatistics = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      total: 0,
      active: 0,
      featured: 0,
      verified: 0
    },
    message: 'Statistics coming soon'
  });
};


// 9. Get property by UID with SSO data INCLUDED in response
exports.getPropertyByUid = async (req, res) => {
  const startTime = Date.now();
  const { propertyUid } = req.params;

  debugLog(`=== START getPropertyByUid(${propertyUid}) ===`);

  if (!propertyUid) {
    debugLog('Property UID is missing');
    return res.status(400).json({
      success: false,
      message: 'Property UID is required'
    });
  }

  try {
    // Get property with basic landlord info
    const query = `
      SELECT 
        -- Property details
        p.*,
        
        -- Pricing details
        COALESCE(pp.monthly_price, 0) as monthly_price,
        COALESCE(pp.weekly_price, 0) as weekly_price,
        COALESCE(pp.daily_price, 0) as daily_price,
        COALESCE(pp.nightly_price, 0) as nightly_price,
        pp.accept_nightly,
        pp.accept_daily,
        pp.accept_weekly,
        pp.accept_monthly,
        pp.utilities_min,
        pp.utilities_max,
        pp.utilities_included,
        
        -- Rules
        pr.check_in_time,
        pr.check_out_time,
        pr.cancellation_policy,
        pr.smoking_allowed,
        pr.pets_allowed,
        pr.events_allowed,
        pr.guests_allowed,
        pr.house_rules,
        
        -- Landlord basic info
        u.id as landlord_id,
        u.user_uid as landlord_uid,
        u.user_type as landlord_type,
        u.id_verified,
        u.verification_status,
        u.public_phone,
        u.public_email,
        u.oliviuus_user_id,
        u.preferred_contact_methods
        
      FROM properties p
      
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      LEFT JOIN property_rules pr ON p.id = pr.property_id
      LEFT JOIN users u ON p.landlord_id = u.id
      
      WHERE p.property_uid = ?
        AND p.status = 'active'
    `;

    debugLog('Executing property query:', { query, params: [propertyUid] });
    const properties = await isanzureQuery(query, [propertyUid]);

    debugLog(`Property query returned ${properties.length} results`);

    if (properties.length === 0) {
      debugLog('No property found with the given UID');
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const property = properties[0];
    debugLog('Property data retrieved:', {
      property_id: property.id,
      title: property.title,
      landlord_id: property.landlord_id,
      oliviuus_user_id: property.oliviuus_user_id,
      has_public_phone: !!property.public_phone,
      has_public_email: !!property.public_email
    });

    // Fetch additional related data
    debugLog('Fetching images and amenities...');
    const [images, amenities] = await Promise.all([
      // Images
      isanzureQuery(`
        SELECT 
          pi.*,
          p.property_uid
        FROM property_images pi
        JOIN properties p ON pi.property_id = p.id
        WHERE p.property_uid = ?
        ORDER BY pi.is_cover DESC, pi.display_order ASC
      `, [propertyUid]),

      // Amenities
      isanzureQuery(`
        SELECT 
          pa.*
        FROM property_amenity_junction paj
        JOIN property_amenities pa ON paj.amenity_id = pa.id
        JOIN properties p ON paj.property_id = p.id
        WHERE p.property_uid = ?
        ORDER BY pa.category, pa.amenity_name
      `, [propertyUid])
    ]);

    debugLog(`Retrieved ${images.length} images and ${amenities.length} amenities`);

    // Parse preferred contact methods JSON
    let preferredContacts = ['whatsapp', 'phone', 'email'];
    if (property.preferred_contact_methods) {
      try {
        preferredContacts = JSON.parse(property.preferred_contact_methods);
        debugLog('Parsed preferred contacts:', preferredContacts);
      } catch (e) {
        debugLog('Failed to parse preferred_contact_methods:', e.message);
      }
    }

    // Check verification status
    const isVerified = property.id_verified === 1 || property.verification_status === 'approved';
    debugLog('Landlord verification status:', {
      id_verified: property.id_verified,
      verification_status: property.verification_status,
      is_verified: isVerified
    });

    // Fetch SSO profile BEFORE preparing response
    let ssoProfile = null;
    if (property.oliviuus_user_id) {
      debugLog(`Fetching SSO profile for oliviuus_user_id: ${property.oliviuus_user_id}`);
      ssoProfile = await fetchSsoProfile(property.oliviuus_user_id);
      if (ssoProfile) {
        debugLog('SSO profile fetched successfully:', {
          first_name: ssoProfile.first_name,
          last_name: ssoProfile.last_name,
          has_avatar: !!ssoProfile.profile_avatar_url
        });
      } else {
        debugLog('No SSO profile found');
      }
    } else {
      debugLog('No oliviuus_user_id found for this landlord');
    }

    // Prepare landlord data WITH SSO profile
    const landlordData = {
      id: property.landlord_id,
      user_uid: property.landlord_uid,
      user_type: property.landlord_type,
      is_verified: isVerified,
      public_phone: property.public_phone,
      public_email: property.public_email,
      oliviuus_user_id: property.oliviuus_user_id,
      preferred_contact_methods: preferredContacts,

      // Include SSO profile data
      sso_profile: ssoProfile ? {
        first_name: ssoProfile.first_name,
        last_name: ssoProfile.last_name,
        full_name: ssoProfile.first_name && ssoProfile.last_name
          ? `${ssoProfile.first_name} ${ssoProfile.last_name}`
          : ssoProfile.first_name || ssoProfile.username || 'Landlord',
        username: ssoProfile.username,
        profile_avatar_url: ssoProfile.profile_avatar_url,
        email: ssoProfile.email,
        phone: ssoProfile.phone
      } : null
    };

    debugLog('Full landlord data prepared (with SSO):', {
      name: landlordData.sso_profile?.full_name || 'Unknown',
      is_verified: landlordData.is_verified,
      has_avatar: !!landlordData.sso_profile?.profile_avatar_url,
      public_phone: landlordData.public_phone,
      public_email: landlordData.public_email
    });

    const responseData = {
      property: property,
      images: images || [],
      amenities: amenities || [],
      landlord: landlordData, // Now includes SSO data!
      stats: {
        images: images.length,
        amenities: amenities.length
      }
    };

    const endTime = Date.now();
    debugLog(`=== END getPropertyByUid(${propertyUid}) - ${endTime - startTime}ms ===`);

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    debugLog('ERROR in getPropertyByUid:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// 10. Get property images
exports.getPropertyImages = async (req, res) => {
  try {
    const { propertyUid } = req.params;

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required'
      });
    }

    const query = `
      SELECT 
        pi.*,
        p.property_uid
      FROM property_images pi
      JOIN properties p ON pi.property_id = p.id
      WHERE p.property_uid = ?
        AND p.status = 'active'
      ORDER BY pi.is_cover DESC, pi.display_order ASC
    `;

    const images = await isanzureQuery(query, [propertyUid]);

    console.log(`✅ getPropertyImages(${propertyUid}): ${images.length} images`);

    res.status(200).json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('❌ Error in getPropertyImages:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 11. Get property amenities
exports.getPropertyAmenities = async (req, res) => {
  try {
    const { propertyUid } = req.params;

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required'
      });
    }

    const query = `
      SELECT 
        pa.*
      FROM property_amenity_junction paj
      JOIN property_amenities pa ON paj.amenity_id = pa.id
      JOIN properties p ON paj.property_id = p.id
      WHERE p.property_uid = ?
        AND p.status = 'active'
      ORDER BY pa.category, pa.amenity_name
    `;

    const amenities = await isanzureQuery(query, [propertyUid]);

    console.log(`✅ getPropertyAmenities(${propertyUid}): ${amenities.length} amenities`);

    res.status(200).json({
      success: true,
      data: amenities
    });
  } catch (error) {
    console.error('❌ Error in getPropertyAmenities:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 12. Get landlord info with SSO integration
exports.getLandlordInfo = async (req, res) => {
  const startTime = Date.now();
  const { landlordId } = req.params;

  debugLog(`=== START getLandlordInfo(${landlordId}) ===`);

  if (!landlordId) {
    debugLog('Landlord ID is missing');
    return res.status(400).json({
      success: false,
      message: 'Landlord ID is required'
    });
  }

  try {
    // First try by numeric ID
    let query = `
      SELECT 
        u.*,
        COUNT(DISTINCT p.id) as total_properties,
        COUNT(DISTINCT CASE WHEN p.is_verified = 1 THEN p.id END) as verified_properties,
        COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_properties,
        COUNT(DISTINCT CASE WHEN p.is_featured = 1 THEN p.id END) as featured_properties
      FROM users u
      LEFT JOIN properties p ON u.id = p.landlord_id
      WHERE u.id = ?
        AND u.is_active = 1
      GROUP BY u.id
      LIMIT 1
    `;

    debugLog('Executing landlord query by ID:', { query, params: [landlordId] });
    let landlords = await isanzureQuery(query, [landlordId]);

    // If not found by numeric ID, try by user_uid
    if (landlords.length === 0) {
      debugLog('Not found by numeric ID, trying by user_uid...');
      query = `
        SELECT 
          u.*,
          COUNT(DISTINCT p.id) as total_properties,
          COUNT(DISTINCT CASE WHEN p.is_verified = 1 THEN p.id END) as verified_properties,
          COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_properties,
          COUNT(DISTINCT CASE WHEN p.is_featured = 1 THEN p.id END) as featured_properties
        FROM users u
        LEFT JOIN properties p ON u.id = p.landlord_id
        WHERE u.user_uid = ?
          AND u.is_active = 1
        GROUP BY u.id
        LIMIT 1
      `;

      landlords = await isanzureQuery(query, [landlordId]);
    }

    debugLog(`Landlord query returned ${landlords.length} results`);

    if (landlords.length === 0) {
      debugLog('No landlord found with the given identifier');
      return res.status(404).json({
        success: false,
        message: 'Landlord not found'
      });
    }

    const landlord = landlords[0];
    debugLog('Raw landlord data from database:', {
      id: landlord.id,
      user_uid: landlord.user_uid,
      user_type: landlord.user_type,
      oliviuus_user_id: landlord.oliviuus_user_id,
      id_verified: landlord.id_verified,
      verification_status: landlord.verification_status,
      public_phone: landlord.public_phone,
      public_email: landlord.public_email
    });

    // Rest of the getLandlordInfo function remains the same...
    // ... [keep the existing SSO fetch, properties fetch, and response preparation]

  } catch (error) {
    debugLog('ERROR in getLandlordInfo:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Test endpoint to debug database connections
exports.testDatabaseConnections = async (req, res) => {
  try {
    debugLog('Testing database connections...');

    // Test isanzure_db connection
    debugLog('Testing isanzure_db connection...');
    const isanzureTest = await isanzureQuery('SELECT 1 as test');
    debugLog('isanzure_db test result:', isanzureTest);

    // Test oliviuus_db connection
    debugLog('Testing oliviuus_db connection...');
    try {
      const oliviuusTest = await oliviuusQuery('SELECT 1 as test');
      debugLog('oliviuus_db test result:', oliviuusTest);
    } catch (oliviuusError) {
      debugLog('oliviuus_db connection FAILED:', oliviuusError.message);
    }

    // Test sample data from both databases
    debugLog('Testing sample data queries...');

    // Get a sample landlord from isanzure_db
    const sampleLandlord = await isanzureQuery(`
      SELECT id, oliviuus_user_id, user_type 
      FROM users 
      WHERE user_type = 'landlord' 
      LIMIT 1
    `);

    debugLog('Sample landlord from isanzure_db:', sampleLandlord);

    if (sampleLandlord.length > 0 && sampleLandlord[0].oliviuus_user_id) {
      // Try to get SSO data
      const ssoData = await fetchSsoProfile(sampleLandlord[0].oliviuus_user_id);
      debugLog('SSO data for sample landlord:', ssoData);
    }

    res.status(200).json({
      success: true,
      message: 'Database connection test completed',
      results: {
        isanzure_db: 'Connected',
        oliviuus_db: 'Test attempted',
        sample_landlord: sampleLandlord[0] || 'No landlords found'
      }
    });

  } catch (error) {
    debugLog('ERROR in testDatabaseConnections:', error.message);
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
};


// 13. Get property rooms
exports.getPropertyRooms = async (req, res) => {
  try {
    const { propertyUid } = req.params;

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required'
      });
    }

    const query = `
      SELECT 
        prm.*
      FROM property_rooms prm
      JOIN properties p ON prm.property_id = p.id
      WHERE p.property_uid = ?
        AND p.status = 'active'
      ORDER BY prm.room_type, prm.count DESC
    `;

    const rooms = await isanzureQuery(query, [propertyUid]);

    console.log(`✅ getPropertyRooms(${propertyUid}): ${rooms.length} rooms`);

    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('❌ Error in getPropertyRooms:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 14. Get property equipment
exports.getPropertyEquipment = async (req, res) => {
  try {
    const { propertyUid } = req.params;

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required'
      });
    }

    const query = `
      SELECT 
        pe.*
      FROM property_equipment pe
      JOIN properties p ON pe.property_id = p.id
      WHERE p.property_uid = ?
        AND p.status = 'active'
      ORDER BY pe.equipment_type, pe.count DESC
    `;

    const equipment = await isanzureQuery(query, [propertyUid]);

    console.log(`✅ getPropertyEquipment(${propertyUid}): ${equipment.length} equipment`);

    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('❌ Error in getPropertyEquipment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 15. Get nearby attractions
exports.getPropertyNearbyAttractions = async (req, res) => {
  try {
    const { propertyUid } = req.params;

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required'
      });
    }

    const query = `
      SELECT 
        pna.*
      FROM property_nearby_attractions pna
      JOIN properties p ON pna.property_id = p.id
      WHERE p.property_uid = ?
        AND p.status = 'active'
      ORDER BY pna.distance_km ASC
    `;

    const attractions = await isanzureQuery(query, [propertyUid]);

    console.log(`✅ getPropertyNearbyAttractions(${propertyUid}): ${attractions.length} attractions`);

    res.status(200).json({
      success: true,
      data: attractions
    });
  } catch (error) {
    console.error('❌ Error in getPropertyNearbyAttractions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 16. Get host profile by UID or ID
exports.getHostProfile = async (req, res) => {
  const startTime = Date.now();
  const { hostUid } = req.params;

  debugLog(`=== START getHostProfile(${hostUid}) ===`);

  if (!hostUid) {
    debugLog('Host UID is missing');
    return res.status(400).json({
      success: false,
      message: 'Host UID is required'
    });
  }

  try {
    // First, try to find user by user_uid (UUID)
    debugLog('Looking for host by user_uid:', hostUid);

    const query = `
      SELECT 
        u.*,
        COUNT(DISTINCT p.id) as total_properties,
        COUNT(DISTINCT CASE WHEN p.is_verified = 1 THEN p.id END) as verified_properties,
        COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_properties,
        COUNT(DISTINCT CASE WHEN p.is_featured = 1 THEN p.id END) as featured_properties
      FROM users u
      LEFT JOIN properties p ON u.id = p.landlord_id
      WHERE u.user_uid = ?
        AND u.is_active = 1
      GROUP BY u.id
      LIMIT 1
    `;

    debugLog('Executing host query:', { query, params: [hostUid] });
    const users = await isanzureQuery(query, [hostUid]);

    debugLog(`Host query returned ${users.length} results`);

    if (users.length === 0) {
      debugLog('No host found with the given UUID, trying by ID...');

      // If not found by UUID, try by numeric ID (for backward compatibility)
      const isNumeric = /^\d+$/.test(hostUid);
      if (isNumeric) {
        const numericQuery = `
          SELECT 
            u.*,
            COUNT(DISTINCT p.id) as total_properties,
            COUNT(DISTINCT CASE WHEN p.is_verified = 1 THEN p.id END) as verified_properties,
            COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_properties,
            COUNT(DISTINCT CASE WHEN p.is_featured = 1 THEN p.id END) as featured_properties
          FROM users u
          LEFT JOIN properties p ON u.id = p.landlord_id
          WHERE u.id = ?
            AND u.is_active = 1
          GROUP BY u.id
          LIMIT 1
        `;

        const numericUsers = await isanzureQuery(numericQuery, [hostUid]);

        if (numericUsers.length === 0) {
          debugLog('No host found with numeric ID either');
          return res.status(404).json({
            success: false,
            message: 'Host not found'
          });
        }

        debugLog('Found host by numeric ID');
        var host = numericUsers[0];
      } else {
        return res.status(404).json({
          success: false,
          message: 'Host not found'
        });
      }
    } else {
      debugLog('Found host by UUID');
      var host = users[0];
    }

    debugLog('Raw host data from database:', {
      id: host.id,
      user_uid: host.user_uid,
      user_type: host.user_type,
      oliviuus_user_id: host.oliviuus_user_id,
      id_verified: host.id_verified,
      verification_status: host.verification_status,
      public_phone: host.public_phone,
      public_email: host.public_email,
      preferred_contact_methods: host.preferred_contact_methods
    });

    // Get SSO profile
    let ssoProfile = null;
    if (host.oliviuus_user_id) {
      debugLog(`Fetching SSO profile for oliviuus_user_id: ${host.oliviuus_user_id}`);
      ssoProfile = await fetchSsoProfile(host.oliviuus_user_id);
      if (ssoProfile) {
        debugLog('SSO profile found:', {
          first_name: ssoProfile.first_name,
          last_name: ssoProfile.last_name,
          has_avatar: !!ssoProfile.profile_avatar_url
        });
      }
    } else {
      debugLog('No oliviuus_user_id found for this host');
    }

    // Parse preferred contact methods JSON
    let preferredContacts = ['whatsapp', 'phone', 'email'];
    if (host.preferred_contact_methods) {
      try {
        preferredContacts = JSON.parse(host.preferred_contact_methods);
        debugLog('Parsed preferred contacts:', preferredContacts);
      } catch (e) {
        debugLog('Failed to parse preferred_contact_methods:', e.message);
      }
    }

    // Get host's active properties
    debugLog('Fetching host properties...');
    const propertiesQuery = `
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
    p.area,
    p.max_guests,
    p.total_rooms,
    p.is_featured,
    p.is_verified,
    p.status,
    p.created_at,
    p.updated_at,
    COALESCE(pp.monthly_price, 0) as monthly_price,
    COALESCE(pp.weekly_price, 0) as weekly_price,
    COALESCE(pp.daily_price, 0) as daily_price,
    COALESCE(pp.nightly_price, 0) as nightly_price,
    pp.accept_monthly, 
    pp.accept_weekly,    
    pp.accept_daily,   
    pp.accept_nightly, 
    (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
    (SELECT COUNT(*) FROM property_images pi2 WHERE pi2.property_id = p.id) as image_count,
    (SELECT COUNT(*) FROM property_amenity_junction paj WHERE paj.property_id = p.id) as amenity_count
  FROM properties p
  LEFT JOIN property_pricing pp ON p.id = pp.property_id
  WHERE p.landlord_id = ?
    AND p.status = 'active'
  ORDER BY p.is_featured DESC, p.created_at DESC
  LIMIT 20
`;

    const properties = await isanzureQuery(propertiesQuery, [host.id]);
    debugLog(`Found ${properties.length} properties for host`);

    // Check verification status
    const isVerified = host.id_verified === 1 || host.verification_status === 'approved';
    debugLog('Verification status:', {
      id_verified: host.id_verified,
      verification_status: host.verification_status,
      is_verified: isVerified
    });

    // Prepare response data
    const responseData = {
      // Core host info
      id: host.id,
      user_uid: host.user_uid,
      user_type: host.user_type,

      // Verification info
      is_verified: isVerified,
      verification_status: host.verification_status,
      id_verified: host.id_verified,

      // Contact info (use public contacts first, fallback to SSO)
      public_phone: host.public_phone || (ssoProfile ? ssoProfile.phone : null),
      public_email: host.public_email || (ssoProfile ? ssoProfile.email : null),
      preferred_contact_methods: preferredContacts,

      // Profile info from SSO
      sso_profile: ssoProfile ? {
        first_name: ssoProfile.first_name,
        last_name: ssoProfile.last_name,
        full_name: ssoProfile.first_name && ssoProfile.last_name
          ? `${ssoProfile.first_name} ${ssoProfile.last_name}`
          : ssoProfile.first_name || ssoProfile.username || 'Host',
        username: ssoProfile.username,
        profile_avatar_url: ssoProfile.profile_avatar_url,
        email: ssoProfile.email,
        phone: ssoProfile.phone
      } : null,

      // Stats
      stats: {
        total_properties: host.total_properties || properties.length || 0,
        verified_properties: host.verified_properties || 0,
        active_properties: host.active_properties || properties.length || 0,
        featured_properties: host.featured_properties || 0
      },

      // Properties
      properties: properties || [],

      // Metadata
      member_since: host.created_at,

      // Debug info (remove in production)
      _debug: {
        query_execution_time: `${Date.now() - startTime}ms`,
        found_by: users.length > 0 ? 'UUID' : 'numeric ID'
      }
    };

    debugLog('Final response data prepared:', {
      host_name: responseData.sso_profile?.full_name || 'Unknown',
      is_verified: responseData.is_verified,
      total_properties: responseData.stats.total_properties,
      has_sso_profile: !!responseData.sso_profile,
      has_contact_info: !!(responseData.public_phone || responseData.public_email)
    });

    const endTime = Date.now();
    debugLog(`=== END getHostProfile(${hostUid}) - ${endTime - startTime}ms ===`);

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    debugLog('ERROR in getHostProfile:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 17. Get SSO user profile (public endpoint)
exports.getSsoUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user exists in isanzure_db first
    const isanzureQueryCheck = `
      SELECT user_uid, user_type, id_verified
      FROM users 
      WHERE oliviuus_user_id = ? 
      LIMIT 1
    `;

    const isanzureUser = await isanzureQuery(isanzureQueryCheck, [userId]);

    if (isanzureUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure'
      });
    }

    // Get detailed profile from oliviuus_db
    const ssoProfile = await fetchSsoProfile(userId);

    if (!ssoProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found in SSO system'
      });
    }

    const isanzureData = isanzureUser[0];

    // Combine data
    const responseData = {
      id: ssoProfile.id,
      user_uid: isanzureData.user_uid,
      first_name: ssoProfile.first_name,
      last_name: ssoProfile.last_name,
      full_name: ssoProfile.first_name && ssoProfile.last_name
        ? `${ssoProfile.first_name} ${ssoProfile.last_name}`
        : ssoProfile.first_name || ssoProfile.username,
      username: ssoProfile.username,
      email: ssoProfile.email,
      phone: ssoProfile.phone,
      profile_avatar_url: ssoProfile.profile_avatar_url,
      user_type: isanzureData.user_type,
      is_verified: isanzureData.id_verified === 1,
      isanzure_user_since: isanzureData.created_at,
      sso_member_since: ssoProfile.created_at
    };

    console.log(`✅ getSsoUserProfile(${userId}): Found user profile`);

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error in getSsoUserProfile:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 18. Get landlord properties with details
exports.getLandlordProperties = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!landlordId) {
      return res.status(400).json({
        success: false,
        message: 'Landlord ID is required'
      });
    }

    // First, verify landlord exists
    const landlordCheck = `
      SELECT id, user_uid FROM users 
      WHERE (id = ? OR user_uid = ?) 
        AND is_active = 1
      LIMIT 1
    `;

    const landlord = await isanzureQuery(landlordCheck, [landlordId, landlordId]);

    if (landlord.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Landlord not found'
      });
    }

    const actualLandlordId = landlord[0].id;

    const query = `
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
        p.area,
        p.max_guests,
        p.total_rooms,
        p.is_featured,
        p.is_verified,
        p.status,
        p.created_at,
        p.updated_at,
        COALESCE(pp.monthly_price, 0) as monthly_price,
        COALESCE(pp.weekly_price, 0) as weekly_price,
        COALESCE(pp.daily_price, 0) as daily_price,
        COALESCE(pp.nightly_price, 0) as nightly_price,
        pp.accept_monthly,
        pp.accept_weekly,
        pp.accept_daily,
        pp.accept_nightly,
        (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image,
        (SELECT COUNT(*) FROM property_images pi2 WHERE pi2.property_id = p.id) as image_count
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.landlord_id = ?
        AND p.status = 'active'
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const properties = await isanzureQuery(query, [actualLandlordId, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM properties 
      WHERE landlord_id = ? 
        AND status = 'active'
    `;

    const countResult = await isanzureQuery(countQuery, [actualLandlordId]);
    const total = countResult[0]?.total || 0;

    console.log(`✅ getLandlordProperties(${landlordId}): ${properties.length} properties`);

    res.status(200).json({
      success: true,
      data: {
        properties: properties || [],
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + properties.length) < total
        },
        landlord: {
          id: landlord[0].id,
          user_uid: landlord[0].user_uid
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in getLandlordProperties:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};