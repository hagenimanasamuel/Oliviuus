// backend/controllers/isanzure/messageController.js
const { isanzureQuery } = require('../../config/isanzureDbConfig');
const { query: oliviuusQuery } = require('../../config/dbConfig');

const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 💬 ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 💬 ${message}`);
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
        u.public_phone,
        u.public_email,
        u.is_active,
        COALESCE(sso.first_name, 'User') as first_name,
        COALESCE(sso.last_name, '') as last_name,
        COALESCE(sso.username, CONCAT('user-', u.id)) as username,
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
// 1. GET ALL CONVERSATIONS - FIXED for existing schema
// ============================================
exports.getConversations = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { filter = 'all', search = '' } = req.query;

    debugLog('Fetching conversations for user:', user.id);

    // Get all distinct conversation partners from messages table
    const partners = await isanzureQuery(`
      SELECT DISTINCT 
        CASE 
          WHEN sender_id = ? THEN receiver_id
          ELSE sender_id
        END as other_user_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      ORDER BY created_at DESC
    `, [user.id, user.id, user.id]);

    const conversations = [];

    for (const partner of partners) {
      // Get last message with this partner
      const lastMessage = await isanzureQuery(`
        SELECT 
          m.id,
          m.message_uid,
          m.content,
          m.created_at,
          m.sender_id,
          m.is_read,
          m.receiver_id,
          m.metadata,
          u_sender.user_uid as sender_uid,
          CONCAT(
            COALESCE(sso_sender.first_name, 'User'),
            ' ',
            COALESCE(sso_sender.last_name, '')
          ) as sender_name,
          sso_sender.profile_avatar_url as sender_avatar
        FROM messages m
        LEFT JOIN users u_sender ON m.sender_id = u_sender.id
        LEFT JOIN oliviuus_db.users sso_sender ON u_sender.oliviuus_user_id = sso_sender.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at DESC
        LIMIT 1
      `, [user.id, partner.other_user_id, partner.other_user_id, user.id]);

      if (lastMessage.length === 0) continue;

      // Get unread count for this conversation
      const unreadCount = await isanzureQuery(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE sender_id = ? 
          AND receiver_id = ? 
          AND is_read = 0
      `, [partner.other_user_id, user.id]);

      // Get other user details
      const otherUser = await isanzureQuery(`
        SELECT 
          u.id,
          u.user_uid,
          u.user_type,
          u.public_phone,
          u.public_email,
          CONCAT(
            COALESCE(sso.first_name, 'User'),
            ' ',
            COALESCE(sso.last_name, '')
          ) as full_name,
          sso.profile_avatar_url as avatar
        FROM users u
        LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
        WHERE u.id = ?
      `, [partner.other_user_id]);

      // Get related booking if exists
      const relatedBooking = await isanzureQuery(`
        SELECT 
          b.id,
          b.booking_uid,
          b.status,
          p.id as property_id,
          p.property_uid,
          p.title as property_title
        FROM bookings b
        INNER JOIN properties p ON b.property_id = p.id
        WHERE (b.tenant_id = ? AND b.landlord_id = ?)
           OR (b.tenant_id = ? AND b.landlord_id = ?)
        ORDER BY b.created_at DESC
        LIMIT 1
      `, [user.id, partner.other_user_id, partner.other_user_id, user.id]);

      // Parse metadata from last message
      let metadata = null;
      if (lastMessage[0].metadata) {
        try {
          metadata = JSON.parse(lastMessage[0].metadata);
        } catch (e) {}
      }

      conversations.push({
        id: `conv_${user.id}_${partner.other_user_id}`,
        uid: `conv_${user.id}_${partner.other_user_id}`,
        created_at: lastMessage[0].created_at,
        updated_at: lastMessage[0].created_at,
        unread_count: parseInt(unreadCount[0]?.count) || 0,
        other_user: otherUser[0] || {
          id: partner.other_user_id,
          full_name: 'User',
          avatar: null,
          type: 'tenant'
        },
        related_booking: relatedBooking.length > 0 ? {
          id: relatedBooking[0].id,
          booking_uid: relatedBooking[0].booking_uid,
          status: relatedBooking[0].status,
          property: {
            id: relatedBooking[0].property_id,
            uid: relatedBooking[0].property_uid,
            title: relatedBooking[0].property_title
          }
        } : null,
        last_message: {
          id: lastMessage[0].id,
          uid: lastMessage[0].message_uid,
          content: lastMessage[0].content,
          created_at: lastMessage[0].created_at,
          sender_id: lastMessage[0].sender_id,
          is_read: lastMessage[0].is_read === 1,
          is_from_me: lastMessage[0].sender_id === user.id,
          metadata: metadata
        }
      });
    }

    // Sort by last message time (newest first)
    conversations.sort((a, b) => 
      new Date(b.updated_at) - new Date(a.updated_at)
    );

    // Apply filters
    let filteredConversations = conversations;

    if (filter === 'unread') {
      filteredConversations = filteredConversations.filter(c => c.unread_count > 0);
    }

    if (filter === 'booking') {
      filteredConversations = filteredConversations.filter(c => c.related_booking !== null);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredConversations = filteredConversations.filter(c => 
        c.other_user.full_name?.toLowerCase().includes(searchLower) ||
        c.last_message?.content?.toLowerCase().includes(searchLower) ||
        c.related_booking?.property.title?.toLowerCase().includes(searchLower)
      );
    }

    // Get total unread count
    const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

    res.status(200).json({
      success: true,
      data: {
        conversations: filteredConversations,
        total: filteredConversations.length,
        unread_total: totalUnread,
        filters: { filter, search }
      }
    });

  } catch (error) {
    debugLog('Error fetching conversations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      code: 'FETCH_CONVERSATIONS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 2. GET SINGLE CONVERSATION WITH MESSAGES - FIXED
// ============================================
exports.getConversation = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
        code: 'MISSING_CONVERSATION_ID'
      });
    }

    debugLog('Fetching conversation:', conversationId);

    // Parse conversation ID to get the other user ID
    // Format: conv_123_456 or just the other user ID
    let otherUserId = conversationId;
    
    if (conversationId.startsWith('conv_')) {
      const parts = conversationId.split('_');
      otherUserId = parts[2] === String(user.id) ? parts[1] : parts[2];
    }

    // Get all messages between these two users
    const messages = await isanzureQuery(`
      SELECT 
        m.id,
        m.message_uid,
        m.content,
        m.metadata,
        m.is_read,
        m.read_at,
        m.created_at,
        m.sender_id,
        m.receiver_id,
        m.booking_id,
        u_sender.user_uid as sender_uid,
        CONCAT(
          COALESCE(sso_sender.first_name, 'User'),
          ' ',
          COALESCE(sso_sender.last_name, '')
        ) as sender_name,
        sso_sender.profile_avatar_url as sender_avatar,
        u_receiver.user_uid as receiver_uid,
        CONCAT(
          COALESCE(sso_receiver.first_name, 'User'),
          ' ',
          COALESCE(sso_receiver.last_name, '')
        ) as receiver_name,
        sso_receiver.profile_avatar_url as receiver_avatar
      FROM messages m
      LEFT JOIN users u_sender ON m.sender_id = u_sender.id
      LEFT JOIN oliviuus_db.users sso_sender ON u_sender.oliviuus_user_id = sso_sender.id
      LEFT JOIN users u_receiver ON m.receiver_id = u_receiver.id
      LEFT JOIN oliviuus_db.users sso_receiver ON u_receiver.oliviuus_user_id = sso_receiver.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [user.id, otherUserId, otherUserId, user.id]);

    // Parse metadata for each message
    const parsedMessages = messages.map(msg => ({
      ...msg,
      metadata: msg.metadata ? JSON.parse(msg.metadata) : null
    }));

    // Get other user details
    const otherUser = await isanzureQuery(`
      SELECT 
        u.id,
        u.user_uid,
        u.user_type,
        u.public_phone,
        u.public_email,
        CONCAT(
          COALESCE(sso.first_name, 'User'),
          ' ',
          COALESCE(sso.last_name, '')
        ) as full_name,
        sso.profile_avatar_url as avatar
      FROM users u
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      WHERE u.id = ?
    `, [otherUserId]);

    // Get related booking
    const relatedBooking = await isanzureQuery(`
      SELECT 
        b.id,
        b.booking_uid,
        b.status,
        p.id as property_id,
        p.property_uid,
        p.title as property_title
      FROM bookings b
      INNER JOIN properties p ON b.property_id = p.id
      WHERE (b.tenant_id = ? AND b.landlord_id = ?)
         OR (b.tenant_id = ? AND b.landlord_id = ?)
      ORDER BY b.created_at DESC
      LIMIT 1
    `, [user.id, otherUserId, otherUserId, user.id]);

    const conversation = {
      id: conversationId,
      other_user: otherUser[0] || {
        id: otherUserId,
        full_name: 'User',
        avatar: null
      },
      related_booking: relatedBooking.length > 0 ? {
        id: relatedBooking[0].id,
        booking_uid: relatedBooking[0].booking_uid,
        status: relatedBooking[0].status,
        property: {
          id: relatedBooking[0].property_id,
          uid: relatedBooking[0].property_uid,
          title: relatedBooking[0].property_title
        }
      } : null,
      messages_count: parsedMessages.length,
      unread_count: parsedMessages.filter(m => !m.is_read && m.receiver_id === user.id).length
    };

    debugLog(`Found ${parsedMessages.length} messages in conversation`);

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages: parsedMessages,
        total: parsedMessages.length
      }
    });

  } catch (error) {
    debugLog('Error fetching conversation:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      code: 'FETCH_CONVERSATION_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 3. SEND NEW MESSAGE - FIXED (NO conversation_id)
// ============================================
exports.sendMessage = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { conversationId } = req.params;
    const { message, recipient_id, booking_id, message_type = 'chat' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
        code: 'MISSING_MESSAGE'
      });
    }

    // Determine recipient ID
    let receiverId = recipient_id;
    
    if (conversationId && !receiverId) {
      if (conversationId.startsWith('conv_')) {
        const parts = conversationId.split('_');
        receiverId = parts[2] === String(user.id) ? parts[1] : parts[2];
      } else {
        receiverId = conversationId;
      }
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required',
        code: 'MISSING_RECIPIENT'
      });
    }

    debugLog('Sending message from user:', user.id, 'to:', receiverId);

    // ========== FIXED: Parse @mentions with FULL property details ==========
    const mentionRegex = /@([a-zA-Z0-9-]+)/g;
    const mentions = [];
    let mentionMatch;
    
    while ((mentionMatch = mentionRegex.exec(message)) !== null) {
      mentions.push(mentionMatch[1]);
    }

    // Get COMPLETE property details for ALL mentions
    let mentionedProperties = [];
    if (mentions.length > 0) {
      const propertyUids = [...new Set(mentions)]; // Remove duplicates
      const placeholders = propertyUids.map(() => '?').join(',');
      
      mentionedProperties = await isanzureQuery(`
        SELECT 
          p.property_uid,
          p.id,
          p.title,
          p.description,
          p.address,
          p.province,
          p.district,
          p.sector,
          p.property_type,
          p.max_guests,
          p.area,
          p.is_verified,
          COALESCE(pp.monthly_price, 0) as monthly_price,
          COALESCE(pp.weekly_price, 0) as weekly_price,
          COALESCE(pp.daily_price, 0) as daily_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image,
          (SELECT COUNT(*) FROM property_images pi2 WHERE pi2.property_id = p.id) as image_count
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.property_uid IN (${placeholders})
      `, propertyUids).catch(() => []);
    }

    // Create metadata with COMPLETE property details
    const metadata = {
      mentions: mentionedProperties.map(p => ({
        property_uid: p.property_uid,
        id: p.id,
        title: p.title,
        description: p.description ? p.description.substring(0, 100) : null,
        location: {
          address: p.address,
          province: p.province,
          district: p.district,
          sector: p.sector
        },
        price: {
          monthly: p.monthly_price,
          weekly: p.weekly_price,
          daily: p.daily_price
        },
        images: {
          cover: p.cover_image,
          count: p.image_count || 0
        },
        specs: {
          type: p.property_type,
          guests: p.max_guests,
          area: p.area
        },
        verified: p.is_verified === 1,
        mentioned_at: new Date().toISOString()
      })),
      tags: [], // Will be populated below
      has_mentions: mentions.length > 0,
      has_tags: false,
      parsed_at: new Date().toISOString()
    };

    // Parse #tags
    const tagRegex = /#([a-zA-Z0-9-]+)/g;
    const tags = [];
    let tagMatch;
    
    while ((tagMatch = tagRegex.exec(message)) !== null) {
      tags.push(tagMatch[1]);
    }
    
    if (tags.length > 0) {
      metadata.tags = tags.map(t => ({ tag: t }));
      metadata.has_tags = true;
    }

    // Insert the message
    const insertQuery = `
      INSERT INTO messages (
        message_uid,
        sender_id,
        receiver_id,
        booking_id,
        message_type,
        content,
        metadata,
        created_at,
        is_read
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), 0)
    `;

    const result = await isanzureQuery(insertQuery, [
      user.id,
      receiverId,
      booking_id || null,
      message_type,
      message.trim(),
      JSON.stringify(metadata)
    ]);

    const messageId = result.insertId;

    // Get the inserted message with FULL details
    const newMessage = await isanzureQuery(`
      SELECT 
        m.id,
        m.message_uid,
        m.content,
        m.metadata,
        m.is_read,
        m.read_at,
        m.created_at,
        m.sender_id,
        m.receiver_id,
        u_sender.user_uid as sender_uid,
        CONCAT(
          COALESCE(sso_sender.first_name, 'User'),
          ' ',
          COALESCE(sso_sender.last_name, '')
        ) as sender_name,
        sso_sender.profile_avatar_url as sender_avatar
      FROM messages m
      LEFT JOIN users u_sender ON m.sender_id = u_sender.id
      LEFT JOIN oliviuus_db.users sso_sender ON u_sender.oliviuus_user_id = sso_sender.id
      WHERE m.id = ?
    `, [messageId]);

    // Parse metadata
    if (newMessage[0].metadata) {
      newMessage[0].metadata = JSON.parse(newMessage[0].metadata);
    }

    // Rest of the function...
    // (notification, auto-mark read, etc.)

    const conversationId_response = `conv_${user.id}_${receiverId}`;

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: {
          ...newMessage[0],
          metadata // Send FULL metadata
        },
        conversation_id: conversationId_response
      }
    });

  } catch (error) {
    debugLog('Error sending message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      code: 'SEND_MESSAGE_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 4. MARK CONVERSATION AS READ - FIXED
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

    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
        code: 'MISSING_CONVERSATION_ID'
      });
    }

    debugLog('Marking conversation as read:', conversationId);

    // Parse conversation ID to get the other user
    let otherUserId = conversationId;
    
    if (conversationId.startsWith('conv_')) {
      const parts = conversationId.split('_');
      otherUserId = parts[2] === String(user.id) ? parts[1] : parts[2];
    }

    // Mark all messages from other user as read
    const result = await isanzureQuery(`
      UPDATE messages
      SET is_read = 1, read_at = UTC_TIMESTAMP()
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `, [otherUserId, user.id]);

    debugLog(`Marked ${result.affectedRows} messages as read`);

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read',
      data: {
        conversation_id: conversationId,
        messages_updated: result.affectedRows
      }
    });

  } catch (error) {
    debugLog('Error marking conversation as read:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to mark conversation as read',
      code: 'MARK_READ_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 5. MARK ALL CONVERSATIONS AS READ - FIXED
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

    debugLog('Marking all conversations as read for user:', user.id);

    const result = await isanzureQuery(`
      UPDATE messages
      SET is_read = 1, read_at = UTC_TIMESTAMP()
      WHERE receiver_id = ? AND is_read = 0
    `, [user.id]);

    debugLog(`Marked ${result.affectedRows} messages as read`);

    res.status(200).json({
      success: true,
      message: 'All conversations marked as read',
      data: {
        messages_updated: result.affectedRows
      }
    });

  } catch (error) {
    debugLog('Error marking all as read:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      code: 'MARK_ALL_READ_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 6. DELETE MESSAGE
// ============================================
exports.deleteMessage = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required',
        code: 'MISSING_MESSAGE_ID'
      });
    }

    debugLog('Deleting message:', messageId);

    // Verify user owns this message
    const message = await isanzureQuery(`
      SELECT id, sender_id FROM messages WHERE id = ? OR message_uid = ?
    `, [messageId, messageId]);

    if (message.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
        code: 'MESSAGE_NOT_FOUND'
      });
    }

    if (message[0].sender_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages',
        code: 'UNAUTHORIZED'
      });
    }

    await isanzureQuery(`
      DELETE FROM messages WHERE id = ?
    `, [message[0].id]);

    debugLog('Message deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: { message_id: messageId }
    });

  } catch (error) {
    debugLog('Error deleting message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      code: 'DELETE_MESSAGE_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 7. GET UNREAD MESSAGES COUNT
// ============================================
exports.getUnreadCount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const result = await isanzureQuery(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE receiver_id = ? AND is_read = 0
    `, [user.id]);

    const count = result[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        count,
        has_unread: count > 0
      }
    });

  } catch (error) {
    debugLog('Error getting unread count:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      code: 'UNREAD_COUNT_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 8. GET MESSAGE STATISTICS - FIXED
// ============================================
exports.getStats = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    debugLog('Fetching message stats for user:', user.id);

    const result = await isanzureQuery(`
      SELECT 
        COUNT(DISTINCT CASE 
          WHEN sender_id = ? THEN receiver_id 
          WHEN receiver_id = ? THEN sender_id 
        END) as total_conversations,
        SUM(CASE WHEN receiver_id = ? AND is_read = 0 THEN 1 ELSE 0 END) as unread_count,
        COUNT(DISTINCT CASE WHEN booking_id IS NOT NULL THEN 
          CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END 
        END) as booking_related,
        COUNT(DISTINCT CASE WHEN DATE(created_at) = CURDATE() THEN 
          CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END 
        END) as today_new,
        MAX(created_at) as last_message_time
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `, [user.id, user.id, user.id, user.id, user.id, user.id, user.id]);

    const stats = {
      total: parseInt(result[0].total_conversations) || 0,
      unread: parseInt(result[0].unread_count) || 0,
      booking_related: parseInt(result[0].booking_related) || 0,
      today_new: parseInt(result[0].today_new) || 0,
      last_message_time: result[0].last_message_time
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    debugLog('Error fetching message stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message stats',
      code: 'STATS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 9. SEARCH MESSAGES - FIXED
// ============================================
exports.searchMessages = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
        code: 'INVALID_QUERY'
      });
    }

    debugLog('Searching messages:', q);

    const messages = await isanzureQuery(`
      SELECT 
        m.id,
        m.message_uid,
        m.content,
        m.created_at,
        m.is_read,
        m.sender_id,
        m.receiver_id,
        u_sender.user_uid as sender_uid,
        CONCAT(
          COALESCE(sso_sender.first_name, 'User'),
          ' ',
          COALESCE(sso_sender.last_name, '')
        ) as sender_name,
        sso_sender.profile_avatar_url as sender_avatar,
        u_receiver.user_uid as receiver_uid,
        CONCAT(
          COALESCE(sso_receiver.first_name, 'User'),
          ' ',
          COALESCE(sso_receiver.last_name, '')
        ) as receiver_name,
        sso_receiver.profile_avatar_url as receiver_avatar
      FROM messages m
      INNER JOIN users u_sender ON m.sender_id = u_sender.id
      LEFT JOIN oliviuus_db.users sso_sender ON u_sender.oliviuus_user_id = sso_sender.id
      INNER JOIN users u_receiver ON m.receiver_id = u_receiver.id
      LEFT JOIN oliviuus_db.users sso_receiver ON u_receiver.oliviuus_user_id = sso_receiver.id
      WHERE (m.sender_id = ? OR m.receiver_id = ?)
        AND m.content LIKE ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [user.id, user.id, `%${q}%`, parseInt(limit), parseInt(offset)]);

    const totalResult = await isanzureQuery(`
      SELECT COUNT(*) as total
      FROM messages m
      WHERE (m.sender_id = ? OR m.receiver_id = ?)
        AND m.content LIKE ?
    `, [user.id, user.id, `%${q}%`]);

    const total = totalResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: total > (parseInt(offset) + messages.length)
        },
        query: q
      }
    });

  } catch (error) {
    debugLog('Error searching messages:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      code: 'SEARCH_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 10. GET PROPERTY SUGGESTIONS FOR @ MENTIONS - FIXED
// ============================================
exports.getPropertySuggestions = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { query, conversation_id } = req.query;
    const searchTerm = query || '';

    let properties = [];

    if (user.user_type === 'landlord' || user.user_type === 'property_manager' || user.user_type === 'agent') {
      // Landlord: suggest their own properties
      properties = await isanzureQuery(`
        SELECT 
          p.id,
          p.property_uid,
          p.title,
          p.description,
          p.property_type,
          p.province,
          p.district,
          p.sector,
          p.address,
          p.max_guests,
          p.area,
          p.is_verified,
          p.is_featured,
          COALESCE(pp.monthly_price, 0) as monthly_price,
          COALESCE(pp.weekly_price, 0) as weekly_price,
          COALESCE(pp.daily_price, 0) as daily_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image,
          (SELECT COUNT(*) FROM property_images pi2 WHERE pi2.property_id = p.id) as image_count
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.landlord_id = ?
          AND p.status = 'active'
          AND (p.title LIKE ? OR p.property_uid LIKE ? OR p.address LIKE ? OR p.description LIKE ?)
        LIMIT 10
      `, [user.id, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    } else {
      // Tenant: suggest properties they've booked
      properties = await isanzureQuery(`
        SELECT 
          p.id,
          p.property_uid,
          p.title,
          p.description,
          p.property_type,
          p.province,
          p.district,
          p.sector,
          p.address,
          p.max_guests,
          p.area,
          p.is_verified,
          COALESCE(pp.monthly_price, 0) as monthly_price,
          COALESCE(pp.weekly_price, 0) as weekly_price,
          COALESCE(pp.daily_price, 0) as daily_price,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image,
          (SELECT COUNT(*) FROM property_images pi2 WHERE pi2.property_id = p.id) as image_count,
          'booked' as relationship
        FROM bookings b
        INNER JOIN properties p ON b.property_id = p.id
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE b.tenant_id = ?
          AND b.status IN ('confirmed', 'active', 'completed')
        ORDER BY b.created_at DESC
        LIMIT 10
      `, [user.id]);
    }

    // Format with FULL details
    const formattedProperties = properties.map(p => ({
      id: p.property_uid,
      uid: p.property_uid,
      name: p.title,
      description: p.description,
      subtitle: `${p.district || ''} ${p.sector ? `- ${p.sector}` : ''}`.trim() || p.province || 'Location not specified',
      location: {
        address: p.address,
        province: p.province,
        district: p.district,
        sector: p.sector
      },
      image: p.cover_image || null,
      images: {
        cover: p.cover_image,
        count: p.image_count || 0
      },
      price: {
        monthly: p.monthly_price || 0,
        weekly: p.weekly_price || 0,
        daily: p.daily_price || 0
      },
      displayPrice: p.monthly_price || p.weekly_price || p.daily_price || 0,
      specs: {
        type: p.property_type,
        guests: p.max_guests,
        area: p.area
      },
      verified: p.is_verified === 1,
      relationship: p.relationship || 'available',
      meta: {
        property_uid: p.property_uid,
        property_type: p.property_type
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        suggestions: formattedProperties,
        type: 'property',
        query: searchTerm,
        total: formattedProperties.length
      }
    });

  } catch (error) {
    debugLog('Error getting property suggestions:', error.message);
    res.status(200).json({
      success: true,
      data: {
        suggestions: [],
        type: 'property',
        query: req.query.query || '',
        total: 0
      }
    });
  }
};

// ============================================
// 11. GET TAG SUGGESTIONS FOR # TAGS
// ============================================
exports.getTagSuggestions = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { query } = req.query;
    const searchTerm = query || '';

    const commonTags = [
      { tag: 'checkin', description: 'Check-in instructions', count: 0 },
      { tag: 'checkout', description: 'Check-out instructions', count: 0 },
      { tag: 'payment', description: 'Payment related', count: 0 },
      { tag: 'maintenance', description: 'Maintenance request', count: 0 },
      { tag: 'cleaning', description: 'Cleaning service', count: 0 },
      { tag: 'wifi', description: 'WiFi information', count: 0 },
      { tag: 'keys', description: 'Key handover', count: 0 },
      { tag: 'parking', description: 'Parking instructions', count: 0 },
      { tag: 'utilities', description: 'Utilities (water/electricity)', count: 0 },
      { tag: 'extension', description: 'Extension request', count: 0 }
    ];

    // Get frequently used tags from messages
    const frequentTags = await isanzureQuery(`
      SELECT 
        SUBSTRING_INDEX(SUBSTRING_INDEX(m.content, '#', -1), ' ', 1) as tag,
        COUNT(*) as frequency
      FROM messages m
      WHERE (m.sender_id = ? OR m.receiver_id = ?)
        AND m.content LIKE '%#%'
      GROUP BY tag
      ORDER BY frequency DESC
      LIMIT 10
    `, [user.id, user.id]).catch(() => []);

    const tagMap = new Map();
    
    commonTags.forEach(t => {
      tagMap.set(t.tag, {
        tag: t.tag,
        description: t.description,
        count: 0,
        type: 'common'
      });
    });

    frequentTags.forEach(t => {
      if (tagMap.has(t.tag)) {
        tagMap.get(t.tag).count = t.frequency;
        tagMap.get(t.tag).type = 'frequent';
      } else {
        tagMap.set(t.tag, {
          tag: t.tag,
          description: `#${t.tag}`,
          count: t.frequency,
          type: 'custom'
        });
      }
    });

    let suggestions = Array.from(tagMap.values());
    if (searchTerm) {
      suggestions = suggestions.filter(s => 
        s.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    suggestions.sort((a, b) => {
      if (a.type === 'frequent' && b.type !== 'frequent') return -1;
      if (a.type !== 'frequent' && b.type === 'frequent') return 1;
      return b.count - a.count;
    });

    res.status(200).json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 10),
        type: 'tag',
        query: searchTerm,
        total: suggestions.length
      }
    });

  } catch (error) {
    debugLog('Error getting tag suggestions:', error.message);
    res.status(200).json({
      success: true,
      data: {
        suggestions: [
          { tag: 'checkin', description: 'Check-in instructions', type: 'common' },
          { tag: 'checkout', description: 'Check-out instructions', type: 'common' },
          { tag: 'payment', description: 'Payment related', type: 'common' },
          { tag: 'maintenance', description: 'Maintenance request', type: 'common' },
          { tag: 'wifi', description: 'WiFi information', type: 'common' }
        ],
        type: 'tag',
        query: searchTerm || '',
        total: 5
      }
    });
  }
};

// ============================================
// 12. PARSE MESSAGE CONTENT
// ============================================
exports.parseMessageContent = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
        code: 'MISSING_CONTENT'
      });
    }

    const mentionRegex = /@([a-zA-Z0-9-]+)/g;
    const mentions = [];
    let mentionMatch;
    
    while ((mentionMatch = mentionRegex.exec(content)) !== null) {
      mentions.push({
        property_uid: mentionMatch[1],
        full_match: mentionMatch[0],
        index: mentionMatch.index
      });
    }

    const tagRegex = /#([a-zA-Z0-9-]+)/g;
    const tags = [];
    let tagMatch;
    
    while ((tagMatch = tagRegex.exec(content)) !== null) {
      tags.push({
        tag: tagMatch[1],
        full_match: tagMatch[0],
        index: tagMatch.index
      });
    }

    let propertyDetails = [];
    if (mentions.length > 0) {
      const propertyUids = mentions.map(m => m.property_uid);
      const placeholders = propertyUids.map(() => '?').join(',');
      
      propertyDetails = await isanzureQuery(`
        SELECT 
          p.property_uid,
          p.id,
          p.title,
          p.property_type,
          p.province,
          p.district,
          p.sector,
          (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image,
          COALESCE(pp.monthly_price, 0) as monthly_price
        FROM properties p
        LEFT JOIN property_pricing pp ON p.id = pp.property_id
        WHERE p.property_uid IN (${placeholders})
      `, propertyUids).catch(() => []);
    }

    res.status(200).json({
      success: true,
      data: {
        content,
        mentions: mentions.map(m => ({
          ...m,
          property: propertyDetails.find(p => p.property_uid === m.property_uid) || null
        })),
        tags,
        has_mentions: mentions.length > 0,
        has_tags: tags.length > 0
      }
    });

  } catch (error) {
    debugLog('Error parsing message content:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to parse message',
      code: 'PARSE_FAILED',
      error: error.message
    });
  }
};

module.exports = exports;