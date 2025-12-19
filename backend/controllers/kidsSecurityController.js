const { query } = require("../config/dbConfig");
const PDFDocument = require('pdfkit');

// Get kids security logs
const getKidsSecurityLogs = async (req, res) => {
  try {
    const parentUserId = req.user.id;
    const { 
      kid_profile_id, 
      activity_type, 
      period = '7days', // 7days, 30days, 90days
      limit = 50,
      offset = 0 
    } = req.query;

    // Calculate date range based on period
    let dateCondition = "";
    const params = [parentUserId];
    
    switch(period) {
      case '30days':
        dateCondition = "AND ks.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)";
        break;
      case '90days':
        dateCondition = "AND ks.created_at > DATE_SUB(NOW(), INTERVAL 90 DAY)";
        break;
      default:
        dateCondition = "AND ks.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)";
    }

    // Add kid profile filter
    if (kid_profile_id) {
      dateCondition += " AND ks.kid_profile_id = ?";
      params.push(kid_profile_id);
    }

    // Add activity type filter
    if (activity_type) {
      dateCondition += " AND ks.activity_type = ?";
      params.push(activity_type);
    }

    // Get logs with pagination - USING CORRECT COLUMN NAMES
    const logsQuery = `
      SELECT 
        ks.*,
        kp.name as kid_name,
        kp.birth_date,
        c.title as content_title,
        c.content_type
      FROM kids_activity_logs ks
      LEFT JOIN kids_profiles kp ON ks.kid_profile_id = kp.id
      LEFT JOIN contents c ON ks.content_id = c.id
      WHERE ks.kid_profile_id IN (
        SELECT id FROM kids_profiles WHERE parent_user_id = ?
      )
      ${dateCondition}
      ORDER BY ks.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    const logs = await query(logsQuery, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM kids_activity_logs ks
      WHERE ks.kid_profile_id IN (
        SELECT id FROM kids_profiles WHERE parent_user_id = ?
      )
      ${dateCondition}
    `;
    
    const countParams = [parentUserId];
    if (kid_profile_id) countParams.push(kid_profile_id);
    if (activity_type) countParams.push(activity_type);
    
    const countResult = await query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        logs: logs,
        total_count: countResult[0].total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: countResult[0].total,
          has_more: (parseInt(offset) + logs.length) < countResult[0].total
        }
      }
    });

  } catch (error) {
    console.error("❌ Error fetching kids security logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch security logs",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get kids activity summary
const getKidsActivitySummary = async (req, res) => {
  try {
    const parentUserId = req.user.id;
    const { period = '7days' } = req.query;

    let intervalDays;
    switch (period) {
      case '30days':
        intervalDays = 30;
        break;
      case '90days':
        intervalDays = 90;
        break;
      default:
        intervalDays = 7;
    }

    // Get basic activity summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_activities,
        SUM(CASE WHEN was_allowed = TRUE THEN 1 ELSE 0 END) as allowed_activities,
        SUM(CASE WHEN was_allowed = FALSE THEN 1 ELSE 0 END) as blocked_activities,
        COUNT(DISTINCT kid_profile_id) as active_kids,
        MIN(created_at) as first_activity,
        MAX(created_at) as last_activity
      FROM kids_activity_logs
      WHERE kid_profile_id IN (
        SELECT id FROM kids_profiles WHERE parent_user_id = ?
      )
      AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const summary = await query(summaryQuery, [parentUserId, intervalDays]);

    // Get activity by type
    const byTypeQuery = `
      SELECT 
        activity_type,
        COUNT(*) as count,
        SUM(CASE WHEN was_allowed = TRUE THEN 1 ELSE 0 END) as allowed,
        SUM(CASE WHEN was_allowed = FALSE THEN 1 ELSE 0 END) as blocked
      FROM kids_activity_logs
      WHERE kid_profile_id IN (
        SELECT id FROM kids_profiles WHERE parent_user_id = ?
      )
      AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY activity_type
      ORDER BY count DESC
    `;
    
    const byType = await query(byTypeQuery, [parentUserId, intervalDays]);

    // Get peak hours
    const peakHoursQuery = `
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as activity_count
      FROM kids_activity_logs
      WHERE kid_profile_id IN (
        SELECT id FROM kids_profiles WHERE parent_user_id = ?
      )
      AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY HOUR(created_at)
      ORDER BY activity_count DESC
      LIMIT 5
    `;
    
    const peakHours = await query(peakHoursQuery, [parentUserId, intervalDays]);

    res.json({
      success: true,
      data: {
        period: period,
        interval_days: intervalDays,
        summary: summary[0] || {},
        by_type: byType,
        peak_hours: peakHours
      }
    });

  } catch (error) {
    console.error("❌ Error getting kids activity summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get activity summary",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export kids activity logs
const exportKidsActivityLogs = async (req, res) => {
  try {
    const parentUserId = req.user.id;
    const { format = 'csv' } = req.query;

    // Get logs for export - USING CORRECT COLUMN NAMES
    const exportQuery = `
      SELECT 
        ks.id as log_id,
        kp.name as kid_name,
        ks.activity_type,
        ks.created_at as timestamp,
        ks.was_allowed as allowed,
        ks.restriction_reason,
        ks.device_type,
        ks.ip_address,
        c.title as content_title,
        c.content_type,
        ks.search_query
      FROM kids_activity_logs ks
      JOIN kids_profiles kp ON ks.kid_profile_id = kp.id
      LEFT JOIN contents c ON ks.content_id = c.id
      WHERE ks.kid_profile_id IN (
        SELECT id FROM kids_profiles WHERE parent_user_id = ?
      )
      AND ks.created_at > DATE_SUB(NOW(), INTERVAL 90 DAY)
      ORDER BY ks.created_at DESC
    `;
    
    const logs = await query(exportQuery, [parentUserId]);

    // Get parent info for PDF header
    const parentInfo = await query(`
      SELECT email, created_at as account_created 
      FROM users WHERE id = ?
    `, [parentUserId]);

    // Get kids info for PDF - USING CORRECT COLUMN NAMES
    const kidsInfo = await query(`
      SELECT name, birth_date, max_content_age_rating 
      FROM kids_profiles 
      WHERE parent_user_id = ?
    `, [parentUserId]);

    // Handle different export formats
    switch(format) {
      case 'json':
        exportJSON(res, logs, parentInfo[0], kidsInfo);
        break;
      case 'pdf':
        await exportPDF(res, logs, parentInfo[0], kidsInfo);
        break;
      default: // csv
        exportCSV(res, logs);
    }

  } catch (error) {
    console.error("❌ Error exporting kids activity logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export activity logs",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to export CSV
const exportCSV = (res, logs) => {
  const headers = [
    'Log ID',
    'Kid Name',
    'Activity Type',
    'Timestamp',
    'Allowed',
    'Restriction Reason',
    'Device Type',
    'IP Address',
    'Content Title',
    'Content Type',
    'Search Query'
  ];

  const csvRows = [
    headers.join(','),
    ...logs.map(log => [
      log.log_id,
      `"${log.kid_name || ''}"`,
      log.activity_type,
      log.timestamp,
      log.allowed ? 'Yes' : 'No',
      `"${log.restriction_reason || ''}"`,
      log.device_type,
      log.ip_address || '',
      `"${log.content_title || ''}"`,
      log.content_type || '',
      `"${log.search_query || ''}"`
    ].join(','))
  ];

  const exportData = csvRows.join('\n');
  const filename = `kids-activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(exportData);
};

// Helper function to export JSON
const exportJSON = (res, logs, parentInfo, kidsInfo) => {
  const exportData = {
    export_info: {
      generated_at: new Date().toISOString(),
      format: 'json',
      total_records: logs.length,
      parent_email: parentInfo?.email || 'Unknown',
      account_created: parentInfo?.account_created || 'Unknown'
    },
    kids_info: kidsInfo,
    activity_logs: logs
  };

  const filename = `kids-activity-logs-${new Date().toISOString().split('T')[0]}.json`;
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(exportData, null, 2));
};

// Helper function to export PDF
const exportPDF = async (res, logs, parentInfo, kidsInfo) => {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4'
  });

  const filename = `kids-activity-logs-${new Date().toISOString().split('T')[0]}.pdf`;
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  // Pipe PDF to response
  doc.pipe(res);

  // Header
  doc.fontSize(20).text('Kids Activity Report', { align: 'center' });
  doc.moveDown();
  
  // Parent Information
  doc.fontSize(12).text('Parent Information:', { underline: true });
  doc.fontSize(10).text(`Email: ${parentInfo?.email || 'Unknown'}`);
  doc.text(`Account Created: ${parentInfo?.account_created ? new Date(parentInfo.account_created).toLocaleDateString() : 'Unknown'}`);
  doc.text(`Report Generated: ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  
  // Kids Information
  doc.fontSize(12).text('Kids Profiles:', { underline: true });
  kidsInfo.forEach((kid, index) => {
    const birthDate = kid.birth_date ? new Date(kid.birth_date) : null;
    const age = birthDate ? Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000)) : 'Unknown';
    doc.fontSize(10).text(`${index + 1}. ${kid.name} - Age: ${age} years - Max Rating: ${kid.max_content_age_rating || 'Not set'}`);
  });
  doc.moveDown();
  
  // Summary Stats
  const totalActivities = logs.length;
  const allowedActivities = logs.filter(log => log.allowed).length;
  const blockedActivities = totalActivities - allowedActivities;
  
  doc.fontSize(12).text('Summary Statistics:', { underline: true });
  doc.fontSize(10).text(`Total Activities: ${totalActivities}`);
  doc.text(`Allowed Activities: ${allowedActivities} (${totalActivities > 0 ? ((allowedActivities/totalActivities)*100).toFixed(1) : 0}%)`);
  doc.text(`Blocked Activities: ${blockedActivities} (${totalActivities > 0 ? ((blockedActivities/totalActivities)*100).toFixed(1) : 0}%)`);
  doc.moveDown();
  
  // Activity Logs Table Header
  doc.fontSize(12).text('Activity Logs:', { underline: true });
  doc.moveDown(0.5);
  
  // Table headers
  const tableTop = doc.y;
  const tableLeft = 50;
  const colWidths = [40, 60, 70, 70, 40, 60, 60, 80];
  const headers = ['#', 'Kid', 'Activity', 'Time', 'Status', 'Device', 'Content', 'Reason'];
  
  // Draw headers
  let currentX = tableLeft;
  headers.forEach((header, i) => {
    doc.fontSize(9).font('Helvetica-Bold').text(header, currentX, tableTop, {
      width: colWidths[i],
      align: 'left'
    });
    currentX += colWidths[i];
  });
  
  // Draw line under headers
  doc.moveTo(tableLeft, tableTop + 15)
     .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
     .stroke();
  
  // Activity logs rows
  let yPos = tableTop + 20;
  
  logs.forEach((log, index) => {
    // Check if we need a new page
    if (yPos > doc.page.height - 100) {
      doc.addPage();
      yPos = 50;
      
      // Redraw headers on new page
      currentX = tableLeft;
      headers.forEach((header, i) => {
        doc.fontSize(9).font('Helvetica-Bold').text(header, currentX, yPos, {
          width: colWidths[i],
          align: 'left'
        });
        currentX += colWidths[i];
      });
      yPos += 20;
    }
    
    const rowData = [
      (index + 1).toString(),
      log.kid_name || 'Unknown',
      formatActivityType(log.activity_type),
      new Date(log.timestamp).toLocaleDateString(),
      log.allowed ? '✓' : '✗',
      log.device_type,
      log.content_title ? log.content_title.substring(0, 15) + (log.content_title.length > 15 ? '...' : '') : '-',
      log.restriction_reason ? log.restriction_reason.substring(0, 20) + (log.restriction_reason.length > 20 ? '...' : '') : '-'
    ];
    
    currentX = tableLeft;
    doc.fontSize(8).font('Helvetica');
    
    rowData.forEach((cell, i) => {
      doc.text(cell, currentX, yPos, {
        width: colWidths[i],
        align: 'left'
      });
      currentX += colWidths[i];
    });
    
    yPos += 15;
  });
  
  // Footer
  doc.addPage();
  doc.fontSize(12).text('Report Summary', { align: 'center', underline: true });
  doc.moveDown();
  
  // Activity type breakdown
  const activityTypes = {};
  logs.forEach(log => {
    activityTypes[log.activity_type] = (activityTypes[log.activity_type] || 0) + 1;
  });
  
  doc.fontSize(10).text('Activity Type Breakdown:', { underline: true });
  Object.entries(activityTypes).forEach(([type, count]) => {
    doc.text(`${formatActivityType(type)}: ${count} activities (${((count/totalActivities)*100).toFixed(1)}%)`);
  });
  
  doc.moveDown();
  
  // Most active kid
  const kidActivityCount = {};
  logs.forEach(log => {
    kidActivityCount[log.kid_name] = (kidActivityCount[log.kid_name] || 0) + 1;
  });
  
  const mostActiveKid = Object.entries(kidActivityCount).sort((a, b) => b[1] - a[1])[0];
  
  if (mostActiveKid) {
    doc.text(`Most Active Kid: ${mostActiveKid[0]} with ${mostActiveKid[1]} activities`);
  }
  
  // Finalize PDF
  doc.end();
};

// Helper function to format activity type for display
const formatActivityType = (type) => {
  if (!type) return 'Unknown';
  
  const types = {
    'content_view': 'Content View',
    'content_attempt': 'Content Attempt',
    'search': 'Search',
    'time_limit': 'Time Limit',
    'pin_entry': 'PIN Entry',
    'mode_switch': 'Mode Switch'
  };
  
  return types[type] || type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1);
};

// Get kids dashboard stats
const getKidsDashboardStats = async (req, res) => {
  try {
    const parentUserId = req.user.id;

    // Get total kids count
    const kidsCount = await query(`
      SELECT COUNT(*) as total_kids FROM kids_profiles WHERE parent_user_id = ? AND is_active = TRUE
    `, [parentUserId]);

    // Get today's activity
    const todayActivity = await query(`
      SELECT 
        COUNT(*) as today_total,
        SUM(CASE WHEN was_allowed = FALSE THEN 1 ELSE 0 END) as today_blocked
      FROM kids_activity_logs
      WHERE kid_profile_id IN (
        SELECT id FROM kids_profiles WHERE parent_user_id = ?
      )
      AND DATE(created_at) = CURDATE()
    `, [parentUserId]);

    // Get most active kid
    const mostActiveKid = await query(`
      SELECT 
        kp.name as kid_name,
        COUNT(*) as activity_count
      FROM kids_activity_logs ks
      JOIN kids_profiles kp ON ks.kid_profile_id = kp.id
      WHERE ks.kid_profile_id IN (
        SELECT id FROM kids_profiles WHERE parent_user_id = ?
      )
      AND ks.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY ks.kid_profile_id, kp.name
      ORDER BY activity_count DESC
      LIMIT 1
    `, [parentUserId]);

    // Get pending notifications
    const pendingNotifications = await query(`
      SELECT COUNT(*) as count
      FROM parent_notifications
      WHERE parent_user_id = ? 
      AND status = 'pending'
      AND created_at > DATE_SUB(NOW(), INTERVAL 3 DAY)
    `, [parentUserId]);

    // Get time limit warnings
    const timeLimitWarnings = await query(`
      SELECT COUNT(DISTINCT kid_profile_id) as count
      FROM kids_activity_logs
      WHERE kid_profile_id IN (
        SELECT id FROM kids_profiles WHERE parent_user_id = ?
      )
      AND activity_type = 'time_limit'
      AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
    `, [parentUserId]);

    res.json({
      success: true,
      data: {
        total_kids: kidsCount[0]?.total_kids || 0,
        today_activity: {
          total: todayActivity[0]?.today_total || 0,
          blocked: todayActivity[0]?.today_blocked || 0
        },
        most_active_kid: mostActiveKid[0] || null,
        alerts: {
          pending_notifications: pendingNotifications[0]?.count || 0,
          time_limit_warnings: timeLimitWarnings[0]?.count || 0
        }
      }
    });

  } catch (error) {
    console.error("❌ Error getting kids dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Log kid activity (for use in other controllers)
const logKidActivity = async (activityData) => {
  try {
    const {
      kid_profile_id,
      activity_type,
      activity_details,
      content_id,
      search_query,
      was_allowed,
      restriction_reason,
      device_type = 'web',
      ip_address
      // REMOVED: session_id (not in your table)
    } = activityData;

    // Validate required fields
    if (!kid_profile_id || !activity_type) {
      console.error("Missing required fields for kid activity log");
      return false;
    }

    // Insert activity log - CORRECT COLUMNS TO MATCH YOUR TABLE
    const insertQuery = `
      INSERT INTO kids_activity_logs (
        kid_profile_id,
        activity_type,
        activity_details,
        content_id,
        search_query,
        was_allowed,
        restriction_reason,
        device_type,
        ip_address,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await query(insertQuery, [
      kid_profile_id,
      activity_type,
      activity_details ? JSON.stringify(activity_details) : null,
      content_id || null,
      search_query || null,
      was_allowed,
      restriction_reason || null,
      device_type,
      ip_address || null
      // REMOVED: session_id parameter
    ]);

    // Create parent notification for blocked activities
    if (!was_allowed) {
      await createParentNotification(kid_profile_id, activity_type, activityData);
    }

    return true;

  } catch (error) {
    console.error("❌ Error logging kid activity:", error);
    return false;
  }
};


// Create parent notification for blocked activities
const createParentNotification = async (kid_profile_id, activity_type, activityData) => {
  try {
    // Get parent user ID - USING CORRECT COLUMN NAMES
    const kidInfo = await query(`
      SELECT parent_user_id, name as kid_name 
      FROM kids_profiles 
      WHERE id = ?
    `, [kid_profile_id]);

    if (kidInfo.length === 0) return;

    const parent_user_id = kidInfo[0].parent_user_id;
    const kid_name = kidInfo[0].kid_name;

    // Create notification message based on activity type
    let message = '';
    let title = '';
    
    switch(activity_type) {
      case 'content_attempt':
        title = `🚫 Content Blocked - ${kid_name}`;
        message = activityData.content_id 
          ? `${kid_name} tried to access restricted content.`
          : `${kid_name} attempted to access blocked content.`;
        break;
      case 'search':
        title = `🔍 Restricted Search - ${kid_name}`;
        message = activityData.search_query
          ? `${kid_name} searched for "${activityData.search_query.substring(0, 50)}${activityData.search_query.length > 50 ? '...' : ''}" which was blocked.`
          : `${kid_name} made a blocked search query.`;
        break;
      case 'time_limit':
        title = `⏰ Time Limit Reached - ${kid_name}`;
        message = `${kid_name} has reached their daily time limit.`;
        break;
      default:
        title = `⚠️ Restricted Activity - ${kid_name}`;
        message = `${kid_name} attempted a restricted activity.`;
    }

    // Insert notification
    await query(`
      INSERT INTO parent_notifications (
        parent_user_id,
        kid_profile_id,
        notification_type,
        title,
        message,
        content_id,
        additional_data,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      parent_user_id,
      kid_profile_id,
      activity_type,
      title,
      message,
      activityData.content_id || null,
      JSON.stringify({
        activity_type: activity_type,
        activity_details: activityData.activity_details,
        search_query: activityData.search_query,
        device_type: activityData.device_type,
        restriction_reason: activityData.restriction_reason,
        timestamp: new Date().toISOString()
      })
    ]);

  } catch (error) {
    console.error("❌ Error creating parent notification:", error);
  }
};

// Log kid activity endpoint
const logKidActivityEndpoint = async (req, res) => {
  try {
    const {
      kid_profile_id,
      activity_type,
      activity_details,
      content_id,
      search_query,
      was_allowed,
      restriction_reason,
      device_type,
      ip_address
      // REMOVED: session_id from destructuring
    } = req.body;

    const result = await logKidActivity({
      kid_profile_id,
      activity_type,
      activity_details,
      content_id,
      search_query,
      was_allowed,
      restriction_reason,
      device_type,
      ip_address
      // REMOVED: session_id
    });

    if (result) {
      res.json({
        success: true,
        message: "Activity logged successfully"
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to log activity"
      });
    }
  } catch (error) {
    console.error("❌ Error logging kid activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to log activity",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create security alert endpoint
const createSecurityAlert = async (req, res) => {
  try {
    const {
      kid_profile_id,
      alert_type,
      severity = 'medium',
      description,
      details
    } = req.body;

    // Get parent user ID for notification
    const kidInfo = await query(`
      SELECT parent_user_id, name as kid_name 
      FROM kids_profiles 
      WHERE id = ?
    `, [kid_profile_id]);

    if (kidInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kid profile not found"
      });
    }

    const parent_user_id = kidInfo[0].parent_user_id;
    const kid_name = kidInfo[0].kid_name;

    // Create alert message based on type
    let title = '';
    let message = '';

    switch(alert_type) {
      case 'multiple_pin_failures':
        title = `🔒 Multiple Failed PIN Attempts - ${kid_name}`;
        message = `${kid_name} has made multiple failed attempts to exit Kids Mode.`;
        break;
      case 'restricted_content':
        title = `🚫 Restricted Content Attempt - ${kid_name}`;
        message = `${kid_name} attempted to access restricted content.`;
        break;
      case 'time_limit_exceeded':
        title = `⏰ Time Limit Exceeded - ${kid_name}`;
        message = `${kid_name} has exceeded their daily time limit.`;
        break;
      default:
        title = `⚠️ Security Alert - ${kid_name}`;
        message = `Security alert detected for ${kid_name}.`;
    }

    // Insert into security logs table
    await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      parent_user_id,
      'kid_security_alert',
      req.ip || 'unknown',
      'success',
      JSON.stringify({
        kid_profile_id,
        kid_name,
        alert_type,
        severity,
        description,
        details: details || {},
        timestamp: new Date().toISOString()
      })
    ]);

    // Create parent notification
    await query(`
      INSERT INTO parent_notifications 
      (parent_user_id, kid_profile_id, notification_type, title, message, additional_data, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      parent_user_id,
      kid_profile_id,
      alert_type,
      title,
      message,
      JSON.stringify({
        severity,
        description,
        details: details || {},
        timestamp: new Date().toISOString()
      })
    ]);

    res.json({
      success: true,
      message: "Security alert created successfully",
      alert: {
        type: alert_type,
        severity,
        kid_name,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Error creating security alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create security alert",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getKidsSecurityLogs,
  getKidsActivitySummary,
  exportKidsActivityLogs,
  getKidsDashboardStats,
  logKidActivity,
  createParentNotification,
    logKidActivityEndpoint,
  createSecurityAlert
};