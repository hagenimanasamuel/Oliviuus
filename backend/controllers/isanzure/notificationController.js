// backend/controllers/isanzure/notificationController.js
const { isanzureQuery } = require('../../config/isanzureDbConfig');
const { query: oliviuusQuery } = require('../../config/dbConfig');

const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🔔 ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 🔔 ${message}`);
  }
};

// ============================================
// HELPER: GET AUTHENTICATED USER (Works for ANY user type)
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
        u.is_active
      FROM users u
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
// GET ALL NOTIFICATION COUNTS - Works for ALL user types
// ============================================
exports.getAllNotificationCounts = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Run all counts with error handling for each
    const [
      unreadMessages,
      pendingBookings,
      pendingPayments,
      pendingVerifications,
      wishlistNotifications
    ] = await Promise.all([
      getUnreadMessagesCount(user.id).catch(() => 0),
      getPendingBookingsCount(user.id).catch(() => 0),
      getPendingPaymentsCount(user.id).catch(() => 0),
      getPendingVerificationsCount(user.id).catch(() => 0),
      getWishlistNotificationsCount(user.id).catch(() => 0)
    ]);

    const response = {
      success: true,
      data: {
        sidebar: {
          messages: {
            count: unreadMessages,
            hasUnread: unreadMessages > 0,
            dotColor: '#EF4444'
          },
          bookings: {
            count: pendingBookings,
            hasUnread: pendingBookings > 0,
            dotColor: '#EAB308'
          },
          payments: {
            count: pendingPayments,
            hasUnread: pendingPayments > 0,
            dotColor: '#22C55E'
          },
          settings: {
            count: pendingVerifications,
            hasUnread: pendingVerifications > 0,
            dotColor: '#A855F7'
          },
          wishlist: {
            count: wishlistNotifications,
            hasUnread: wishlistNotifications > 0,
            dotColor: '#EF4444'
          }
        },
        summary: {
          totalUnread: unreadMessages,
          totalPending: pendingBookings + pendingPayments + pendingVerifications + wishlistNotifications
        },
        lastUpdated: new Date().toISOString()
      }
    };

    res.status(200).json(response);

  } catch (error) {
    debugLog('Error in getAllNotificationCounts:', error.message);
    res.status(200).json({
      success: true,
      data: {
        sidebar: {
          messages: { count: 0, hasUnread: false, dotColor: '#EF4444' },
          bookings: { count: 0, hasUnread: false, dotColor: '#EAB308' },
          payments: { count: 0, hasUnread: false, dotColor: '#22C55E' },
          settings: { count: 0, hasUnread: false, dotColor: '#A855F7' },
          wishlist: { count: 0, hasUnread: false, dotColor: '#EF4444' }
        },
        summary: { totalUnread: 0, totalPending: 0 },
        lastUpdated: new Date().toISOString()
      }
    });
  }
};

// ============================================
// GET UNREAD MESSAGES COUNT - Works for ANY user
// ============================================
exports.getUnreadMessagesCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const count = await getUnreadMessagesCount(user.id);
    
    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'messages'
      }
    });
  } catch (error) {
    debugLog('Error in getUnreadMessagesCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'messages' } 
    });
  }
};

// ============================================
// GET PENDING BOOKINGS COUNT - Works for TENANTS
// ============================================
exports.getPendingBookingsCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if bookings table exists
    const tableCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'bookings'
    `);

    if (tableCheck[0].count === 0) {
      return res.status(200).json({ 
        success: true, 
        data: { count: 0, hasUnread: false, type: 'bookings' } 
      });
    }

    // For TENANTS: count pending bookings
    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE tenant_id = ? 
        AND status = 'pending'
    `, [user.id]).catch(() => [{ count: 0 }]);
    
    const count = result[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'bookings'
      }
    });

  } catch (error) {
    debugLog('Error in getPendingBookingsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'bookings' } 
    });
  }
};

// ============================================
// GET PENDING PAYMENTS COUNT - Works for TENANTS
// ============================================
exports.getPendingPaymentsCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if booking_payments table exists
    const paymentsCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'booking_payments'
    `);

    if (paymentsCheck[0].count === 0) {
      return res.status(200).json({ 
        success: true, 
        data: { count: 0, hasUnread: false, type: 'payments' } 
      });
    }

    // For TENANTS: count pending payments
    const result = await isanzureQuery(`
      SELECT COUNT(bp.id) as count
      FROM booking_payments bp
      INNER JOIN bookings b ON bp.booking_id = b.id
      WHERE b.tenant_id = ? 
        AND bp.status = 'pending'
        AND bp.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `, [user.id]).catch(() => [{ count: 0 }]);
    
    const count = result[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'payments'
      }
    });

  } catch (error) {
    debugLog('Error in getPendingPaymentsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'payments' } 
    });
  }
};

// ============================================
// GET PENDING VERIFICATIONS COUNT - Works for ANY user
// ============================================
exports.getPendingVerificationsCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if users table has verification_status column
    const columnCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
        AND table_name = 'users'
        AND column_name = 'verification_status'
    `);

    if (columnCheck[0].count === 0) {
      return res.status(200).json({ 
        success: true, 
        data: { count: 0, hasUnread: false, type: 'settings' } 
      });
    }

    // Check if THIS user has pending verification
    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM users
      WHERE id = ? 
        AND verification_status = 'pending'
    `, [user.id]).catch(() => [{ count: 0 }]);

    const count = result[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'settings'
      }
    });

  } catch (error) {
    debugLog('Error in getPendingVerificationsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'settings' } 
    });
  }
};

// ============================================
// GET WISHLIST NOTIFICATIONS COUNT - For TENANTS
// ============================================
exports.getWishlistNotificationsCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Check if wishlist table exists
    const tableCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'wishlist'
    `).catch(() => [{ count: 0 }]);

    let count = 0;
    
    if (tableCheck[0].count > 0) {
      const result = await isanzureQuery(`
        SELECT COUNT(*) as count
        FROM wishlist w
        WHERE w.user_id = ?
      `, [user.id]).catch(() => [{ count: 0 }]);
      
      count = result[0]?.count || 0;
    }

    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'wishlist'
      }
    });

  } catch (error) {
    debugLog('Error in getWishlistNotificationsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'wishlist' } 
    });
  }
};

// ============================================
// MARK AS READ - Generic for any user
// ============================================
exports.markAsRead = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { type, id } = req.params;
    
    debugLog(`Marking ${type} ${id} as read for user:`, user.id);

    if (type === 'messages' || type === 'message') {
      if (id === 'all') {
        await isanzureQuery(`
          UPDATE messages
          SET is_read = 1, read_at = UTC_TIMESTAMP()
          WHERE receiver_id = ? AND is_read = 0
        `, [user.id]);
      } else {
        await isanzureQuery(`
          UPDATE messages
          SET is_read = 1, read_at = UTC_TIMESTAMP()
          WHERE id = ? AND receiver_id = ?
        `, [id, user.id]);
      }
    }

    res.status(200).json({
      success: true,
      message: `Marked as read`,
      data: { 
        type, 
        id,
        markedAt: new Date().toISOString() 
      }
    });

  } catch (error) {
    debugLog('Error in markAsRead:', error.message);
    res.status(200).json({
      success: true,
      message: 'Marked as read',
      data: { 
        type: req.params.type, 
        id: req.params.id,
        markedAt: new Date().toISOString() 
      }
    });
  }
};

// ============================================
// MARK ALL AS READ
// ============================================
exports.markAllAsRead = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { type } = req.params;

    if (type === 'messages') {
      await isanzureQuery(`
        UPDATE messages
        SET is_read = 1, read_at = UTC_TIMESTAMP()
        WHERE receiver_id = ? AND is_read = 0
      `, [user.id]);
    }

    res.status(200).json({
      success: true,
      message: `All ${type} notifications marked as read`,
      data: { 
        type,
        markedAt: new Date().toISOString() 
      }
    });

  } catch (error) {
    debugLog('Error in markAllAsRead:', error.message);
    res.status(200).json({
      success: true,
      message: `All ${req.params.type} notifications marked as read`,
      data: { 
        type: req.params.type,
        markedAt: new Date().toISOString() 
      }
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getUnreadMessagesCount(userId) {
  try {
    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE receiver_id = ? AND is_read = 0
    `, [userId]).catch(() => [{ count: 0 }]);
    
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getPendingBookingsCount(userId) {
  try {
    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE tenant_id = ? AND status = 'pending'
    `, [userId]).catch(() => [{ count: 0 }]);
    
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getPendingPaymentsCount(userId) {
  try {
    const result = await isanzureQuery(`
      SELECT COUNT(bp.id) as count
      FROM booking_payments bp
      INNER JOIN bookings b ON bp.booking_id = b.id
      WHERE b.tenant_id = ? 
        AND bp.status = 'pending'
    `, [userId]).catch(() => [{ count: 0 }]);
    
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getPendingVerificationsCount(userId) {
  try {
    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM users
      WHERE id = ? AND verification_status = 'pending'
    `, [userId]).catch(() => [{ count: 0 }]);
    
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getWishlistNotificationsCount(userId) {
  try {
    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM wishlist
      WHERE user_id = ?
    `, [userId]).catch(() => [{ count: 0 }]);
    
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

module.exports = exports;