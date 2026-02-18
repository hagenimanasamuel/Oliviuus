// backend/controllers/isanzure/landlordTenantController.js - FIXED VERSION
const { isanzureQuery } = require('../../config/isanzureDbConfig');
const { query: oliviuusQuery } = require('../../config/dbConfig');

// Debug helper
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 👥 ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 👥 ${message}`);
  }
};

// ============================================
// 1. GET AUTHENTICATED LANDLORD - FIXED like message controller
// ============================================
const getAuthenticatedLandlord = async (req) => {
  try {
    const userId = req.user?.id || req.user?.oliviuus_id;
    
    if (!userId) {
      debugLog('❌ No authenticated user found');
      return null;
    }

    debugLog('🔍 Looking up landlord in iSanzure:', userId);

    const sql = `
      SELECT 
        u.id,
        u.user_uid,
        u.oliviuus_user_id,
        u.user_type,
        u.public_phone,
        u.public_email,
        u.id_verified,
        u.verification_status,
        u.is_active,
        COALESCE(sso.first_name, 'Landlord') as first_name,
        COALESCE(sso.last_name, '') as last_name,
        COALESCE(sso.username, CONCAT('landlord-', u.id)) as username,
        CONCAT(
          COALESCE(sso.first_name, 'Landlord'),
          ' ',
          COALESCE(sso.last_name, '')
        ) as full_name,
        sso.profile_avatar_url as avatar
      FROM users u
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      WHERE u.oliviuus_user_id = ?
        AND u.user_type IN ('landlord', 'property_manager', 'agent')
        AND u.is_active = 1
      LIMIT 1
    `;

    const landlords = await isanzureQuery(sql, [userId]);

    if (landlords.length === 0) {
      debugLog('❌ User is not a landlord');
      return null;
    }

    return landlords[0];
  } catch (error) {
    debugLog('❌ Error getting landlord:', error.message);
    return null;
  }
};

// ============================================
// 2. GET TENANTS STATISTICS - FIXED
// ============================================
exports.getTenantStats = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    debugLog('📊 Fetching tenant stats for landlord:', landlord.id);

    // Get current tenants (active bookings)
    const currentTenantsQuery = `
      SELECT COUNT(DISTINCT b.tenant_id) as count
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
        AND b.status IN ('confirmed', 'active')
        AND b.start_date <= CURDATE()
        AND b.end_date >= CURDATE()
    `;

    // Get total tenants (all time)
    const totalTenantsQuery = `
      SELECT COUNT(DISTINCT b.tenant_id) as count
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
    `;

    // Get past tenants
    const pastTenantsQuery = `
      SELECT COUNT(DISTINCT b.tenant_id) as count
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
        AND b.status = 'completed'
        AND b.end_date < CURDATE()
    `;

    // Get new tenants this month
    const newTenantsQuery = `
      SELECT COUNT(DISTINCT b.tenant_id) as count
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
        AND b.created_at >= DATE_FORMAT(CURDATE() ,'%Y-%m-01')
    `;

    // Get active properties
    const activePropertiesQuery = `
      SELECT COUNT(*) as count
      FROM properties p
      WHERE p.landlord_id = ?
        AND p.status = 'active'
    `;

    // Get active bookings count
    const activeBookingsQuery = `
      SELECT COUNT(*) as count
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
        AND b.status IN ('confirmed', 'active')
    `;

    // Get monthly revenue
    const monthlyRevenueQuery = `
      SELECT COALESCE(SUM(b.total_amount), 0) as total
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
        AND b.status IN ('completed', 'active')
        AND MONTH(b.created_at) = MONTH(CURDATE())
        AND YEAR(b.created_at) = YEAR(CURDATE())
    `;

    // Get average stay duration
    const avgStayQuery = `
      SELECT COALESCE(AVG(DATEDIFF(b.end_date, b.start_date)), 0) as avg_days
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
        AND b.status = 'completed'
    `;

    // Get retention rate (tenants who booked again)
    const retentionQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN booking_count > 1 THEN tenant_id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT tenant_id), 0) as retention_rate
      FROM (
        SELECT b.tenant_id, COUNT(*) as booking_count
        FROM bookings b
        INNER JOIN properties p ON b.property_id = p.id
        WHERE p.landlord_id = ?
        GROUP BY b.tenant_id
      ) as tenant_bookings
    `;

    const [
      currentResult,
      totalResult,
      pastResult,
      newResult,
      propertiesResult,
      bookingsResult,
      revenueResult,
      avgStayResult,
      retentionResult
    ] = await Promise.all([
      isanzureQuery(currentTenantsQuery, [landlord.id]),
      isanzureQuery(totalTenantsQuery, [landlord.id]),
      isanzureQuery(pastTenantsQuery, [landlord.id]),
      isanzureQuery(newTenantsQuery, [landlord.id]),
      isanzureQuery(activePropertiesQuery, [landlord.id]),
      isanzureQuery(activeBookingsQuery, [landlord.id]),
      isanzureQuery(monthlyRevenueQuery, [landlord.id]),
      isanzureQuery(avgStayQuery, [landlord.id]),
      isanzureQuery(retentionQuery, [landlord.id])
    ]);

    const stats = {
      current_tenants: parseInt(currentResult[0]?.count) || 0,
      total_tenants: parseInt(totalResult[0]?.count) || 0,
      past_tenants: parseInt(pastResult[0]?.count) || 0,
      new_this_month: parseInt(newResult[0]?.count) || 0,
      active_properties: parseInt(propertiesResult[0]?.count) || 0,
      active_bookings: parseInt(bookingsResult[0]?.count) || 0,
      monthly_revenue: parseFloat(revenueResult[0]?.total) || 0,
      avg_stay_duration: Math.round(parseFloat(avgStayResult[0]?.avg_days)) || 0,
      retention_rate: Math.round(parseFloat(retentionResult[0]?.retention_rate)) || 0
    };

    debugLog('✅ Tenant stats fetched successfully', stats);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    debugLog('❌ Error fetching tenant stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant statistics',
      code: 'STATS_FETCH_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 3. GET ALL TENANTS - FIXED like message controller style
// ============================================
exports.getTenants = async (req, res) => {
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
      type = 'current', // 'current', 'past', 'all'
      search = '',
      propertyId = '',
      verificationStatus = '',
      sortBy = 'recent',
      limit = 12,
      offset = 0
    } = req.query;

    debugLog('📋 Fetching tenants for landlord:', {
      landlordId: landlord.id,
      type,
      search,
      propertyId,
      verificationStatus,
      sortBy
    });

    // First, get all distinct tenant IDs from bookings of this landlord
    let tenantIdsQuery = `
      SELECT DISTINCT 
        b.tenant_id,
        MAX(b.created_at) as last_booking_date
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
    `;

    const tenantIdParams = [landlord.id];

    if (type === 'current') {
      tenantIdsQuery += ` AND b.status IN ('confirmed', 'active')
                          AND b.start_date <= CURDATE()
                          AND b.end_date >= CURDATE()`;
    } else if (type === 'past') {
      tenantIdsQuery += ` AND (b.status = 'completed' OR b.end_date < CURDATE())`;
    }

    if (propertyId) {
      tenantIdsQuery += ` AND p.id = ?`;
      tenantIdParams.push(propertyId);
    }

    tenantIdsQuery += ` GROUP BY b.tenant_id ORDER BY last_booking_date DESC`;

    const tenantIds = await isanzureQuery(tenantIdsQuery, tenantIdParams);
    
    if (tenantIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          tenants: [],
          pagination: {
            total: 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: false
          }
        }
      });
    }

    // Get total count
    const total = tenantIds.length;

    // Apply pagination to tenant IDs
    const paginatedTenantIds = tenantIds.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    if (paginatedTenantIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          tenants: [],
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < total
          }
        }
      });
    }

    // Get full tenant details for the paginated IDs
    const placeholders = paginatedTenantIds.map(() => '?').join(',');
    const tenantIdsList = paginatedTenantIds.map(t => t.tenant_id);

    const tenantsQuery = `
      SELECT 
        u.id,
        u.user_uid,
        u.oliviuus_user_id,
        u.public_phone,
        u.public_email,
        u.id_verified,
        u.verification_status,
        u.created_at as member_since,
        
        -- SSO details
        sso.first_name,
        sso.last_name,
        sso.username,
        sso.profile_avatar_url as avatar,
        sso.email,
        sso.phone,
        CONCAT(
          COALESCE(sso.first_name, 'Tenant'),
          ' ',
          COALESCE(sso.last_name, '')
        ) as full_name
        
      FROM users u
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      WHERE u.id IN (${placeholders})
    `;

    const tenants = await isanzureQuery(tenantsQuery, tenantIdsList);

    // For each tenant, get their current booking, stats, etc.
    const formattedTenants = await Promise.all(tenants.map(async (tenant) => {
      
      // Get current booking
      const currentBookingQuery = `
        SELECT 
          b.id,
          b.booking_uid,
          b.start_date,
          b.end_date,
          b.duration,
          b.booking_period,
          b.total_amount,
          b.status,
          p.id as property_id,
          p.property_uid,
          p.title as property_title,
          (
            SELECT JSON_OBJECT(
              'status', bp.status,
              'amount', bp.amount,
              'paid_at', bp.paid_at
            )
            FROM booking_payments bp
            WHERE bp.booking_id = b.id
            ORDER BY bp.created_at DESC
            LIMIT 1
          ) as payment
        FROM bookings b
        INNER JOIN properties p ON b.property_id = p.id
        WHERE b.tenant_id = ?
          AND p.landlord_id = ?
          AND b.status IN ('confirmed', 'active')
          AND b.start_date <= CURDATE()
          AND b.end_date >= CURDATE()
        ORDER BY b.created_at DESC
        LIMIT 1
      `;
      
      const currentBookings = await isanzureQuery(currentBookingQuery, [tenant.id, landlord.id]);
      let currentBooking = null;
      
      if (currentBookings.length > 0) {
        currentBooking = {
          ...currentBookings[0],
          payment: currentBookings[0].payment ? JSON.parse(currentBookings[0].payment) : null
        };
      }

      // Get total stays with this landlord
      const totalStaysQuery = `
        SELECT COUNT(*) as count
        FROM bookings b
        INNER JOIN properties p ON b.property_id = p.id
        WHERE b.tenant_id = ? AND p.landlord_id = ?
      `;
      const totalStaysResult = await isanzureQuery(totalStaysQuery, [tenant.id, landlord.id]);
      
      // Get total spent with this landlord
      const totalSpentQuery = `
        SELECT COALESCE(SUM(b.total_amount), 0) as total
        FROM bookings b
        INNER JOIN properties p ON b.property_id = p.id
        WHERE b.tenant_id = ? 
          AND p.landlord_id = ?
          AND b.status = 'completed'
      `;
      const totalSpentResult = await isanzureQuery(totalSpentQuery, [tenant.id, landlord.id]);
      
      // Get average stay duration with this landlord
      const avgStayQuery = `
        SELECT COALESCE(AVG(DATEDIFF(b.end_date, b.start_date)), 0) as avg_days
        FROM bookings b
        INNER JOIN properties p ON b.property_id = p.id
        WHERE b.tenant_id = ? 
          AND p.landlord_id = ?
          AND b.status = 'completed'
      `;
      const avgStayResult = await isanzureQuery(avgStayQuery, [tenant.id, landlord.id]);

      // Filter by verification status if needed
      if (verificationStatus) {
        const isVerified = tenant.id_verified === 1 || tenant.verification_status === 'approved';
        const isPending = tenant.verification_status === 'pending';
        const isUnverified = !isVerified && !isPending;

        if (verificationStatus === 'verified' && !isVerified) return null;
        if (verificationStatus === 'pending' && !isPending) return null;
        if (verificationStatus === 'unverified' && !isUnverified) return null;
      }

      // Filter by search if needed
      if (search) {
        const searchLower = search.toLowerCase();
        const fullName = tenant.full_name?.toLowerCase() || '';
        const email = (tenant.email || tenant.public_email || '').toLowerCase();
        const phone = (tenant.phone || tenant.public_phone || '').toLowerCase();
        
        const matches = fullName.includes(searchLower) || 
                        email.includes(searchLower) || 
                        phone.includes(searchLower);
        
        if (!matches) return null;
      }

      return {
        id: tenant.id,
        user_uid: tenant.user_uid,
        full_name: tenant.full_name?.trim() || 'Tenant',
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        username: tenant.username,
        avatar: tenant.avatar,
        phone: tenant.phone || tenant.public_phone,
        email: tenant.email || tenant.public_email,
        is_verified: tenant.id_verified === 1 || tenant.verification_status === 'approved',
        verification_status: tenant.verification_status || 'not_submitted',
        created_at: tenant.member_since,
        current_booking: currentBooking,
        total_stays: parseInt(totalStaysResult[0]?.count) || 0,
        total_spent: parseFloat(totalSpentResult[0]?.total) || 0,
        avg_stay_duration: Math.round(parseFloat(avgStayResult[0]?.avg_days)) || 0
      };
    }));

    // Remove nulls (from filtering)
    const filteredTenants = formattedTenants.filter(t => t !== null);

    // Sort if needed
    if (sortBy === 'name') {
      filteredTenants.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (sortBy === 'name_desc') {
      filteredTenants.sort((a, b) => b.full_name.localeCompare(a.full_name));
    } else if (sortBy === 'stay_long') {
      filteredTenants.sort((a, b) => b.avg_stay_duration - a.avg_stay_duration);
    } else if (sortBy === 'stay_short') {
      filteredTenants.sort((a, b) => a.avg_stay_duration - b.avg_stay_duration);
    } else if (sortBy === 'payment_high') {
      filteredTenants.sort((a, b) => b.total_spent - a.total_spent);
    }

    debugLog(`✅ Found ${filteredTenants.length} tenants (total: ${total})`);

    res.status(200).json({
      success: true,
      data: {
        tenants: filteredTenants,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    debugLog('❌ Error fetching tenants:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants',
      code: 'FETCH_TENANTS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 4. GET SINGLE TENANT DETAILS - FIXED
// ============================================
exports.getTenantDetails = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const { tenantId } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    debugLog('📋 Fetching tenant details:', { tenantId, landlordId: landlord.id });

    // First, verify this tenant has booked with this landlord
    const verifyQuery = `
      SELECT DISTINCT b.tenant_id
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.tenant_id = ? AND p.landlord_id = ?
      LIMIT 1
    `;
    
    const verifyResult = await isanzureQuery(verifyQuery, [tenantId, landlord.id]);
    
    if (verifyResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or has no bookings with you',
        code: 'TENANT_NOT_FOUND'
      });
    }

    // Get basic tenant info
    const tenantQuery = `
      SELECT 
        u.id,
        u.user_uid,
        u.oliviuus_user_id,
        u.user_type,
        u.public_phone,
        u.public_email,
        u.id_verified,
        u.verification_status,
        u.verification_submitted_at,
        u.verification_processed_at,
        u.created_at,
        u.updated_at,
        
        -- SSO details
        sso.first_name,
        sso.last_name,
        sso.username,
        sso.profile_avatar_url as avatar,
        sso.email,
        sso.phone,
        sso.created_at as sso_created_at,
        CONCAT(
          COALESCE(sso.first_name, 'Tenant'),
          ' ',
          COALESCE(sso.last_name, '')
        ) as full_name
        
      FROM users u
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      WHERE u.id = ?
    `;

    const tenants = await isanzureQuery(tenantQuery, [tenantId]);

    if (tenants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
    }

    const tenant = tenants[0];

    // Get stats with this landlord
    const totalStaysQuery = `
      SELECT COUNT(*) as count
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.tenant_id = ? AND p.landlord_id = ?
    `;
    const totalStaysResult = await isanzureQuery(totalStaysQuery, [tenantId, landlord.id]);
    
    const totalSpentQuery = `
      SELECT COALESCE(SUM(b.total_amount), 0) as total
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.tenant_id = ? 
        AND p.landlord_id = ?
        AND b.status = 'completed'
    `;
    const totalSpentResult = await isanzureQuery(totalSpentQuery, [tenantId, landlord.id]);
    
    const avgStayQuery = `
      SELECT COALESCE(AVG(DATEDIFF(b.end_date, b.start_date)), 0) as avg_days
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.tenant_id = ? 
        AND p.landlord_id = ?
        AND b.status = 'completed'
    `;
    const avgStayResult = await isanzureQuery(avgStayQuery, [tenantId, landlord.id]);

    // Get current booking
    const currentBookingQuery = `
      SELECT 
        b.id,
        b.booking_uid,
        b.start_date,
        b.end_date,
        b.duration,
        b.booking_period,
        b.total_amount,
        b.status,
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        (
          SELECT JSON_OBJECT(
            'id', bp.id,
            'payment_uid', bp.payment_uid,
            'status', bp.status,
            'amount', bp.amount,
            'paid_at', bp.paid_at,
            'due_date', bp.due_date,
            'payment_type', bp.payment_type
          )
          FROM booking_payments bp
          WHERE bp.booking_id = b.id
          ORDER BY bp.created_at DESC
          LIMIT 1
        ) as payment
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.tenant_id = ?
        AND p.landlord_id = ?
        AND b.status IN ('confirmed', 'active')
        AND b.start_date <= CURDATE()
        AND b.end_date >= CURDATE()
      ORDER BY b.created_at DESC
      LIMIT 1
    `;
    
    const currentBookings = await isanzureQuery(currentBookingQuery, [tenantId, landlord.id]);
    let currentBooking = null;
    
    if (currentBookings.length > 0) {
      currentBooking = {
        ...currentBookings[0],
        payment: currentBookings[0].payment ? JSON.parse(currentBookings[0].payment) : null
      };
    }

    // Get recent bookings with this landlord
    const recentBookingsQuery = `
      SELECT 
        b.id,
        b.booking_uid,
        b.start_date,
        b.end_date,
        b.duration,
        b.booking_period,
        b.total_amount,
        b.status,
        b.created_at,
        b.confirmed_at,
        b.check_in_at,
        b.check_out_at,
        b.cancelled_at,
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        p.address,
        p.district,
        (
          SELECT pi.image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id AND pi.is_cover = 1 
          LIMIT 1
        ) as property_image,
        (
          SELECT JSON_OBJECT(
            'status', bp.status,
            'amount', bp.amount,
            'paid_at', bp.paid_at,
            'payment_type', bp.payment_type
          )
          FROM booking_payments bp
          WHERE bp.booking_id = b.id
          ORDER BY bp.created_at DESC
          LIMIT 1
        ) as payment
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.tenant_id = ?
        AND p.landlord_id = ?
      ORDER BY b.created_at DESC
      LIMIT 10
    `;

    const recentBookings = await isanzureQuery(recentBookingsQuery, [tenantId, landlord.id]);

    // Format the response
    const formattedTenant = {
      id: tenant.id,
      user_uid: tenant.user_uid,
      full_name: tenant.full_name?.trim() || 'Tenant',
      first_name: tenant.first_name,
      last_name: tenant.last_name,
      username: tenant.username,
      avatar: tenant.avatar,
      phone: tenant.phone || tenant.public_phone,
      email: tenant.email || tenant.public_email,
      is_verified: tenant.id_verified === 1 || tenant.verification_status === 'approved',
      verification_status: tenant.verification_status || 'not_submitted',
      verification_submitted_at: tenant.verification_submitted_at,
      verification_processed_at: tenant.verification_processed_at,
      created_at: tenant.created_at,
      updated_at: tenant.updated_at,
      sso_created_at: tenant.sso_created_at,
      total_stays: parseInt(totalStaysResult[0]?.count) || 0,
      total_spent: parseFloat(totalSpentResult[0]?.total) || 0,
      avg_stay_duration: Math.round(parseFloat(avgStayResult[0]?.avg_days)) || 0,
      current_booking: currentBooking,
      recent_bookings: recentBookings.map(booking => ({
        ...booking,
        payment: booking.payment ? JSON.parse(booking.payment) : null
      }))
    };

    debugLog('✅ Tenant details fetched successfully:', {
      tenantId: formattedTenant.id,
      name: formattedTenant.full_name
    });

    res.status(200).json({
      success: true,
      data: formattedTenant
    });

  } catch (error) {
    debugLog('❌ Error fetching tenant details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant details',
      code: 'FETCH_TENANT_DETAILS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 5. GET TENANT STAY HISTORY - FIXED
// ============================================
exports.getTenantHistory = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const { tenantId } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    debugLog('📋 Fetching tenant history:', { tenantId, landlordId: landlord.id });

    const historyQuery = `
      SELECT 
        b.id,
        b.booking_uid,
        b.start_date,
        b.end_date,
        b.duration,
        b.booking_period,
        b.total_amount,
        b.status,
        b.created_at,
        b.confirmed_at,
        b.check_in_at,
        b.check_out_at,
        b.cancelled_at,
        
        -- Property details
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        p.address,
        p.district,
        p.province,
        (
          SELECT pi.image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id AND pi.is_cover = 1 
          LIMIT 1
        ) as property_image,
        
        -- Payment info
        (
          SELECT JSON_OBJECT(
            'id', bp.id,
            'payment_uid', bp.payment_uid,
            'status', bp.status,
            'amount', bp.amount,
            'paid_at', bp.paid_at,
            'due_date', bp.due_date,
            'payment_type', bp.payment_type
          )
          FROM booking_payments bp
          WHERE bp.booking_id = b.id
          ORDER BY bp.created_at DESC
          LIMIT 1
        ) as payment,
        
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
        ) as extensions,
        
        -- Cancellation info
        (
          SELECT JSON_OBJECT(
            'id', bc.id,
            'cancellation_uid', bc.cancellation_uid,
            'reason', bc.reason,
            'refund_amount', bc.refund_amount,
            'platform_fee_kept', bc.platform_fee_kept,
            'cancellation_policy_applied', bc.cancellation_policy_applied,
            'status', bc.status,
            'created_at', bc.created_at,
            'processed_at', bc.processed_at
          )
          FROM booking_cancellations bc
          WHERE bc.booking_id = b.id
          LIMIT 1
        ) as cancellation
        
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.tenant_id = ?
        AND p.landlord_id = ?
      ORDER BY b.created_at DESC
    `;

    const history = await isanzureQuery(historyQuery, [tenantId, landlord.id]);

    // Format the response
    const formattedHistory = history.map(item => ({
      id: item.id,
      booking_uid: item.booking_uid,
      start_date: item.start_date,
      end_date: item.end_date,
      duration: item.duration,
      booking_period: item.booking_period,
      total_amount: parseFloat(item.total_amount),
      status: item.status,
      created_at: item.created_at,
      confirmed_at: item.confirmed_at,
      check_in_at: item.check_in_at,
      check_out_at: item.check_out_at,
      cancelled_at: item.cancelled_at,
      property: {
        id: item.property_id,
        uid: item.property_uid,
        title: item.property_title,
        address: item.address,
        district: item.district,
        province: item.province,
        image: item.property_image
      },
      payment: item.payment ? JSON.parse(item.payment) : null,
      extensions: item.extensions ? JSON.parse(item.extensions) : [],
      cancellation: item.cancellation ? JSON.parse(item.cancellation) : null
    }));

    debugLog(`✅ Found ${formattedHistory.length} history items for tenant ${tenantId}`);

    res.status(200).json({
      success: true,
      data: formattedHistory
    });

  } catch (error) {
    debugLog('❌ Error fetching tenant history:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant history',
      code: 'FETCH_HISTORY_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 6. SEND MESSAGE TO TENANT - FIXED like message controller
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

    const { tenantId } = req.params;
    const { message } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }

    debugLog('📨 Sending message to tenant:', { tenantId, landlordId: landlord.id });

    // Verify tenant has booked with this landlord
    const verifyQuery = `
      SELECT DISTINCT b.tenant_id
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.tenant_id = ? AND p.landlord_id = ?
      LIMIT 1
    `;

    const verifyResult = await isanzureQuery(verifyQuery, [tenantId, landlord.id]);

    if (verifyResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or has no bookings with you',
        code: 'TENANT_NOT_FOUND'
      });
    }

    // Insert message
    const insertQuery = `
      INSERT INTO messages (
        message_uid,
        sender_id,
        receiver_id,
        message_type,
        content,
        created_at,
        is_read
      ) VALUES (
        UUID(),
        ?,
        ?,
        'chat',
        ?,
        UTC_TIMESTAMP(),
        0
      )
    `;

    const result = await isanzureQuery(insertQuery, [
      landlord.id,
      tenantId,
      message.trim()
    ]);

    // Get message UID
    const messageUid = await isanzureQuery(
      'SELECT message_uid FROM messages WHERE id = ?',
      [result.insertId]
    );

    // Get tenant's oliviuus_user_id for notification
    const tenantInfo = await isanzureQuery(`
      SELECT oliviuus_user_id FROM users WHERE id = ?
    `, [tenantId]);

    // Send notification if tenant has oliviuus ID
    if (tenantInfo.length > 0 && tenantInfo[0].oliviuus_user_id) {
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
          tenantInfo[0].oliviuus_user_id,
          'new_message',
          `New message from ${landlord.full_name || 'Landlord'}`,
          message.substring(0, 100) + (message.length > 100 ? '...' : ''),
          JSON.stringify({
            sender_id: landlord.id,
            sender_name: landlord.full_name,
            sender_avatar: landlord.avatar,
            message_id: result.insertId,
            message_uid: messageUid[0]?.message_uid
          })
        ]);
      } catch (notifyError) {
        debugLog('⚠️ Failed to send notification:', notifyError.message);
      }
    }

    debugLog('✅ Message sent successfully:', {
      messageId: result.insertId,
      tenantId
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
// 7. EXPORT TENANTS DATA - FIXED
// ============================================
exports.exportTenants = async (req, res) => {
  try {
    const landlord = await getAuthenticatedLandlord(req);
    
    if (!landlord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord access required.',
        code: 'LANDLORD_ACCESS_DENIED'
      });
    }

    const { type = 'all', format = 'csv' } = req.query;

    debugLog('📊 Exporting tenants:', { landlordId: landlord.id, type, format });

    // Build query
    let query = `
      SELECT DISTINCT
        u.id,
        CONCAT(COALESCE(sso.first_name, ''), ' ', COALESCE(sso.last_name, '')) as tenant_name,
        sso.email as tenant_email,
        sso.phone as tenant_phone,
        u.public_phone,
        u.public_email,
        CASE 
          WHEN u.id_verified = 1 OR u.verification_status = 'approved' THEN 'Verified'
          WHEN u.verification_status = 'pending' THEN 'Pending'
          ELSE 'Unverified'
        END as verification_status,
        u.created_at as member_since,
        COUNT(DISTINCT b.id) as total_stays,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END), 0) as total_spent,
        COALESCE(AVG(DATEDIFF(b.end_date, b.start_date)), 0) as avg_stay_duration,
        MAX(b.created_at) as last_booking_date,
        
        -- Current stay info
        MAX(CASE 
          WHEN b.status IN ('confirmed', 'active') 
            AND b.start_date <= CURDATE() 
            AND b.end_date >= CURDATE() 
          THEN p.title 
          ELSE NULL 
        END) as current_property,
        
        MAX(CASE 
          WHEN b.status IN ('confirmed', 'active') 
            AND b.start_date <= CURDATE() 
            AND b.end_date >= CURDATE() 
          THEN b.end_date 
          ELSE NULL 
        END) as current_stay_end
        
      FROM users u
      INNER JOIN bookings b ON u.id = b.tenant_id
      INNER JOIN properties p ON b.property_id = p.id
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      WHERE p.landlord_id = ?
    `;

    const params = [landlord.id];

    if (type === 'current') {
      query += ` AND b.status IN ('confirmed', 'active')
                 AND b.start_date <= CURDATE()
                 AND b.end_date >= CURDATE()`;
    } else if (type === 'past') {
      query += ` AND (b.status = 'completed' OR b.end_date < CURDATE())`;
    }

    query += ` GROUP BY u.id ORDER BY last_booking_date DESC`;

    const tenants = await isanzureQuery(query, params);

    if (format === 'csv') {
      // Format as CSV
      const headers = [
        'Tenant Name', 'Email', 'Phone', 'Public Phone', 'Public Email',
        'Verification Status', 'Member Since', 'Total Stays', 'Total Spent (RWF)',
        'Avg Stay (Days)', 'Last Booking', 'Current Property', 'Current Stay Ends'
      ];

      const csvRows = [];
      csvRows.push(headers.join(','));

      tenants.forEach(tenant => {
        const row = [
          tenant.tenant_name?.trim() || 'N/A',
          tenant.tenant_email || 'N/A',
          tenant.tenant_phone || 'N/A',
          tenant.public_phone || 'N/A',
          tenant.public_email || 'N/A',
          tenant.verification_status,
          tenant.member_since ? new Date(tenant.member_since).toISOString().split('T')[0] : 'N/A',
          tenant.total_stays || 0,
          tenant.total_spent || 0,
          Math.round(tenant.avg_stay_duration || 0),
          tenant.last_booking_date ? new Date(tenant.last_booking_date).toISOString().split('T')[0] : 'N/A',
          tenant.current_property || 'N/A',
          tenant.current_stay_end ? new Date(tenant.current_stay_end).toISOString().split('T')[0] : 'N/A'
        ].map(cell => `"${cell}"`);

        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=tenants-export-${type}-${Date.now()}.csv`);
      res.status(200).send(csvString);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        data: tenants,
        count: tenants.length,
        exported_at: new Date().toISOString()
      });
    }

  } catch (error) {
    debugLog('❌ Error exporting tenants:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to export tenants',
      code: 'EXPORT_FAILED',
      error: error.message
    });
  }
};

module.exports = exports;