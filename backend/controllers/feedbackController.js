const { query } = require('../config/dbConfig');

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { 
      user_name, 
      user_email, 
      category, 
      feedback_type, 
      rating, 
      message, 
      allow_contact,
      platform = 'WEB'
    } = req.body;
    
    // Validate required fields
    if (!user_name || !user_email || !category || !feedback_type) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, category, and feedback type are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user_email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate feedback_type
    const validFeedbackTypes = ['LIKE', 'DISLIKE', 'DETAILED'];
    if (!validFeedbackTypes.includes(feedback_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback type. Use LIKE, DISLIKE, or DETAILED'
      });
    }

    // Validate category
    const validCategories = [
      'FEATURE_REQUEST',
      'BUG_REPORT',
      'STREAMING_ISSUE',
      'CONTENT_SUGGESTION',
      'ACCOUNT_ISSUE',
      'PAYMENT_ISSUE',
      'WEBSITE_APP_FEEDBACK',
      'CUSTOMER_SERVICE',
      'GENERAL_FEEDBACK',
      'LIKE_DISLIKE'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback category'
      });
    }

    // Validate message for DETAILED feedback type
    if (feedback_type === 'DETAILED' && (!message || message.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message is required for detailed feedback'
      });
    }

    // Validate rating (1-5 or null)
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // For simple LIKE/DISLIKE, message must be null
    if ((feedback_type === 'LIKE' || feedback_type === 'DISLIKE') && message) {
      return res.status(400).json({
        success: false,
        message: 'Simple feedback (LIKE/DISLIKE) should not include a message'
      });
    }

    // Validate platform
    const validPlatforms = ['WEB', 'ANDROID', 'IOS', 'SMART_TV', 'TABLET', 'DESKTOP_APP'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform'
      });
    }

    // Get user_id if user is authenticated
    const user_id = req.user ? req.user.id : null;
    const ip_address = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
    const user_agent = req.get('User-Agent') || 'Unknown';

    // Insert feedback into database - USING ONLY COLUMNS THAT EXIST IN THE TABLE
    const insertSql = `
      INSERT INTO feedback (
        user_id,
        user_name,
        user_email,
        category,
        feedback_type,
        rating,
        message,
        platform,
        allow_contact,
        ip_address,
        user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(insertSql, [
      user_id,
      user_name.trim(),
      user_email.trim().toLowerCase(),
      category,
      feedback_type,
      rating || null,
      message ? message.trim() : null,
      platform,
      allow_contact || false,
      ip_address,
      user_agent
    ]);

    const feedbackId = result.insertId;

    // Send success response
    res.status(201).json({
      success: true,
      message: feedback_type === 'DETAILED' 
        ? 'Thank you for your detailed feedback! We appreciate your input.'
        : feedback_type === 'LIKE'
          ? 'Thank you for the positive feedback!'
          : 'Thank you for your feedback. We\'ll work to improve.',
      data: {
        feedback_id: feedbackId,
        feedback_type: feedback_type,
        category: category
      }
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    
    // Handle specific MySQL errors
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({
        success: false,
        message: 'Database configuration error. Please contact support.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit your feedback. Please try again later.'
    });
  }
};

// Admin: Get all feedback with filters, sorting, and pagination
const getFeedback = async (req, res) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 20,
      status,
      category,
      feedback_type,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      date_start,
      date_end,
      platform
    } = req.query;

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    // Validate sort order
    const validSortOrders = ['ASC', 'DESC'];
    if (!validSortOrders.includes(sortOrder.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort order. Use ASC or DESC'
      });
    }

    // Validate sort field - ONLY COLUMNS THAT EXIST
    const validSortFields = [
      'created_at', 'updated_at', 'user_name', 'user_email', 'category', 
      'feedback_type', 'rating', 'platform'
    ];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort field'
      });
    }

    // Build WHERE conditions
    let whereConditions = [];
    let queryParams = [];

    // Status filter
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      const validStatuses = ['NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
      const filteredStatuses = statuses.filter(s => validStatuses.includes(s));
      
      if (filteredStatuses.length > 0) {
        whereConditions.push(`status IN (${filteredStatuses.map(() => '?').join(',')})`);
        queryParams.push(...filteredStatuses);
      }
    }

    // Category filter
    if (category) {
      const categories = category.split(',').map(c => c.trim());
      const validCategories = [
        'FEATURE_REQUEST', 'BUG_REPORT', 'STREAMING_ISSUE', 'CONTENT_SUGGESTION',
        'ACCOUNT_ISSUE', 'PAYMENT_ISSUE', 'WEBSITE_APP_FEEDBACK', 'CUSTOMER_SERVICE',
        'GENERAL_FEEDBACK', 'LIKE_DISLIKE'
      ];
      const filteredCategories = categories.filter(c => validCategories.includes(c));
      
      if (filteredCategories.length > 0) {
        whereConditions.push(`category IN (${filteredCategories.map(() => '?').join(',')})`);
        queryParams.push(...filteredCategories);
      }
    }

    // Feedback type filter
    if (feedback_type) {
      const types = feedback_type.split(',').map(t => t.trim());
      const validTypes = ['LIKE', 'DISLIKE', 'DETAILED'];
      const filteredTypes = types.filter(t => validTypes.includes(t));
      
      if (filteredTypes.length > 0) {
        whereConditions.push(`feedback_type IN (${filteredTypes.map(() => '?').join(',')})`);
        queryParams.push(...filteredTypes);
      }
    }

    // Search filter (user_name, user_email, message)
    if (search) {
      whereConditions.push(`(user_name LIKE ? OR user_email LIKE ? OR message LIKE ?)`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Date range filter
    if (date_start) {
      whereConditions.push(`DATE(created_at) >= ?`);
      queryParams.push(date_start);
    }
    if (date_end) {
      whereConditions.push(`DATE(created_at) <= ?`);
      queryParams.push(date_end);
    }

    // Platform filter
    if (platform) {
      const platforms = platform.split(',').map(p => p.trim());
      const validPlatforms = ['WEB', 'ANDROID', 'IOS', 'SMART_TV', 'TABLET', 'DESKTOP_APP'];
      const filteredPlatforms = platforms.filter(p => validPlatforms.includes(p));
      
      if (filteredPlatforms.length > 0) {
        whereConditions.push(`platform IN (${filteredPlatforms.map(() => '?').join(',')})`);
        queryParams.push(...filteredPlatforms);
      }
    }

    // Build the final WHERE clause
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Count total records for pagination
    const countSql = `SELECT COUNT(*) as total FROM feedback ${whereClause}`;
    const countResult = await query(countSql, queryParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    // Build main query - ONLY SELECTING COLUMNS THAT EXIST
    const sql = `
      SELECT 
        id,
        user_id,
        user_name,
        user_email,
        category,
        feedback_type,
        rating,
        message,
        platform,
        allow_contact,
        status,
        ip_address,
        created_at,
        updated_at
      FROM feedback 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    // Add pagination parameters
    queryParams.push(limitNum, offset);

    // Execute query
    const feedback = await query(sql, queryParams);

    // Prepare response
    const response = {
      success: true,
      data: {
        feedback,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalFeedback: total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        },
        filters: {
          status: status || null,
          category: category || null,
          feedback_type: feedback_type || null,
          search: search || null,
          sortBy,
          sortOrder: sortOrder.toUpperCase(),
          date_start: date_start || null,
          date_end: date_end || null,
          platform: platform || null
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
};

// Get feedback by ID
const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        id,
        user_id,
        user_name,
        user_email,
        category,
        feedback_type,
        rating,
        message,
        platform,
        allow_contact,
        status,
        ip_address,
        user_agent,
        created_at,
        updated_at
      FROM feedback 
      WHERE id = ?
    `;

    const feedback = await query(sql, [id]);

    if (feedback.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Mark as reviewed if not already
    if (feedback[0].status === 'NEW') {
      await query('UPDATE feedback SET status = "REVIEWED" WHERE id = ?', [id]);
    }

    res.json({
      success: true,
      data: feedback[0]
    });

  } catch (error) {
    console.error('Get feedback by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
};

// Update feedback status
const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided. Use: NEW, REVIEWED, IN_PROGRESS, RESOLVED, CLOSED'
      });
    }

    // Update status
    const updateSql = `UPDATE feedback SET status = ?, updated_at = NOW() WHERE id = ?`;
    const result = await query(updateSql, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Fetch updated feedback
    const feedback = await query('SELECT * FROM feedback WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback[0]
    });

  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback status'
    });
  }
};

// Admin: Get feedback statistics
const getFeedbackStats = async (req, res) => {
  try {
    const statsSql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new,
        COUNT(CASE WHEN status = 'REVIEWED' THEN 1 END) as reviewed,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed,
        COUNT(CASE WHEN feedback_type = 'LIKE' THEN 1 END) as likes,
        COUNT(CASE WHEN feedback_type = 'DISLIKE' THEN 1 END) as dislikes,
        COUNT(CASE WHEN feedback_type = 'DETAILED' THEN 1 END) as detailed,
        AVG(rating) as average_rating
      FROM feedback
    `;

    const categoryStatsSql = `
      SELECT 
        category,
        COUNT(*) as count
      FROM feedback 
      GROUP BY category 
      ORDER BY count DESC
    `;

    const platformStatsSql = `
      SELECT 
        platform,
        COUNT(*) as count
      FROM feedback 
      GROUP BY platform 
      ORDER BY count DESC
    `;

    const [stats, categoryStats, platformStats] = await Promise.all([
      query(statsSql),
      query(categoryStatsSql),
      query(platformStatsSql)
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        categories: categoryStats,
        platforms: platformStats
      }
    });

  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics'
    });
  }
};

// Export feedback as CSV
const exportFeedback = async (req, res) => {
  try {
    const { 
      status, 
      category, 
      feedback_type,
      date_start,
      date_end 
    } = req.query;

    // Build WHERE conditions
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      const validStatuses = ['NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
      const filteredStatuses = statuses.filter(s => validStatuses.includes(s));
      
      if (filteredStatuses.length > 0) {
        whereConditions.push(`status IN (${filteredStatuses.map(() => '?').join(',')})`);
        queryParams.push(...filteredStatuses);
      }
    }

    if (category) {
      const categories = category.split(',').map(c => c.trim());
      const validCategories = [
        'FEATURE_REQUEST', 'BUG_REPORT', 'STREAMING_ISSUE', 'CONTENT_SUGGESTION',
        'ACCOUNT_ISSUE', 'PAYMENT_ISSUE', 'WEBSITE_APP_FEEDBACK', 'CUSTOMER_SERVICE',
        'GENERAL_FEEDBACK', 'LIKE_DISLIKE'
      ];
      const filteredCategories = categories.filter(c => validCategories.includes(c));
      
      if (filteredCategories.length > 0) {
        whereConditions.push(`category IN (${filteredCategories.map(() => '?').join(',')})`);
        queryParams.push(...filteredCategories);
      }
    }

    if (feedback_type) {
      const types = feedback_type.split(',').map(t => t.trim());
      const validTypes = ['LIKE', 'DISLIKE', 'DETAILED'];
      const filteredTypes = types.filter(t => validTypes.includes(t));
      
      if (filteredTypes.length > 0) {
        whereConditions.push(`feedback_type IN (${filteredTypes.map(() => '?').join(',')})`);
        queryParams.push(...filteredTypes);
      }
    }

    if (date_start) {
      whereConditions.push(`DATE(created_at) >= ?`);
      queryParams.push(date_start);
    }
    if (date_end) {
      whereConditions.push(`DATE(created_at) <= ?`);
      queryParams.push(date_end);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Fetch feedback for export
    const sql = `
      SELECT 
        id,
        user_name,
        user_email,
        category,
        feedback_type,
        rating,
        message,
        platform,
        allow_contact,
        status,
        ip_address,
        created_at,
        updated_at
      FROM feedback 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const feedback = await query(sql, queryParams);

    // Generate CSV
    const headers = [
      'ID',
      'User Name',
      'User Email',
      'Category',
      'Feedback Type',
      'Rating',
      'Message',
      'Platform',
      'Allow Contact',
      'Status',
      'IP Address',
      'Created At',
      'Updated At'
    ];

    let csvContent = headers.join(',') + '\n';

    feedback.forEach(item => {
      const row = [
        item.id,
        `"${(item.user_name || '').replace(/"/g, '""')}"`,
        `"${(item.user_email || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        `"${(item.feedback_type || '').replace(/"/g, '""')}"`,
        item.rating || '',
        `"${(item.message || '').replace(/"/g, '""')}"`,
        `"${(item.platform || '').replace(/"/g, '""')}"`,
        item.allow_contact ? 'Yes' : 'No',
        `"${(item.status || '').replace(/"/g, '""')}"`,
        `"${(item.ip_address || '').replace(/"/g, '""')}"`,
        `"${format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss')}"`,
        `"${format(new Date(item.updated_at), 'yyyy-MM-dd HH:mm:ss')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=feedback_export_${Date.now()}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export feedback'
    });
  }
};

// Get feedback by user (for logged-in users to see their own feedback)
const getUserFeedback = async (req, res) => {
  try {
    // Only allow users to see their own feedback
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Get feedback by user_id OR matching email (in case they submitted before login)
    const sql = `
      SELECT 
        id,
        category,
        feedback_type,
        rating,
        message,
        platform,
        status,
        created_at
      FROM feedback 
      WHERE user_id = ? OR user_email = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const feedback = await query(sql, [
      req.user.id,
      req.user.email,
      limitNum,
      offset
    ]);

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM feedback 
      WHERE user_id = ? OR user_email = ?
    `;
    
    const countResult = await query(countSql, [req.user.id, req.user.email]);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalFeedback: total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your feedback'
    });
  }
};

module.exports = {
  submitFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  getFeedbackStats,
  exportFeedback,
  getUserFeedback
};