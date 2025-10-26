const { query } = require('../config/dbConfig');

const notificationController = {
  // ==================== USER NOTIFICATION CONTROLLERS ====================
  
  // Get all notifications for authenticated user
  getUserNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, type, page = 1, limit = 20 } = req.query;
      
      // Build WHERE conditions
      let whereConditions = ['n.user_id = ?'];
      const queryParams = [userId];
      
      if (status && ['unread', 'read', 'archived'].includes(status)) {
        whereConditions.push('n.status = ?');
        queryParams.push(status);
      }
      
      if (type) {
        whereConditions.push('n.type = ?');
        queryParams.push(type);
      }
      
      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Get notifications with pagination
      const notificationsSql = `
        SELECT 
          n.id,
          n.type,
          n.title,
          n.message,
          n.icon,
          n.status,
          n.reference_id,
          n.reference_type,
          n.action_url,
          n.priority,
          n.created_at,
          n.read_at,
          n.expires_at
        FROM notifications n
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(parseInt(limit), offset);
      const notifications = await query(notificationsSql, queryParams);
      
      // Get total count for pagination info
      const countSql = `
        SELECT COUNT(*) as total 
        FROM notifications n 
        WHERE ${whereConditions.join(' AND ')}
      `;
      const countParams = queryParams.slice(0, -2);
      const countResult = await query(countSql, countParams);
      const total = countResult[0].total;
      
      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  },

  // Get unread notification count for user
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const countSql = `
        SELECT COUNT(*) as unread_count 
        FROM notifications 
        WHERE user_id = ? AND status = 'unread'
      `;
      
      const result = await query(countSql, [userId]);
      const unreadCount = result[0].unread_count;
      
      res.json({
        success: true,
        data: {
          unread_count: unreadCount
        }
      });
      
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count'
      });
    }
  },

  // Mark notification as read (user specific)
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      // Update only if notification belongs to user
      const updateSql = `
        UPDATE notifications 
        SET status = 'read', read_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `;
      
      const result = await query(updateSql, [notificationId, userId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access denied'
        });
      }
      
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  },

  // Mark all notifications as read for user
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const updateSql = `
        UPDATE notifications 
        SET status = 'read', read_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND status = 'unread'
      `;
      
      const result = await query(updateSql, [userId]);
      
      res.json({
        success: true,
        message: `Marked ${result.affectedRows} notifications as read`
      });
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read'
      });
    }
  },

  // Archive a notification (user specific)
  archiveNotification: async (req, res) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      const updateSql = `
        UPDATE notifications 
        SET status = 'archived'
        WHERE id = ? AND user_id = ?
      `;
      
      const result = await query(updateSql, [notificationId, userId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access denied'
        });
      }
      
      res.json({
        success: true,
        message: 'Notification archived'
      });
      
    } catch (error) {
      console.error('Error archiving notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive notification'
      });
    }
  },

  // ==================== ADMIN NOTIFICATION CONTROLLERS ====================

  // Admin: Get all notifications for admin users (system-wide notifications)
  getAdminNotifications: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        status, 
        type, 
        priority,
        user_role = 'admin'
      } = req.query;
      
      // Build WHERE conditions for admin notifications
      let whereConditions = ['u.role = ?'];
      const queryParams = [user_role];
      
      if (status && ['unread', 'read', 'archived'].includes(status)) {
        whereConditions.push('n.status = ?');
        queryParams.push(status);
      }
      
      if (type) {
        whereConditions.push('n.type = ?');
        queryParams.push(type);
      }
      
      if (priority && ['low', 'normal', 'high', 'urgent'].includes(priority)) {
        whereConditions.push('n.priority = ?');
        queryParams.push(priority);
      }
      
      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Get admin notifications with user info
      const notificationsSql = `
        SELECT 
          n.id,
          n.type,
          n.title,
          n.message,
          n.icon,
          n.status,
          n.reference_id,
          n.reference_type,
          n.action_url,
          n.priority,
          n.created_at,
          n.read_at,
          n.expires_at,
          u.id as user_id,
          u.email,
          u.role,
          u.profile_avatar_url
        FROM notifications n
        INNER JOIN users u ON n.user_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY n.priority DESC, n.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(parseInt(limit), offset);
      const notifications = await query(notificationsSql, queryParams);
      
      // Get total count for pagination info
      const countSql = `
        SELECT COUNT(*) as total 
        FROM notifications n
        INNER JOIN users u ON n.user_id = u.id
        WHERE ${whereConditions.join(' AND ')}
      `;
      const countParams = queryParams.slice(0, -2);
      const countResult = await query(countSql, countParams);
      const total = countResult[0].total;
      
      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error getting admin notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admin notifications'
      });
    }
  },

  // Admin: Get system-wide notification statistics
  getNotificationStats: async (req, res) => {
    try {
      const statsSql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread,
          COUNT(CASE WHEN status = 'read' THEN 1 END) as read,
          COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high,
          COUNT(CASE WHEN priority = 'normal' THEN 1 END) as normal,
          COUNT(CASE WHEN priority = 'low' THEN 1 END) as low,
          COUNT(CASE WHEN type = 'subscription' THEN 1 END) as subscription,
          COUNT(CASE WHEN type = 'user_session' THEN 1 END) as session,
          COUNT(CASE WHEN type = 'contact' THEN 1 END) as contact,
          COUNT(CASE WHEN type = 'system' THEN 1 END) as system,
          COUNT(CASE WHEN type = 'user' THEN 1 END) as user
        FROM notifications
      `;

      const recentActivitySql = `
        SELECT 
          type,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM notifications 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY type, DATE(created_at)
        ORDER BY date DESC, count DESC
      `;

      const adminStatsSql = `
        SELECT 
          u.role,
          COUNT(n.id) as notification_count,
          COUNT(CASE WHEN n.status = 'unread' THEN 1 END) as unread_count
        FROM users u
        LEFT JOIN notifications n ON u.id = n.user_id
        WHERE u.role IN ('admin', 'viewer')
        GROUP BY u.role
      `;

      const [stats, recentActivity, adminStats] = await Promise.all([
        query(statsSql),
        query(recentActivitySql),
        query(adminStatsSql)
      ]);

      res.json({
        success: true,
        data: {
          overview: stats[0],
          recent_activity: recentActivity,
          user_stats: adminStats
        }
      });

    } catch (error) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification statistics'
      });
    }
  },

  // Admin: Create system-wide notification for all users or specific roles
  createSystemNotification: async (req, res) => {
    try {
      const { title, message, type = 'system', priority = 'normal', target_roles, icon = 'system' } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Title and message are required'
        });
      }

      // Determine target users based on roles
      let targetUsersSql = 'SELECT id FROM users WHERE is_active = TRUE';
      let targetParams = [];
      
      if (target_roles && target_roles.length > 0) {
        const roles = Array.isArray(target_roles) ? target_roles : [target_roles];
        targetUsersSql += ' AND role IN (?)';
        targetParams.push(roles);
      }
      
      const targetUsers = await query(targetUsersSql, targetParams);
      
      if (targetUsers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No users found for the specified roles'
        });
      }

      // Insert notifications for all target users
      const insertSql = `
        INSERT INTO notifications (user_id, type, title, message, icon, priority, reference_type) 
        VALUES ?
      `;
      
      const notificationValues = targetUsers.map(user => [
        user.id,
        type,
        title,
        message,
        icon,
        priority,
        'system'
      ]);
      
      const result = await query(insertSql, [notificationValues]);
      
      res.status(201).json({
        success: true,
        message: `Notification sent to ${targetUsers.length} users`,
        data: {
          affected_users: targetUsers.length,
          notification_id: result.insertId
        }
      });
      
    } catch (error) {
      console.error('Error creating system notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create system notification'
      });
    }
  },

  // Admin: Delete notification (system-wide)
  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;
      
      const deleteSql = 'DELETE FROM notifications WHERE id = ?';
      const result = await query(deleteSql, [notificationId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }
  },

  // Admin: Bulk update notifications
  bulkUpdateNotifications: async (req, res) => {
    try {
      const { notification_ids, action } = req.body;
      
      if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Notification IDs array is required'
        });
      }
      
      if (!['read', 'archived', 'delete'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Valid action (read, archived, delete) is required'
        });
      }
      
      let sql;
      let params;
      
      if (action === 'delete') {
        sql = 'DELETE FROM notifications WHERE id IN (?)';
        params = [notification_ids];
      } else {
        sql = `UPDATE notifications SET status = ? ${action === 'read' ? ', read_at = CURRENT_TIMESTAMP' : ''} WHERE id IN (?)`;
        params = [action, notification_ids];
      }
      
      const result = await query(sql, params);
      
      res.json({
        success: true,
        message: `${result.affectedRows} notifications ${action === 'delete' ? 'deleted' : 'updated'} successfully`
      });
      
    } catch (error) {
      console.error('Error in bulk update notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notifications'
      });
    }
  },

  // Admin: Get notifications by specific user (for admin viewing)
  getUserNotificationsByAdmin: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      
      // Verify user exists
      const userSql = 'SELECT id, email, role FROM users WHERE id = ?';
      const user = await query(userSql, [userId]);
      
      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Build WHERE conditions
      let whereConditions = ['n.user_id = ?'];
      const queryParams = [userId];
      
      if (status && ['unread', 'read', 'archived'].includes(status)) {
        whereConditions.push('n.status = ?');
        queryParams.push(status);
      }
      
      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Get user notifications
      const notificationsSql = `
        SELECT 
          n.id,
          n.type,
          n.title,
          n.message,
          n.icon,
          n.status,
          n.reference_id,
          n.reference_type,
          n.action_url,
          n.priority,
          n.created_at,
          n.read_at,
          n.expires_at
        FROM notifications n
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(parseInt(limit), offset);
      const notifications = await query(notificationsSql, queryParams);
      
      // Get total count
      const countSql = `
        SELECT COUNT(*) as total 
        FROM notifications n 
        WHERE ${whereConditions.join(' AND ')}
      `;
      const countParams = queryParams.slice(0, -2);
      const countResult = await query(countSql, countParams);
      const total = countResult[0].total;
      
      res.json({
        success: true,
        data: {
          user: user[0],
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Error getting user notifications by admin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user notifications'
      });
    }
  }
};

module.exports = notificationController;