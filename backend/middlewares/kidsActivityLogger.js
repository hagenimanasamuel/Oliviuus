const { logKidActivity } = require("../controllers/kidsSecurityController");

const kidsActivityLogger = async (req, res, next) => {
  // Store original send function
  const originalSend = res.send;
  
  // Override send to log activity after response
  res.send = function(data) {
    // Call original send first
    originalSend.call(this, data);
    
    // Try to parse response if it's JSON
    let responseData;
    try {
      responseData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      responseData = data;
    }
    
    // Log activity if it's a kid-related endpoint
    try {
      logKidActivityIfApplicable(req, responseData);
    } catch (error) {
      console.error("Error in activity logging middleware:", error);
    }
  };
  
  next();
};

const logKidActivityIfApplicable = async (req, responseData) => {
  try {
    // Only log activities for kid-related endpoints
    // Check if user is in kid mode (has kid_profile_id in session)
    if (!req.user || !req.user.kid_profile_id) {
      return; // Not a kid session, don't log
    }

    const kidProfileId = req.user.kid_profile_id;
    const activityType = determineActivityType(req);
    
    if (!activityType) return;

    // Extract relevant data
    const activityData = {
      kid_profile_id: kidProfileId,
      activity_type: activityType,
      device_type: req.headers['device-type'] || req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
      ip_address: req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
      session_id: req.sessionID,
    };

    // Add content-specific data
    if (req.params.contentId || req.body.content_id) {
      activityData.content_id = req.params.contentId || req.body.content_id;
    }

    // Add search query data
    if (req.query.search || req.body.search_query) {
      activityData.search_query = req.query.search || req.body.search_query;
    }

    // Determine if activity was allowed based on response
    if (responseData && typeof responseData === 'object') {
      // Check if there's an error or blocked status
      activityData.was_allowed = !responseData.error && !responseData.blocked;
      
      if (responseData.blocked_reason || responseData.error) {
        activityData.restriction_reason = responseData.blocked_reason || responseData.error;
      }
    } else {
      // Default to allowed if we can't determine
      activityData.was_allowed = true;
    }

    // Log the activity (async, don't wait for it)
    logKidActivity(activityData).catch(error => {
      console.error("Failed to log activity:", error);
    });

  } catch (error) {
    console.error("Error in activity logging middleware:", error);
    // Don't throw error, just log it
  }
};

const determineActivityType = (req) => {
  const path = req.path;
  const method = req.method;

  // Content viewing
  if ((path.includes('/kids/content/') || path.includes('/api/kids/content/')) && method === 'GET') {
    return 'content_view';
  }

  // Content attempt (when trying to access)
  if ((path.includes('/content/') || path.includes('/watch/')) && method === 'GET') {
    return 'content_attempt';
  }

  // Search
  if (path.includes('/search') && method === 'GET') {
    return 'search';
  }

  // Time limit check
  if (path.includes('/time-limit') || path.includes('/time-limit-check')) {
    return 'time_limit';
  }

  // PIN entry
  if (path.includes('/pin') || path.includes('/verify-pin')) {
    return 'pin_entry';
  }

  // Mode switch
  if (path.includes('/switch-mode') || path.includes('/exit-kids-mode')) {
    return 'mode_switch';
  }

  return null;
};

module.exports = {
  kidsActivityLogger,
  logKidActivityIfApplicable
};