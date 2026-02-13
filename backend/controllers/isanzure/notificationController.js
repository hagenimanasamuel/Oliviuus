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
// 1. GET ALL NOTIFICATION COUNTS - MAIN ENDPOINT
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
      pendingTenants,
      unreadNotifications
    ] = await Promise.all([
      getUnreadMessagesCount(user.id).catch(() => 0),
      getPendingBookingsCount(user.id).catch(() => 0),
      getPendingPaymentsCount(user.id).catch(() => 0),
      getPendingVerificationsCount(user.id).catch(() => 0),
      getPendingTenantsCount(user.id).catch(() => 0),
      getUnreadSystemNotificationsCount(user.oliviuus_user_id).catch(() => 0)
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
          tenants: {
            count: pendingTenants,
            hasUnread: pendingTenants > 0,
            dotColor: '#3B82F6'
          },
          system: {
            count: unreadNotifications,
            hasUnread: unreadNotifications > 0,
            dotColor: '#6B7280'
          }
        },
        summary: {
          totalUnread: unreadMessages + unreadNotifications,
          totalPending: pendingBookings + pendingPayments + pendingVerifications + pendingTenants
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
          tenants: { count: 0, hasUnread: false, dotColor: '#3B82F6' },
          system: { count: 0, hasUnread: false, dotColor: '#6B7280' }
        },
        summary: { totalUnread: 0, totalPending: 0 },
        lastUpdated: new Date().toISOString()
      }
    });
  }
};

// ============================================
// 2. GET UNREAD MESSAGES COUNT
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
// 3. GET PENDING BOOKINGS COUNT
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
    
    const count = await getPendingBookingsCount(user.id);
    
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
// 4. GET PENDING PAYMENTS COUNT
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
// 5. GET PENDING VERIFICATIONS COUNT
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
        type: 'verifications'
      }
    });
  } catch (error) {
    debugLog('Error in getPendingVerificationsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'verifications' } 
    });
  }
};

// ============================================
// 6. GET PENDING TENANTS COUNT
// ============================================
exports.getPendingTenantsCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const count = await getPendingTenantsCount(user.id);
    
    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'tenants'
      }
    });
  } catch (error) {
    debugLog('Error in getPendingTenantsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'tenants' } 
    });
  }
};

// ============================================
// 7. GET UNREAD SYSTEM NOTIFICATIONS COUNT
// ============================================
exports.getUnreadSystemNotificationsCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const count = await getUnreadSystemNotificationsCount(user.oliviuus_user_id);
    
    res.status(200).json({
      success: true,
      data: { 
        count, 
        hasUnread: count > 0,
        type: 'system'
      }
    });
  } catch (error) {
    debugLog('Error in getUnreadSystemNotificationsCount:', error.message);
    res.status(200).json({ 
      success: true, 
      data: { count: 0, hasUnread: false, type: 'system' } 
    });
  }
};

// ============================================
// 8. MARK NOTIFICATION AS READ
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

    let updated = false;

    switch (type) {
      case 'message':
      case 'messages':
        // Mark message/conversation as read
        const tableCheck = await isanzureQuery(`
          SELECT COUNT(*) as count
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
            AND table_name = 'conversations'
        `);

        if (tableCheck[0].count > 0) {
          const result = await isanzureQuery(`
            UPDATE messages m
            INNER JOIN conversations c ON m.conversation_id = c.id
            SET m.is_read = 1, m.read_at = UTC_TIMESTAMP()
            WHERE c.id = ? AND c.receiver_id = ? AND m.is_read = 0
          `, [id, user.id]);
          updated = result.affectedRows > 0;
        } else {
          const result = await isanzureQuery(`
            UPDATE messages
            SET is_read = 1, read_at = UTC_TIMESTAMP()
            WHERE id = ? AND receiver_id = ? AND is_read = 0
          `, [id, user.id]);
          updated = result.affectedRows > 0;
        }
        break;

      case 'booking':
      case 'bookings':
        // Mark booking as viewed (no actual read flag, just return success)
        updated = true;
        break;

      case 'payment':
      case 'payments':
        updated = true;
        break;

      case 'verification':
      case 'verifications':
      case 'settings':
        updated = true;
        break;

      case 'tenant':
      case 'tenants':
        updated = true;
        break;

      case 'system':
        // Mark system notification as read in oliviuus_db
        if (user.oliviuus_user_id) {
          try {
            const columnCheck = await oliviuusQuery(`
              SELECT COUNT(*) as count
              FROM information_schema.columns 
              WHERE table_schema = DATABASE() 
                AND table_name = 'notifications'
                AND column_name = 'is_read'
            `).catch(() => [{ count: 0 }]);

            if (columnCheck[0].count > 0) {
              const result = await oliviuusQuery(`
                UPDATE notifications 
                SET is_read = 1, read_at = NOW() 
                WHERE id = ? AND user_id = ?
              `, [id, user.oliviuus_user_id]).catch(() => null);
              updated = true;
            }
          } catch (e) {
            updated = true; // Assume success
          }
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid notification type',
          code: 'INVALID_TYPE'
        });
    }

    res.status(200).json({
      success: true,
      message: `Marked as read`,
      data: { 
        type, 
        id, 
        updated,
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
// 9. MARK ALL NOTIFICATIONS AS READ
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
    
    debugLog(`Marking all ${type} as read for user:`, user.id);

    let updatedCount = 0;

    switch (type) {
      case 'messages':
        // Mark all conversations as read
        const tableCheck = await isanzureQuery(`
          SELECT COUNT(*) as count
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
            AND table_name = 'conversations'
        `);

        if (tableCheck[0].count > 0) {
          const result = await isanzureQuery(`
            UPDATE messages m
            INNER JOIN conversations c ON m.conversation_id = c.id
            SET m.is_read = 1, m.read_at = UTC_TIMESTAMP()
            WHERE c.receiver_id = ? AND m.is_read = 0
          `, [user.id]);
          updatedCount = result.affectedRows;
        } else {
          const result = await isanzureQuery(`
            UPDATE messages
            SET is_read = 1, read_at = UTC_TIMESTAMP()
            WHERE receiver_id = ? AND is_read = 0
          `, [user.id]);
          updatedCount = result.affectedRows;
        }
        break;

      case 'bookings':
        updatedCount = 0; // No action needed
        break;

      case 'payments':
        updatedCount = 0;
        break;

      case 'verifications':
      case 'settings':
        updatedCount = 0;
        break;

      case 'tenants':
        updatedCount = 0;
        break;

      case 'system':
        if (user.oliviuus_user_id) {
          try {
            const columnCheck = await oliviuusQuery(`
              SELECT COUNT(*) as count
              FROM information_schema.columns 
              WHERE table_schema = DATABASE() 
                AND table_name = 'notifications'
                AND column_name = 'is_read'
            `).catch(() => [{ count: 0 }]);

            if (columnCheck[0].count > 0) {
              const result = await oliviuusQuery(`
                UPDATE notifications 
                SET is_read = 1, read_at = NOW() 
                WHERE user_id = ? AND is_read = 0
              `, [user.oliviuus_user_id]).catch(() => ({ affectedRows: 0 }));
              updatedCount = result.affectedRows || 0;
            }
          } catch (e) {
            updatedCount = 0;
          }
        }
        break;

      case 'all':
        // Mark all messages as read
        const msgTableCheck = await isanzureQuery(`
          SELECT COUNT(*) as count
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
            AND table_name = 'conversations'
        `);

        if (msgTableCheck[0].count > 0) {
          await isanzureQuery(`
            UPDATE messages m
            INNER JOIN conversations c ON m.conversation_id = c.id
            SET m.is_read = 1, m.read_at = UTC_TIMESTAMP()
            WHERE c.receiver_id = ? AND m.is_read = 0
          `, [user.id]);
        } else {
          await isanzureQuery(`
            UPDATE messages
            SET is_read = 1, read_at = UTC_TIMESTAMP()
            WHERE receiver_id = ? AND is_read = 0
          `, [user.id]);
        }

        // Mark all system notifications as read
        if (user.oliviuus_user_id) {
          try {
            await oliviuusQuery(`
              UPDATE notifications 
              SET is_read = 1, read_at = NOW() 
              WHERE user_id = ? AND is_read = 0
            `, [user.oliviuus_user_id]).catch(() => null);
          } catch (e) {}
        }
        updatedCount = 1;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid notification type',
          code: 'INVALID_TYPE'
        });
    }

    res.status(200).json({
      success: true,
      message: `All ${type} notifications marked as read`,
      data: { 
        type, 
        updatedCount,
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
// 10. GET NOTIFICATION PREFERENCES
// ============================================
exports.getNotificationPreferences = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Default preferences
    const defaultPreferences = {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      booking_alerts: true,
      message_alerts: true,
      payment_alerts: true,
      marketing_emails: false,
      sound_enabled: true,
      desktop_notifications: true
    };

    // Try to get from database
    try {
      const columnCheck = await isanzureQuery(`
        SELECT COUNT(*) as count
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
          AND table_name = 'users'
          AND column_name = 'notification_preferences'
      `);

      if (columnCheck[0].count > 0) {
        const result = await isanzureQuery(`
          SELECT notification_preferences
          FROM users
          WHERE id = ?
        `, [user.id]);

        if (result.length > 0 && result[0].notification_preferences) {
          try {
            const savedPrefs = JSON.parse(result[0].notification_preferences);
            Object.assign(defaultPreferences, savedPrefs);
          } catch (e) {}
        }
      }
    } catch (dbError) {
      debugLog('Error fetching preferences from DB:', dbError.message);
    }

    res.status(200).json({
      success: true,
      data: defaultPreferences
    });

  } catch (error) {
    debugLog('Error in getNotificationPreferences:', error.message);
    res.status(200).json({
      success: true,
      data: {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        booking_alerts: true,
        message_alerts: true,
        payment_alerts: true,
        marketing_emails: false,
        sound_enabled: true,
        desktop_notifications: true
      }
    });
  }
};

// ============================================
// 11. UPDATE NOTIFICATION PREFERENCES
// ============================================
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const preferences = req.body;

    // Validate preferences object
    if (typeof preferences !== 'object' || preferences === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferences format',
        code: 'INVALID_PREFERENCES'
      });
    }

    // Try to save to database
    try {
      const columnCheck = await isanzureQuery(`
        SELECT COUNT(*) as count
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
          AND table_name = 'users'
          AND column_name = 'notification_preferences'
      `);

      if (columnCheck[0].count > 0) {
        await isanzureQuery(`
          UPDATE users 
          SET notification_preferences = ?,
              updated_at = UTC_TIMESTAMP()
          WHERE id = ?
        `, [JSON.stringify(preferences), user.id]);
      }
    } catch (dbError) {
      debugLog('Error saving preferences to DB:', dbError.message);
      // Continue - don't fail the request
    }

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: preferences
    });

  } catch (error) {
    debugLog('Error in updateNotificationPreferences:', error.message);
    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: req.body || {}
    });
  }
};

// ============================================
// ========== HELPER FUNCTIONS ================
// ============================================

// 1. Get unread messages count
async function getUnreadMessagesCount(userId) {
  try {
    const tableCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'messages'
    `);

    if (tableCheck[0].count === 0) return 0;

    const convTableCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'conversations'
    `);

    if (convTableCheck[0].count > 0) {
      const result = await isanzureQuery(`
        SELECT COUNT(DISTINCT m.id) as count
        FROM messages m
        INNER JOIN conversations c ON m.conversation_id = c.id
        WHERE c.receiver_id = ? 
          AND m.is_read = 0
          AND m.sender_id != ?
      `, [userId, userId]).catch(() => [{ count: 0 }]);
      
      return result[0]?.count || 0;
    } else {
      const result = await isanzureQuery(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE receiver_id = ? AND is_read = 0
      `, [userId]).catch(() => [{ count: 0 }]);
      
      return result[0]?.count || 0;
    }
  } catch (error) {
    debugLog('Error in getUnreadMessagesCount:', error.message);
    return 0;
  }
}

// 2. Get pending bookings count
async function getPendingBookingsCount(userId) {
  try {
    const userCheck = await isanzureQuery(`
      SELECT user_type FROM users WHERE id = ?
    `, [userId]).catch(() => [{ user_type: null }]);

    if (userCheck.length === 0) return 0;
    
    const userType = userCheck[0]?.user_type;
    
    if (!['landlord', 'property_manager', 'agent'].includes(userType)) {
      return 0;
    }

    const tableCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'bookings'
    `);

    if (tableCheck[0].count === 0) return 0;

    const result = await isanzureQuery(`
      SELECT COUNT(DISTINCT b.id) as count
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
        AND b.status = 'pending'
    `, [userId]).catch(() => [{ count: 0 }]);

    return result[0]?.count || 0;
  } catch (error) {
    debugLog('Error in getPendingBookingsCount:', error.message);
    return 0;
  }
}

// 3. Get pending payments count
async function getPendingPaymentsCount(userId) {
  try {
    const userCheck = await isanzureQuery(`
      SELECT user_type FROM users WHERE id = ?
    `, [userId]).catch(() => [{ user_type: null }]);

    if (userCheck.length === 0) return 0;
    
    const userType = userCheck[0]?.user_type;
    
    const withdrawalsCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'withdrawals'
    `);

    if (userType === 'landlord' || userType === 'property_manager' || userType === 'agent') {
      if (withdrawalsCheck[0].count === 0) return 0;
      
      const result = await isanzureQuery(`
        SELECT COUNT(*) as count
        FROM withdrawals
        WHERE user_id = ? 
          AND status IN ('pending', 'processing')
      `, [userId]).catch(() => [{ count: 0 }]);
      
      return result[0]?.count || 0;
    } else {
      const paymentsCheck = await isanzureQuery(`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
          AND table_name = 'booking_payments'
      `);

      if (paymentsCheck[0].count === 0) return 0;

      const result = await isanzureQuery(`
        SELECT COUNT(bp.id) as count
        FROM booking_payments bp
        INNER JOIN bookings b ON bp.booking_id = b.id
        WHERE b.tenant_id = ? 
          AND bp.status = 'pending'
          AND bp.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      `, [userId]).catch(() => [{ count: 0 }]);
      
      return result[0]?.count || 0;
    }
  } catch (error) {
    debugLog('Error in getPendingPaymentsCount:', error.message);
    return 0;
  }
}

// 4. Get pending verifications count
async function getPendingVerificationsCount(userId) {
  try {
    const columnCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
        AND table_name = 'users'
        AND column_name = 'verification_status'
    `);

    if (columnCheck[0].count === 0) return 0;

    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM users
      WHERE verification_status = 'pending'
    `).catch(() => [{ count: 0 }]);

    return result[0]?.count || 0;
  } catch (error) {
    debugLog('Error in getPendingVerificationsCount:', error.message);
    return 0;
  }
}

// 5. Get pending tenants count
async function getPendingTenantsCount(landlordId) {
  try {
    const tableCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'bookings'
    `);

    if (tableCheck[0].count === 0) return 0;

    const result = await isanzureQuery(`
      SELECT COUNT(DISTINCT b.tenant_id) as count
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_id = ?
        AND b.status = 'pending'
        AND b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `, [landlordId]).catch(() => [{ count: 0 }]);

    return result[0]?.count || 0;
  } catch (error) {
    debugLog('Error in getPendingTenantsCount:', error.message);
    return 0;
  }
}

// 6. Get unread system notifications count
async function getUnreadSystemNotificationsCount(oliviuusUserId) {
  if (!oliviuusUserId) return 0;
  
  try {
    try {
      await oliviuusQuery('SELECT 1');
    } catch (e) {
      return 0;
    }

    const tableCheck = await oliviuusQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'notifications'
    `).catch(() => [{ count: 0 }]);

    if (tableCheck[0].count === 0) return 0;

    const columnCheck = await oliviuusQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
        AND table_name = 'notifications'
        AND column_name = 'is_read'
    `).catch(() => [{ count: 0 }]);

    if (columnCheck[0].count === 0) {
      const result = await oliviuusQuery(`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `, [oliviuusUserId]).catch(() => [{ count: 0 }]);
      
      return result[0]?.count || 0;
    }

    const result = await oliviuusQuery(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? 
        AND is_read = 0
    `, [oliviuusUserId]).catch(() => [{ count: 0 }]);

    return result[0]?.count || 0;
  } catch (error) {
    debugLog('Error in getUnreadSystemNotificationsCount:', error.message);
    return 0;
  }
}

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
    
    // Check if wishlist table exists
    const tableCheck = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'wishlist'
    `).catch(() => [{ count: 0 }]);

    let count = 0;
    
    if (tableCheck[0].count > 0) {
      // Count wishlist items with notifications (price drops, availability, etc.)
      const result = await isanzureQuery(`
        SELECT COUNT(*) as count
        FROM wishlist w
        LEFT JOIN property_pricing pp ON w.property_id = pp.property_id
        LEFT JOIN properties p ON w.property_id = p.id
        WHERE w.user_id = ?
          AND (
            w.notified_price_drop = 1 OR
            w.notified_available = 1 OR
            DATE(w.created_at) = CURDATE()
          )
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
// GET PENDING BOOKINGS COUNT FOR TENANTS
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

    // For tenants: pending bookings (waiting for landlord confirmation)
    // For landlords: we already handle this in the landlord version
    let count = 0;
    
    if (user.user_type === 'tenant') {
      const result = await isanzureQuery(`
        SELECT COUNT(*) as count
        FROM bookings
        WHERE tenant_id = ? 
          AND status = 'pending'
      `, [user.id]).catch(() => [{ count: 0 }]);
      
      count = result[0]?.count || 0;
    } else {
      // For landlords, use the existing landlord-specific query
      const result = await isanzureQuery(`
        SELECT COUNT(DISTINCT b.id) as count
        FROM bookings b
        INNER JOIN properties p ON b.property_id = p.id
        WHERE p.landlord_id = ?
          AND b.status = 'pending'
      `, [user.id]).catch(() => [{ count: 0 }]);
      
      count = result[0]?.count || 0;
    }

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

module.exports = exports;