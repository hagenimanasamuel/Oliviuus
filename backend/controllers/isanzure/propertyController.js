// backend/controllers/propertyController.js
const { isanzureQuery, isanzureDb } = require('../../config/isanzureDbConfig');
const { uploadMultipleBuffersToCloudinary, deleteFromCloudinary } = require('../../config/cloudinaryConfig');

// Helper function to safely parse JSON from FormData
const parseFormDataField = (field) => {
  if (!field) return null;
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      return field;
    }
  }
  return field;
};

// Helper function to process boolean values from FormData
const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === 'true' || value === '1';
  }
  return Boolean(value);
};

// Helper function to process number values
const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

// Helper function to process string values
const parseString = (value) => {
  return value ? String(value).trim() : '';
};

// 1. Create Property
exports.createProperty = async (req, res) => {
  const connection = await isanzureDb.promise().getConnection();
  let uploadedImages = [];

  try {
    await connection.beginTransaction();

    // Debug: Log what we're receiving
    console.log('Request body:', req.body);
    console.log('Files received:', req.files ? req.files.length : 0);

    // Parse FormData fields (they come as strings)
    const {
      // Step 1: Basic Info
      title,
      description,
      propertyType = 'ghetto',

      // Step 2: Location
      address,
      province,
      district,
      sector,
      cell,
      village,
      isibo,
      country = 'Rwanda',
      latitude,
      longitude,
      nearbyAttractions: nearbyAttractionsRaw,

      // Step 3: Details
      area,
      maxGuests = 2,
      amenities: amenitiesRaw,
      rooms: roomsRaw,
      equipment: equipmentRaw,

      // Step 4: Pricing
      monthlyPrice,
      weeklyPrice,
      dailyPrice,
      nightlyPrice,
      paymentTypes: paymentTypesRaw,
      maxAdvanceMonths = 3,
      maxSinglePaymentMonths = 6,
      utilitiesMin,
      utilitiesMax,

      // Step 5: Rules
      checkInTime = '14:00',
      checkOutTime = '11:00',
      cancellationPolicy = 'flexible',
      houseRules = '',
      smokingAllowed: smokingAllowedRaw,
      petsAllowed: petsAllowedRaw,
      eventsAllowed: eventsAllowedRaw,
      guestsAllowed: guestsAllowedRaw,
      latePaymentFee = 0,
      gracePeriodDays = 3,

      // User info
      landlordId,
    } = req.body;

    // Parse complex fields
    const nearbyAttractions = parseFormDataField(nearbyAttractionsRaw) || [];
    const amenities = parseFormDataField(amenitiesRaw) || [];
    const rooms = parseFormDataField(roomsRaw) || {};
    const equipment = parseFormDataField(equipmentRaw) || {};
    const paymentTypes = parseFormDataField(paymentTypesRaw) || ['monthly'];
    const smokingAllowed = parseBoolean(smokingAllowedRaw);
    const petsAllowed = parseBoolean(petsAllowedRaw);
    const eventsAllowed = parseBoolean(eventsAllowedRaw);
    const guestsAllowed = parseBoolean(guestsAllowedRaw);

    // Validate required fields
    const requiredFields = { title, description, address, monthlyPrice, landlordId };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields,
        details: `${missingFields.join(', ')} are required`
      });
    }

    // Validate images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least 1 property image is required'
      });
    }

    if (req.files.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Minimum 3 property images are required',
        received: req.files.length
      });
    }

    // Validate landlord exists and is a landlord
    const [userCheck] = await connection.query(
      'SELECT id, user_type FROM users WHERE id = ?',
      [landlordId]
    );

    if (!userCheck || userCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid landlord ID',
        details: `User with ID ${landlordId} not found`
      });
    }

    if (userCheck[0].user_type !== 'landlord') {
      return res.status(400).json({
        success: false,
        message: 'User is not registered as a landlord',
        userType: userCheck[0].user_type
      });
    }

    // 1. Upload images to Cloudinary
    try {
      uploadedImages = await uploadMultipleBuffersToCloudinary(req.files);
      console.log(`Uploaded ${uploadedImages.length} images to Cloudinary`);
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload images',
        error: uploadError.message
      });
    }

    // Calculate total rooms
    const totalRooms =
      (parseNumber(rooms.bedrooms) || 0) +
      (parseNumber(rooms.bathrooms) || 0) +
      (parseNumber(rooms.livingRooms) || 0) +
      (parseNumber(rooms.diningRooms) || 0) +
      (parseNumber(rooms.kitchen) || 0) +
      (parseNumber(rooms.storage) || 0) +
      (parseNumber(rooms.balcony) || 0) +
      (parseNumber(rooms.otherRooms) || 0);

    // Validate total rooms
    if (totalRooms < 1) {
      // Cleanup uploaded images
      if (uploadedImages.length > 0) {
        await Promise.allSettled(
          uploadedImages.map(img =>
            deleteFromCloudinary(img.public_id).catch(e => console.error('Cleanup error:', e))
          )
        );
      }

      return res.status(400).json({
        success: false,
        message: 'Property must have at least 1 room',
        totalRooms
      });
    }

    // 2. Insert into properties table
    const propertySql = `
      INSERT INTO properties (
        title, description, property_type,
        address, province, district, sector, cell, village, isibo, country, latitude, longitude,
        area, max_guests, total_rooms,
        landlord_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const propertyValues = [
      parseString(title),
      parseString(description),
      parseString(propertyType),
      parseString(address),
      parseString(province),
      parseString(district),
      parseString(sector),
      parseString(cell),
      parseString(village),
      parseString(isibo),
      parseString(country),
      parseNumber(latitude),
      parseNumber(longitude),
      parseNumber(area),
      parseNumber(maxGuests) || 2,
      totalRooms,
      parseNumber(landlordId),
      'active'  // Start as active
    ];

    const [propertyResult] = await connection.query(propertySql, propertyValues);
    const propertyId = propertyResult.insertId;

    // Get property UID
    const [property] = await connection.query(
      'SELECT property_uid FROM properties WHERE id = ?',
      [propertyId]
    );
    const propertyUid = property[0].property_uid;

    // 3. Insert property images
    const imageValues = uploadedImages.map((img, index) => [
      propertyId,
      img.url,
      img.public_id,
      img.original_filename || `property-image-${index + 1}`,
      img.bytes || 0,
      img.format || 'jpg',
      index === 0, // First image is cover
      index
    ]);

    const imageSql = `
      INSERT INTO property_images 
      (property_id, image_url, public_id, image_name, image_size, mime_type, is_cover, display_order)
      VALUES ?
    `;

    await connection.query(imageSql, [imageValues]);

    // 4. Insert amenities
    if (amenities && amenities.length > 0) {
      // Get amenity IDs
      const amenityPlaceholders = amenities.map(() => '?').join(',');
      const [amenityRows] = await connection.query(
        `SELECT id FROM property_amenities WHERE amenity_key IN (${amenityPlaceholders})`,
        amenities
      );

      if (amenityRows.length > 0) {
        const junctionValues = amenityRows.map(row => [propertyId, row.id]);
        const junctionSql = `
          INSERT INTO property_amenity_junction (property_id, amenity_id)
          VALUES ?
        `;
        await connection.query(junctionSql, [junctionValues]);
      }
    }

    // 5. Insert rooms
    const roomTypes = [
      { type: 'bedroom', count: parseNumber(rooms?.bedrooms) || 0 },
      { type: 'bathroom', count: parseNumber(rooms?.bathrooms) || 0 },
      { type: 'living_room', count: parseNumber(rooms?.livingRooms) || 0 },
      { type: 'dining_room', count: parseNumber(rooms?.diningRooms) || 0 },
      { type: 'kitchen', count: parseNumber(rooms?.kitchen) || 0 },
      { type: 'storage', count: parseNumber(rooms?.storage) || 0 },
      { type: 'balcony', count: parseNumber(rooms?.balcony) || 0 },
      { type: 'other', count: parseNumber(rooms?.otherRooms) || 0 },
    ];

    const roomValues = roomTypes
      .filter(room => room.count > 0)
      .map(room => [propertyId, room.type, room.count]);

    if (roomValues.length > 0) {
      const roomSql = `
        INSERT INTO property_rooms (property_id, room_type, count)
        VALUES ?
      `;
      await connection.query(roomSql, [roomValues]);
    }

    // 6. Insert equipment
    const equipmentTypes = [
      { type: 'beds', count: parseNumber(equipment?.beds) || 0 },
      { type: 'mattresses', count: parseNumber(equipment?.mattresses) || 0 },
      { type: 'sofas', count: parseNumber(equipment?.sofas) || 0 },
      { type: 'chairs', count: parseNumber(equipment?.chairs) || 0 },
      { type: 'tables', count: parseNumber(equipment?.tables) || 0 },
      { type: 'wardrobes', count: parseNumber(equipment?.wardrobes) || 0 },
      { type: 'shelves', count: parseNumber(equipment?.shelves) || 0 },
      { type: 'lamps', count: parseNumber(equipment?.lamps) || 0 },
      { type: 'curtains', count: parseNumber(equipment?.curtains) || 0 },
      { type: 'mirrors', count: parseNumber(equipment?.mirrors) || 0 },
    ];

    const equipmentValues = equipmentTypes
      .filter(eq => eq.count > 0)
      .map(eq => [propertyId, eq.type, eq.count]);

    if (equipmentValues.length > 0) {
      const equipmentSql = `
        INSERT INTO property_equipment (property_id, equipment_type, count)
        VALUES ?
      `;
      await connection.query(equipmentSql, [equipmentValues]);
    }

    // 7. Insert pricing
    const calculatedPrices = {
      quarterly: monthlyPrice ? Math.round(monthlyPrice * 3) : null,
      semester: monthlyPrice ? Math.round(monthlyPrice * 6) : null,
      yearly: monthlyPrice ? Math.round(monthlyPrice * 12) : null,
    };

    const pricingSql = `
  INSERT INTO property_pricing (
    property_id,
    monthly_price, weekly_price, daily_price, nightly_price,
    quarterly_price, semester_price, yearly_price,
    accept_monthly, accept_weekly, accept_daily, accept_nightly,
    accept_quarterly, accept_semester, accept_yearly,
    max_advance_months, max_single_payment_months,
    utilities_min, utilities_max,
    utilities_included,
    platform_commission_rate,
    currency_code
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

    const pricingValues = [
      propertyId,
      parseNumber(monthlyPrice),
      parseNumber(weeklyPrice),
      parseNumber(dailyPrice),
      parseNumber(nightlyPrice),
      calculatedPrices.quarterly,
      calculatedPrices.semester,
      calculatedPrices.yearly,
      paymentTypes.includes('monthly') ? 1 : 0,
      paymentTypes.includes('weekly') ? 1 : 0,
      paymentTypes.includes('daily') ? 1 : 0,
      paymentTypes.includes('nightly') ? 1 : 0,
      paymentTypes.includes('quarterly') ? 1 : 0,
      paymentTypes.includes('semester') ? 1 : 0,
      paymentTypes.includes('yearly') ? 1 : 0,
      parseNumber(maxAdvanceMonths) || 3,
      parseNumber(maxSinglePaymentMonths) || 6,
      parseNumber(utilitiesMin),
      parseNumber(utilitiesMax),
      0, // utilities_included - default to false
      10.00, // Default platform commission
      'RWF' // Default currency code
    ];

    await connection.query(pricingSql, pricingValues);

    // 8. Insert rules
    const rulesSql = `
      INSERT INTO property_rules (
        property_id,
        check_in_time, check_out_time,
        cancellation_policy,
        smoking_allowed, pets_allowed, events_allowed, guests_allowed,
        late_payment_fee, grace_period_days,
        house_rules
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const rulesValues = [
      propertyId,
      parseString(checkInTime),
      parseString(checkOutTime),
      parseString(cancellationPolicy),
      smokingAllowed ? 1 : 0,
      petsAllowed ? 1 : 0,
      eventsAllowed ? 1 : 0,
      guestsAllowed ? 1 : 0,
      parseNumber(latePaymentFee) || 0,
      parseNumber(gracePeriodDays) || 3,
      parseString(houseRules)
    ];

    await connection.query(rulesSql, rulesValues);

    // 9. Insert nearby attractions
    if (nearbyAttractions && nearbyAttractions.length > 0) {
      const attractionValues = nearbyAttractions
        .filter(attraction => attraction && attraction.trim())
        .map(attraction => [
          propertyId,
          parseString(attraction),
          'landmark'
        ]);

      if (attractionValues.length > 0) {
        const attractionSql = `
          INSERT INTO property_nearby_attractions (property_id, attraction_name, attraction_type)
          VALUES ?
        `;

        await connection.query(attractionSql, [attractionValues]);
      }
    }

    await connection.commit();

    // Fetch complete property data
    const propertyQuery = `
  SELECT 
    p.*,
    pp.*,
    pr.*,
    CONCAT(
      '[',
      GROUP_CONCAT(
        DISTINCT CONCAT(
          '{"url":"', COALESCE(pi.image_url, ''), '",',
          '"isCover":', pi.is_cover, ',',
          '"publicId":"', COALESCE(pi.public_id, ''), '",',
          '"displayOrder":', COALESCE(pi.display_order, 0), '}'
        )
      ),
      ']'
    ) as images,
    CONCAT(
      '[',
      GROUP_CONCAT(
        DISTINCT CONCAT('"', COALESCE(pa.amenity_name, ''), '"')
      ),
      ']'
    ) as amenities
  FROM properties p
  LEFT JOIN property_pricing pp ON p.id = pp.property_id
  LEFT JOIN property_rules pr ON p.id = pr.property_id
  LEFT JOIN property_images pi ON p.id = pi.property_id
  LEFT JOIN property_amenity_junction paj ON p.id = paj.property_id
  LEFT JOIN property_amenities pa ON paj.amenity_id = pa.id
  WHERE p.id = ?
  GROUP BY p.id
`;

    const [completeProperty] = await connection.query(propertyQuery, [propertyId]);

    // Parse JSON fields
    const parsedProperty = completeProperty[0] ? {
      ...completeProperty[0],
      images: parseFormDataField(completeProperty[0].images) || [],
      amenities: parseFormDataField(completeProperty[0].amenities) || [],
    } : null;

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      propertyId: propertyId,
      propertyUid: propertyUid,
      data: parsedProperty
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating property:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlState: error.sqlState
    });

    // Cleanup uploaded images if error occurred
    if (uploadedImages && uploadedImages.length > 0) {
      try {
        const deletePromises = uploadedImages.map(img =>
          deleteFromCloudinary(img.public_id).catch(e =>
            console.error('Failed to delete image from Cloudinary:', e)
          )
        );
        await Promise.allSettled(deletePromises);
      } catch (cleanupError) {
        console.error('Error cleaning up Cloudinary images:', cleanupError);
      }
    }

    let errorMessage = 'Failed to create property';
    let statusCode = 500;

    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Referenced user does not exist in the database';
      statusCode = 400;
    } else if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Duplicate entry detected';
      statusCode = 400;
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Data too long for one or more fields';
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlState: error.sqlState
      } : undefined
    });
  } finally {
    connection.release();
  }
};

// 2. Get All Properties
exports.getAllProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'active', propertyType, province } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id, p.property_uid, p.title, p.property_type,
        p.address, p.province, p.district, p.sector,
        p.area, p.max_guests, p.total_rooms,
        p.status, p.created_at,
        pp.monthly_price,
        (SELECT pi.image_url FROM property_images pi 
         WHERE pi.property_id = p.id AND pi.is_cover = TRUE LIMIT 1) as cover_image,
        (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) as image_count
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.status = ?
    `;

    const queryParams = [status];

    if (propertyType) {
      query += ' AND p.property_type = ?';
      queryParams.push(propertyType);
    }

    if (province) {
      query += ' AND p.province = ?';
      queryParams.push(province);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    const properties = await isanzureQuery(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM properties WHERE status = ?';
    const countParams = [status];

    if (propertyType) {
      countQuery += ' AND property_type = ?';
      countParams.push(propertyType);
    }

    if (province) {
      countQuery += ' AND province = ?';
      countParams.push(province);
    }

    const [countResult] = await isanzureQuery(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 3. Get Complete Property by UID - FIXED VERSION
exports.getCompletePropertyByUid = async (req, res) => {
  let connection;
  try {
    const { propertyUid } = req.params;

    console.log('🔍 Fetching complete property with UID:', propertyUid);

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required'
      });
    }

    // Get connection
    connection = await isanzureDb.promise().getConnection();

    // 1. Get the property ID from the property_uid
    const [propertyIdResult] = await connection.query(
      'SELECT id FROM properties WHERE property_uid = ? AND status != "deleted"',
      [propertyUid]
    );

    if (!propertyIdResult || propertyIdResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const propertyId = propertyIdResult[0].id;

    // 2. Fetch basic property data with landlord info
    const [propertyData] = await connection.query(`
      SELECT 
        p.*,
        u.user_type as landlord_type,
        CONCAT('LL-', u.oliviuus_user_id) as landlord_code
      FROM properties p
      LEFT JOIN users u ON p.landlord_id = u.id
      WHERE p.id = ? AND p.status != 'deleted'
    `, [propertyId]);

    if (!propertyData || propertyData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property data not found'
      });
    }

    const property = propertyData[0];

    // 3. Fetch all related data in parallel
    const [
      pricingData,
      rulesData,
      imagesData,
      amenitiesData,
      roomsData,
      equipmentData,
      attractionsData
    ] = await Promise.all([
      // Pricing
      connection.query('SELECT * FROM property_pricing WHERE property_id = ?', [propertyId]),
      // Rules
      connection.query('SELECT * FROM property_rules WHERE property_id = ?', [propertyId]),
      // Images
      connection.query(`
        SELECT 
          id, image_uid, image_url, cloudinary_public_id, public_id,
          image_name, image_size, mime_type, is_cover, display_order, uploaded_at
        FROM property_images 
        WHERE property_id = ?
        ORDER BY is_cover DESC, display_order, uploaded_at
      `, [propertyId]),
      // Amenities
      connection.query(`
        SELECT 
          pa.id, pa.amenity_key as \`key\`, pa.amenity_name as name,
          pa.category, pa.icon_class as iconClass
        FROM property_amenity_junction paj
        INNER JOIN property_amenities pa ON paj.amenity_id = pa.id
        WHERE paj.property_id = ?
        ORDER BY pa.category, pa.amenity_name
      `, [propertyId]),
      // Rooms
      connection.query(`
        SELECT 
          id, room_uid, room_type as type, count, description
        FROM property_rooms 
        WHERE property_id = ?
        ORDER BY 
          CASE room_type
            WHEN 'bedroom' THEN 1
            WHEN 'bathroom' THEN 2
            WHEN 'living_room' THEN 3
            WHEN 'dining_room' THEN 4
            WHEN 'kitchen' THEN 5
            WHEN 'storage' THEN 6
            WHEN 'balcony' THEN 7
            WHEN 'other' THEN 8
            ELSE 9
          END
      `, [propertyId]),
      // Equipment
      connection.query(`
        SELECT 
          id, equipment_uid, equipment_type as type, count, description
        FROM property_equipment 
        WHERE property_id = ?
        ORDER BY 
          CASE equipment_type
            WHEN 'beds' THEN 1
            WHEN 'mattresses' THEN 2
            WHEN 'sofas' THEN 3
            WHEN 'chairs' THEN 4
            WHEN 'tables' THEN 5
            WHEN 'wardrobes' THEN 6
            WHEN 'shelves' THEN 7
            WHEN 'lamps' THEN 8
            WHEN 'curtains' THEN 9
            WHEN 'mirrors' THEN 10
            ELSE 11
          END
      `, [propertyId]),
      // Nearby attractions
      connection.query(`
        SELECT 
          id, attraction_uid, attraction_name as name,
          attraction_type as type, distance_km as distance, description
        FROM property_nearby_attractions 
        WHERE property_id = ?
        ORDER BY distance_km
      `, [propertyId])
    ]);

    // 4. Format the complete response
    const formattedProperty = {
      // Basic property info
      id: property.id,
      property_uid: property.property_uid,
      title: property.title,
      description: property.description,
      property_type: property.property_type,

      // Location
      address: property.address,
      province: property.province,
      district: property.district,
      sector: property.sector,
      cell: property.cell,
      village: property.village,
      isibo: property.isibo,
      country: property.country,
      latitude: property.latitude,
      longitude: property.longitude,

      // Details
      area: property.area,
      max_guests: property.max_guests,
      total_rooms: property.total_rooms,

      // Status & Ownership
      landlord_id: property.landlord_id,
      landlord_type: property.landlord_type,
      landlord_code: property.landlord_code,
      status: property.status,
      is_featured: Boolean(property.is_featured),
      is_verified: Boolean(property.is_verified),
      verification_status: property.verification_status,

      // Timestamps
      created_at: property.created_at,
      updated_at: property.updated_at,
      published_at: property.published_at,
      verified_at: property.verified_at,

      // Pricing (all fields)
      pricing: pricingData[0] && pricingData[0][0] ? {
        monthly_price: pricingData[0][0].monthly_price,
        weekly_price: pricingData[0][0].weekly_price,
        daily_price: pricingData[0][0].daily_price,
        nightly_price: pricingData[0][0].nightly_price,
        quarterly_price: pricingData[0][0].quarterly_price,
        semester_price: pricingData[0][0].semester_price,
        yearly_price: pricingData[0][0].yearly_price,
        accept_monthly: Boolean(pricingData[0][0].accept_monthly),
        accept_weekly: Boolean(pricingData[0][0].accept_weekly),
        accept_daily: Boolean(pricingData[0][0].accept_daily),
        accept_nightly: Boolean(pricingData[0][0].accept_nightly),
        accept_quarterly: Boolean(pricingData[0][0].accept_quarterly),
        accept_semester: Boolean(pricingData[0][0].accept_semester),
        accept_yearly: Boolean(pricingData[0][0].accept_yearly),
        max_advance_months: pricingData[0][0].max_advance_months,
        max_single_payment_months: pricingData[0][0].max_single_payment_months,
        utilities_min: pricingData[0][0].utilities_min,
        utilities_max: pricingData[0][0].utilities_max,
        utilities_included: Boolean(pricingData[0][0].utilities_included),
        platform_commission_rate: pricingData[0][0].platform_commission_rate,
        currency_code: pricingData[0][0].currency_code
      } : null,

      // Rules (all fields)
      rules: rulesData[0] && rulesData[0][0] ? {
        check_in_time: rulesData[0][0].check_in_time || '14:00',
        check_out_time: rulesData[0][0].check_out_time || '11:00',
        cancellation_policy: rulesData[0][0].cancellation_policy || 'flexible',
        smoking_allowed: Boolean(rulesData[0][0].smoking_allowed),
        pets_allowed: Boolean(rulesData[0][0].pets_allowed),
        events_allowed: Boolean(rulesData[0][0].events_allowed),
        guests_allowed: Boolean(rulesData[0][0].guests_allowed),
        late_payment_fee: rulesData[0][0].late_payment_fee,
        grace_period_days: rulesData[0][0].grace_period_days,
        house_rules: rulesData[0][0].house_rules || ''
      } : null,

      // Related data arrays
      images: imagesData[0] ? imagesData[0].map(img => ({
        id: img.id,
        image_uid: img.image_uid,
        url: img.image_url,
        cloudinary_public_id: img.cloudinary_public_id,
        public_id: img.public_id,
        imageName: img.image_name,
        imageSize: img.image_size,
        mimeType: img.mime_type,
        isCover: Boolean(img.is_cover),
        displayOrder: img.display_order,
        uploadedAt: img.uploaded_at
      })) : [],

      amenities: amenitiesData[0] || [],
      rooms: roomsData[0] || [],
      equipment: equipmentData[0] || [],
      nearby_attractions: attractionsData[0] || []
    };

    // 5. Find and set cover image
    const coverImage = formattedProperty.images.find(img => img.isCover);
    formattedProperty.cover_image = coverImage ? coverImage.url :
      (formattedProperty.images.length > 0 ? formattedProperty.images[0].url : null);

    // 6. Format time strings
    const formatTimeString = (timeValue) => {
      if (!timeValue) return '14:00';
      if (typeof timeValue === 'object' && timeValue.constructor.name === 'Time') {
        return timeValue.toISOString().split('T')[1].slice(0, 5);
      }
      const str = String(timeValue);
      const match = str.match(/(\d{1,2}):(\d{2})/);
      return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '14:00';
    };

    if (formattedProperty.rules) {
      formattedProperty.rules.check_in_time = formatTimeString(formattedProperty.rules.check_in_time);
      formattedProperty.rules.check_out_time = formatTimeString(formattedProperty.rules.check_out_time);
    }

    console.log(`✅ Complete property data loaded for "${formattedProperty.title}"`);
    console.log(`   - Images: ${formattedProperty.images.length}`);
    console.log(`   - Amenities: ${formattedProperty.amenities.length}`);
    console.log(`   - Rooms: ${formattedProperty.rooms.length}`);
    console.log(`   - Equipment: ${formattedProperty.equipment.length}`);
    console.log(`   - Nearby Attractions: ${formattedProperty.nearby_attractions.length}`);

    res.status(200).json({
      success: true,
      data: formattedProperty
    });

  } catch (error) {
    console.error('❌ ERROR in getCompletePropertyByUid:', error);
    console.error('Stack trace:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch complete property details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// 4. Get Properties by Landlord
exports.getPropertiesByLandlord = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT 
        p.id, p.property_uid, p.title, p.property_type,
        p.address, p.province, p.district,
        p.status, p.created_at, p.published_at,
        pp.monthly_price,
        (SELECT pi.image_url FROM property_images pi 
         WHERE pi.property_id = p.id AND pi.is_cover = TRUE LIMIT 1) as cover_image,
        (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) as image_count
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.landlord_id = ?
    `;

    const queryParams = [landlordId];

    if (status) {
      query += ' AND p.status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const properties = await isanzureQuery(query, queryParams);

    res.status(200).json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Error fetching landlord properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 5. Update Property - COMPREHENSIVE VERSION
exports.updateProperty = async (req, res) => {
  const connection = await isanzureDb.promise().getConnection();
  let uploadedImages = [];

  try {
    await connection.beginTransaction();

    const { propertyUid } = req.params;
    const updateData = req.body;

    console.log('🔄 Updating property:', propertyUid);
    console.log('Update data received:', updateData);

    // 1. Get property and check if it can be edited
    const [propertyResult] = await connection.query(
      'SELECT id, status, landlord_id FROM properties WHERE property_uid = ?',
      [propertyUid]
    );

    if (!propertyResult || propertyResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const propertyId = propertyResult[0].id;
    const currentStatus = propertyResult[0].status;
    const landlordId = propertyResult[0].landlord_id;

    // Check if property is rented
    if (currentStatus === 'rented') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a rented property. Please end the tenancy first.'
      });
    }

    // Verify ownership (if landlordId is provided in update data)
    if (updateData.landlordId && parseInt(updateData.landlordId) !== landlordId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this property'
      });
    }

    // 2. Handle image uploads if any
    if (req.files && req.files.length > 0) {
      console.log(`📸 Processing ${req.files.length} new images`);

      // Check total images won't exceed 10
      const [currentImages] = await connection.query(
        'SELECT COUNT(*) as count FROM property_images WHERE property_id = ?',
        [propertyId]
      );

      const currentImageCount = currentImages[0].count;
      const totalImagesAfterUpload = currentImageCount + req.files.length;

      if (totalImagesAfterUpload > 10) {
        return res.status(400).json({
          success: false,
          message: `Maximum 10 images allowed. Currently have ${currentImageCount} images, cannot add ${req.files.length} more.`,
          currentCount: currentImageCount,
          maxAllowed: 10
        });
      }

      // Upload new images
      uploadedImages = await uploadMultipleBuffersToCloudinary(req.files);
      console.log(`✅ Uploaded ${uploadedImages.length} images to Cloudinary`);

      const imageValues = uploadedImages.map((img, index) => [
        propertyId,
        img.url,
        img.public_id,
        img.original_filename || `property-image-${Date.now()}-${index}`,
        img.bytes || 0,
        img.format || 'jpg',
        false, // Not cover by default
        currentImageCount + index // Display order
      ]);

      const imageSql = `
        INSERT INTO property_images 
        (property_id, image_url, public_id, image_name, image_size, mime_type, is_cover, display_order)
        VALUES ?
      `;

      await connection.query(imageSql, [imageValues]);
    }

    // 3. Parse update data sections
    const {
      // Basic Info
      title,
      description,
      propertyType,
      status,

      // Location
      address,
      province,
      district,
      sector,
      cell,
      village,
      isibo,
      country,
      latitude,
      longitude,

      // Details
      area,
      maxGuests,

      // Rooms
      rooms: roomsRaw,

      // Equipment
      equipment: equipmentRaw,

      // Amenities
      amenities: amenitiesRaw,

      // Pricing
      monthlyPrice,
      weeklyPrice,
      dailyPrice,
      nightlyPrice,
      paymentTypes: paymentTypesRaw,
      maxAdvanceMonths,
      maxSinglePaymentMonths,
      utilitiesMin,
      utilitiesMax,
      utilitiesIncluded,

      // Rules
      checkInTime,
      checkOutTime,
      cancellationPolicy,
      houseRules,
      smokingAllowed: smokingAllowedRaw,
      petsAllowed: petsAllowedRaw,
      eventsAllowed: eventsAllowedRaw,
      guestsAllowed: guestsAllowedRaw,
      latePaymentFee,
      gracePeriodDays,

      // Nearby attractions
      nearbyAttractions: nearbyAttractionsRaw
    } = updateData;

    // 4. Update basic property info
    if (title || description || propertyType || status ||
      address || province || district || sector || area || maxGuests) {

      const updateFields = [];
      const updateValues = [];

      const fieldsMapping = {
        title: { field: 'title', parser: parseString },
        description: { field: 'description', parser: parseString },
        propertyType: { field: 'property_type', parser: parseString },
        status: { field: 'status', parser: parseString },
        address: { field: 'address', parser: parseString },
        province: { field: 'province', parser: parseString },
        district: { field: 'district', parser: parseString },
        sector: { field: 'sector', parser: parseString },
        cell: { field: 'cell', parser: parseString },
        village: { field: 'village', parser: parseString },
        isibo: { field: 'isibo', parser: parseString },
        country: { field: 'country', parser: parseString },
        latitude: { field: 'latitude', parser: parseNumber },
        longitude: { field: 'longitude', parser: parseNumber },
        area: { field: 'area', parser: parseNumber },
        maxGuests: { field: 'max_guests', parser: parseNumber }
      };

      for (const [key, config] of Object.entries(fieldsMapping)) {
        if (updateData[key] !== undefined) {
          updateFields.push(`${config.field} = ?`);
          updateValues.push(config.parser(updateData[key]));
        }
      }

      if (status === 'active' && currentStatus !== 'active') {
        updateFields.push('published_at = CURRENT_TIMESTAMP');
      }

      if (updateFields.length > 0) {
        updateValues.push(propertyId);
        const updateSql = `UPDATE properties SET ${updateFields.join(', ')} WHERE id = ?`;
        console.log('Updating properties table:', updateSql);
        await connection.query(updateSql, updateValues);
      }
    }

    // 5. Update rooms if provided
    if (roomsRaw) {
      const rooms = parseFormDataField(roomsRaw);

      // Delete existing rooms
      await connection.query(
        'DELETE FROM property_rooms WHERE property_id = ?',
        [propertyId]
      );

      // Insert new rooms
      if (rooms && typeof rooms === 'object') {
        const roomTypes = [
          { type: 'bedroom', count: parseNumber(rooms.bedrooms) || 0 },
          { type: 'bathroom', count: parseNumber(rooms.bathrooms) || 0 },
          { type: 'living_room', count: parseNumber(rooms.livingRooms) || 0 },
          { type: 'dining_room', count: parseNumber(rooms.diningRooms) || 0 },
          { type: 'kitchen', count: parseNumber(rooms.kitchen) || 0 },
          { type: 'storage', count: parseNumber(rooms.storage) || 0 },
          { type: 'balcony', count: parseNumber(rooms.balcony) || 0 },
          { type: 'other', count: parseNumber(rooms.otherRooms) || 0 },
        ];

        const roomValues = roomTypes
          .filter(room => room.count > 0)
          .map(room => [propertyId, room.type, room.count]);

        if (roomValues.length > 0) {
          const roomSql = `
            INSERT INTO property_rooms (property_id, room_type, count)
            VALUES ?
          `;
          await connection.query(roomSql, [roomValues]);
        }

        // Update total_rooms in properties table
        const totalRooms = roomTypes.reduce((sum, room) => sum + room.count, 0);
        await connection.query(
          'UPDATE properties SET total_rooms = ? WHERE id = ?',
          [totalRooms, propertyId]
        );
      }
    }

    // 6. Update equipment if provided
    if (equipmentRaw) {
      const equipment = parseFormDataField(equipmentRaw);

      // Delete existing equipment
      await connection.query(
        'DELETE FROM property_equipment WHERE property_id = ?',
        [propertyId]
      );

      // Insert new equipment
      if (equipment && typeof equipment === 'object') {
        const equipmentTypes = [
          { type: 'beds', count: parseNumber(equipment.beds) || 0 },
          { type: 'mattresses', count: parseNumber(equipment.mattresses) || 0 },
          { type: 'sofas', count: parseNumber(equipment.sofas) || 0 },
          { type: 'chairs', count: parseNumber(equipment.chairs) || 0 },
          { type: 'tables', count: parseNumber(equipment.tables) || 0 },
          { type: 'wardrobes', count: parseNumber(equipment.wardrobes) || 0 },
          { type: 'shelves', count: parseNumber(equipment.shelves) || 0 },
          { type: 'lamps', count: parseNumber(equipment.lamps) || 0 },
          { type: 'curtains', count: parseNumber(equipment.curtains) || 0 },
          { type: 'mirrors', count: parseNumber(equipment.mirrors) || 0 },
        ];

        const equipmentValues = equipmentTypes
          .filter(eq => eq.count > 0)
          .map(eq => [propertyId, eq.type, eq.count]);

        if (equipmentValues.length > 0) {
          const equipmentSql = `
            INSERT INTO property_equipment (property_id, equipment_type, count)
            VALUES ?
          `;
          await connection.query(equipmentSql, [equipmentValues]);
        }
      }
    }

    // 7. Update amenities if provided
    if (amenitiesRaw) {
      const amenities = parseFormDataField(amenitiesRaw) || [];

      // Delete existing amenities
      await connection.query(
        'DELETE FROM property_amenity_junction WHERE property_id = ?',
        [propertyId]
      );

      // Insert new amenities
      if (amenities.length > 0) {
        // Get amenity IDs
        const amenityPlaceholders = amenities.map(() => '?').join(',');
        const [amenityRows] = await connection.query(
          `SELECT id FROM property_amenities WHERE amenity_key IN (${amenityPlaceholders})`,
          amenities
        );

        if (amenityRows.length > 0) {
          const junctionValues = amenityRows.map(row => [propertyId, row.id]);
          const junctionSql = `
            INSERT INTO property_amenity_junction (property_id, amenity_id)
            VALUES ?
          `;
          await connection.query(junctionSql, [junctionValues]);
        }
      }
    }

    // 8. Update pricing if provided
    if (monthlyPrice !== undefined || weeklyPrice !== undefined ||
      dailyPrice !== undefined || nightlyPrice !== undefined ||
      paymentTypesRaw !== undefined) {

      const paymentTypes = paymentTypesRaw ? parseFormDataField(paymentTypesRaw) : ['monthly'];

      const calculatedPrices = {
        quarterly: monthlyPrice ? Math.round(monthlyPrice * 3) : null,
        semester: monthlyPrice ? Math.round(monthlyPrice * 6) : null,
        yearly: monthlyPrice ? Math.round(monthlyPrice * 12) : null,
      };

      const pricingUpdateFields = [];
      const pricingUpdateValues = [];

      const pricingFields = {
        monthly_price: { value: monthlyPrice, parser: parseNumber },
        weekly_price: { value: weeklyPrice, parser: parseNumber },
        daily_price: { value: dailyPrice, parser: parseNumber },
        nightly_price: { value: nightlyPrice, parser: parseNumber },
        quarterly_price: { value: calculatedPrices.quarterly, parser: parseNumber },
        semester_price: { value: calculatedPrices.semester, parser: parseNumber },
        yearly_price: { value: calculatedPrices.yearly, parser: parseNumber },
        max_advance_months: { value: maxAdvanceMonths, parser: parseNumber },
        max_single_payment_months: { value: maxSinglePaymentMonths, parser: parseNumber },
        utilities_min: { value: utilitiesMin, parser: parseNumber },
        utilities_max: { value: utilitiesMax, parser: parseNumber },
        utilities_included: { value: utilitiesIncluded, parser: (val) => val ? 1 : 0 }
      };

      for (const [field, config] of Object.entries(pricingFields)) {
        if (config.value !== undefined) {
          pricingUpdateFields.push(`${field} = ?`);
          pricingUpdateValues.push(config.parser(config.value));
        }
      }

      // Update payment acceptance flags
      if (paymentTypesRaw !== undefined) {
        const paymentFlags = {
          accept_monthly: paymentTypes.includes('monthly') ? 1 : 0,
          accept_weekly: paymentTypes.includes('weekly') ? 1 : 0,
          accept_daily: paymentTypes.includes('daily') ? 1 : 0,
          accept_nightly: paymentTypes.includes('nightly') ? 1 : 0,
          accept_quarterly: paymentTypes.includes('quarterly') ? 1 : 0,
          accept_semester: paymentTypes.includes('semester') ? 1 : 0,
          accept_yearly: paymentTypes.includes('yearly') ? 1 : 0
        };

        for (const [field, value] of Object.entries(paymentFlags)) {
          pricingUpdateFields.push(`${field} = ?`);
          pricingUpdateValues.push(value);
        }
      }

      if (pricingUpdateFields.length > 0) {
        pricingUpdateValues.push(propertyId);
        const pricingUpdateSql = `
          UPDATE property_pricing 
          SET ${pricingUpdateFields.join(', ')} 
          WHERE property_id = ?
        `;
        await connection.query(pricingUpdateSql, pricingUpdateValues);
      }
    }

    // 9. Update rules if provided
    if (checkInTime !== undefined || checkOutTime !== undefined ||
      cancellationPolicy !== undefined || houseRules !== undefined ||
      smokingAllowedRaw !== undefined || petsAllowedRaw !== undefined ||
      eventsAllowedRaw !== undefined || guestsAllowedRaw !== undefined) {

      const rulesUpdateFields = [];
      const rulesUpdateValues = [];

      const rulesFields = {
        check_in_time: { value: checkInTime, parser: parseString },
        check_out_time: { value: checkOutTime, parser: parseString },
        cancellation_policy: { value: cancellationPolicy, parser: parseString },
        house_rules: { value: houseRules, parser: parseString },
        smoking_allowed: { value: smokingAllowedRaw, parser: parseBoolean },
        pets_allowed: { value: petsAllowedRaw, parser: parseBoolean },
        events_allowed: { value: eventsAllowedRaw, parser: parseBoolean },
        guests_allowed: { value: guestsAllowedRaw, parser: parseBoolean },
        late_payment_fee: { value: latePaymentFee, parser: parseNumber },
        grace_period_days: { value: gracePeriodDays, parser: parseNumber }
      };

      for (const [field, config] of Object.entries(rulesFields)) {
        if (config.value !== undefined) {
          rulesUpdateFields.push(`${field} = ?`);
          rulesUpdateValues.push(config.parser(config.value));
        }
      }

      if (rulesUpdateFields.length > 0) {
        rulesUpdateValues.push(propertyId);
        const rulesUpdateSql = `
          UPDATE property_rules 
          SET ${rulesUpdateFields.join(', ')} 
          WHERE property_id = ?
        `;
        await connection.query(rulesUpdateSql, rulesUpdateValues);
      }
    }

    // 10. Update nearby attractions if provided
    if (nearbyAttractionsRaw !== undefined) {
      const nearbyAttractions = parseFormDataField(nearbyAttractionsRaw) || [];

      // Delete existing attractions
      await connection.query(
        'DELETE FROM property_nearby_attractions WHERE property_id = ?',
        [propertyId]
      );

      // Insert new attractions
      if (nearbyAttractions.length > 0) {
        const attractionValues = nearbyAttractions
          .filter(attraction => attraction && attraction.trim())
          .map(attraction => [
            propertyId,
            parseString(attraction),
            'landmark'
          ]);

        if (attractionValues.length > 0) {
          const attractionSql = `
            INSERT INTO property_nearby_attractions (property_id, attraction_name, attraction_type)
            VALUES ?
          `;
          await connection.query(attractionSql, [attractionValues]);
        }
      }
    }

    await connection.commit();

    // 11. Fetch updated property using the complete function
    const [updatedPropertyData] = await connection.query(`
  SELECT p.*, 
    pp.*,
    pr.*,
    u.user_type as landlord_type,
    CONCAT('LL-', u.oliviuus_user_id) as landlord_code
  FROM properties p
  LEFT JOIN users u ON p.landlord_id = u.id
  LEFT JOIN property_pricing pp ON p.id = pp.property_id
  LEFT JOIN property_rules pr ON p.id = pr.property_id
  WHERE p.property_uid = ?
`, [propertyUid]);

    if (!updatedPropertyData || updatedPropertyData.length === 0) {
      throw new Error('Failed to fetch updated property');
    }

    const updatedProperty = updatedPropertyData[0];

    console.log('✅ Property updated successfully');

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error updating property:', error);
    console.error('Error details:', error.message);

    // Cleanup uploaded images if error occurred
    if (uploadedImages && uploadedImages.length > 0) {
      try {
        const deletePromises = uploadedImages.map(img =>
          deleteFromCloudinary(img.public_id).catch(e =>
            console.error('Failed to delete image from Cloudinary:', e)
          )
        );
        await Promise.allSettled(deletePromises);
      } catch (cleanupError) {
        console.error('Error cleaning up Cloudinary images:', cleanupError);
      }
    }

    let errorMessage = 'Failed to update property';
    let statusCode = 500;

    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Duplicate entry detected';
      statusCode = 400;
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Data too long for one or more fields';
      statusCode = 400;
    } else if (error.message.includes('Cannot edit a rented property')) {
      errorMessage = 'Cannot edit a rented property';
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    connection.release();
  }
};

// 6. Delete Property - ENHANCED VERSION
exports.deleteProperty = async (req, res) => {
  const connection = await isanzureDb.promise().getConnection();

  try {
    await connection.beginTransaction();

    const { propertyUid } = req.params;
    const { forceDelete = false } = req.query;

    console.log('🗑️ Deleting property:', propertyUid);

    // 1. Get property with all details
    const [property] = await connection.query(
      `SELECT 
        p.id, p.status, p.title, p.landlord_id,
        (SELECT COUNT(*) FROM bookings WHERE property_id = p.id AND status IN ('confirmed', 'active')) as active_bookings,
        (SELECT COUNT(*) FROM contracts WHERE property_id = p.id AND status = 'active') as active_contracts
      FROM properties p
      WHERE p.property_uid = ?`,
      [propertyUid]
    );

    if (!property || property.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const propertyId = property[0].id;
    const propertyStatus = property[0].status;
    const propertyTitle = property[0].title;
    const activeBookings = property[0].active_bookings;
    const activeContracts = property[0].active_contracts;

    // 2. Check business rules for deletion
    if (propertyStatus === 'rented') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a rented property. Please end the tenancy first.',
        details: {
          status: 'rented',
          suggestion: 'Change status to "inactive" instead'
        }
      });
    }

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete property with ${activeBookings} active booking(s).`,
        details: {
          activeBookings,
          suggestion: 'Cancel or complete bookings first'
        }
      });
    }

    if (activeContracts > 0 && !forceDelete) {
      return res.status(400).json({
        success: false,
        message: `Property has ${activeContracts} active contract(s). Use forceDelete=true to delete anyway.`,
        details: {
          activeContracts,
          warning: 'This will also delete related contracts'
        }
      });
    }

    // 3. Get property images for Cloudinary cleanup
    const [propertyImages] = await connection.query(
      `SELECT 
        pi.public_id, 
        pi.cloudinary_public_id,
        pi.image_uid
      FROM property_images pi
      WHERE pi.property_id = ? AND (pi.public_id IS NOT NULL OR pi.cloudinary_public_id IS NOT NULL)`,
      [propertyId]
    );

    // 4. Delete images from Cloudinary
    if (propertyImages.length > 0) {
      console.log(`🗑️ Deleting ${propertyImages.length} images from Cloudinary`);

      const deletePromises = propertyImages.map(img => {
        const publicId = img.cloudinary_public_id || img.public_id;
        if (publicId) {
          return deleteFromCloudinary(publicId).catch(e => {
            console.error(`Failed to delete image ${publicId}:`, e.message);
            // Continue even if Cloudinary deletion fails
          });
        }
        return Promise.resolve();
      });

      await Promise.allSettled(deletePromises);
    }

    // 5. Soft delete vs hard delete based on forceDelete flag
    if (forceDelete) {
      // Hard delete - remove all related records
      console.log('⚠️ Performing hard delete (forceDelete=true)');

      // Delete in correct order (respecting foreign key constraints)
      const deleteOrder = [
        'property_nearby_attractions',
        'property_amenity_junction',
        'property_rooms',
        'property_equipment',
        'property_images',
        'property_rules',
        'property_pricing',
        'properties'
      ];

      for (const table of deleteOrder) {
        try {
          await connection.query(
            `DELETE FROM ${table} WHERE property_id = ?`,
            [propertyId]
          );
          console.log(`✅ Deleted from ${table}`);
        } catch (err) {
          console.error(`Error deleting from ${table}:`, err.message);
          // Continue with other tables
        }
      }
    } else {
      // Soft delete - mark as deleted
      console.log('🔄 Performing soft delete');
      await connection.query(
        `UPDATE properties 
         SET status = 'deleted', 
             deleted_at = CURRENT_TIMESTAMP,
             title = CONCAT(title, ' [DELETED]')
         WHERE id = ?`,
        [propertyId]
      );
    }

    await connection.commit();

    const action = forceDelete ? 'permanently deleted' : 'soft deleted';
    console.log(`✅ Property "${propertyTitle}" ${action}`);

    res.status(200).json({
      success: true,
      message: `Property ${action} successfully`,
      data: {
        propertyId,
        propertyUid,
        title: propertyTitle,
        action: forceDelete ? 'hard_delete' : 'soft_delete',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error deleting property:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlState: error.sqlState,
        stack: error.stack
      } : undefined
    });
  } finally {
    connection.release();
  }
};

// 7. Get Amenities List
exports.getAmenities = async (req, res) => {
  try {
    const { category } = req.query;

    let query = 'SELECT * FROM property_amenities';
    const queryParams = [];

    if (category) {
      query += ' WHERE category = ?';
      queryParams.push(category);
    }

    query += ' ORDER BY category, amenity_name';

    const amenities = await isanzureQuery(query, queryParams);

    res.status(200).json({
      success: true,
      data: amenities
    });
  } catch (error) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch amenities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 8. Search Properties
exports.searchProperties = async (req, res) => {
  try {
    const {
      query: searchQuery,
      province,
      district,
      minPrice,
      maxPrice,
      propertyType,
      minRooms,
      maxGuests,
      amenities = []
    } = req.query;

    let sql = `
      SELECT DISTINCT
        p.id, p.property_uid, p.title, p.property_type,
        p.address, p.province, p.district, p.sector,
        p.area, p.max_guests, p.total_rooms,
        p.status, p.created_at,
        pp.monthly_price,
        (SELECT pi.image_url FROM property_images pi 
         WHERE pi.property_id = p.id AND pi.is_cover = TRUE LIMIT 1) as cover_image
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      LEFT JOIN property_amenity_junction paj ON p.id = paj.property_id
      WHERE p.status = 'active'
    `;

    const params = [];

    if (searchQuery) {
      sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ?)`;
      const likeQuery = `%${searchQuery}%`;
      params.push(likeQuery, likeQuery, likeQuery);
    }

    if (province) {
      sql += ` AND p.province = ?`;
      params.push(province);
    }

    if (district) {
      sql += ` AND p.district = ?`;
      params.push(district);
    }

    if (propertyType) {
      sql += ` AND p.property_type = ?`;
      params.push(propertyType);
    }

    if (minPrice) {
      sql += ` AND pp.monthly_price >= ?`;
      params.push(minPrice);
    }

    if (maxPrice) {
      sql += ` AND pp.monthly_price <= ?`;
      params.push(maxPrice);
    }

    if (minRooms) {
      sql += ` AND p.total_rooms >= ?`;
      params.push(minRooms);
    }

    if (maxGuests) {
      sql += ` AND p.max_guests >= ?`;
      params.push(maxGuests);
    }

    if (amenities.length > 0) {
      const amenityPlaceholders = amenities.map(() => '?').join(',');
      sql += ` AND paj.amenity_id IN (
        SELECT id FROM property_amenities WHERE amenity_key IN (${amenityPlaceholders})
      )`;
      params.push(...amenities);
    }

    sql += ` GROUP BY p.id ORDER BY p.created_at DESC`;

    const properties = await isanzureQuery(sql, params);

    res.status(200).json({
      success: true,
      data: properties,
      count: properties.length
    });
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search properties',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 9. Get Property Statistics
exports.getPropertyStats = async (req, res) => {
  try {
    const { landlordId } = req.params;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_properties,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_properties,
        SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented_properties,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_properties,
        AVG(pp.monthly_price) as avg_monthly_price,
        MIN(pp.monthly_price) as min_monthly_price,
        MAX(pp.monthly_price) as max_monthly_price
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.landlord_id = ?
    `;

    const [stats] = await isanzureQuery(statsQuery, [landlordId]);

    // Get property types distribution
    const typeQuery = `
      SELECT property_type, COUNT(*) as count
      FROM properties
      WHERE landlord_id = ? AND status = 'active'
      GROUP BY property_type
    `;

    const propertyTypes = await isanzureQuery(typeQuery, [landlordId]);

    res.status(200).json({
      success: true,
      data: {
        ...stats[0],
        propertyTypes
      }
    });
  } catch (error) {
    console.error('Error fetching property stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 10. Delete Property Image
exports.deletePropertyImage = async (req, res) => {
  try {
    const { propertyUid, imageId } = req.params;

    // Get image public_id
    const [image] = await isanzureQuery(
      `SELECT pi.public_id 
       FROM property_images pi
       JOIN properties p ON pi.property_id = p.id
       WHERE p.property_uid = ? AND pi.id = ?`,
      [propertyUid, imageId]
    );

    if (!image || image.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete from Cloudinary
    if (image[0].public_id) {
      await deleteFromCloudinary(image[0].public_id);
    }

    // Delete from database
    await isanzureQuery(
      'DELETE FROM property_images WHERE id = ?',
      [imageId]
    );

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 11. Set Property Cover Image
exports.setPropertyCoverImage = async (req, res) => {
  const connection = await isanzureDb.promise().getConnection();

  try {
    await connection.beginTransaction();

    const { propertyUid, imageId } = req.params;

    // Get property ID
    const [property] = await connection.query(
      'SELECT id FROM properties WHERE property_uid = ?',
      [propertyUid]
    );

    if (!property || property.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const propertyId = property[0].id;

    // Reset all images to not cover
    await connection.query(
      'UPDATE property_images SET is_cover = FALSE WHERE property_id = ?',
      [propertyId]
    );

    // Set selected image as cover
    await connection.query(
      'UPDATE property_images SET is_cover = TRUE WHERE id = ? AND property_id = ?',
      [imageId, propertyId]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Cover image updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error setting cover image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set cover image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// 12. Bulk Update Property Status (FIXED - Removed property_logs dependency)
exports.bulkUpdatePropertyStatus = async (req, res) => {
  const connection = await isanzureDb.promise().getConnection();

  try {
    await connection.beginTransaction();

    const { propertyUids, status, reason } = req.body;
    const { landlordId } = req.query;

    if (!propertyUids || !Array.isArray(propertyUids) || propertyUids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Property UIDs array is required'
      });
    }

    if (!status || !['active', 'inactive', 'draft', 'under_maintenance', 'rented'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    // Build query
    let query = `
      UPDATE properties 
      SET status = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE property_uid IN (?)
    `;

    let params = [status, propertyUids];

    // Add landlord filter if provided
    if (landlordId) {
      query += ' AND landlord_id = ?';
      params.push(landlordId);
    }

    // Add published_at for active status
    if (status === 'active') {
      query = query.replace('SET status = ?', 'SET status = ?, published_at = CURRENT_TIMESTAMP');
    }

    const [result] = await connection.query(query, params);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'No properties found or you are not authorized'
      });
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.affectedRows} property/properties`,
      data: {
        updatedCount: result.affectedRows,
        status,
        propertyUids
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error in bulk update:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update properties',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// 13. Get Property Edit History
exports.getPropertyEditHistory = async (req, res) => {
  try {
    const { propertyUid } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const [property] = await connection.query(
      'SELECT id FROM properties WHERE property_uid = ?',
      [propertyUid]
    );

    if (!property || property.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const propertyId = property[0].id;

    // Check if property_logs table exists, create if not
    await connection.query(`
      CREATE TABLE IF NOT EXISTS property_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        property_uid VARCHAR(36) NOT NULL,
        action VARCHAR(50) NOT NULL,
        section VARCHAR(50),
        old_value TEXT,
        new_value TEXT,
        details TEXT,
        performed_by VARCHAR(100),
        performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_property_id (property_id),
        INDEX idx_property_uid (property_uid),
        INDEX idx_action (action),
        INDEX idx_performed_at (performed_at),
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [history] = await connection.query(
      `SELECT 
        pl.*,
        u.oliviuus_user_id,
        u.user_type
      FROM property_logs pl
      LEFT JOIN users u ON pl.performed_by = u.id
      WHERE pl.property_uid = ?
      ORDER BY pl.performed_at DESC
      LIMIT ? OFFSET ?`,
      [propertyUid, parseInt(limit), parseInt(offset)]
    );

    const [totalCount] = await connection.query(
      'SELECT COUNT(*) as count FROM property_logs WHERE property_uid = ?',
      [propertyUid]
    );

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        total: totalCount[0].count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount[0].count > (parseInt(offset) + history.length)
      }
    });

  } catch (error) {
    console.error('Error fetching edit history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch edit history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 14. Duplicate Property
exports.duplicateProperty = async (req, res) => {
  const connection = await isanzureDb.promise().getConnection();
  let uploadedImages = [];

  try {
    await connection.beginTransaction();

    const { propertyUid } = req.params;
    const {
      newTitle = null,
      landlordId = null,
      copyImages = true
    } = req.body;

    console.log('📋 Duplicating property:', propertyUid);

    // 1. Get original property data using the complete function
    const [originalProperty] = await connection.query(
      `SELECT * FROM properties WHERE property_uid = ?`,
      [propertyUid]
    );

    if (!originalProperty || originalProperty.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property to duplicate not found'
      });
    }

    const originalId = originalProperty[0].id;
    const newLandlordId = landlordId || originalProperty[0].landlord_id;

    // 2. Verify new landlord exists and is a landlord
    const [newLandlord] = await connection.query(
      'SELECT id, user_type FROM users WHERE id = ?',
      [newLandlordId]
    );

    if (!newLandlord || newLandlord.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'New landlord not found'
      });
    }

    if (newLandlord[0].user_type !== 'landlord') {
      return res.status(400).json({
        success: false,
        message: 'New user is not a landlord'
      });
    }

    // 3. Create new property (most fields copied, some reset)
    const propertySql = `
      INSERT INTO properties (
        title, description, property_type,
        address, province, district, sector, cell, village, isibo, country, latitude, longitude,
        area, max_guests, total_rooms,
        landlord_id, status,
        is_featured, is_verified, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const newTitleValue = newTitle || `${originalProperty[0].title} (Copy)`;

    const propertyValues = [
      parseString(newTitleValue),
      parseString(originalProperty[0].description),
      parseString(originalProperty[0].property_type),
      parseString(originalProperty[0].address),
      parseString(originalProperty[0].province),
      parseString(originalProperty[0].district),
      parseString(originalProperty[0].sector),
      parseString(originalProperty[0].cell),
      parseString(originalProperty[0].village),
      parseString(originalProperty[0].isibo),
      parseString(originalProperty[0].country),
      parseNumber(originalProperty[0].latitude),
      parseNumber(originalProperty[0].longitude),
      parseNumber(originalProperty[0].area),
      parseNumber(originalProperty[0].max_guests) || 2,
      parseNumber(originalProperty[0].total_rooms) || 0,
      newLandlordId,
      'draft', // Always start as draft
      0, // is_featured reset
      0, // is_verified reset
      'pending' // verification_status reset
    ];

    const [propertyResult] = await connection.query(propertySql, propertyValues);
    const newPropertyId = propertyResult.insertId;

    // 4. Get new property UID
    const [newProperty] = await connection.query(
      'SELECT property_uid FROM properties WHERE id = ?',
      [newPropertyId]
    );
    const newPropertyUid = newProperty[0].property_uid;

    // 5. Copy related data
    const tablesToCopy = [
      {
        name: 'property_pricing',
        exclude: ['id', 'pricing_uid', 'property_id'],
        transform: (row) => ({ ...row, property_id: newPropertyId })
      },
      {
        name: 'property_rules',
        exclude: ['id', 'rule_uid', 'property_id'],
        transform: (row) => ({ ...row, property_id: newPropertyId })
      },
      {
        name: 'property_rooms',
        exclude: ['id', 'room_uid', 'property_id'],
        transform: (row) => ({ ...row, property_id: newPropertyId })
      },
      {
        name: 'property_equipment',
        exclude: ['id', 'equipment_uid', 'property_id'],
        transform: (row) => ({ ...row, property_id: newPropertyId })
      },
      {
        name: 'property_nearby_attractions',
        exclude: ['id', 'attraction_uid', 'property_id'],
        transform: (row) => ({ ...row, property_id: newPropertyId })
      }
    ];

    for (const table of tablesToCopy) {
      const [rows] = await connection.query(
        `SELECT * FROM ${table.name} WHERE property_id = ?`,
        [originalId]
      );

      if (rows.length > 0) {
        for (const row of rows) {
          const transformed = table.transform(row);
          const columns = Object.keys(transformed).filter(col => !table.exclude.includes(col));
          const values = columns.map(col => transformed[col]);
          const placeholders = columns.map(() => '?').join(', ');

          const insertSql = `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${placeholders})`;
          await connection.query(insertSql, values);
        }
      }
    }

    // 6. Copy amenities junction
    const [amenities] = await connection.query(
      `SELECT amenity_id FROM property_amenity_junction WHERE property_id = ?`,
      [originalId]
    );

    if (amenities.length > 0) {
      const junctionValues = amenities.map(row => [newPropertyId, row.amenity_id]);
      const junctionSql = `
        INSERT INTO property_amenity_junction (property_id, amenity_id)
        VALUES ?
      `;
      await connection.query(junctionSql, [junctionValues]);
    }

    // 7. Handle images (copy or re-upload)
    if (copyImages) {
      const [images] = await connection.query(
        `SELECT * FROM property_images WHERE property_id = ? ORDER BY display_order`,
        [originalId]
      );

      if (images.length > 0) {
        // We can't copy Cloudinary images directly, so we need to handle this differently
        // For now, we'll just copy the image references
        const imageValues = images.map((img, index) => [
          newPropertyId,
          img.image_url,
          null, // Don't copy public_id
          null, // Don't copy cloudinary_public_id
          `${img.image_name || 'property-image'}-copy-${index + 1}`,
          img.image_size,
          img.mime_type,
          img.is_cover && index === 0, // Only first image as cover
          index
        ]);

        const imageSql = `
          INSERT INTO property_images 
          (property_id, image_url, public_id, cloudinary_public_id, image_name, image_size, mime_type, is_cover, display_order)
          VALUES ?
        `;

        await connection.query(imageSql, [imageValues]);
      }
    }

    await connection.commit();

    // 8. Fetch the new property
    const newPropertyData = await exports.getCompletePropertyByUid(
      { params: { propertyUid: newPropertyUid } },
      res,
      true
    );

    console.log(`✅ Property duplicated successfully: ${newPropertyUid}`);

    res.status(201).json({
      success: true,
      message: 'Property duplicated successfully',
      data: {
        originalPropertyUid: propertyUid,
        newPropertyUid: newPropertyUid,
        newPropertyId: newPropertyId,
        property: newPropertyData
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error duplicating property:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to duplicate property',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};


// Update single property status
exports.updatePropertyStatus = async (req, res) => {
  try {
    const { propertyUid } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'draft', 'under_maintenance', 'rented'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    await isanzureQuery(
      `UPDATE properties 
       SET status = ?, 
           updated_at = CURRENT_TIMESTAMP,
           published_at = CASE WHEN ? = 'active' THEN CURRENT_TIMESTAMP ELSE published_at END
       WHERE property_uid = ?`,
      [status, status, propertyUid]
    );

    res.status(200).json({
      success: true,
      message: 'Property status updated successfully'
    });

  } catch (error) {
    console.error('Error updating property status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property status'
    });
  }
};