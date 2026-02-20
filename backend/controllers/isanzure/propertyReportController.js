// backend/controllers/isanzure/propertyReportController.js
const { isanzureQuery } = require('../../config/isanzureDbConfig');

const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 📝 ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 📝 ${message}`);
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
        sso.email as email,
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
// 1. SUBMIT PROPERTY REPORT (TEXT ONLY)
// ============================================
exports.submitReport = async (req, res) => {
  try {
    // Get authenticated user (if any)
    const user = await getAuthenticatedUser(req);
    
    const { propertyUid } = req.params;
    const formData = req.body;

    debugLog('Submitting report for property:', propertyUid);
    debugLog('Form data received:', formData);

    // Validate required fields
    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required',
        code: 'MISSING_PROPERTY_UID'
      });
    }

    if (!formData.report_type) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required',
        code: 'MISSING_REPORT_TYPE'
      });
    }

    // Get property ID from UID
    const property = await isanzureQuery(`
      SELECT id, landlord_id, title FROM properties WHERE property_uid = ?
    `, [propertyUid]);

    if (property.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    const propertyId = property[0].id;

    // Check if logged-in user has already reported this property (optional)
    if (user) {
      const existingReport = await isanzureQuery(`
        SELECT id, status FROM property_reports 
        WHERE reporter_id = ? AND property_id = ? AND status IN ('pending', 'under_review', 'investigating')
        LIMIT 1
      `, [user.id, propertyId]);

      if (existingReport.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already reported this property',
          code: 'ALREADY_REPORTED',
          data: { report_status: existingReport[0].status }
        });
      }
    }

    // Prepare report data
    const reportData = {
      reporter_id: user?.id || null,
      property_id: propertyId,
      
      // Anonymous info
      anonymous_name: !user ? (formData.anonymous_name || null) : null,
      anonymous_email: !user ? (formData.anonymous_email || null) : null,
      anonymous_phone: !user ? (formData.anonymous_phone || null) : null,
      
      // Report details
      report_type: formData.report_type,
      
      // Type-specific fields (only set if they exist)
      fake_listing_reason: formData.fake_listing_reason || null,
      price_issue_type: formData.price_issue_type || null,
      inaccurate_info_field: formData.inaccurate_info_field || null,
      scam_type: formData.scam_type || null,
      landlord_issue_type: formData.landlord_issue_type || null,
      safety_issue_type: formData.safety_issue_type || null,
      
      // Description
      description: formData.description || null,
      
      // Contact preference
      contact_allowed: formData.contact_allowed === 'true' || formData.contact_allowed === true,
      contact_method: formData.contact_method || 'none',
      
      // Reporter IP (for anonymous)
      reporter_ip: !user ? (req.ip || req.connection.remoteAddress) : null,
      reporter_user_agent: !user ? req.headers['user-agent'] : null,
      
      // Status defaults
      status: 'pending',
      priority: 'medium'
    };

    // Build SQL query dynamically based on available fields
    const fields = Object.keys(reportData).filter(key => reportData[key] !== undefined);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(key => reportData[key]);

    const sql = `
      INSERT INTO property_reports (
        report_uid,
        ${fields.join(', ')}
      ) VALUES (UUID(), ${placeholders})
    `;

    const result = await isanzureQuery(sql, values);
    const reportId = result.insertId;

    // Get the created report
    const newReport = await isanzureQuery(`
      SELECT 
        report_uid,
        report_type,
        status,
        created_at
      FROM property_reports 
      WHERE id = ?
    `, [reportId]);

    debugLog('Report submitted successfully:', newReport[0]);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      code: 'REPORT_SUBMITTED',
      data: {
        report: newReport[0],
        property: {
          uid: propertyUid,
          title: property[0].title
        }
      }
    });

  } catch (error) {
    debugLog('Error submitting report:', error.message);
    
    // Check for duplicate entry
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this property',
        code: 'ALREADY_REPORTED'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      code: 'REPORT_SUBMISSION_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 2. GET REPORT STATUS (FOR REPORTER)
// ============================================
exports.getReportStatus = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { reportUid } = req.params;

    if (!reportUid) {
      return res.status(400).json({
        success: false,
        message: 'Report UID is required',
        code: 'MISSING_REPORT_UID'
      });
    }

    let sql = `
      SELECT 
        pr.report_uid,
        pr.report_type,
        pr.status,
        pr.created_at,
        pr.updated_at,
        pr.resolved_at,
        p.property_uid,
        p.title as property_title
      FROM property_reports pr
      INNER JOIN properties p ON pr.property_id = p.id
      WHERE pr.report_uid = ?
    `;

    const params = [reportUid];

    // If user is logged in, ensure they own the report
    if (user) {
      sql += ` AND pr.reporter_id = ?`;
      params.push(user.id);
    } else {
      // Anonymous users can only see reports from their IP (basic check)
      const ip = req.ip || req.connection.remoteAddress;
      sql += ` AND pr.reporter_ip = ? AND pr.reporter_id IS NULL`;
      params.push(ip);
    }

    const reports = await isanzureQuery(sql, params);

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
        code: 'REPORT_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: reports[0]
    });

  } catch (error) {
    debugLog('Error fetching report status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report status',
      code: 'FETCH_STATUS_FAILED',
      error: error.message
    });
  }
};

module.exports = exports;