// middleware/checkTimeLimits.js
const { query } = require("../config/dbConfig");

const checkTimeLimits = async (req, res, next) => {
  try {
    // Only apply to kid mode requests
    if (!req.kid_profile) {
      return next();
    }

    const kidProfileId = req.kid_profile.kid_profile_id;

    // Check daily time limits
    const timeLimitCheck = await query(
      `SELECT * FROM viewing_time_limits 
       WHERE kid_profile_id = ? AND last_reset_date = CURDATE()`,
      [kidProfileId]
    );

    if (timeLimitCheck.length > 0) {
      const limits = timeLimitCheck[0];
      
      // Check if daily limit reached
      if (limits.current_daily_usage >= limits.daily_time_limit_minutes) {
        return res.status(429).json({
          error: "daily_time_limit_reached",
          message: "Daily viewing time limit reached",
          limit_type: "daily",
          limit_minutes: limits.daily_time_limit_minutes,
          reset_time: "tomorrow"
        });
      }

      // Check bedtime restrictions
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;

      if (currentTimeString >= limits.bedtime_start || currentTimeString <= limits.bedtime_end) {
        return res.status(403).json({
          error: "bedtime_restriction",
          message: "Viewing not allowed during bedtime hours",
          bedtime_start: limits.bedtime_start,
          bedtime_end: limits.bedtime_end
        });
      }
    }

    next();
  } catch (error) {
    console.error("❌ Time limit check error:", error);
    next(); // Don't block on error, just skip time limit check
  }
};

module.exports = checkTimeLimits;