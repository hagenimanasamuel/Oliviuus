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
        u.is_active,
        u.verification_status,
        u.id_verified,
        u.withdrawal_verified
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
// GET ALL NOTIFICATION COUNTS - Using ONLY existing tables
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

    // Run all counts using ONLY existing tables
    const [
      unreadMessages,
      pendingBookings,
      pendingPayments,
      pendingVerifications,
      wishlistNotifications,
      totalWishlistItems,
      pendingWithdrawalVerification,
      activeBookings,
      unreadBookingMessages,
      pendingPropertyVerifications,
      upcomingBookings,
      recentWishlistActivity
    ] = await Promise.all([
      getUnreadMessagesCount(user.id).catch(() => 0),
      getPendingBookingsCount(user.id, user.user_type).catch(() => 0),
      getPendingPaymentsCount(user.id).catch(() => 0),
      getPendingVerificationsCount(user.id).catch(() => 0),
      getWishlistNotificationsCount(user.id).catch(() => 0),
      getTotalWishlistItemsCount(user.id).catch(() => 0),
      getPendingWithdrawalVerificationCount(user.id).catch(() => 0),
      getActiveBookingsCount(user.id, user.user_type).catch(() => 0),
      getUnreadBookingMessagesCount(user.id).catch(() => 0),
      getPendingPropertyVerificationsCount(user.id, user.user_type).catch(() => 0),
      getUpcomingBookingsCount(user.id, user.user_type).catch(() => 0),
      getRecentWishlistActivityCount(user.id).catch(() => 0)
    ]);

    // Calculate summary counts based on user type
    const totalUnread = unreadMessages + unreadBookingMessages;
    const totalPending = pendingBookings + pendingPayments + 
                        (pendingVerifications ? 1 : 0) + 
                        (pendingWithdrawalVerification ? 1 : 0) +
                        pendingPropertyVerifications;
    const totalActive = activeBookings;
    const totalUpcoming = upcomingBookings;

    const response = {
      success: true,
      data: {
        sidebar: {
          messages: {
            count: unreadMessages,
            hasUnread: unreadMessages > 0,
            dotColor: '#EF4444',
            subType: 'chat'
          },
          bookingMessages: {
            count: unreadBookingMessages,
            hasUnread: unreadBookingMessages > 0,
            dotColor: '#F97316',
            subType: 'booking_updates'
          },
          bookings: {
            count: pendingBookings,
            hasUnread: pendingBookings > 0,
            dotColor: '#EAB308',
            subType: 'pending'
          },
          activeBookings: {
            count: activeBookings,
            hasUnread: activeBookings > 0,
            dotColor: '#22C55E',
            subType: 'active'
          },
          upcomingBookings: {
            count: upcomingBookings,
            hasUnread: upcomingBookings > 0,
            dotColor: '#3B82F6',
            subType: 'upcoming'
          },
          payments: {
            count: pendingPayments,
            hasUnread: pendingPayments > 0,
            dotColor: '#22C55E',
            subType: 'pending'
          },
          settings: {
            count: pendingVerifications,
            hasUnread: pendingVerifications > 0,
            dotColor: '#A855F7',
            subType: 'id_verification'
          },
          withdrawalVerification: {
            count: pendingWithdrawalVerification,
            hasUnread: pendingWithdrawalVerification > 0,
            dotColor: '#8B5CF6',
            subType: 'withdrawal_account'
          },
          wishlist: {
            count: wishlistNotifications,
            hasUnread: wishlistNotifications > 0,
            dotColor: '#EF4444',
            subType: 'notifications'
          },
          wishlistItems: {
            count: totalWishlistItems,
            hasUnread: totalWishlistItems > 0,
            dotColor: '#EC4899',
            subType: 'saved'
          },
          wishlistActivity: {
            count: recentWishlistActivity,
            hasUnread: recentWishlistActivity > 0,
            dotColor: '#F59E0B',
            subType: 'property_updates'
          },
          propertyVerifications: {
            count: pendingPropertyVerifications,
            hasUnread: pendingPropertyVerifications > 0,
            dotColor: '#6366F1',
            subType: 'property_approval'
          }
        },
        summary: {
          totalUnread,
          totalPending,
          totalActive,
          totalUpcoming,
          totalSaved: totalWishlistItems,
          byCategory: {
            messages: unreadMessages + unreadBookingMessages,
            bookings: pendingBookings + activeBookings + upcomingBookings,
            payments: pendingPayments,
            verifications: pendingVerifications + pendingWithdrawalVerification + pendingPropertyVerifications,
            wishlist: wishlistNotifications + recentWishlistActivity
          }
        },
        userType: user.user_type,
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
          messages: { count: 0, hasUnread: false, dotColor: '#EF4444', subType: 'chat' },
          bookingMessages: { count: 0, hasUnread: false, dotColor: '#F97316', subType: 'booking_updates' },
          bookings: { count: 0, hasUnread: false, dotColor: '#EAB308', subType: 'pending' },
          activeBookings: { count: 0, hasUnread: false, dotColor: '#22C55E', subType: 'active' },
          upcomingBookings: { count: 0, hasUnread: false, dotColor: '#3B82F6', subType: 'upcoming' },
          payments: { count: 0, hasUnread: false, dotColor: '#22C55E', subType: 'pending' },
          settings: { count: 0, hasUnread: false, dotColor: '#A855F7', subType: 'id_verification' },
          withdrawalVerification: { count: 0, hasUnread: false, dotColor: '#8B5CF6', subType: 'withdrawal_account' },
          wishlist: { count: 0, hasUnread: false, dotColor: '#EF4444', subType: 'notifications' },
          wishlistItems: { count: 0, hasUnread: false, dotColor: '#EC4899', subType: 'saved' },
          wishlistActivity: { count: 0, hasUnread: false, dotColor: '#F59E0B', subType: 'property_updates' },
          propertyVerifications: { count: 0, hasUnread: false, dotColor: '#6366F1', subType: 'property_approval' }
        },
        summary: { 
          totalUnread: 0, 
          totalPending: 0, 
          totalActive: 0, 
          totalUpcoming: 0, 
          totalSaved: 0,
          byCategory: { messages: 0, bookings: 0, payments: 0, verifications: 0, wishlist: 0 }
        },
        userType: user?.user_type || 'unknown',
        lastUpdated: new Date().toISOString()
      }
    });
  }
};

// ============================================
// GET UNREAD MESSAGES COUNT
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
// GET PENDING BOOKINGS COUNT
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

    const count = await getPendingBookingsCount(user.id, user.user_type);

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
// GET PENDING PAYMENTS COUNT
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

    const count = await getPendingPaymentsCount(user.id);

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
// GET PENDING VERIFICATIONS COUNT
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

    const count = await getPendingVerificationsCount(user.id);

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
// GET WISHLIST NOTIFICATIONS COUNT
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
    
    const count = await getWishlistNotificationsCount(user.id);

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
// GET UNREAD BOOKING-RELATED MESSAGES COUNT
// ============================================
exports.getUnreadBookingMessagesCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const count = await getUnreadBookingMessagesCount(user.id);
    
    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'booking_messages'
      }
    });
  } catch (error) {
    debugLog('Error in getUnreadBookingMessagesCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'booking_messages' } 
    });
  }
};

// ============================================
// GET ACTIVE BOOKINGS COUNT
// ============================================
exports.getActiveBookingsCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const count = await getActiveBookingsCount(user.id, user.user_type);
    
    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'active_bookings'
      }
    });
  } catch (error) {
    debugLog('Error in getActiveBookingsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'active_bookings' } 
    });
  }
};

// ============================================
// GET UPCOMING BOOKINGS COUNT (next 7 days)
// ============================================
exports.getUpcomingBookingsCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const count = await getUpcomingBookingsCount(user.id, user.user_type);
    
    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'upcoming_bookings'
      }
    });
  } catch (error) {
    debugLog('Error in getUpcomingBookingsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'upcoming_bookings' } 
    });
  }
};

// ============================================
// GET TOTAL WISHLIST ITEMS COUNT
// ============================================
exports.getTotalWishlistItemsCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const count = await getTotalWishlistItemsCount(user.id);
    
    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'wishlist_items'
      }
    });
  } catch (error) {
    debugLog('Error in getTotalWishlistItemsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'wishlist_items' } 
    });
  }
};

// ============================================
// GET PENDING WITHDRAWAL VERIFICATION COUNT
// ============================================
exports.getPendingWithdrawalVerificationCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const count = await getPendingWithdrawalVerificationCount(user.id);
    
    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'withdrawal_verification'
      }
    });
  } catch (error) {
    debugLog('Error in getPendingWithdrawalVerificationCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'withdrawal_verification' } 
    });
  }
};

// ============================================
// GET PENDING PROPERTY VERIFICATIONS COUNT (For landlords)
// ============================================
exports.getPendingPropertyVerificationsCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const count = await getPendingPropertyVerificationsCount(user.id, user.user_type);
    
    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'property_verifications'
      }
    });
  } catch (error) {
    debugLog('Error in getPendingPropertyVerificationsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'property_verifications' } 
    });
  }
};

// ============================================
// GET RECENT WISHLIST ACTIVITY COUNT (Property updates)
// ============================================
exports.getRecentWishlistActivityCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const count = await getRecentWishlistActivityCount(user.id);
    
    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'wishlist_activity'
      }
    });
  } catch (error) {
    debugLog('Error in getRecentWishlistActivityCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'wishlist_activity' } 
    });
  }
};

// ============================================
// MARK AS READ
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

    if (type === 'messages' || type === 'message' || type === 'booking_messages') {
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

    if (type === 'messages' || type === 'booking_messages') {
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

async function getUnreadBookingMessagesCount(userId) {
  try {
    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM messages m
      WHERE m.receiver_id = ? 
        AND m.is_read = 0
        AND m.message_type IN ('booking_update', 'payment_notice')
    `, [userId]).catch(() => [{ count: 0 }]);
    
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getPendingBookingsCount(userId, userType) {
  try {
    let sql = '';
    if (userType === 'tenant') {
      sql = `SELECT COUNT(*) as count FROM bookings WHERE tenant_id = ? AND status = 'pending'`;
    } else if (userType === 'landlord' || userType === 'agent' || userType === 'property_manager') {
      sql = `SELECT COUNT(*) as count FROM bookings WHERE landlord_id = ? AND status = 'pending'`;
    } else {
      return 0;
    }
    
    const result = await isanzureQuery(sql, [userId]).catch(() => [{ count: 0 }]);
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getActiveBookingsCount(userId, userType) {
  try {
    let sql = '';
    if (userType === 'tenant') {
      sql = `SELECT COUNT(*) as count FROM bookings WHERE tenant_id = ? AND status = 'active'`;
    } else if (userType === 'landlord' || userType === 'agent' || userType === 'property_manager') {
      sql = `SELECT COUNT(*) as count FROM bookings WHERE landlord_id = ? AND status = 'active'`;
    } else {
      return 0;
    }
    
    const result = await isanzureQuery(sql, [userId]).catch(() => [{ count: 0 }]);
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getUpcomingBookingsCount(userId, userType) {
  try {
    let sql = '';
    if (userType === 'tenant') {
      sql = `SELECT COUNT(*) as count 
             FROM bookings 
             WHERE tenant_id = ? 
               AND status IN ('confirmed', 'active')
               AND start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
    } else if (userType === 'landlord' || userType === 'agent' || userType === 'property_manager') {
      sql = `SELECT COUNT(*) as count 
             FROM bookings 
             WHERE landlord_id = ? 
               AND status IN ('confirmed', 'active')
               AND start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
    } else {
      return 0;
    }
    
    const result = await isanzureQuery(sql, [userId]).catch(() => [{ count: 0 }]);
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
      WHERE (b.tenant_id = ? OR b.landlord_id = ?) 
        AND bp.status = 'pending'
        AND bp.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `, [userId, userId]).catch(() => [{ count: 0 }]);
    
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

async function getPendingWithdrawalVerificationCount(userId) {
  try {
    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM users
      WHERE id = ? 
        AND withdrawal_method IS NOT NULL 
        AND withdrawal_verified = 0
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
      FROM wishlist w
      INNER JOIN properties p ON w.property_id = p.id
      WHERE w.user_id = ? 
        AND p.updated_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
    `, [userId]).catch(() => [{ count: 0 }]);
    
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalWishlistItemsCount(userId) {
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

async function getRecentWishlistActivityCount(userId) {
  try {
    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM wishlist w
      INNER JOIN properties p ON w.property_id = p.id
      WHERE w.user_id = ? 
        AND p.updated_at > DATE_SUB(NOW(), INTERVAL 3 DAY)
    `, [userId]).catch(() => [{ count: 0 }]);
    
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getPendingPropertyVerificationsCount(userId, userType) {
  try {
    if (userType !== 'landlord' && userType !== 'agent' && userType !== 'property_manager') {
      return 0;
    }
    
    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM properties
      WHERE landlord_id = ? AND verification_status = 'pending'
    `, [userId]).catch(() => [{ count: 0 }]);
    
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

// Make sure all functions are exported
module.exports = exports;