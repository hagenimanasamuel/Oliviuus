// middleware/kidContentFilter.js

// Safe JSON parsing function
const safeJsonParse = (jsonString, defaultValue = []) => {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
};

const kidContentFilter = (req, res, next) => {
  // Only apply filters if in kid mode
  if (!req.kid_profile) {
    return next();
  }

  // Build content filters based on kid's restrictions using your exact columns
  req.content_filters = {
    max_age_rating: req.kid_profile.max_age_rating || '7+',
    blocked_genres: req.kid_profile.blocked_genres || [],
    allowed_content_types: req.kid_profile.allowed_content_types || ['cartoons', 'educational', 'family'],
    allow_movies: req.kid_profile.allow_movies !== undefined ? req.kid_profile.allow_movies : true,
    allow_series: req.kid_profile.allow_series !== undefined ? req.kid_profile.allow_series : true,
    allow_live_events: req.kid_profile.allow_live_events !== undefined ? req.kid_profile.allow_live_events : false,
    
    // Add filter flags for query building
    is_kid_mode: true,
    kid_profile_id: req.kid_profile.kid_profile_id
  };

  // Also modify response behavior for kid-friendly UI
  req.kid_ui_preferences = {
    simplified_interface: true,
    theme_color: req.kid_profile.theme_color || 'blue',
    interface_mode: req.kid_profile.interface_mode || 'simple'
  };

  next();
};

module.exports = kidContentFilter;