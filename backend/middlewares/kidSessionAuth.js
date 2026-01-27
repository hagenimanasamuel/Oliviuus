const { query } = require("../config/dbConfig");

const kidSessionAuth = async (req, res, next) => {
  try {
    console.log('\n👶 KID SESSION AUTH =======================');
    
    // Check if user is in kid mode or family member with kid access
    if (req.user?.session_mode === 'kid' && req.user?.active_kid_profile_id) {
      console.log('✅ User is in kid mode, validating...');
      
      const kidProfileId = req.user.active_kid_profile_id;
      const parentUserId = req.user.id;

      // Get kid profile with ALL necessary info
      const kidProfile = await query(
        `SELECT 
          kp.id, kp.name, kp.parent_user_id, kp.max_content_age_rating,
          kp.avatar_url, kp.birth_date, kp.theme_color, kp.interface_mode,
          kp.is_active,
          kcr.blocked_genres, kcr.max_age_rating as restriction_max_age,
          kcr.allow_movies, kcr.allow_series, kcr.allow_live_events,
          kcr.allow_search, kcr.allow_trending, kcr.allow_recommendations,
          CASE 
            WHEN fm.id IS NOT NULL THEN TRUE 
            ELSE FALSE 
          END as is_family_member
         FROM kids_profiles kp
         LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
         LEFT JOIN family_members fm ON kp.parent_user_id = fm.user_id 
           AND fm.dashboard_type = 'kid' 
           AND fm.is_active = TRUE
         WHERE kp.id = ? AND kp.parent_user_id = ?
           AND kp.is_active = TRUE
         LIMIT 1`,
        [kidProfileId, parentUserId]
      );

      if (kidProfile.length === 0) {
        console.log('❌ Kid profile not found');
        return res.status(403).json({
          error: "Kid profile not found or access denied"
        });
      }

      const profile = kidProfile[0];
      
      // 🆕 CRITICAL: Attach COMPLETE kid profile to request
      req.kid_profile = {
        id: profile.id,
        name: profile.name,
        parent_user_id: profile.parent_user_id,
        max_age_rating: profile.max_content_age_rating || profile.restriction_max_age || '7+',
        avatar_url: profile.avatar_url,
        birth_date: profile.birth_date,
        theme_color: profile.theme_color,
        interface_mode: profile.interface_mode,
        is_active: profile.is_active,
        is_family_member: profile.is_family_member === 1,
        
        // Content restrictions
        blocked_genres: profile.blocked_genres ? JSON.parse(profile.blocked_genres) : [],
        allow_movies: profile.allow_movies !== 0,
        allow_series: profile.allow_series !== 0,
        allow_live_events: profile.allow_live_events === 1,
        allow_search: profile.allow_search !== 0,
        allow_trending: profile.allow_trending !== 0,
        allow_recommendations: profile.allow_recommendations !== 0,
        
        // Session info
        session_mode: 'kid',
        active_kid_profile_id: kidProfileId
      };

      console.log('✅ Kid session authenticated:', {
        kid_id: req.kid_profile.id,
        name: req.kid_profile.name,
        parent_id: req.kid_profile.parent_user_id
      });

      return next();
    }

    // Check if family member with kid dashboard
    if (req.user?.is_family_member && req.user?.dashboard_type === 'kid') {
      console.log('✅ Family member with kid dashboard access');
      
      // Create simulated kid profile
      req.kid_profile = {
        id: `family_${req.user.id}`,
        name: req.user.username || 'Family Member',
        parent_user_id: req.user.family_owner_id || req.user.id,
        max_age_rating: '13+',
        is_family_member: true,
        session_mode: 'kid',
        active_kid_profile_id: `family_${req.user.id}`
      };

      return next();
    }

    console.log('❌ Not in kid mode');
    return res.status(403).json({
      error: "Access to kid content requires kid mode"
    });

  } catch (error) {
    console.error("Kid session auth error:", error);
    res.status(500).json({ error: "Kid session verification failed" });
  }
};

module.exports = kidSessionAuth;