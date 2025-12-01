const { query } = require('../config/dbConfig');
const { format } = require('date-fns');
const {sendContactReplyEmail} = require("../services/emailService");

// Submit contact form
const submitContact = async (req, res) => {
  try {
    const { name, email, category, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !category || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Auto-assign priority based on category
    const getPriority = (category) => {
      switch (category) {
        case 'feature_request':
        case 'feedback':
          return 'low';
        case 'technical':
        case 'bug_report':
          return 'high';
        case 'general':
        case 'billing':
        case 'partnership':
        case 'other':
        default:
          return 'medium';
      }
    };

    const priority = getPriority(category);
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    // Get user_id if user is authenticated
    const userId = req.user ? req.user.id : null;

    // Insert contact into database
    const insertSql = `
      INSERT INTO contacts (
        name, email, category, subject, message, 
        priority, user_id, ip_address, user_agent, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'website')
    `;

    const result = await query(insertSql, [
      name.trim(),
      email.trim().toLowerCase(),
      category,
      subject.trim(),
      message.trim(),
      priority,
      userId,
      ipAddress,
      userAgent
    ]);

    const contactId = result.insertId;

    // Create notification for all admins if priority is high
    if (priority === 'high') {
      try {
        // Get all admin users
        const adminUsers = await query(
          'SELECT id FROM users WHERE role = ? AND is_active = TRUE',
          ['admin']
        );

        if (adminUsers.length > 0) {
          // Prepare notification values for all admins
          const notificationValues = adminUsers.map(admin => [
            admin.id,
            'contact',
            'New High Priority Support Request',
            `User ${name} (${email}) submitted a high priority support request: "${subject}"`,
            'support',
            'high',
            contactId,
            'contact',
            `/admin/support#all`
          ]);

          // Insert notifications for all admins
          const insertNotificationSql = `
            INSERT INTO notifications 
            (user_id, type, title, message, icon, priority, reference_id, reference_type, action_url) 
            VALUES ?
          `;

          await query(insertNotificationSql, [notificationValues]);
          
          console.log(`✅ Created high-priority notifications for ${adminUsers.length} admins for contact #${contactId}`);
        }
      } catch (notificationError) {
        // Don't fail the contact submission if notification creation fails
        console.error('❌ Error creating admin notifications:', notificationError);
        // Continue with contact submission success
      }
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.',
      data: {
        contactId: contactId,
        priority: priority,
        estimatedResponseTime: getEstimatedResponseTime(priority)
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit your message. Please try again later.'
    });
  }
};

// Get contact by ID
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        id,
        name,
        email,
        category,
        subject,
        message,
        status,
        priority,
        user_id,
        source,
        ip_address,
        user_agent,
        read_at,
        first_response_at,
        resolved_at,
        response_count,
        last_response_at,
        created_at,
        updated_at
      FROM contacts 
      WHERE id = ?
    `;

    const contacts = await query(sql, [id]);

    if (contacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Mark as read if not already read
    if (!contacts[0].read_at) {
      await query('UPDATE contacts SET read_at = NOW() WHERE id = ?', [id]);
    }

    res.json({
      success: true,
      data: contacts[0]
    });

  } catch (error) {
    console.error('Get contact by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact'
    });
  }
};

// Admin: Get all contacts with filters, sorting, and pagination
const getContacts = async (req, res) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      // Add advanced filters
      date_start,
      date_end,
      response_count,
      source
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

    // Validate sort field
    const validSortFields = [
      'created_at', 'updated_at', 'name', 'email', 'priority', 
      'status', 'category', 'response_count'
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
      const validStatuses = ['new', 'open', 'in_progress', 'awaiting_reply', 'resolved', 'closed'];
      const filteredStatuses = statuses.filter(s => validStatuses.includes(s));
      
      if (filteredStatuses.length > 0) {
        whereConditions.push(`status IN (${filteredStatuses.map(() => '?').join(',')})`);
        queryParams.push(...filteredStatuses);
      }
    }

    // Priority filter
    if (priority) {
      const priorities = priority.split(',').map(p => p.trim());
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      const filteredPriorities = priorities.filter(p => validPriorities.includes(p));
      
      if (filteredPriorities.length > 0) {
        whereConditions.push(`priority IN (${filteredPriorities.map(() => '?').join(',')})`);
        queryParams.push(...filteredPriorities);
      }
    }

    // Category filter
    if (category) {
      const categories = category.split(',').map(c => c.trim());
      const validCategories = ['general', 'technical', 'billing', 'feature_request', 'bug_report', 'partnership', 'feedback', 'other'];
      const filteredCategories = categories.filter(c => validCategories.includes(c));
      
      if (filteredCategories.length > 0) {
        whereConditions.push(`category IN (${filteredCategories.map(() => '?').join(',')})`);
        queryParams.push(...filteredCategories);
      }
    }

    // Search filter (name, email, subject, message)
    if (search) {
      whereConditions.push(`(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
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

    // Source filter
    if (source) {
      const sources = source.split(',').map(s => s.trim());
      const validSources = ['website', 'mobile_app', 'api', 'email'];
      const filteredSources = sources.filter(s => validSources.includes(s));
      
      if (filteredSources.length > 0) {
        whereConditions.push(`source IN (${filteredSources.map(() => '?').join(',')})`);
        queryParams.push(...filteredSources);
      }
    }

    // Response count filter
    if (response_count) {
      switch (response_count) {
        case '0':
          whereConditions.push(`(response_count = 0 OR response_count IS NULL)`);
          break;
        case '1-3':
          whereConditions.push(`response_count BETWEEN 1 AND 3`);
          break;
        case '4+':
          whereConditions.push(`response_count >= 4`);
          break;
      }
    }

    // Build the final WHERE clause
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Count total records for pagination
    const countSql = `SELECT COUNT(*) as total FROM contacts ${whereClause}`;
    const countResult = await query(countSql, queryParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    // Build main query
    const sql = `
      SELECT 
        id,
        name,
        email,
        category,
        subject,
        message,
        status,
        priority,
        user_id,
        source,
        ip_address,
        user_agent,
        read_at,
        first_response_at,
        resolved_at,
        response_count,
        last_response_at,
        created_at,
        updated_at
      FROM contacts 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    // Add pagination parameters
    queryParams.push(limitNum, offset);

    // Execute query
    const contacts = await query(sql, queryParams);

    // Prepare response
    const response = {
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalContacts: total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        },
        filters: {
          status: status || null,
          priority: priority || null,
          category: category || null,
          search: search || null,
          sortBy,
          sortOrder: sortOrder.toUpperCase(),
          // Include advanced filters in response
          date_start: date_start || null,
          date_end: date_end || null,
          response_count: response_count || null,
          source: source || null
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
};

// Update contact status
const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'open', 'in_progress', 'awaiting_reply', 'resolved', 'closed'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    // Update status and set resolved_at if status is resolved
    let updateSql = `UPDATE contacts SET status = ?, updated_at = NOW()`;
    let updateParams = [status];

    if (status === 'resolved' || status === 'closed') {
      updateSql += `, resolved_at = NOW()`;
    }

    updateSql += ` WHERE id = ?`;
    updateParams.push(id);

    const result = await query(updateSql, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Fetch updated contact
    const contact = await query('SELECT * FROM contacts WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact[0]
    });

  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status'
    });
  }
};

// Send reply to contact
const sendReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // First, get contact details to send email
      const contact = await query('SELECT * FROM contacts WHERE id = ?', [id]);
      
      if (contact.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      const contactData = contact[0];

      // Insert reply into contact_responses
      const insertReplySql = `
        INSERT INTO contact_responses (contact_id, responder_id, message, is_internal)
        VALUES (?, ?, ?, FALSE)
      `;
      await query(insertReplySql, [id, req.user.id, message.trim()]);

      // Update contact with response count and timestamps
      const updateContactSql = `
        UPDATE contacts 
        SET 
          response_count = COALESCE(response_count, 0) + 1,
          last_response_at = NOW(),
          status = CASE 
            WHEN status = 'new' THEN 'in_progress' 
            ELSE status 
          END,
          first_response_at = COALESCE(first_response_at, NOW()),
          updated_at = NOW()
        WHERE id = ?
      `;
      await query(updateContactSql, [id]);

      await query('COMMIT');

      // Send email to the user (non-blocking)
      try {
        await sendContactReplyEmail(
          contactData.email,
          message.trim(),
          contactData.subject
        );
        // console.log(`📧 Reply email sent to ${contactData.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send reply email:', emailError);
        // Don't fail the request if email fails
      }

      // Fetch updated contact
      const updatedContact = await query('SELECT * FROM contacts WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Reply sent successfully',
        data: updatedContact[0]
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Send reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply'
    });
  }
};

// Export contacts as CSV
const exportContacts = async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;

    // Build WHERE conditions (same as getContacts)
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      const validStatuses = ['new', 'open', 'in_progress', 'awaiting_reply', 'resolved', 'closed'];
      const filteredStatuses = statuses.filter(s => validStatuses.includes(s));
      
      if (filteredStatuses.length > 0) {
        whereConditions.push(`status IN (${filteredStatuses.map(() => '?').join(',')})`);
        queryParams.push(...filteredStatuses);
      }
    }

    if (priority) {
      const priorities = priority.split(',').map(p => p.trim());
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      const filteredPriorities = priorities.filter(p => validPriorities.includes(p));
      
      if (filteredPriorities.length > 0) {
        whereConditions.push(`priority IN (${filteredPriorities.map(() => '?').join(',')})`);
        queryParams.push(...filteredPriorities);
      }
    }

    if (category) {
      const categories = category.split(',').map(c => c.trim());
      const validCategories = ['general', 'technical', 'billing', 'feature_request', 'bug_report', 'partnership', 'feedback', 'other'];
      const filteredCategories = categories.filter(c => validCategories.includes(c));
      
      if (filteredCategories.length > 0) {
        whereConditions.push(`category IN (${filteredCategories.map(() => '?').join(',')})`);
        queryParams.push(...filteredCategories);
      }
    }

    if (search) {
      whereConditions.push(`(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Fetch contacts for export
    const sql = `
      SELECT 
        id,
        name,
        email,
        category,
        subject,
        message,
        status,
        priority,
        source,
        ip_address,
        response_count,
        created_at,
        updated_at
      FROM contacts 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const contacts = await query(sql, queryParams);

    // Generate CSV
    const headers = [
      'ID',
      'Name',
      'Email',
      'Category',
      'Subject',
      'Message',
      'Status',
      'Priority',
      'Source',
      'IP Address',
      'Response Count',
      'Created At',
      'Updated At'
    ];

    let csvContent = headers.join(',') + '\n';

    contacts.forEach(contact => {
      const row = [
        contact.id,
        `"${(contact.name || '').replace(/"/g, '""')}"`,
        `"${(contact.email || '').replace(/"/g, '""')}"`,
        `"${(contact.category || '').replace(/"/g, '""')}"`,
        `"${(contact.subject || '').replace(/"/g, '""')}"`,
        `"${(contact.message || '').replace(/"/g, '""')}"`,
        `"${(contact.status || '').replace(/"/g, '""')}"`,
        `"${(contact.priority || '').replace(/"/g, '""')}"`,
        `"${(contact.source || '').replace(/"/g, '""')}"`,
        `"${(contact.ip_address || '').replace(/"/g, '""')}"`,
        contact.response_count || 0,
        `"${format(new Date(contact.created_at), 'yyyy-MM-dd HH:mm:ss')}"`,
        `"${format(new Date(contact.updated_at), 'yyyy-MM-dd HH:mm:ss')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=contacts_export_${Date.now()}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export contacts'
    });
  }
};

// Admin: Get contact statistics
const getContactStats = async (req, res) => {
  try {
    const statsSql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'awaiting_reply' THEN 1 END) as awaiting_reply,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low
      FROM contacts
    `;

    const categoryStatsSql = `
      SELECT 
        category,
        COUNT(*) as count
      FROM contacts 
      GROUP BY category 
      ORDER BY count DESC
    `;

    const [stats, categoryStats] = await Promise.all([
      query(statsSql),
      query(categoryStatsSql)
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        categories: categoryStats
      }
    });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact statistics'
    });
  }
};

// Helper function for estimated response time
const getEstimatedResponseTime = (priority) => {
  switch (priority) {
    case 'urgent': return '1-2 hours';
    case 'high': return '4-8 hours';
    case 'medium': return '12-24 hours';
    case 'low': return '24-48 hours';
    default: return '24 hours';
  }
};

// Replied Message
const getContactResponses = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        cr.id,
        cr.contact_id,
        cr.responder_id,
        cr.message,
        cr.is_internal,
        cr.created_at
      FROM contact_responses cr
      WHERE cr.contact_id = ?
      ORDER BY cr.created_at ASC
    `;

    const responses = await query(sql, [id]);

    res.json({
      success: true,
      data: responses
    });

  } catch (error) {
    console.error('Get contact responses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact responses'
    });
  }
};

// Get contact info
const getContactInfo = async (req, res) => {
  try {
    const sql = 'SELECT email, phone FROM contact_info LIMIT 1';
    const result = await query(sql);
    
    if (result.length === 0) {
      return res.json({
        success: true,
        data: {
          email: 'support@oliviuus.com',
          phone: '+250 788 123 456'
        }
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Get contact info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact information'
    });
  }
};

// Update contact info
const updateContactInfo = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email and phone are required'
      });
    }

    // Check if record exists
    const checkSql = 'SELECT id FROM contact_info LIMIT 1';
    const existing = await query(checkSql);

    let result;
    if (existing.length > 0) {
      // Update existing
      result = await query(
        'UPDATE contact_info SET email = ?, phone = ? WHERE id = ?',
        [email, phone, existing[0].id]
      );
    } else {
      // Insert new
      result = await query(
        'INSERT INTO contact_info (email, phone) VALUES (?, ?)',
        [email, phone]
      );
    }

    res.json({
      success: true,
      message: 'Contact information updated successfully',
      data: { email, phone }
    });

  } catch (error) {
    console.error('Update contact info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact information'
    });
  }
};


module.exports = {
  submitContact,
  getContacts,
  getContactStats,
  updateContactStatus,
  sendReply,
  exportContacts,
  getContactById,
  getContactResponses,
  getContactInfo,
  updateContactInfo,
};