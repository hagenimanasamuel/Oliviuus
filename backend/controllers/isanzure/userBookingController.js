// backend/controllers/isanzure/userBookingController.js
const { isanzureQuery } = require('../../config/isanzureDbConfig');
const mysql = require('mysql2');

const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 📅 ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 📅 ${message}`);
  }
};

// ============================================
// HELPER: GET DATABASE CONNECTION FOR TRANSACTIONS
// ============================================
const getConnection = () => {
  return new Promise((resolve, reject) => {
    const pool = require('../../config/isanzureDbConfig').isanzureDb;
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err);
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
};

// ============================================
// HELPER: GET AUTHENTICATED USER
// ============================================
const getAuthenticatedUser = async (req) => {
  try {
    const userId = req.user?.id || req.user?.oliviuus_id;
    if (!userId) return null;

    const sql = `
      SELECT 
        u.id,
        u.user_uid,
        u.oliviuus_user_id,
        u.user_type,
        u.public_phone,
        u.public_email,
        u.is_active,
        COALESCE(sso.first_name, 'User') as first_name,
        COALESCE(sso.last_name, '') as last_name,
        CONCAT(
          COALESCE(sso.first_name, 'User'),
          ' ',
          COALESCE(sso.last_name, '')
        ) as full_name,
        sso.profile_avatar_url as avatar
      FROM users u
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      WHERE u.oliviuus_user_id = ?
        AND u.is_active = 1
      LIMIT 1
    `;

    const users = await isanzureQuery(sql, [userId]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    debugLog('Error getting authenticated user:', error.message);
    return null;
  }
};

// ============================================
// HELPER: UPDATE USER BALANCE
// ============================================
const updateUserBalance = async (connection, userId, amount, type, reference) => {
  try {
    // Check if user balance exists
    const [existingBalance] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, balance_amount, pending_amount, on_hold_amount 
        FROM user_balances 
        WHERE user_id = ?
      `, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (existingBalance) {
      // Update existing balance
      await new Promise((resolve, reject) => {
        connection.query(`
          UPDATE user_balances 
          SET 
            balance_amount = balance_amount + ?,
            updated_at = NOW()
          WHERE user_id = ?
        `, [amount, userId], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    } else {
      // Create new balance record
      await new Promise((resolve, reject) => {
        connection.query(`
          INSERT INTO user_balances (
            user_id, 
            balance_amount, 
            pending_amount,
            on_hold_amount,
            currency_code, 
            updated_at
          ) VALUES (?, ?, 0, 0, 'RWF', NOW())
        `, [userId, amount], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    debugLog(`💰 Balance updated for user ${userId}: +${amount} (${type})`);
    return true;
  } catch (error) {
    debugLog(`❌ Error updating balance for user ${userId}:`, error.message);
    throw error;
  }
};

// ============================================
// HELPER: UPDATE PENDING BALANCE STATUS
// ============================================
const updatePendingBalanceStatus = async (connection, bookingId, newStatus, reason, processedBy = null) => {
  try {
    // Find pending balance for this booking
    const [pending] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, user_id, amount FROM pending_balances 
        WHERE source_reference_type = 'booking' 
          AND source_reference_id = ?
          AND pending_type = 'booking_payment'
          AND status = 'pending'
        LIMIT 1
      `, [bookingId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!pending) {
      debugLog(`⚠️ No pending balance found for booking ${bookingId}`);
      return null;
    }

    // Update pending balance status
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE pending_balances 
        SET 
          status = ?,
          completed_at = CASE WHEN ? IN ('completed', 'refunded', 'cancelled') THEN NOW() ELSE NULL END,
          last_status_change = NOW(),
          last_status_change_reason = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [newStatus, newStatus, reason, pending.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    debugLog(`🔄 Pending balance ${pending.id} updated to ${newStatus}: ${reason}`);
    return pending;
  } catch (error) {
    debugLog(`❌ Error updating pending balance:`, error.message);
    throw error;
  }
};

// ============================================
// 1. GET USER'S BOOKINGS
// ============================================
exports.getUserBookings = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { 
      status, 
      role = 'all',
      page = 1, 
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    debugLog('Fetching bookings for user:', user.id, 'role:', role);

    // Build conditions
    let roleCondition = '';
    const params = [];

    if (role === 'tenant') {
      roleCondition = 'AND b.tenant_id = ?';
      params.push(user.id);
    } else if (role === 'landlord') {
      roleCondition = 'AND b.landlord_id = ?';
      params.push(user.id);
    } else {
      roleCondition = 'AND (b.tenant_id = ? OR b.landlord_id = ?)';
      params.push(user.id, user.id);
    }

    if (status && status !== 'all') {
      roleCondition += ' AND b.status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await isanzureQuery(`
      SELECT COUNT(*) as total
      FROM bookings b
      WHERE 1=1 ${roleCondition}
    `, params);

    const total = countResult[0]?.total || 0;

    // Get bookings
    const bookings = await isanzureQuery(`
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
        
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        p.property_type,
        p.province,
        p.district,
        p.sector,
        
        (SELECT image_url FROM property_images WHERE property_id = p.id AND is_cover = 1 LIMIT 1) as cover_image,
        
        t.id as tenant_id,
        t.user_uid as tenant_uid,
        CONCAT(COALESCE(sso_t.first_name, ''), ' ', COALESCE(sso_t.last_name, '')) as tenant_name,
        t.public_phone as tenant_phone,
        t.public_email as tenant_email,
        sso_t.profile_avatar_url as tenant_avatar,
        
        l.id as landlord_id,
        l.user_uid as landlord_uid,
        CONCAT(COALESCE(sso_l.first_name, ''), ' ', COALESCE(sso_l.last_name, '')) as landlord_name,
        l.public_phone as landlord_phone,
        l.public_email as landlord_email,
        sso_l.profile_avatar_url as landlord_avatar
        
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      LEFT JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso_t ON t.oliviuus_user_id = sso_t.id
      LEFT JOIN users l ON b.landlord_id = l.id
      LEFT JOIN oliviuus_db.users sso_l ON l.oliviuus_user_id = sso_l.id
      WHERE 1=1 ${roleCondition}
      ORDER BY b.${sort} ${order}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Format bookings
    const formattedBookings = bookings.map(b => ({
      id: b.booking_uid,
      reference: b.payment_reference,
      period: b.booking_period,
      dates: {
        start: b.start_date,
        end: b.end_date,
        duration: b.duration
      },
      amount: parseFloat(b.total_amount),
      special_requests: b.special_requests,
      status: b.status,
      cancellation_policy: b.cancellation_policy,
      timestamps: {
        created: b.created_at,
        confirmed: b.confirmed_at,
        check_in: b.check_in_at,
        check_out: b.check_out_at,
        cancelled: b.cancelled_at
      },
      property: {
        id: b.property_uid,
        title: b.property_title,
        type: b.property_type,
        location: {
          province: b.province,
          district: b.district,
          sector: b.sector
        },
        image: b.cover_image
      },
      tenant: {
        id: b.tenant_uid,
        name: b.tenant_name,
        phone: b.tenant_phone,
        email: b.tenant_email,
        avatar: b.tenant_avatar
      },
      landlord: {
        id: b.landlord_uid,
        name: b.landlord_name,
        phone: b.landlord_phone,
        email: b.landlord_email,
        avatar: b.landlord_avatar
      }
    }));

    // Get status counts
    const counts = await exports.getBookingStatusCounts(user.id, role);

    res.status(200).json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
          has_more: total > (parseInt(page) * parseInt(limit))
        },
        counts
      }
    });

  } catch (error) {
    debugLog('Error fetching user bookings:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      code: 'FETCH_BOOKINGS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 2. GET BOOKING STATUS COUNTS
// ============================================
exports.getBookingStatusCounts = async (userId, role) => {
  try {
    let roleCondition = '';
    const params = [];

    if (role === 'tenant') {
      roleCondition = 'AND tenant_id = ?';
      params.push(userId);
    } else if (role === 'landlord') {
      roleCondition = 'AND landlord_id = ?';
      params.push(userId);
    } else {
      roleCondition = 'AND (tenant_id = ? OR landlord_id = ?)';
      params.push(userId, userId);
    }

    const counts = await isanzureQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        
        COUNT(CASE 
          WHEN status IN ('confirmed', 'active') 
          AND start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          THEN 1 
        END) as upcoming_checkins,
        
        COUNT(CASE 
          WHEN status = 'active' 
          AND CURDATE() BETWEEN start_date AND end_date
          THEN 1 
        END) as current_stays,
        
        COUNT(CASE 
          WHEN status = 'active' 
          AND end_date < CURDATE()
          THEN 1 
        END) as overdue_checkouts,
        
        (SELECT COUNT(*) 
         FROM booking_payments bp
         INNER JOIN bookings b ON bp.booking_id = b.id
         WHERE (b.tenant_id = ? OR b.landlord_id = ?)
         AND bp.status = 'pending'
         AND bp.due_date <= CURDATE()
        ) as pending_payments
      FROM bookings
      WHERE 1=1 ${roleCondition}
    `, [...params, userId, userId]);

    return {
      total: parseInt(counts[0]?.total) || 0,
      pending: parseInt(counts[0]?.pending) || 0,
      confirmed: parseInt(counts[0]?.confirmed) || 0,
      active: parseInt(counts[0]?.active) || 0,
      completed: parseInt(counts[0]?.completed) || 0,
      cancelled: parseInt(counts[0]?.cancelled) || 0,
      upcoming_checkins: parseInt(counts[0]?.upcoming_checkins) || 0,
      current_stays: parseInt(counts[0]?.current_stays) || 0,
      overdue_checkouts: parseInt(counts[0]?.overdue_checkouts) || 0,
      pending_payments: parseInt(counts[0]?.pending_payments) || 0
    };
  } catch (error) {
    debugLog('Error getting status counts:', error.message);
    return {
      total: 0, pending: 0, confirmed: 0, active: 0, completed: 0, cancelled: 0,
      upcoming_checkins: 0, current_stays: 0, overdue_checkouts: 0, pending_payments: 0
    };
  }
};

// ============================================
// 3. GET BOOKING STATISTICS
// ============================================
exports.getBookingStats = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { role = 'all' } = req.query;

    debugLog('Fetching booking stats for user:', user.id, 'role:', role);

    let roleCondition = '';
    const params = [user.id];

    if (role === 'tenant') {
      roleCondition = 'AND tenant_id = ?';
    } else if (role === 'landlord') {
      roleCondition = 'AND landlord_id = ?';
    } else {
      roleCondition = 'AND (tenant_id = ? OR landlord_id = ?)';
      params.push(user.id);
    }

    const stats = await isanzureQuery(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(total_amount) as total_spent_received,
        AVG(total_amount) as average_booking_value,
        
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as completed_amount,
        
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
        SUM(CASE WHEN status = 'cancelled' THEN total_amount ELSE 0 END) as cancelled_amount,
        
        COUNT(CASE WHEN booking_period = 'monthly' THEN 1 END) as monthly_bookings,
        COUNT(CASE WHEN booking_period = 'weekly' THEN 1 END) as weekly_bookings,
        COUNT(CASE WHEN booking_period = 'daily' THEN 1 END) as daily_bookings,
        
        MIN(start_date) as first_booking_date,
        MAX(start_date) as last_booking_date,
        
        AVG(duration) as avg_duration,
        MAX(duration) as max_duration,
        
        COUNT(CASE 
          WHEN YEAR(created_at) = YEAR(CURDATE()) 
          AND MONTH(created_at) = MONTH(CURDATE())
          THEN 1 
        END) as bookings_this_month,
        
        SUM(CASE 
          WHEN YEAR(created_at) = YEAR(CURDATE()) 
          AND MONTH(created_at) = MONTH(CURDATE())
          THEN total_amount ELSE 0 
        END) as amount_this_month,
        
        COUNT(CASE 
          WHEN YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH)
          AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)
          THEN 1 
        END) as bookings_last_month,
        
        SUM(CASE 
          WHEN YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH)
          AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)
          THEN total_amount ELSE 0 
        END) as amount_last_month
        
      FROM bookings
      WHERE 1=1 ${roleCondition}
    `, params);

    const monthlyTrend = await isanzureQuery(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(total_amount) as total
      FROM bookings
      WHERE (tenant_id = ? OR landlord_id = ?)
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `, [user.id, user.id]);

    const s = stats[0] || {};

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: parseInt(s.total_bookings) || 0,
          total_amount: parseFloat(s.total_spent_received) || 0,
          average_value: parseFloat(s.average_booking_value) || 0,
          avg_duration: Math.round(parseFloat(s.avg_duration)) || 0,
          max_duration: parseInt(s.max_duration) || 0
        },
        by_status: {
          completed: {
            count: parseInt(s.completed_count) || 0,
            amount: parseFloat(s.completed_amount) || 0
          },
          cancelled: {
            count: parseInt(s.cancelled_count) || 0,
            amount: parseFloat(s.cancelled_amount) || 0
          }
        },
        by_period: {
          monthly: parseInt(s.monthly_bookings) || 0,
          weekly: parseInt(s.weekly_bookings) || 0,
          daily: parseInt(s.daily_bookings) || 0
        },
        timeline: {
          first: s.first_booking_date,
          last: s.last_booking_date
        },
        monthly_comparison: {
          this_month: {
            count: parseInt(s.bookings_this_month) || 0,
            amount: parseFloat(s.amount_this_month) || 0
          },
          last_month: {
            count: parseInt(s.bookings_last_month) || 0,
            amount: parseFloat(s.amount_last_month) || 0
          }
        },
        trend: monthlyTrend.map(m => ({
          month: m.month,
          count: parseInt(m.count),
          total: parseFloat(m.total)
        }))
      }
    });

  } catch (error) {
    debugLog('Error fetching booking stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking stats',
      code: 'STATS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 4. GET SINGLE BOOKING DETAILS
// ============================================
exports.getBookingDetails = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { bookingUid } = req.params;

    if (!bookingUid) {
      return res.status(400).json({
        success: false,
        message: 'Booking UID is required',
        code: 'MISSING_BOOKING_UID'
      });
    }

    debugLog('Fetching booking details:', bookingUid);

    const booking = await isanzureQuery(`
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
        
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        p.property_type,
        p.province,
        p.district,
        p.sector,
        
        (SELECT image_url FROM property_images WHERE property_id = p.id AND is_cover = 1 LIMIT 1) as cover_image,
        
        t.id as tenant_id,
        t.user_uid as tenant_uid,
        CONCAT(COALESCE(sso_t.first_name, ''), ' ', COALESCE(sso_t.last_name, '')) as tenant_name,
        t.public_phone as tenant_phone,
        t.public_email as tenant_email,
        sso_t.profile_avatar_url as tenant_avatar,
        
        l.id as landlord_id,
        l.user_uid as landlord_uid,
        CONCAT(COALESCE(sso_l.first_name, ''), ' ', COALESCE(sso_l.last_name, '')) as landlord_name,
        l.public_phone as landlord_phone,
        l.public_email as landlord_email,
        sso_l.profile_avatar_url as landlord_avatar
        
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      LEFT JOIN users t ON b.tenant_id = t.id
      LEFT JOIN oliviuus_db.users sso_t ON t.oliviuus_user_id = sso_t.id
      LEFT JOIN users l ON b.landlord_id = l.id
      LEFT JOIN oliviuus_db.users sso_l ON l.oliviuus_user_id = sso_l.id
      WHERE b.booking_uid = ?
        AND (b.tenant_id = ? OR b.landlord_id = ?)
    `, [bookingUid, user.id, user.id]);

    if (booking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    const b = booking[0];

    // Get payments for this booking
    const payments = await isanzureQuery(`
      SELECT 
        payment_uid,
        payment_type,
        amount,
        status,
        due_date,
        paid_at
      FROM booking_payments
      WHERE booking_id = ?
      ORDER BY due_date ASC
    `, [b.id]);

    // Get extensions for this booking
    const extensions = await isanzureQuery(`
      SELECT 
        extension_uid,
        additional_periods,
        new_end_date,
        additional_amount,
        status,
        created_at
      FROM booking_extensions
      WHERE original_booking_id = ?
      ORDER BY created_at DESC
    `, [b.id]);

    // Get cancellation for this booking
    const cancellation = await isanzureQuery(`
      SELECT 
        cancellation_uid,
        reason,
        refund_amount,
        platform_fee_kept,
        status,
        created_at
      FROM booking_cancellations
      WHERE booking_id = ?
      LIMIT 1
    `, [b.id]);

    // Get pending balance for this booking
    const pendingBalance = await isanzureQuery(`
      SELECT 
        pending_uid,
        amount,
        status as pending_status,
        description,
        reason,
        pending_since,
        completed_at
      FROM pending_balances
      WHERE source_reference_type = 'booking' 
        AND source_reference_id = ?
        AND pending_type = 'booking_payment'
      LIMIT 1
    `, [b.id]);

    const formattedBooking = {
      id: b.booking_uid,
      reference: b.payment_reference,
      period: b.booking_period,
      dates: {
        start: b.start_date,
        end: b.end_date,
        duration: b.duration
      },
      amount: parseFloat(b.total_amount),
      optional_services: b.optional_services ? JSON.parse(b.optional_services) : null,
      special_requests: b.special_requests,
      status: b.status,
      cancellation_policy: b.cancellation_policy,
      timestamps: {
        created: b.created_at,
        confirmed: b.confirmed_at,
        check_in: b.check_in_at,
        check_out: b.check_out_at,
        cancelled: b.cancelled_at
      },
      property: {
        id: b.property_uid,
        title: b.property_title,
        type: b.property_type,
        location: {
          province: b.province,
          district: b.district,
          sector: b.sector
        },
        image: b.cover_image
      },
      tenant: {
        id: b.tenant_uid,
        name: b.tenant_name,
        phone: b.tenant_phone,
        email: b.tenant_email,
        avatar: b.tenant_avatar
      },
      landlord: {
        id: b.landlord_uid,
        name: b.landlord_name,
        phone: b.landlord_phone,
        email: b.landlord_email,
        avatar: b.landlord_avatar
      },
      payments,
      extensions,
      cancellation: cancellation.length > 0 ? cancellation[0] : null,
      pending_balance: pendingBalance.length > 0 ? pendingBalance[0] : null
    };

    const userRole = b.tenant_id === user.id ? 'tenant' : 'landlord';

    res.status(200).json({
      success: true,
      data: {
        booking: formattedBooking,
        user_role: userRole
      }
    });

  } catch (error) {
    debugLog('Error fetching booking details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      code: 'FETCH_BOOKING_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 5. CHECK-IN (Tenant action) - WITH PENDING BALANCE HANDLING
// ============================================
exports.checkIn = async (req, res) => {
  let connection = null;
  
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { bookingUid } = req.params;

    if (!bookingUid) {
      return res.status(400).json({
        success: false,
        message: 'Booking UID is required',
        code: 'MISSING_BOOKING_UID'
      });
    }

    debugLog('Processing check-in for booking:', bookingUid);

    // Get database connection for transaction
    const pool = require('../../config/isanzureDbConfig').isanzureDb;
    
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get booking details with property rules
    const [booking] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          b.id,
          b.booking_uid,
          b.status,
          b.start_date,
          b.end_date,
          b.tenant_id,
          b.landlord_id,
          b.total_amount,
          b.cancellation_policy,
          pr.grace_period_days,
          pr.late_payment_fee,
          p.title as property_title
        FROM bookings b
        LEFT JOIN properties p ON b.property_id = p.id
        LEFT JOIN property_rules pr ON p.id = pr.property_id
        WHERE b.booking_uid = ? AND b.tenant_id = ?
      `, [bookingUid, user.id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!booking) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you are not the tenant',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Validate check-in conditions
    if (booking.status !== 'confirmed') {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(400).json({
        success: false,
        message: 'Booking must be confirmed to check in',
        code: 'INVALID_STATUS',
        current_status: booking.status
      });
    }

    const today = new Date();
    const startDate = new Date(booking.start_date);
    
    // Set times to midnight for date comparison
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    // Allow check-in from start_date onwards
    if (startDate > today) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(400).json({
        success: false,
        message: 'Check-in is only available on or after the start date',
        code: 'TOO_EARLY',
        start_date: booking.start_date
      });
    }

    // Calculate days late (if checking in after start date)
    const daysLate = Math.max(0, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
    
    // Apply late fee if applicable
    let lateFee = 0;
    const gracePeriod = booking.grace_period_days || 3;
    const lateFeePercent = booking.late_payment_fee || 0;
    
    if (daysLate > gracePeriod && lateFeePercent > 0) {
      lateFee = (lateFeePercent / 100) * booking.total_amount;
      debugLog(`Late check-in: ${daysLate} days late (grace: ${gracePeriod}), applying ${lateFeePercent}% fee: ${lateFee}`);
    }

    // ===== ✅ FIXED: GET PENDING BALANCE FOR LANDLORD (NOT TENANT) =====
    const [pendingBalance] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, amount, user_id 
        FROM pending_balances 
        WHERE source_reference_type = 'booking' 
          AND source_reference_id = ?
          AND pending_type = 'booking_payment'
          AND status = 'pending'
        LIMIT 1
      `, [booking.id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!pendingBalance) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(404).json({
        success: false,
        message: 'Pending payment not found for this booking',
        code: 'PENDING_BALANCE_NOT_FOUND'
      });
    }

    debugLog(`✅ Found pending balance for landlord ${pendingBalance.user_id}: ${pendingBalance.amount}`);

    // ===== ✅ FIXED: UPDATE PENDING BALANCE TO COMPLETED =====
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE pending_balances 
        SET 
          status = 'completed',
          completed_at = NOW(),
          last_status_change = NOW(),
          last_status_change_reason = ?,
          updated_at = NOW()
        WHERE id = ?
      `, ['Check-in completed - funds released to landlord', pendingBalance.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    debugLog(`✅ Pending balance ${pendingBalance.id} marked as completed`);

    // ===== ✅ FIXED: ADD MONEY TO LANDLORD'S BALANCE (NOT TOUCH TENANT) =====
    // Calculate landlord amount (full amount minus late fee if any)
    const landlordAmount = booking.total_amount - lateFee;

    // Check if landlord balance exists
    const [landlordBalance] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id FROM user_balances WHERE user_id = ?
      `, [booking.landlord_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!landlordBalance) {
      // Create landlord balance record with FULL amount
      await new Promise((resolve, reject) => {
        connection.query(`
          INSERT INTO user_balances (
            user_id, 
            balance_amount, 
            pending_amount,
            on_hold_amount,
            currency_code, 
            updated_at
          ) VALUES (?, ?, 0, 0, 'RWF', NOW())
        `, [booking.landlord_id, landlordAmount], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      debugLog(`✅ Created landlord balance for ${booking.landlord_id} with ${landlordAmount}`);
    } else {
      // Update existing landlord balance
      await new Promise((resolve, reject) => {
        connection.query(`
          UPDATE user_balances 
          SET 
            balance_amount = balance_amount + ?,
            updated_at = NOW()
          WHERE user_id = ?
        `, [landlordAmount, booking.landlord_id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      debugLog(`✅ Updated landlord ${booking.landlord_id} balance +${landlordAmount}`);
    }

    // ===== ✅ FIXED: TENANT'S BALANCE IS NEVER TOUCHED =====
    // Tenant already paid via payment gateway
    // They have no pending_amount in their user_balances
    // So we do NOT update tenant's balance at all

    // Update booking payments to 'paid'
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE booking_payments 
        SET status = 'paid', paid_at = NOW()
        WHERE booking_id = ? AND status = 'pending'
      `, [booking.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Update booking status to active
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE bookings 
        SET 
          status = 'active',
          check_in_at = NOW()
        WHERE id = ?
      `, [booking.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Create transaction record
    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT INTO transactions (
          transaction_uid,
          from_user_id,
          to_user_id,
          booking_id,
          amount,
          transaction_type,
          status,
          payment_method,
          notes,
          created_at,
          completed_at
        ) VALUES (UUID(), ?, ?, ?, ?, 'rent_payment', 'completed', 'balance', ?, NOW(), NOW())
      `, [
        booking.tenant_id,
        booking.landlord_id,
        booking.id,
        landlordAmount,
        JSON.stringify({
          booking_uid: booking.booking_uid,
          total_amount: booking.total_amount,
          landlord_received: landlordAmount,
          late_fee: lateFee,
          days_late: daysLate,
          grace_period: gracePeriod,
          check_in_date: today.toISOString().split('T')[0],
          pending_balance_completed: pendingBalance.amount,
          pending_balance_id: pendingBalance.id,
          // ✅ IMPORTANT: No tenant balance was modified
          tenant_balance_unchanged: true,
          fee_policy: "Platform fee (5%) and processor fee (5%) apply at withdrawal only"
        })
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // ===== CREATE NOTIFICATION FOR LANDLORD =====
    const messageContent = `✅ Check-in completed for ${booking.property_title}. ${landlordAmount.toLocaleString()} RWF has been added to your available balance. Remember: Fees (10% total) will be deducted when you withdraw.`;

    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT INTO messages (
          message_uid,
          sender_id,
          receiver_id,
          booking_id,
          message_type,
          content,
          metadata,
          created_at
        ) VALUES (
          UUID(),
          1,
          ?,
          ?,
          'system_alert',
          ?,
          ?,
          NOW()
        )
      `, [
        booking.landlord_id,
        booking.id,
        messageContent,
        JSON.stringify({
          type: 'checkin_completed',
          amount: landlordAmount,
          full_amount: booking.total_amount,
          tenant_id: booking.tenant_id,
          property_title: booking.property_title,
          booking_uid: booking.booking_uid,
          late_fee: lateFee,
          days_late: daysLate,
          pending_balance_completed: pendingBalance.amount,
          fee_info: {
            platform_fee_percent: 5,
            processor_fee_percent: 5,
            total_fee_percent: 10,
            applied_at: "withdrawal_only"
          }
        })
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Log the action
    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT INTO security_audit_log (
          log_uid,
          user_id,
          action_type,
          description,
          metadata,
          created_at
        ) VALUES (UUID(), ?, 'booking_check_in', ?, ?, NOW())
      `, [
        user.id,
        `Checked in to booking ${bookingUid}`,
        JSON.stringify({ 
          booking_id: booking.id, 
          booking_uid: bookingUid,
          total_amount: booking.total_amount,
          landlord_received: landlordAmount,
          late_fee: lateFee,
          days_late: daysLate,
          pending_balance_completed: pendingBalance.amount,
          pending_balance_id: pendingBalance.id,
          landlord_id: booking.landlord_id,
          tenant_id: booking.tenant_id,
          // ✅ Confirm tenant balance not touched
          tenant_balance_unchanged: true,
          policy: booking.cancellation_policy
        })
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Commit transaction
    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    connection.release();

    res.status(200).json({
      success: true,
      message: 'Check-in successful! Full amount added to landlord wallet.',
      data: {
        booking_uid: bookingUid,
        property_title: booking.property_title,
        check_in_at: new Date().toISOString(),
        status: 'active',
        payment: {
          total: booking.total_amount,
          landlord_received: landlordAmount,
          late_fee: lateFee,
          days_late: daysLate
        },
        balances: {
          // ✅ CORRECT: Show pending balance that was completed
          pending_balance_completed: pendingBalance.amount,
          landlord_new_balance: landlordAmount,
          // ✅ Explicitly show tenant balance unchanged
          tenant_balance: {
            status: "unchanged",
            message: "Tenant balance was not modified during check-in"
          }
        },
        fee_policy: {
          message: "Fees are applied ONLY at withdrawal",
          platform_fee: "5% at cashout",
          processor_fee: "5% at cashout",
          total_fee: "10% at cashout"
        }
      }
    });

  } catch (error) {
    debugLog('Error during check-in:', error.message);
    
    // Rollback transaction if connection exists
    if (connection) {
      await new Promise((resolve) => {
        connection.rollback(() => resolve());
      });
      connection.release();
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to check in',
      code: 'CHECK_IN_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 6. CHECK-OUT (Tenant action)
// ============================================
exports.checkOut = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { bookingUid } = req.params;

    if (!bookingUid) {
      return res.status(400).json({
        success: false,
        message: 'Booking UID is required',
        code: 'MISSING_BOOKING_UID'
      });
    }

    debugLog('Processing check-out for booking:', bookingUid);

    // Get booking details
    const booking = await isanzureQuery(`
      SELECT 
        b.id,
        b.status,
        b.end_date,
        b.tenant_id,
        b.landlord_id
      FROM bookings b
      WHERE b.booking_uid = ? AND b.tenant_id = ?
    `, [bookingUid, user.id]);

    if (booking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you are not the tenant',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    const b = booking[0];

    // Validate check-out conditions
    if (b.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be active to check out',
        code: 'INVALID_STATUS',
        current_status: b.status
      });
    }

    // Update booking status to completed
    await isanzureQuery(`
      UPDATE bookings 
      SET 
        status = 'completed',
        check_out_at = NOW()
      WHERE id = ?
    `, [b.id]);

    // Log the action
    await isanzureQuery(`
      INSERT INTO security_audit_log (
        log_uid,
        user_id,
        action_type,
        description,
        metadata,
        created_at
      ) VALUES (UUID(), ?, 'booking_check_out', ?, ?, NOW())
    `, [
      user.id,
      `Checked out of booking ${bookingUid}`,
      JSON.stringify({ booking_id: b.id, booking_uid: bookingUid })
    ]);

    res.status(200).json({
      success: true,
      message: 'Check-out successful. Hope you enjoyed your stay!',
      data: {
        booking_uid: bookingUid,
        check_out_at: new Date().toISOString(),
        status: 'completed'
      }
    });

  } catch (error) {
    debugLog('Error during check-out:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to check out',
      code: 'CHECK_OUT_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 7. REQUEST EXTENSION (Tenant action)
// ============================================
exports.requestExtension = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { bookingUid } = req.params;
    const { additional_periods } = req.body;

    if (!bookingUid) {
      return res.status(400).json({
        success: false,
        message: 'Booking UID is required',
        code: 'MISSING_BOOKING_UID'
      });
    }

    if (!additional_periods || additional_periods < 1) {
      return res.status(400).json({
        success: false,
        message: 'Additional periods must be at least 1',
        code: 'INVALID_PERIODS'
      });
    }

    debugLog('Processing extension request for booking:', bookingUid);

    // Get booking details
    const booking = await isanzureQuery(`
      SELECT 
        b.id,
        b.booking_period,
        b.end_date,
        b.tenant_id,
        b.landlord_id,
        p.id as property_id,
        pp.monthly_price,
        pp.weekly_price,
        pp.daily_price
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE b.booking_uid = ? AND b.tenant_id = ?
        AND b.status IN ('confirmed', 'active')
    `, [bookingUid, user.id]);

    if (booking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be extended',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    const b = booking[0];

    // Calculate new end date and additional amount
    let newEndDate = new Date(b.end_date);
    let pricePerPeriod = 0;

    switch (b.booking_period) {
      case 'monthly':
        newEndDate.setMonth(newEndDate.getMonth() + additional_periods);
        pricePerPeriod = b.monthly_price;
        break;
      case 'weekly':
        newEndDate.setDate(newEndDate.getDate() + (additional_periods * 7));
        pricePerPeriod = b.weekly_price;
        break;
      case 'daily':
        newEndDate.setDate(newEndDate.getDate() + additional_periods);
        pricePerPeriod = b.daily_price;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Cannot extend this booking period',
          code: 'INVALID_PERIOD'
        });
    }

    const additionalAmount = pricePerPeriod * additional_periods;

    // Create extension request
    const extensionResult = await isanzureQuery(`
      INSERT INTO booking_extensions (
        extension_uid,
        original_booking_id,
        requested_by_user_id,
        additional_periods,
        new_end_date,
        additional_amount,
        status,
        created_at
      ) VALUES (UUID(), ?, ?, ?, ?, ?, 'requested', NOW())
    `, [b.id, user.id, additional_periods, newEndDate, additionalAmount]);

    const extensionId = extensionResult.insertId;

    // Get the created extension
    const extension = await isanzureQuery(`
      SELECT 
        extension_uid,
        additional_periods,
        new_end_date,
        additional_amount,
        status,
        created_at
      FROM booking_extensions
      WHERE id = ?
    `, [extensionId]);

    res.status(201).json({
      success: true,
      message: 'Extension request submitted successfully',
      data: {
        extension: extension[0],
        booking_uid: bookingUid,
        current_end_date: b.end_date,
        new_end_date: newEndDate,
        additional_amount: additionalAmount
      }
    });

  } catch (error) {
    debugLog('Error requesting extension:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to request extension',
      code: 'EXTENSION_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 8. CANCEL BOOKING - WITH PENDING BALANCE HANDLING
// ============================================
exports.cancelBooking = async (req, res) => {
  let connection = null;
  
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { bookingUid } = req.params;
    const { reason } = req.body;

    if (!bookingUid) {
      return res.status(400).json({
        success: false,
        message: 'Booking UID is required',
        code: 'MISSING_BOOKING_UID'
      });
    }

    debugLog('Processing cancellation for booking:', bookingUid);

    // Get database connection for transaction
    const pool = require('../../config/isanzureDbConfig').isanzureDb;
    
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get booking details with payment info
    const [booking] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          b.id,
          b.booking_uid,
          b.status,
          b.total_amount,
          b.cancellation_policy,
          b.tenant_id,
          b.landlord_id,
          b.start_date,
          b.end_date,
          -- Get any pending payments for this booking
          (SELECT SUM(amount) FROM booking_payments 
           WHERE booking_id = b.id AND status = 'pending') as pending_amount
        FROM bookings b
        WHERE b.booking_uid = ? 
          AND (b.tenant_id = ? OR b.landlord_id = ?)
          AND b.status IN ('pending', 'confirmed')
      `, [bookingUid, user.id, user.id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!booking) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be cancelled',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
        code: 'ALREADY_CANCELLED'
      });
    }

    // Determine who is cancelling
    const isTenantCancelling = booking.tenant_id === user.id;
    
    // Calculate hours until check-in
    const now = new Date();
    const checkInDate = new Date(booking.start_date);
    const hoursUntilCheckIn = Math.max(0, Math.floor((checkInDate - now) / (1000 * 60 * 60)));
    
    // Use policy from booking
    const policy = booking.cancellation_policy || 'moderate';
    
    // Calculate refund based on policy and timing (remove 10% platform fee first)
    const platformFee = booking.total_amount * 0.10;
    const remainingAmount = booking.total_amount - platformFee;
    
    let tenantRefundPercentage = 0;
    let landlordKeptPercentage = 0;
    let tenantRefund = 0;
    let landlordKept = 0;

    switch (policy) {
      case 'flexible':
        // Flexible: Full refund if >=24 hours, 50% refund if <24 hours
        if (hoursUntilCheckIn >= 24) {
          tenantRefundPercentage = 100; // 100% of remaining (90% of total)
          tenantRefund = remainingAmount;
          landlordKept = 0;
        } else {
          tenantRefundPercentage = 50; // 50% of remaining (45% of total)
          landlordKeptPercentage = 50; // 50% of remaining (45% of total)
          tenantRefund = remainingAmount * 0.5;
          landlordKept = remainingAmount * 0.5;
        }
        break;
        
      case 'moderate':
        // Moderate: Full refund 48+ hours, 50% refund 24-48 hours, no refund <24 hours
        if (hoursUntilCheckIn >= 48) {
          tenantRefundPercentage = 100;
          tenantRefund = remainingAmount;
          landlordKept = 0;
        } else if (hoursUntilCheckIn >= 24) {
          tenantRefundPercentage = 50;
          landlordKeptPercentage = 50;
          tenantRefund = remainingAmount * 0.5;
          landlordKept = remainingAmount * 0.5;
        } else {
          tenantRefundPercentage = 0;
          landlordKeptPercentage = 100;
          tenantRefund = 0;
          landlordKept = remainingAmount;
        }
        break;
        
      case 'strict':
        // Strict: 50% refund if 48+ hours, no refund within 48 hours
        if (hoursUntilCheckIn >= 48) {
          tenantRefundPercentage = 50;
          landlordKeptPercentage = 50;
          tenantRefund = remainingAmount * 0.5;
          landlordKept = remainingAmount * 0.5;
        } else {
          tenantRefundPercentage = 0;
          landlordKeptPercentage = 100;
          tenantRefund = 0;
          landlordKept = remainingAmount;
        }
        break;
        
      default:
        // Default to moderate
        if (hoursUntilCheckIn >= 48) {
          tenantRefundPercentage = 100;
          tenantRefund = remainingAmount;
          landlordKept = 0;
        } else if (hoursUntilCheckIn >= 24) {
          tenantRefundPercentage = 50;
          landlordKeptPercentage = 50;
          tenantRefund = remainingAmount * 0.5;
          landlordKept = remainingAmount * 0.5;
        } else {
          tenantRefundPercentage = 0;
          landlordKeptPercentage = 100;
          tenantRefund = 0;
          landlordKept = remainingAmount;
        }
    }

    // Platform always keeps its 10%
    const platformKept = platformFee;

    debugLog(`Cancellation split: Total=${booking.total_amount}, Platform=${platformKept}, Tenant refund=${tenantRefund}, Landlord keeps=${landlordKept}`);

    // Update booking status to cancelled
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE bookings 
        SET 
          status = 'cancelled',
          cancelled_at = NOW()
        WHERE id = ?
      `, [booking.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // ===== HANDLE PENDING BALANCE FOR LANDLORD =====
    const pendingResult = await updatePendingBalanceStatus(
      connection, 
      booking.id, 
      'cancelled', 
      `Booking cancelled - ${isTenantCancelling ? 'Tenant' : 'Landlord'} initiated`
    );

    // ===== HANDLE PENDING AMOUNTS IN USER BALANCE =====
    if (booking.pending_amount && booking.pending_amount > 0) {
      await new Promise((resolve, reject) => {
        connection.query(`
          UPDATE user_balances 
          SET 
            pending_amount = GREATEST(0, pending_amount - ?),
            updated_at = NOW()
          WHERE user_id = ?
        `, [booking.pending_amount, booking.tenant_id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      debugLog(`Removed pending amount ${booking.pending_amount} for user ${booking.tenant_id}`);
    }

    // Update all pending payments for this booking to cancelled
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE booking_payments 
        SET status = 'cancelled'
        WHERE booking_id = ? AND status = 'pending'
      `, [booking.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // ===== PROCESS REFUND TO TENANT =====
    if (tenantRefund > 0) {
      await updateUserBalance(connection, booking.tenant_id, tenantRefund, 'refund', booking.id);
    }

    // ===== ADD TO LANDLORD BALANCE IF APPLICABLE =====
    if (landlordKept > 0) {
      await updateUserBalance(connection, booking.landlord_id, landlordKept, 'cancellation_compensation', booking.id);
    }

    // ===== PLATFORM KEEPS ITS FEE (ADMIN USER ID 1) =====
    if (platformKept > 0) {
      await updateUserBalance(connection, 1, platformKept, 'platform_fee_cancelled', booking.id);
    }

    // ===== CHECK IF CANCELLATION ALREADY EXISTS =====
    const [existingCancellation] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id FROM booking_cancellations 
        WHERE booking_id = ?
      `, [booking.id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (existingCancellation) {
      // Update existing cancellation
      await new Promise((resolve, reject) => {
        connection.query(`
          UPDATE booking_cancellations 
          SET 
            initiated_by_user_id = ?,
            reason = ?,
            refund_amount = ?,
            platform_fee_kept = ?,
            status = 'processed',
            created_at = NOW()
          WHERE booking_id = ?
        `, [
          user.id,
          reason || 'No reason provided',
          tenantRefund,
          platformKept,
          booking.id
        ], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      debugLog(`Updated existing cancellation for booking ${booking.id}`);
    } else {
      // Insert new cancellation record
      await new Promise((resolve, reject) => {
        connection.query(`
          INSERT INTO booking_cancellations (
            cancellation_uid,
            booking_id,
            initiated_by_user_id,
            reason,
            refund_amount,
            platform_fee_kept,
            status,
            created_at
          ) VALUES (UUID(), ?, ?, ?, ?, ?, 'processed', NOW())
        `, [
          booking.id,
          user.id,
          reason || 'No reason provided',
          tenantRefund,
          platformKept
        ], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      debugLog(`Created new cancellation for booking ${booking.id}`);
    }

    // Create transaction records
    if (tenantRefund > 0) {
      await new Promise((resolve, reject) => {
        connection.query(`
          INSERT INTO transactions (
            transaction_uid,
            from_user_id,
            to_user_id,
            booking_id,
            amount,
            transaction_type,
            status,
            notes,
            created_at
          ) VALUES (UUID(), ?, ?, ?, ?, 'refund', 'completed', ?, NOW())
        `, [
          1, // Platform admin
          booking.tenant_id,
          booking.id,
          tenantRefund,
          JSON.stringify({ 
            reason: 'Booking cancellation refund', 
            policy, 
            hours_until_check_in: hoursUntilCheckIn,
            cancelled_by: isTenantCancelling ? 'tenant' : 'landlord',
            pending_amount_removed: booking.pending_amount || 0,
            pending_balance_cancelled: pendingResult ? pendingResult.amount : 0
          })
        ], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    if (landlordKept > 0) {
      await new Promise((resolve, reject) => {
        connection.query(`
          INSERT INTO transactions (
            transaction_uid,
            from_user_id,
            to_user_id,
            booking_id,
            amount,
            transaction_type,
            status,
            notes,
            created_at
          ) VALUES (UUID(), ?, ?, ?, ?, 'cancellation_compensation', 'completed', ?, NOW())
        `, [
          booking.tenant_id,
          booking.landlord_id,
          booking.id,
          landlordKept,
          JSON.stringify({ 
            reason: 'Cancellation compensation', 
            policy, 
            hours_until_check_in: hoursUntilCheckIn,
            cancelled_by: isTenantCancelling ? 'tenant' : 'landlord'
          })
        ], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    // Log the action
    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT INTO security_audit_log (
          log_uid,
          user_id,
          action_type,
          description,
          metadata,
          created_at
        ) VALUES (UUID(), ?, 'booking_cancel', ?, ?, NOW())
      `, [
        user.id,
        `Cancelled booking ${bookingUid}`,
        JSON.stringify({ 
          booking_id: booking.id, 
          booking_uid: bookingUid,
          tenant_refund: tenantRefund,
          landlord_kept: landlordKept,
          platform_kept: platformKept,
          pending_amount_removed: booking.pending_amount || 0,
          pending_balance_cancelled: pendingResult ? pendingResult.amount : 0,
          policy: policy,
          hours_until_check_in: hoursUntilCheckIn,
          cancelled_by: isTenantCancelling ? 'tenant' : 'landlord'
        })
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Commit transaction
    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    connection.release();

    // Prepare response message
    let refundMessage = '';
    if (tenantRefund > 0) {
      refundMessage = `RWF ${tenantRefund.toLocaleString()} will be credited to your balance`;
      if (booking.pending_amount > 0) {
        refundMessage += ` (RWF ${booking.pending_amount.toLocaleString()} pending amount released)`;
      }
    } else {
      refundMessage = 'No refund applicable based on cancellation policy';
    }

    res.status(200).json({
      success: true,
      message: tenantRefund > 0 
        ? 'Booking cancelled successfully. Refund will be processed to your account.'
        : 'Booking cancelled successfully.',
      data: {
        booking_uid: bookingUid,
        status: 'cancelled',
        refund: {
          amount: tenantRefund,
          percentage: tenantRefundPercentage,
          message: refundMessage,
          pending_released: booking.pending_amount || 0,
          pending_balance_cancelled: pendingResult ? pendingResult.amount : 0
        },
        splits: {
          tenant_refund: tenantRefund,
          landlord_kept: landlordKept,
          platform_fee: platformKept
        },
        policy_applied: policy,
        hours_until_check_in: hoursUntilCheckIn,
        cancelled_by: isTenantCancelling ? 'tenant' : 'landlord',
        next_steps: tenantRefund > 0 
          ? 'You can view and withdraw your refund from Account > Payments'
          : null
      }
    });

  } catch (error) {
    debugLog('Error cancelling booking:', error.message);
    
    // Rollback transaction if connection exists
    if (connection) {
      await new Promise((resolve) => {
        connection.rollback(() => resolve());
      });
      connection.release();
    }
    
    // Handle duplicate entry error specifically
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
      return res.status(409).json({
        success: false,
        message: 'This booking is already being processed',
        code: 'DUPLICATE_CANCELLATION',
        error: 'A cancellation record already exists for this booking'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      code: 'CANCEL_FAILED',
      error: error.message
    });
  }
};

module.exports = exports;