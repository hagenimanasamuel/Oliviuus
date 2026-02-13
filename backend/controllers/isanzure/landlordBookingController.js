// backend/controllers/isanzure/landlordBookingController.js
const { isanzureQuery } = require('../../config/isanzureDbConfig');
const { query: oliviuusQuery } = require('../../config/dbConfig');

// Debug helper
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🏠 ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 🏠 ${message}`);
  }
};

// ============================================
// 1. GET AUTHENTICATED LANDLORD
// ============================================
const getAuthenticatedLandlord = async (req) => {
  try {
    const userId = req.user?.id || req.user?.oliviuus_id;
    
    if (!userId) {
      debugLog('❌ No authenticated user found');
      return null;
    }

    debugLog('🔍 Looking up landlord in iSanzure:', userId);

    const checkSql = `
      SELECT 
        u.id,
        u.user_uid,
        u.oliviuus_user_id,
        u.user_type,
        u.public_phone,
        u.public_email,
        u.id_verified,
        u.verification_status,
        COALESCE(sso.first_name, 'Landlord') as first_name,
        COALESCE(sso.last_name, '') as last_name,
        COALESCE(sso.username, CONCAT('landlord-', u.id)) as username,
        CONCAT(
          COALESCE(sso.first_name, 'Landlord'),
          ' ',
          COALESCE(sso.last_name, '')
        ) as full_name,
        sso.profile_avatar_url
      FROM users u
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      WHERE u.oliviuus_user_id = ?
        AND u.user_type IN ('landlord', 'property_manager', 'agent')
        AND u.is_active = 1
      LIMIT 1
    `;

    const landlords = await isanzureQuery(checkSql, [userId]);

    if (landlords.length === 0) {
      debugLog('❌ User is not a landlord');
      return null;
    }

    const landlord = landlords[0];
    
    debugLog('✅ Authenticated landlord found:', {
      id: landlord.id,
      user_uid: landlord.user_uid,
      name: landlord.full_name,
      verified: landlord.id_verified === 1 || landlord.verification_status === 'approved'
    });

    return landlord;
  } catch (error) {
    debugLog('❌ Error getting landlord:', error.message);
    return null;
  }
};

// ============================================
// 2. GET ALL BOOKINGS FOR LANDLORD'S PROPERTIES
// ============================================
exports.getLandlordBookings = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const {
      status,
      propertyUid,
      period,
      startDate,
      endDate,
      search,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    debugLog('📋 Fetching bookings for landlord:', {
      landlordId: landlord.id,
      filters: { status, propertyUid, period, startDate, endDate, search }
    });

    // Build base query
    let baseQuery = `
      SELECT 
        b.id,
        b.booking_uid,
        b.payment_reference,
        b.booking_period,
        b.start_date,
        b.duration,
        b.end_date,
        b.total_amount,
        b.optional_services,
        b.special_requests,
        b.status,
        b.cancellation_policy,
        b.created_at,
        b.confirmed_at,
        b.check_in_at,
        b.check_out_at,
        b.cancelled_at,
        
        -- Property details
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        p.property_type,
        p.address,
        p.province,
        p.district,
        p.sector,
        (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as property_cover_image,
        (SELECT COUNT(*) FROM property_images pi2 WHERE pi2.property_id = p.id) as property_image_count,
        
        -- Tenant details (iSanzure)
        t.id as tenant_id,
        t.user_uid as tenant_uid,
        t.user_type as tenant_type,
        t.public_phone as tenant_phone,
        t.public_email as tenant_email,
        t.id_verified as tenant_id_verified,
        t.verification_status as tenant_verification_status,
        
        -- Tenant SSO details
        sso.first_name as tenant_first_name,
        sso.last_name as tenant_last_name,
        sso.username as tenant_username,
        sso.profile_avatar_url as tenant_avatar,
        CONCAT(COALESCE(sso.first_name, 'Tenant'), ' ', COALESCE(sso.last_name, '')) as tenant_full_name,
        
        -- Payment info
        COALESCE(bp.paid_at, b.confirmed_at) as paid_at,
        bp.amount as paid_amount,
        bp.payment_type,
        bp.status as payment_status,
        
        -- Transaction info
        txn.transaction_uid,
        txn.payment_method,
        txn.status as transaction_status,
        
        -- Extension info
        (SELECT COUNT(*) FROM booking_extensions be WHERE be.original_booking_id = b.id AND be.status = 'requested') as pending_extension_count,
        (SELECT COUNT(*) FROM booking_extensions be2 WHERE be2.original_booking_id = b.id) as total_extensions,
        
        -- Cancellation info
        bc.id as cancellation_id,
        bc.reason as cancellation_reason,
        bc.refund_amount,
        bc.status as cancellation_status,
        bc.cancellation_policy_applied
        
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso ON t.oliviuus_user_id = sso.id
      LEFT JOIN booking_payments bp ON b.id = bp.booking_id
      LEFT JOIN transactions txn ON bp.transaction_id = txn.id
      LEFT JOIN booking_cancellations bc ON b.id = bc.booking_id
      
      WHERE p.landlord_id = ?
    `;

    const queryParams = [landlord.id];

    // Apply filters
    if (status) {
      const statusArray = status.split(',');
      baseQuery += ` AND b.status IN (${statusArray.map(() => '?').join(',')})`;
      queryParams.push(...statusArray);
    }

    if (propertyUid) {
      baseQuery += ` AND p.property_uid = ?`;
      queryParams.push(propertyUid);
    }

    if (period) {
      baseQuery += ` AND b.booking_period = ?`;
      queryParams.push(period);
    }

    if (startDate) {
      baseQuery += ` AND b.start_date >= ?`;
      queryParams.push(startDate);
    }

    if (endDate) {
      baseQuery += ` AND b.end_date <= ?`;
      queryParams.push(endDate);
    }

    if (search) {
      baseQuery += ` AND (
        p.title LIKE ? OR
        sso.first_name LIKE ? OR
        sso.last_name LIKE ? OR
        sso.username LIKE ? OR
        b.booking_uid LIKE ? OR
        b.payment_reference LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_table`;
    const countResult = await isanzureQuery(countQuery, queryParams);
    const total = countResult[0]?.total || 0;

    // Add sorting and pagination
    const allowedSortFields = ['created_at', 'start_date', 'end_date', 'total_amount', 'status', 'tenant_full_name'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    baseQuery += ` ORDER BY b.${finalSortBy} ${finalSortOrder}`;
    baseQuery += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const bookings = await isanzureQuery(baseQuery, queryParams);

    // Format the response
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      optional_services: booking.optional_services ? JSON.parse(booking.optional_services) : [],
      tenant: {
        id: booking.tenant_id,
        uid: booking.tenant_uid,
        full_name: booking.tenant_full_name?.trim() || 'Tenant',
        first_name: booking.tenant_first_name,
        last_name: booking.tenant_last_name,
        username: booking.tenant_username,
        avatar: booking.tenant_avatar,
        phone: booking.tenant_phone,
        email: booking.tenant_email,
        is_verified: booking.tenant_id_verified === 1 || booking.tenant_verification_status === 'approved',
        verification_status: booking.tenant_verification_status
      },
      property: {
        id: booking.property_id,
        uid: booking.property_uid,
        title: booking.property_title,
        type: booking.property_type,
        address: booking.address,
        province: booking.province,
        district: booking.district,
        sector: booking.sector,
        cover_image: booking.property_cover_image,
        image_count: booking.property_image_count
      },
      payment: {
        amount: booking.paid_amount || booking.total_amount,
        paid_at: booking.paid_at,
        payment_type: booking.payment_type,
        status: booking.payment_status,
        transaction_uid: booking.transaction_uid,
        method: booking.payment_method,
        transaction_status: booking.transaction_status
      },
      cancellation: booking.cancellation_id ? {
        id: booking.cancellation_id,
        reason: booking.cancellation_reason,
        refund_amount: booking.refund_amount,
        status: booking.cancellation_status,
        policy_applied: booking.cancellation_policy_applied
      } : null,
      extensions: {
        pending: booking.pending_extension_count || 0,
        total: booking.total_extensions || 0
      }
    }));

    // Remove raw fields
    formattedBookings.forEach(booking => {
      delete booking.tenant_id;
      delete booking.tenant_uid;
      delete booking.tenant_first_name;
      delete booking.tenant_last_name;
      delete booking.tenant_username;
      delete booking.tenant_avatar;
      delete booking.tenant_phone;
      delete booking.tenant_email;
      delete booking.tenant_id_verified;
      delete booking.tenant_verification_status;
      delete booking.tenant_full_name;
      delete booking.property_id;
      delete booking.property_uid;
      delete booking.property_title;
      delete booking.property_type;
      delete booking.address;
      delete booking.province;
      delete booking.district;
      delete booking.sector;
      delete booking.property_cover_image;
      delete booking.property_image_count;
      delete booking.paid_amount;
      delete booking.paid_at;
      delete booking.payment_type;
      delete booking.payment_status;
      delete booking.transaction_uid;
      delete booking.payment_method;
      delete booking.transaction_status;
      delete booking.cancellation_id;
      delete booking.cancellation_reason;
      delete booking.refund_amount;
      delete booking.cancellation_status;
      delete booking.cancellation_policy_applied;
      delete booking.pending_extension_count;
      delete booking.total_extensions;
    });

    // Get summary statistics
    const stats = await getLandlordBookingStats(landlord.id);

    debugLog(`✅ Found ${formattedBookings.length} bookings (total: ${total})`);

    res.status(200).json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + formattedBookings.length) < total
        },
        stats,
        filters: {
          status: status || null,
          propertyUid: propertyUid || null,
          period: period || null,
          startDate: startDate || null,
          endDate: endDate || null,
          search: search || null
        }
      }
    });

  } catch (error) {
    debugLog('❌ Error fetching landlord bookings:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      code: 'FETCH_BOOKINGS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 3. GET BOOKING DETAILS BY ID
// ============================================
exports.getBookingDetails = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
        code: 'MISSING_BOOKING_ID'
      });
    }

    debugLog('📋 Fetching booking details:', { bookingId, landlordId: landlord.id });

    // Get booking with all details
    const bookingQuery = `
      SELECT 
        b.*,
        
        -- Property details
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        p.property_type,
        p.description as property_description,
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
        
        -- Property pricing
        pp.monthly_price,
        pp.weekly_price,
        pp.daily_price,
        pp.nightly_price,
        pp.accept_monthly,
        pp.accept_weekly,
        pp.accept_daily,
        pp.accept_nightly,
        pp.utilities_min,
        pp.utilities_max,
        pp.utilities_included,
        
        -- Property rules
        pr.check_in_time,
        pr.check_out_time,
        pr.cancellation_policy,
        pr.smoking_allowed,
        pr.pets_allowed,
        pr.events_allowed,
        pr.guests_allowed,
        pr.house_rules,
        
        -- Tenant details
        t.id as tenant_id,
        t.user_uid as tenant_uid,
        t.user_type as tenant_type,
        t.public_phone as tenant_phone,
        t.public_email as tenant_email,
        t.id_verified as tenant_id_verified,
        t.verification_status as tenant_verification_status,
        t.created_at as tenant_since,
        
        -- Tenant SSO
        sso.first_name as tenant_first_name,
        sso.last_name as tenant_last_name,
        sso.username as tenant_username,
        sso.profile_avatar_url as tenant_avatar,
        sso.email as tenant_sso_email,
        sso.phone as tenant_sso_phone,
        CONCAT(COALESCE(sso.first_name, 'Tenant'), ' ', COALESCE(sso.last_name, '')) as tenant_full_name,
        
        -- Payment info
        bp.id as payment_id,
        bp.payment_uid,
        bp.payment_type,
        bp.period_covered,
        bp.due_date,
        bp.amount as payment_amount,
        bp.status as payment_status,
        bp.paid_at,
        
        -- Transaction info
        txn.id as transaction_id,
        txn.transaction_uid,
        txn.amount as transaction_amount,
        txn.currency_code,
        txn.transaction_type,
        txn.status as transaction_status,
        txn.payment_method,
        txn.gateway_data,
        txn.created_at as transaction_created_at,
        txn.completed_at,
        
        -- Cancellation info
        bc.id as cancellation_id,
        bc.cancellation_uid,
        bc.reason as cancellation_reason,
        bc.refund_amount,
        bc.platform_fee_kept,
        bc.cancellation_policy_applied,
        bc.status as cancellation_status,
        bc.created_at as cancellation_requested_at,
        bc.processed_at as cancellation_processed_at,
        
        -- Extension info
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', be.id,
              'extension_uid', be.extension_uid,
              'additional_periods', be.additional_periods,
              'new_end_date', be.new_end_date,
              'additional_amount', be.additional_amount,
              'status', be.status,
              'created_at', be.created_at,
              'responded_at', be.responded_at
            )
          )
          FROM booking_extensions be
          WHERE be.original_booking_id = b.id
          ORDER BY be.created_at DESC
        ) as extensions,
        
        -- Property images
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', pi.id,
              'image_uid', pi.image_uid,
              'image_url', pi.image_url,
              'is_cover', pi.is_cover,
              'display_order', pi.display_order
            )
          )
          FROM property_images pi
          WHERE pi.property_id = p.id
          ORDER BY pi.is_cover DESC, pi.display_order ASC
        ) as property_images,
        
        -- Property amenities
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', pa.id,
              'amenity_key', pa.amenity_key,
              'amenity_name', pa.amenity_name,
              'category', pa.category
            )
          )
          FROM property_amenity_junction paj
          JOIN property_amenities pa ON paj.amenity_id = pa.id
          WHERE paj.property_id = p.id
          ORDER BY pa.category, pa.amenity_name
        ) as property_amenities
        
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      LEFT JOIN property_rules pr ON p.id = pr.property_id
      INNER JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso ON t.oliviuus_user_id = sso.id
      LEFT JOIN booking_payments bp ON b.id = bp.booking_id
      LEFT JOIN transactions txn ON bp.transaction_id = txn.id
      LEFT JOIN booking_cancellations bc ON b.id = bc.booking_id
      WHERE (b.id = ? OR b.booking_uid = ?)
        AND p.landlord_id = ?
    `;

    const bookings = await isanzureQuery(bookingQuery, [bookingId, bookingId, landlord.id]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    const booking = bookings[0];

    // Parse JSON fields
    if (booking.optional_services) {
      booking.optional_services = JSON.parse(booking.optional_services);
    }
    if (booking.period_covered) {
      booking.period_covered = JSON.parse(booking.period_covered);
    }
    if (booking.extensions) {
      booking.extensions = JSON.parse(booking.extensions);
    }
    if (booking.property_images) {
      booking.property_images = JSON.parse(booking.property_images);
    }
    if (booking.property_amenities) {
      booking.property_amenities = JSON.parse(booking.property_amenities);
    }
    if (booking.gateway_data) {
      booking.gateway_data = JSON.parse(booking.gateway_data);
    }

    // Get available dates
    const unavailableQuery = `
      SELECT date, status, reason
      FROM property_unavailable_dates
      WHERE property_id = ?
        AND date >= CURDATE()
      ORDER BY date ASC
      LIMIT 30
    `;
    
    const unavailableDates = await isanzureQuery(unavailableQuery, [booking.property_id]);

    // Get landlord stats
    const stats = await getLandlordBookingStats(landlord.id);

    // Format response
    const formattedBooking = {
      id: booking.id,
      booking_uid: booking.booking_uid,
      payment_reference: booking.payment_reference,
      
      booking_details: {
        period: booking.booking_period,
        start_date: booking.start_date,
        duration: booking.duration,
        end_date: booking.end_date,
        total_amount: parseFloat(booking.total_amount),
        optional_services: booking.optional_services || [],
        special_requests: booking.special_requests,
        status: booking.status,
        cancellation_policy: booking.cancellation_policy,
        created_at: booking.created_at,
        confirmed_at: booking.confirmed_at,
        check_in_at: booking.check_in_at,
        check_out_at: booking.check_out_at,
        cancelled_at: booking.cancelled_at
      },
      
      property: {
        id: booking.property_id,
        uid: booking.property_uid,
        title: booking.property_title,
        type: booking.property_type,
        description: booking.property_description,
        address: {
          full: booking.address,
          province: booking.province,
          district: booking.district,
          sector: booking.sector,
          cell: booking.cell,
          village: booking.village,
          isibo: booking.isibo
        },
        area: booking.area,
        max_guests: booking.max_guests,
        total_rooms: booking.total_rooms,
        is_featured: booking.is_featured === 1,
        is_verified: booking.is_verified === 1,
        images: booking.property_images || [],
        amenities: booking.property_amenities || [],
        unavailable_dates: unavailableDates
      },
      
      pricing: {
        monthly: parseFloat(booking.monthly_price) || 0,
        weekly: parseFloat(booking.weekly_price) || 0,
        daily: parseFloat(booking.daily_price) || 0,
        nightly: parseFloat(booking.nightly_price) || 0,
        accepts: {
          monthly: booking.accept_monthly === 1,
          weekly: booking.accept_weekly === 1,
          daily: booking.accept_daily === 1,
          nightly: booking.accept_nightly === 1
        },
        utilities: {
          min: parseFloat(booking.utilities_min) || 0,
          max: parseFloat(booking.utilities_max) || 0,
          included: booking.utilities_included === 1
        }
      },
      
      rules: {
        check_in: booking.check_in_time,
        check_out: booking.check_out_time,
        cancellation_policy: booking.cancellation_policy,
        smoking_allowed: booking.smoking_allowed === 1,
        pets_allowed: booking.pets_allowed === 1,
        events_allowed: booking.events_allowed === 1,
        guests_allowed: booking.guests_allowed === 1,
        house_rules: booking.house_rules
      },
      
      tenant: {
        id: booking.tenant_id,
        uid: booking.tenant_uid,
        full_name: booking.tenant_full_name?.trim() || 'Tenant',
        first_name: booking.tenant_first_name,
        last_name: booking.tenant_last_name,
        username: booking.tenant_username,
        avatar: booking.tenant_avatar,
        phone: booking.tenant_phone || booking.tenant_sso_phone,
        email: booking.tenant_email || booking.tenant_sso_email,
        is_verified: booking.tenant_id_verified === 1 || booking.tenant_verification_status === 'approved',
        verification_status: booking.tenant_verification_status,
        member_since: booking.tenant_since
      },
      
      payment: {
        id: booking.payment_id,
        uid: booking.payment_uid,
        type: booking.payment_type,
        period_covered: booking.period_covered,
        due_date: booking.due_date,
        amount: parseFloat(booking.payment_amount) || parseFloat(booking.total_amount),
        status: booking.payment_status,
        paid_at: booking.paid_at,
        transaction: {
          id: booking.transaction_id,
          uid: booking.transaction_uid,
          amount: parseFloat(booking.transaction_amount),
          currency: booking.currency_code || 'RWF',
          type: booking.transaction_type,
          status: booking.transaction_status,
          method: booking.payment_method,
          gateway_data: booking.gateway_data,
          created_at: booking.transaction_created_at,
          completed_at: booking.completed_at
        }
      },
      
      cancellation: booking.cancellation_id ? {
        id: booking.cancellation_id,
        uid: booking.cancellation_uid,
        reason: booking.cancellation_reason,
        refund_amount: parseFloat(booking.refund_amount),
        platform_fee_kept: parseFloat(booking.platform_fee_kept),
        policy_applied: booking.cancellation_policy_applied,
        status: booking.cancellation_status,
        requested_at: booking.cancellation_requested_at,
        processed_at: booking.cancellation_processed_at
      } : null,
      
      extensions: booking.extensions || [],
      
      stats: {
        total_bookings: stats.total_bookings,
        pending_bookings: stats.pending_bookings,
        active_bookings: stats.active_bookings,
        completed_bookings: stats.completed_bookings,
        cancelled_bookings: stats.cancelled_bookings,
        total_revenue: stats.total_revenue,
        monthly_revenue: stats.monthly_revenue
      }
    };

    debugLog('✅ Booking details fetched successfully:', {
      bookingId: formattedBooking.booking_uid,
      status: formattedBooking.booking_details.status,
      tenant: formattedBooking.tenant.full_name
    });

    res.status(200).json({
      success: true,
      data: formattedBooking
    });

  } catch (error) {
    debugLog('❌ Error fetching booking details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      code: 'FETCH_BOOKING_DETAILS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 4. UPDATE BOOKING STATUS (Confirm, Cancel, Complete)
// ============================================
exports.updateBookingStatus = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const { bookingId } = req.params;
    const { status, reason, notifyTenant = true } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
        code: 'MISSING_BOOKING_ID'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
        code: 'MISSING_STATUS'
      });
    }

    const validStatuses = ['confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      });
    }

    debugLog('📋 Updating booking status:', {
      bookingId,
      status,
      reason: reason || 'No reason provided',
      landlordId: landlord.id
    });

    // Verify booking belongs to landlord
    const verifyQuery = `
      SELECT b.id, b.status, b.booking_uid, p.title as property_title,
             t.id as tenant_id, t.oliviuus_user_id,
             sso.first_name, sso.last_name, sso.email, sso.phone
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso ON t.oliviuus_user_id = sso.id
      WHERE (b.id = ? OR b.booking_uid = ?)
        AND p.landlord_id = ?
    `;

    const bookings = await isanzureQuery(verifyQuery, [bookingId, bookingId, landlord.id]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    const booking = bookings[0];

    // Check if status transition is valid
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a cancelled booking',
        code: 'BOOKING_CANCELLED'
      });
    }

    if (booking.status === 'completed' && status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a completed booking',
        code: 'BOOKING_COMPLETED'
      });
    }

    if (booking.status === status) {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${status}`,
        code: 'BOOKING_ALREADY_UPDATED'
      });
    }

    // Update booking status
    let updateQuery = '';
    let updateParams = [];

    if (status === 'confirmed') {
      updateQuery = `
        UPDATE bookings 
        SET status = ?, confirmed_at = UTC_TIMESTAMP()
        WHERE id = ?
      `;
      updateParams = [status, booking.id];
    } else if (status === 'cancelled') {
      updateQuery = `
        UPDATE bookings 
        SET status = ?, cancelled_at = UTC_TIMESTAMP()
        WHERE id = ?
      `;
      updateParams = [status, booking.id];
      
      // Create cancellation record
      await isanzureQuery(`
        INSERT INTO booking_cancellations (
          cancellation_uid,
          booking_id,
          initiated_by_user_id,
          reason,
          status,
          cancellation_policy_applied
        ) VALUES (
          UUID(),
          ?,
          ?,
          ?,
          'pending',
          (SELECT cancellation_policy FROM bookings WHERE id = ?)
        )
      `, [booking.id, landlord.id, reason || 'Cancelled by landlord', booking.id]);
      
    } else if (status === 'completed') {
      updateQuery = `
        UPDATE bookings 
        SET status = ?, check_out_at = UTC_TIMESTAMP()
        WHERE id = ?
      `;
      updateParams = [status, booking.id];
    }

    await isanzureQuery(updateQuery, updateParams);

    // Log in audit log
    await isanzureQuery(`
      INSERT INTO security_audit_log (
        log_uid,
        user_id,
        action_type,
        description,
        ip_address,
        user_agent,
        metadata
      ) VALUES (
        UUID(),
        ?,
        'booking_status_update',
        ?,
        ?,
        ?,
        ?
      )
    `, [
      landlord.id,
      `Updated booking ${booking.booking_uid} status from ${booking.status} to ${status}`,
      req.ip,
      req.headers['user-agent'],
      JSON.stringify({
        booking_id: booking.id,
        old_status: booking.status,
        new_status: status,
        reason: reason
      })
    ]);

    // If notifyTenant is true, create notification
    if (notifyTenant && booking.oliviuus_user_id) {
      try {
        // Create notification in oliviuus_db
        await oliviuusQuery(`
          INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())
        `, [
          booking.oliviuus_user_id,
          'booking_update',
          `Booking ${getStatusTitle(status)}`,
          getStatusMessage(status, booking.property_title, reason),
          JSON.stringify({
            booking_id: booking.id,
            booking_uid: booking.booking_uid,
            property_title: booking.property_title,
            status: status,
            reason: reason
          })
        ]);
      } catch (notifyError) {
        debugLog('⚠️ Failed to send notification:', notifyError.message);
      }
    }

    debugLog('✅ Booking status updated successfully:', {
      bookingId: booking.booking_uid,
      oldStatus: booking.status,
      newStatus: status
    });

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      data: {
        booking_uid: booking.booking_uid,
        status: status,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    debugLog('❌ Error updating booking status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      code: 'UPDATE_BOOKING_STATUS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 5. HANDLE BOOKING EXTENSION REQUEST
// ============================================
exports.handleExtensionRequest = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const { extensionId } = req.params;
    const { action, responseNote } = req.body;

    if (!extensionId) {
      return res.status(400).json({
        success: false,
        message: 'Extension ID is required',
        code: 'MISSING_EXTENSION_ID'
      });
    }

    if (!action || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Valid action (approved/rejected) is required',
        code: 'INVALID_ACTION'
      });
    }

    debugLog('📋 Handling extension request:', {
      extensionId,
      action,
      landlordId: landlord.id
    });

    // Get extension details and verify ownership
    const extensionQuery = `
      SELECT 
        be.*,
        b.id as booking_id,
        b.booking_uid,
        b.tenant_id,
        b.status as booking_status,
        b.end_date as current_end_date,
        b.booking_period,
        b.total_amount,
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        p.landlord_id,
        t.oliviuus_user_id as tenant_oliviuus_id,
        sso.first_name,
        sso.last_name,
        sso.email,
        sso.phone
      FROM booking_extensions be
      INNER JOIN bookings b ON be.original_booking_id = b.id
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso ON t.oliviuus_user_id = sso.id
      WHERE be.id = ?
        AND p.landlord_id = ?
        AND be.status = 'requested'
    `;

    const extensions = await isanzureQuery(extensionQuery, [extensionId, landlord.id]);

    if (extensions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Extension request not found or already processed',
        code: 'EXTENSION_NOT_FOUND'
      });
    }

    const extension = extensions[0];

    // Update extension status
    await isanzureQuery(`
      UPDATE booking_extensions 
      SET status = ?, responded_at = UTC_TIMESTAMP()
      WHERE id = ?
    `, [action, extension.id]);

    if (action === 'approved') {
      // Update booking end date
      await isanzureQuery(`
        UPDATE bookings 
        SET end_date = ?,
            duration = duration + ?
        WHERE id = ?
      `, [extension.new_end_date, extension.additional_periods, extension.booking_id]);

      // Create additional payment record if needed
      if (parseFloat(extension.additional_amount) > 0) {
        const periodCovered = JSON.stringify({
          start: extension.current_end_date,
          end: extension.new_end_date,
          period: extension.booking_period,
          duration: extension.additional_periods,
          type: 'extension'
        });

        await isanzureQuery(`
          INSERT INTO booking_payments (
            payment_uid,
            booking_id,
            payment_type,
            period_covered,
            due_date,
            amount,
            status
          ) VALUES (
            UUID(),
            ?,
            'extension',
            ?,
            ?,
            ?,
            'pending'
          )
        `, [extension.booking_id, periodCovered, extension.new_end_date, extension.additional_amount]);
      }
    }

    // Log in audit log
    await isanzureQuery(`
      INSERT INTO security_audit_log (
        log_uid,
        user_id,
        action_type,
        description,
        ip_address,
        user_agent,
        metadata
      ) VALUES (
        UUID(),
        ?,
        'extension_request_${action}',
        ?,
        ?,
        ?,
        ?
      )
    `, [
      landlord.id,
      `${action === 'approved' ? 'Approved' : 'Rejected'} extension request for booking ${extension.booking_uid}`,
      req.ip,
      req.headers['user-agent'],
      JSON.stringify({
        extension_id: extension.id,
        booking_id: extension.booking_id,
        additional_periods: extension.additional_periods,
        new_end_date: extension.new_end_date,
        additional_amount: extension.additional_amount,
        note: responseNote
      })
    ]);

    // Notify tenant
    if (extension.tenant_oliviuus_id) {
      try {
        await oliviuusQuery(`
          INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())
        `, [
          extension.tenant_oliviuus_id,
          'extension_response',
          action === 'approved' ? 'Extension Request Approved' : 'Extension Request Declined',
          getExtensionMessage(action, extension.property_title, extension.additional_periods, extension.booking_period, responseNote),
          JSON.stringify({
            booking_id: extension.booking_id,
            booking_uid: extension.booking_uid,
            extension_id: extension.id,
            status: action,
            new_end_date: extension.new_end_date,
            additional_amount: extension.additional_amount,
            note: responseNote
          })
        ]);
      } catch (notifyError) {
        debugLog('⚠️ Failed to send notification:', notifyError.message);
      }
    }

    debugLog(`✅ Extension request ${action} successfully:`, {
      extensionId: extension.id,
      bookingId: extension.booking_uid,
      additionalPeriods: extension.additional_periods
    });

    res.status(200).json({
      success: true,
      message: `Extension request ${action} successfully`,
      data: {
        extension_id: extension.id,
        booking_uid: extension.booking_uid,
        status: action,
        new_end_date: action === 'approved' ? extension.new_end_date : null,
        additional_amount: action === 'approved' ? extension.additional_amount : 0,
        responded_at: new Date().toISOString()
      }
    });

  } catch (error) {
    debugLog('❌ Error handling extension request:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process extension request',
      code: 'EXTENSION_PROCESSING_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 6. GET BOOKING STATISTICS & ANALYTICS
// ============================================
exports.getBookingAnalytics = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const { period = 'month', year = new Date().getFullYear() } = req.query;

    debugLog('📊 Fetching booking analytics:', { landlordId: landlord.id, period, year });

    // Get overall stats
    const overallStats = await getLandlordBookingStats(landlord.id);

    // Get monthly breakdown
    let monthlyQuery = '';
    
    if (period === 'month') {
      monthlyQuery = `
        SELECT 
          MONTH(b.created_at) as month,
          YEAR(b.created_at) as year,
          COUNT(*) as total_bookings,
          SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN b.status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(b.total_amount) as revenue,
          AVG(b.total_amount) as average_booking_value,
          COUNT(DISTINCT b.tenant_id) as unique_tenants
        FROM bookings b
        INNER JOIN properties p ON b.property_id = p.id
        WHERE p.landlord_id = ?
          AND YEAR(b.created_at) = ?
        GROUP BY YEAR(b.created_at), MONTH(b.created_at)
        ORDER BY year DESC, month DESC
      `;
    } else {
      monthlyQuery = `
        SELECT 
          YEAR(b.created_at) as year,
          COUNT(*) as total_bookings,
          SUM(b.total_amount) as revenue,
          COUNT(DISTINCT b.tenant_id) as unique_tenants
        FROM bookings b
        INNER JOIN properties p ON b.property_id = p.id
        WHERE p.landlord_id = ?
        GROUP BY YEAR(b.created_at)
        ORDER BY year DESC
      `;
    }

    const monthlyStats = await isanzureQuery(monthlyQuery, period === 'month' ? [landlord.id, year] : [landlord.id]);

    // Get booking by property
    const propertyStats = await isanzureQuery(`
      SELECT 
        p.id,
        p.property_uid,
        p.title,
        p.property_type,
        p.province,
        p.district,
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN b.status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        COALESCE(AVG(b.total_amount), 0) as avg_booking_value,
        COUNT(DISTINCT b.tenant_id) as unique_tenants,
        (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image
      FROM properties p
      LEFT JOIN bookings b ON p.id = b.property_id
      WHERE p.landlord_id = ?
        AND p.status = 'active'
      GROUP BY p.id
      ORDER BY total_bookings DESC
    `, [landlord.id]);

    // Get booking by status
    const statusBreakdown = await isanzureQuery(`
      SELECT 
        b.status,
        COUNT(*) as count,
        SUM(b.total_amount) as total_revenue
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
      GROUP BY b.status
    `, [landlord.id]);

    // Get recent activity
    const recentActivity = await isanzureQuery(`
      SELECT 
        b.id,
        b.booking_uid,
        b.status,
        b.total_amount,
        b.created_at,
        b.confirmed_at,
        b.cancelled_at,
        b.check_in_at,
        b.check_out_at,
        p.title as property_title,
        p.property_uid as property_uid,
        CONCAT(COALESCE(sso.first_name, 'Tenant'), ' ', COALESCE(sso.last_name, '')) as tenant_name,
        sso.profile_avatar_url as tenant_avatar
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso ON t.oliviuus_user_id = sso.id
      WHERE p.landlord_id = ?
      ORDER BY b.created_at DESC
      LIMIT 20
    `, [landlord.id]);

    // Get upcoming check-ins
    const upcomingCheckins = await isanzureQuery(`
      SELECT 
        b.id,
        b.booking_uid,
        b.start_date,
        b.end_date,
        b.total_amount,
        p.title as property_title,
        p.property_uid,
        CONCAT(COALESCE(sso.first_name, 'Tenant'), ' ', COALESCE(sso.last_name, '')) as tenant_name,
        sso.profile_avatar_url as tenant_avatar,
        sso.phone as tenant_phone
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso ON t.oliviuus_user_id = sso.id
      WHERE p.landlord_id = ?
        AND b.status IN ('confirmed', 'active')
        AND b.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY b.start_date ASC
    `, [landlord.id]);

    // Get occupancy rate
    const occupancyQuery = `
      SELECT 
        p.id,
        p.title,
        COUNT(DISTINCT b.id) as bookings_count,
        SUM(DATEDIFF(LEAST(b.end_date, DATE_ADD(CURDATE(), INTERVAL 30 DAY)), 
                     GREATEST(b.start_date, CURDATE()))) as occupied_days,
        ROUND(
          (SUM(DATEDIFF(LEAST(b.end_date, DATE_ADD(CURDATE(), INTERVAL 30 DAY)), 
                       GREATEST(b.start_date, CURDATE()))) / 30) * 100, 
          1
        ) as occupancy_rate
      FROM properties p
      LEFT JOIN bookings b ON p.id = b.property_id
        AND b.status IN ('confirmed', 'active')
        AND b.start_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND b.end_date >= CURDATE()
      WHERE p.landlord_id = ?
        AND p.status = 'active'
      GROUP BY p.id
    `;

    const occupancyRates = await isanzureQuery(occupancyQuery, [landlord.id]);

    res.status(200).json({
      success: true,
      data: {
        overview: overallStats,
        monthly: monthlyStats,
        by_property: propertyStats,
        by_status: statusBreakdown,
        recent_activity: recentActivity,
        upcoming_checkins: upcomingCheckins,
        occupancy_rates: occupancyRates,
        period: {
          type: period,
          year: parseInt(year)
        }
      }
    });

  } catch (error) {
    debugLog('❌ Error fetching booking analytics:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking analytics',
      code: 'ANALYTICS_FETCH_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 7. GET PENDING REQUESTS (Extensions, Cancellations)
// ============================================
exports.getPendingRequests = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    debugLog('📋 Fetching pending requests for landlord:', landlord.id);

    // Get pending extension requests
    const extensions = await isanzureQuery(`
      SELECT 
        be.id,
        be.extension_uid,
        be.additional_periods,
        be.new_end_date,
        be.additional_amount,
        be.status,
        be.created_at as requested_at,
        b.id as booking_id,
        b.booking_uid,
        b.start_date,
        b.end_date as current_end_date,
        b.booking_period,
        b.total_amount,
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        p.province,
        p.district,
        (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as property_image,
        t.id as tenant_id,
        t.user_uid as tenant_uid,
        CONCAT(COALESCE(sso.first_name, 'Tenant'), ' ', COALESCE(sso.last_name, '')) as tenant_name,
        sso.profile_avatar_url as tenant_avatar
      FROM booking_extensions be
      INNER JOIN bookings b ON be.original_booking_id = b.id
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso ON t.oliviuus_user_id = sso.id
      WHERE p.landlord_id = ?
        AND be.status = 'requested'
      ORDER BY be.created_at DESC
    `, [landlord.id]);

    // Get pending cancellations
    const cancellations = await isanzureQuery(`
      SELECT 
        bc.id,
        bc.cancellation_uid,
        bc.reason,
        bc.refund_amount,
        bc.platform_fee_kept,
        bc.cancellation_policy_applied,
        bc.status,
        bc.created_at as requested_at,
        b.id as booking_id,
        b.booking_uid,
        b.start_date,
        b.end_date,
        b.total_amount,
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as property_image,
        t.id as tenant_id,
        t.user_uid as tenant_uid,
        CONCAT(COALESCE(sso.first_name, 'Tenant'), ' ', COALESCE(sso.last_name, '')) as tenant_name,
        sso.profile_avatar_url as tenant_avatar
      FROM booking_cancellations bc
      INNER JOIN bookings b ON bc.booking_id = b.id
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso ON t.oliviuus_user_id = sso.id
      WHERE p.landlord_id = ?
        AND bc.status = 'pending'
      ORDER BY bc.created_at DESC
    `, [landlord.id]);

    debugLog(`✅ Found ${extensions.length} extension requests and ${cancellations.length} cancellation requests`);

    res.status(200).json({
      success: true,
      data: {
        extensions,
        cancellations,
        total: extensions.length + cancellations.length,
        counts: {
          extensions: extensions.length,
          cancellations: cancellations.length
        }
      }
    });

  } catch (error) {
    debugLog('❌ Error fetching pending requests:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests',
      code: 'FETCH_REQUESTS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 8. GET PROPERTY BOOKING CALENDAR
// ============================================
exports.getPropertyBookingCalendar = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const { propertyUid, month, year } = req.query;

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required',
        code: 'MISSING_PROPERTY_UID'
      });
    }

    debugLog('📅 Fetching booking calendar:', { propertyUid, month, year, landlordId: landlord.id });

    // Verify property belongs to landlord
    const propertyQuery = `
      SELECT id, title, property_uid
      FROM properties
      WHERE property_uid = ? AND landlord_id = ?
    `;

    const properties = await isanzureQuery(propertyQuery, [propertyUid, landlord.id]);

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or access denied',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    const property = properties[0];

    // Build date filter
    let dateFilter = '';
    let params = [property.id];

    if (month && year) {
      dateFilter = 'AND MONTH(b.start_date) = ? AND YEAR(b.start_date) = ?';
      params.push(parseInt(month), parseInt(year));
    }

    // Get all bookings for the property
    const bookings = await isanzureQuery(`
      SELECT 
        b.id,
        b.booking_uid,
        b.start_date,
        b.end_date,
        b.status,
        b.total_amount,
        CONCAT(COALESCE(sso.first_name, 'Tenant'), ' ', COALESCE(sso.last_name, '')) as tenant_name,
        sso.profile_avatar_url as tenant_avatar
      FROM bookings b
      INNER JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso ON t.oliviuus_user_id = sso.id
      WHERE b.property_id = ?
        AND b.status IN ('confirmed', 'active')
        ${dateFilter}
      ORDER BY b.start_date ASC
    `, params);

    // Get unavailable dates
    const unavailable = await isanzureQuery(`
      SELECT date, status, reason
      FROM property_unavailable_dates
      WHERE property_id = ?
        ${dateFilter.replace(/b\.start_date/g, 'date')}
      ORDER BY date ASC
    `, params);

    debugLog(`✅ Found ${bookings.length} bookings and ${unavailable.length} unavailable dates`);

    res.status(200).json({
      success: true,
      data: {
        property: {
          id: property.id,
          uid: property.property_uid,
          title: property.title
        },
        bookings,
        unavailable_dates: unavailable,
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null
      }
    });

  } catch (error) {
    debugLog('❌ Error fetching booking calendar:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking calendar',
      code: 'CALENDAR_FETCH_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 9. GET BOOKING EXPORT DATA (CSV/PDF)
// ============================================
exports.exportBookings = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const { format = 'json', status, startDate, endDate } = req.query;

    debugLog('📊 Exporting bookings:', { landlordId: landlord.id, format, status, startDate, endDate });

    // Build query
    let query = `
      SELECT 
        b.booking_uid as reference,
        b.status,
        b.booking_period as period,
        b.start_date,
        b.end_date,
        b.duration,
        b.total_amount as amount,
        DATE(b.created_at) as booking_date,
        DATE(b.confirmed_at) as confirmed_date,
        DATE(b.cancelled_at) as cancelled_date,
        DATE(b.check_in_at) as check_in_date,
        DATE(b.check_out_at) as check_out_date,
        p.title as property_name,
        p.property_uid,
        p.province,
        p.district,
        p.sector,
        CONCAT(COALESCE(sso.first_name, ''), ' ', COALESCE(sso.last_name, '')) as tenant_name,
        sso.email as tenant_email,
        sso.phone as tenant_phone,
        t.public_phone as tenant_public_phone,
        t.public_email as tenant_public_email
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso ON t.oliviuus_user_id = sso.id
      WHERE p.landlord_id = ?
    `;

    const params = [landlord.id];

    if (status) {
      const statusArray = status.split(',');
      query += ` AND b.status IN (${statusArray.map(() => '?').join(',')})`;
      params.push(...statusArray);
    }

    if (startDate) {
      query += ` AND b.start_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND b.end_date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY b.created_at DESC`;

    const bookings = await isanzureQuery(query, params);

    if (format === 'csv') {
      // Format as CSV
      const headers = [
        'Reference', 'Status', 'Period', 'Start Date', 'End Date', 
        'Duration', 'Amount (RWF)', 'Booking Date', 'Property', 
        'Location', 'Tenant Name', 'Tenant Email', 'Tenant Phone'
      ];

      const csvRows = [];
      csvRows.push(headers.join(','));

      bookings.forEach(booking => {
        const row = [
          booking.reference,
          booking.status,
          booking.period,
          booking.start_date,
          booking.end_date,
          booking.duration,
          booking.amount,
          booking.booking_date,
          booking.property_name,
          `${booking.district || ''}, ${booking.province || ''}`,
          booking.tenant_name?.trim() || 'N/A',
          booking.tenant_email || booking.tenant_public_email || 'N/A',
          booking.tenant_phone || booking.tenant_public_phone || 'N/A'
        ].map(cell => `"${cell || ''}"`);

        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=bookings-export-${Date.now()}.csv`);
      res.status(200).send(csvString);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        data: bookings,
        count: bookings.length,
        exported_at: new Date().toISOString()
      });
    }

  } catch (error) {
    debugLog('❌ Error exporting bookings:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to export bookings',
      code: 'EXPORT_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 10. SEND MESSAGE TO TENANT
// ============================================
exports.sendMessageToTenant = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const { bookingId } = req.params;
    const { message, type = 'chat' } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
        code: 'MISSING_BOOKING_ID'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }

    debugLog('📨 Sending message to tenant:', { bookingId, landlordId: landlord.id });

    // Verify booking belongs to landlord
    const verifyQuery = `
      SELECT b.id, b.tenant_id, t.oliviuus_user_id,
             p.title as property_title
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN users t ON b.tenant_id = t.id
      WHERE (b.id = ? OR b.booking_uid = ?)
        AND p.landlord_id = ?
    `;

    const bookings = await isanzureQuery(verifyQuery, [bookingId, bookingId, landlord.id]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    const booking = bookings[0];

    // Insert message
    const insertQuery = `
      INSERT INTO messages (
        message_uid,
        sender_id,
        receiver_id,
        booking_id,
        message_type,
        content,
        created_at
      ) VALUES (
        UUID(),
        ?,
        ?,
        ?,
        ?,
        ?,
        UTC_TIMESTAMP()
      )
    `;

    const result = await isanzureQuery(insertQuery, [
      landlord.id,
      booking.tenant_id,
      booking.id,
      type,
      message.trim()
    ]);

    // Get message UID
    const messageUid = await isanzureQuery(
      'SELECT message_uid FROM messages WHERE id = ?',
      [result.insertId]
    );

    // Send notification if tenant has oliviuus ID
    if (booking.oliviuus_user_id) {
      try {
        await oliviuusQuery(`
          INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())
        `, [
          booking.oliviuus_user_id,
          'new_message',
          `New message from landlord`,
          `You have a new message regarding ${booking.property_title}`,
          JSON.stringify({
            booking_id: booking.id,
            message_id: result.insertId,
            message_uid: messageUid[0]?.message_uid,
            sender: landlord.full_name,
            property: booking.property_title
          })
        ]);
      } catch (notifyError) {
        debugLog('⚠️ Failed to send notification:', notifyError.message);
      }
    }

    debugLog('✅ Message sent successfully:', {
      messageId: result.insertId,
      bookingId: booking.id
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message_id: result.insertId,
        message_uid: messageUid[0]?.message_uid,
        sent_at: new Date().toISOString()
      }
    });

  } catch (error) {
    debugLog('❌ Error sending message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      code: 'SEND_MESSAGE_FAILED',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get landlord booking statistics
const getLandlordBookingStats = async (landlordId) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN b.status = 'active' THEN 1 ELSE 0 END) as active_bookings,
        SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN MONTH(b.created_at) = MONTH(CURDATE()) AND YEAR(b.created_at) = YEAR(CURDATE()) 
                     THEN b.total_amount ELSE 0 END), 0) as monthly_revenue,
        COUNT(DISTINCT b.tenant_id) as unique_tenants,
        COUNT(DISTINCT p.id) as active_properties_with_bookings,
        AVG(b.total_amount) as average_booking_value,
        AVG(b.duration) as average_stay_duration
      FROM bookings b
      RIGHT JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
        AND p.status = 'active'
    `;

    const stats = await isanzureQuery(statsQuery, [landlordId]);
    
    return stats[0] || {
      total_bookings: 0,
      pending_bookings: 0,
      confirmed_bookings: 0,
      active_bookings: 0,
      completed_bookings: 0,
      cancelled_bookings: 0,
      total_revenue: 0,
      monthly_revenue: 0,
      unique_tenants: 0,
      active_properties_with_bookings: 0,
      average_booking_value: 0,
      average_stay_duration: 0
    };
  } catch (error) {
    debugLog('Error getting landlord stats:', error.message);
    return {
      total_bookings: 0,
      pending_bookings: 0,
      confirmed_bookings: 0,
      active_bookings: 0,
      completed_bookings: 0,
      cancelled_bookings: 0,
      total_revenue: 0,
      monthly_revenue: 0,
      unique_tenants: 0,
      active_properties_with_bookings: 0,
      average_booking_value: 0,
      average_stay_duration: 0
    };
  }
};

// Get status title for notifications
const getStatusTitle = (status) => {
  const titles = {
    'confirmed': 'Confirmed',
    'cancelled': 'Cancelled',
    'completed': 'Completed'
  };
  return titles[status] || status;
};

// Get status message for notifications
const getStatusMessage = (status, propertyTitle, reason) => {
  const messages = {
    'confirmed': `Your booking for ${propertyTitle} has been confirmed by the landlord.`,
    'cancelled': `Your booking for ${propertyTitle} has been cancelled by the landlord.${reason ? ` Reason: ${reason}` : ''}`,
    'completed': `Your stay at ${propertyTitle} has been marked as completed. Thank you for choosing iSanzure!`
  };
  return messages[status] || `Booking status updated to ${status}`;
};

// Get extension message for notifications
const getExtensionMessage = (action, propertyTitle, periods, periodType, note) => {
  if (action === 'approved') {
    return `Your extension request for ${propertyTitle} has been approved. Your stay has been extended by ${periods} ${periodType}(s).${note ? ` Note: ${note}` : ''}`;
  } else {
    return `Your extension request for ${propertyTitle} has been declined.${note ? ` Reason: ${note}` : ''}`;
  }
};

module.exports = exports;