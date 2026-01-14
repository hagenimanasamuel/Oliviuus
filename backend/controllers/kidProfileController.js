// controllers/kidProfileController.js
const { query } = require("../config/dbConfig");
const bcrypt = require("bcrypt");

// ✅ Get all kid profiles for a parent
const getKidProfiles = async (req, res) => {
  try {
    const parentUserId = req.user.id;

    const kidProfiles = await query(
      `SELECT 
        kp.*,
        kcr.max_age_rating,
        kcr.blocked_genres,
        kcr.allowed_genres,
        kcr.blocked_content_ids,
        kcr.allowed_content_ids,
        kcr.allow_movies,
        kcr.allow_series,
        kcr.allow_live_events,
        kcr.allow_search,
        kcr.allow_trending,
        kcr.allow_recommendations,
        vtl.daily_time_limit_minutes as effective_daily_limit,
        vtl.current_daily_usage,
        vtl.last_reset_date
       FROM kids_profiles kp
       LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
       LEFT JOIN viewing_time_limits vtl ON kp.id = vtl.kid_profile_id
       WHERE kp.parent_user_id = ? AND kp.is_active = TRUE
       ORDER BY kp.created_at DESC`,
      [parentUserId]
    );

    res.json(kidProfiles);
  } catch (error) {
    console.error("❌ Error fetching kid profiles:", error);
    res.status(500).json({ error: "Failed to fetch kid profiles" });
  }
};

// ✅ Get single kid profile by ID
const getKidProfileById = async (req, res) => {
  try {
    const { kidId } = req.params;
    const parentUserId = req.user.id;

    const kidProfile = await query(
      `SELECT 
        kp.*,
        kcr.max_age_rating,
        kcr.blocked_genres,
        kcr.allowed_genres,
        kcr.blocked_content_ids,
        kcr.allowed_content_ids,
        kcr.allow_movies,
        kcr.allow_series,
        kcr.allow_live_events,
        kcr.allow_search,
        kcr.allow_trending,
        kcr.allow_recommendations,
        vtl.*,
        pc.master_pin_code,
        pc.require_pin_for_settings,
        pc.notify_time_limit_reached,
        pc.notify_restricted_access,
        pc.notify_weekly_report
       FROM kids_profiles kp
       LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
       LEFT JOIN viewing_time_limits vtl ON kp.id = vtl.kid_profile_id
       LEFT JOIN parental_controls pc ON kp.parent_user_id = pc.parent_user_id
       WHERE kp.id = ? AND kp.parent_user_id = ? AND kp.is_active = TRUE`,
      [kidId, parentUserId]
    );

    if (kidProfile.length === 0) {
      return res.status(404).json({ error: "Kid profile not found" });
    }

    res.json(kidProfile[0]);
  } catch (error) {
    console.error("❌ Error fetching kid profile:", error);
    res.status(500).json({ error: "Failed to fetch kid profile" });
  }
};

// ✅ Create new kid profile - FIXED VERSION
const createKidProfile = async (req, res) => {
  try {
    const parentUserId = req.user.id;
    const {
      name,
      birth_date,
      max_age_rating = "7",
      daily_time_limit_minutes = 120,
      require_pin_to_exit = true,
      theme_color = "blue",
      interface_mode = "simple",
      avatar_url,
      // Content restrictions - using only columns that exist
      blocked_genres = [],
      allowed_genres = [],
      allow_movies = true,
      allow_series = true,
      allow_live_events = false,
      allow_search = true,
      allow_trending = true,
      allow_recommendations = true
    } = req.body;

    // Validate required fields
    if (!name || !birth_date) {
      return res.status(400).json({
        error: "Name and birth date are required"
      });
    }

    // Validate name length
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        error: "Name must be between 2 and 50 characters"
      });
    }

    // ✅ FIX 1: Check if name already exists for THIS PARENT among ACTIVE kids only
    const existingActiveKid = await query(
      "SELECT id, name FROM kids_profiles WHERE parent_user_id = ? AND name = ? AND is_active = TRUE",
      [parentUserId, name]
    );

    if (existingActiveKid.length > 0) {
      return res.status(400).json({
        error: "profile_name_exists",
        message: `A kid profile with the name "${name}" already exists. Please choose a different name.`
      });
    }

    // ✅ FIX 2: Check if there's an INACTIVE kid with the same name that we can reactivate
    const existingInactiveKid = await query(
      "SELECT id, name FROM kids_profiles WHERE parent_user_id = ? AND name = ? AND is_active = FALSE",
      [parentUserId, name]
    );

    // If inactive kid exists with same name, offer to reactivate it
    if (existingInactiveKid.length > 0) {
      return res.status(400).json({
        error: "inactive_profile_exists",
        message: `A deactivated kid profile with the name "${name}" exists. Would you like to reactivate it instead?`,
        deactivated_profile_id: existingInactiveKid[0].id
      });
    }

    // Check kid profile limit
    const profileCount = await query(
      "SELECT COUNT(*) as count FROM kids_profiles WHERE parent_user_id = ? AND is_active = TRUE",
      [parentUserId]
    );

    const familyPlanCheck = await query(
      `SELECT s.max_profiles 
       FROM user_subscriptions us
       JOIN subscriptions s ON us.subscription_id = s.id
       WHERE us.user_id = ? AND us.status = 'active' AND us.end_date > NOW()
       AND s.type = 'family'`,
      [parentUserId]
    );

    if (familyPlanCheck.length === 0) {
      return res.status(403).json({
        error: "family_plan_required",
        message: "Family plan subscription required to create kid profiles"
      });
    }

    const maxProfiles = familyPlanCheck[0].max_profiles || 4;
    if (profileCount[0].count >= maxProfiles) {
      return res.status(403).json({
        error: "profile_limit_reached",
        message: `Maximum ${maxProfiles} kid profiles allowed on your plan`
      });
    }

    // Generate avatar URL if not provided
    const finalAvatarUrl = avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=BC8BBC`;

    // Start transaction
    await query("START TRANSACTION");

    try {
      // 1. Create kid profile (ONLY with columns that exist in kids_profiles table)
      const kidResult = await query(
        `INSERT INTO kids_profiles 
         (parent_user_id, name, avatar_url, birth_date, 
          daily_time_limit_minutes, require_pin_to_exit, theme_color, interface_mode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parentUserId,
          name,
          finalAvatarUrl,
          birth_date,
          daily_time_limit_minutes,
          require_pin_to_exit,
          theme_color,
          interface_mode
        ]
      );

      const kidProfileId = kidResult.insertId;

      // 2. Create content restrictions with ONLY existing columns
      await query(
        `INSERT INTO kids_content_restrictions 
         (kid_profile_id, max_age_rating, blocked_genres, allowed_genres,
          allow_movies, allow_series, allow_live_events, allow_search, 
          allow_trending, allow_recommendations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          kidProfileId,
          max_age_rating,
          JSON.stringify(blocked_genres),
          JSON.stringify(allowed_genres),
          allow_movies,
          allow_series,
          allow_live_events,
          allow_search,
          allow_trending,
          allow_recommendations
        ]
      );

      // 3. Create time limits (ONLY with existing columns - no bedtime_start/end)
      await query(
        `INSERT INTO viewing_time_limits 
         (kid_profile_id, daily_time_limit_minutes, weekly_time_limit_minutes,
          allowed_start_time, allowed_end_time)
         VALUES (?, ?, ?, '07:00:00', '21:00:00')`,
        [kidProfileId, daily_time_limit_minutes, daily_time_limit_minutes * 5]
      );

      // 4. Ensure parental controls exist for parent
      const existingControls = await query(
        "SELECT id FROM parental_controls WHERE parent_user_id = ?",
        [parentUserId]
      );

      if (existingControls.length === 0) {
        const defaultPin = Math.random().toString().slice(2, 8); // 6-digit PIN
        const hashedPin = await bcrypt.hash(defaultPin, 10);

        await query(
          `INSERT INTO parental_controls 
           (parent_user_id, master_pin_code, require_pin_for_settings)
           VALUES (?, ?, TRUE)`,
          [parentUserId, hashedPin]
        );
      }

      await query("COMMIT");

      // Fetch complete kid profile data
      const newKidProfile = await query(
        `SELECT 
          kp.*,
          kcr.max_age_rating,
          kcr.blocked_genres,
          kcr.allowed_genres,
          vtl.daily_time_limit_minutes as effective_daily_limit
         FROM kids_profiles kp
         LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
         LEFT JOIN viewing_time_limits vtl ON kp.id = vtl.kid_profile_id
         WHERE kp.id = ?`,
        [kidProfileId]
      );

      // Send notification to parent
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority)
         VALUES (?, 'kid_profile_created', '👶 Kid Profile Created', ?, 'user', 'kid_profile', ?, 'normal')`,
        [
          parentUserId,
          `You've successfully created a profile for ${name}. They can now enjoy kid-friendly content with the restrictions you've set.`,
          kidProfileId
        ]
      );

      res.status(201).json({
        message: "Kid profile created successfully",
        profile: newKidProfile[0]
      });

    } catch (error) {
      await query("ROLLBACK");
      console.error("❌ Database error in createKidProfile:", error);
      
      // ✅ FIX 3: Handle duplicate entry error specifically
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          error: "profile_name_exists",
          message: `A kid profile with the name "${name}" already exists. This might be a deactivated profile.`
        });
      }
      
      res.status(500).json({ 
        error: "database_error",
        message: "Database error creating kid profile",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

  } catch (error) {
    console.error("❌ Error creating kid profile:", error);
    res.status(500).json({ 
      error: "server_error",
      message: "Failed to create kid profile",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// ✅ Reactivate deactivated kid profile
const reactivateKidProfile = async (req, res) => {
  try {
    const { kidId } = req.params;
    const parentUserId = req.user.id;
    const updates = req.body; // Optional updates for reactivation

    // Check if the deactivated profile exists and belongs to parent
    const deactivatedProfile = await query(
      "SELECT id, name FROM kids_profiles WHERE id = ? AND parent_user_id = ? AND is_active = FALSE",
      [kidId, parentUserId]
    );

    if (deactivatedProfile.length === 0) {
      return res.status(404).json({ 
        error: "profile_not_found",
        message: "Deactivated profile not found or already active"
      });
    }

    // Check profile limit before reactivating
    const profileCount = await query(
      "SELECT COUNT(*) as count FROM kids_profiles WHERE parent_user_id = ? AND is_active = TRUE",
      [parentUserId]
    );

    const familyPlanCheck = await query(
      `SELECT s.max_profiles 
       FROM user_subscriptions us
       JOIN subscriptions s ON us.subscription_id = s.id
       WHERE us.user_id = ? AND us.status = 'active' AND us.end_date > NOW()
       AND s.type = 'family'`,
      [parentUserId]
    );

    if (familyPlanCheck.length === 0) {
      return res.status(403).json({
        error: "family_plan_required",
        message: "Family plan subscription required"
      });
    }

    const maxProfiles = familyPlanCheck[0].max_profiles || 4;
    if (profileCount[0].count >= maxProfiles) {
      return res.status(403).json({
        error: "profile_limit_reached",
        message: `Maximum ${maxProfiles} kid profiles allowed on your plan`
      });
    }

    // Start transaction
    await query("START TRANSACTION");

    try {
      // Prepare update fields
      const allowedUpdates = [
        'birth_date', 'daily_time_limit_minutes', 'require_pin_to_exit',
        'theme_color', 'interface_mode', 'avatar_url'
      ];

      const setClause = ['is_active = TRUE'];
      const values = [];

      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          setClause.push(`${field} = ?`);
          values.push(updates[field]);
        }
      });

      values.push(kidId, parentUserId);

      // Reactivate the profile
      await query(
        `UPDATE kids_profiles 
         SET ${setClause.join(', ')}, updated_at = NOW() 
         WHERE id = ? AND parent_user_id = ?`,
        values
      );

      // Update viewing time limits if provided
      if (updates.daily_time_limit_minutes !== undefined) {
        await query(
          `UPDATE viewing_time_limits 
           SET daily_time_limit_minutes = ?, updated_at = NOW() 
           WHERE kid_profile_id = ?`,
          [updates.daily_time_limit_minutes, kidId]
        );
      }

      await query("COMMIT");

      // Fetch reactivated profile
      const reactivatedProfile = await query(
        `SELECT 
          kp.*,
          kcr.max_age_rating,
          kcr.blocked_genres,
          kcr.allowed_genres,
          vtl.daily_time_limit_minutes as effective_daily_limit
         FROM kids_profiles kp
         LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
         LEFT JOIN viewing_time_limits vtl ON kp.id = vtl.kid_profile_id
         WHERE kp.id = ?`,
        [kidId]
      );

      res.json({
        message: "Kid profile reactivated successfully",
        profile: reactivatedProfile[0]
      });

    } catch (error) {
      await query("ROLLBACK");
      console.error("❌ Database error reactivating profile:", error);
      res.status(500).json({ 
        error: "database_error",
        message: "Failed to reactivate profile"
      });
    }

  } catch (error) {
    console.error("❌ Error reactivating kid profile:", error);
    res.status(500).json({ 
      error: "server_error",
      message: "Failed to reactivate profile"
    });
  }
};

// ✅ Update kid profile
const updateKidProfile = async (req, res) => {
  try {
    const { kidId } = req.params;
    const parentUserId = req.user.id;
    const updates = req.body;

    // Verify ownership
    const ownershipCheck = await query(
      "SELECT id FROM kids_profiles WHERE id = ? AND parent_user_id = ?",
      [kidId, parentUserId]
    );

    if (ownershipCheck.length === 0) {
      return res.status(404).json({ error: "Kid profile not found" });
    }

    await query("START TRANSACTION");

    try {
      // Update basic profile info (ONLY columns that exist in kids_profiles table)
      const allowedProfileFields = [
        'name', 'birth_date', 'daily_time_limit_minutes',
        'require_pin_to_exit', 'theme_color', 'interface_mode', 'avatar_url'
      ];

      const profileSetClause = [];
      const profileValues = [];

      allowedProfileFields.forEach(field => {
        if (updates[field] !== undefined) {
          profileSetClause.push(`${field} = ?`);
          profileValues.push(updates[field]);
        }
      });

      if (profileSetClause.length > 0) {
        profileValues.push(kidId, parentUserId);
        await query(
          `UPDATE kids_profiles SET ${profileSetClause.join(', ')}, updated_at = NOW() 
           WHERE id = ? AND parent_user_id = ?`,
          profileValues
        );
      }

      // Update content restrictions if provided (using only existing columns)
      const restrictionFields = [
        'max_age_rating', 'blocked_genres', 'allowed_genres',
        'allow_movies', 'allow_series', 'allow_live_events',
        'allow_search', 'allow_trending', 'allow_recommendations'
      ];

      const restrictionSetClause = [];
      const restrictionValues = [];

      restrictionFields.forEach(field => {
        if (updates[field] !== undefined) {
          restrictionSetClause.push(`${field} = ?`);
          restrictionValues.push(Array.isArray(updates[field]) ? JSON.stringify(updates[field]) : updates[field]);
        }
      });

      if (restrictionSetClause.length > 0) {
        restrictionValues.push(kidId);
        await query(
          `UPDATE kids_content_restrictions SET ${restrictionSetClause.join(', ')} 
           WHERE kid_profile_id = ?`,
          restrictionValues
        );
      }

      // Update time limits if provided
      if (updates.daily_time_limit_minutes !== undefined) {
        await query(
          `UPDATE viewing_time_limits 
           SET daily_time_limit_minutes = ?, updated_at = NOW() 
           WHERE kid_profile_id = ?`,
          [updates.daily_time_limit_minutes, kidId]
        );
      }

      await query("COMMIT");

      // Fetch updated profile
      const updatedProfile = await query(
        `SELECT 
          kp.*,
          kcr.max_age_rating,
          kcr.blocked_genres,
          kcr.allowed_genres,
          kcr.allow_movies,
          kcr.allow_series,
          kcr.allow_live_events,
          kcr.allow_search,
          kcr.allow_trending,
          kcr.allow_recommendations,
          vtl.daily_time_limit_minutes as effective_daily_limit
         FROM kids_profiles kp
         LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
         LEFT JOIN viewing_time_limits vtl ON kp.id = vtl.kid_profile_id
         WHERE kp.id = ?`,
        [kidId]
      );

      res.json({
        message: "Kid profile updated successfully",
        profile: updatedProfile[0]
      });

    } catch (error) {
      await query("ROLLBACK");
      console.error("❌ Database error in updateKidProfile:", error);
      res.status(500).json({ error: "Database error updating kid profile" });
    }

  } catch (error) {
    console.error("❌ Error updating kid profile:", error);
    res.status(500).json({ error: "Failed to update kid profile" });
  }
};

// ✅ Delete kid profile (soft delete)
const deleteKidProfile = async (req, res) => {
  try {
    const { kidId } = req.params;
    const parentUserId = req.user.id;

    // Verify ownership
    const kidProfile = await query(
      "SELECT name FROM kids_profiles WHERE id = ? AND parent_user_id = ?",
      [kidId, parentUserId]
    );

    if (kidProfile.length === 0) {
      return res.status(404).json({ error: "Kid profile not found" });
    }

    // Soft delete the kid profile
    await query(
      "UPDATE kids_profiles SET is_active = FALSE, updated_at = NOW() WHERE id = ?",
      [kidId]
    );

    // Send notification
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority)
       VALUES (?, 'kid_profile_deleted', '🗑️ Kid Profile Deleted', ?, 'user', 'kid_profile', ?, 'normal')`,
      [
        parentUserId,
        `You've deleted the profile for ${kidProfile[0].name}. All their data has been archived.`,
        kidId
      ]
    );

    res.json({
      message: "Kid profile deleted successfully",
      deleted_profile: kidProfile[0].name
    });

  } catch (error) {
    console.error("❌ Error deleting kid profile:", error);
    res.status(500).json({ error: "Failed to delete kid profile" });
  }
};

// ✅ Update kid avatar
const updateKidAvatar = async (req, res) => {
  try {
    const { kidId } = req.params;
    const parentUserId = req.user.id;
    const { avatar_url } = req.body;

    if (!avatar_url) {
      return res.status(400).json({ error: "Avatar URL is required" });
    }

    // Verify ownership
    const ownershipCheck = await query(
      "SELECT id FROM kids_profiles WHERE id = ? AND parent_user_id = ?",
      [kidId, parentUserId]
    );

    if (ownershipCheck.length === 0) {
      return res.status(404).json({ error: "Kid profile not found" });
    }

    await query(
      "UPDATE kids_profiles SET avatar_url = ?, updated_at = NOW() WHERE id = ?",
      [avatar_url, kidId]
    );

    res.json({
      message: "Kid avatar updated successfully",
      avatar_url
    });

  } catch (error) {
    console.error("❌ Error updating kid avatar:", error);
    res.status(500).json({ error: "Failed to update kid avatar" });
  }
};

// ✅ Get kid viewing statistics
const getKidViewingStats = async (req, res) => {
  try {
    const { kidId } = req.params;
    const parentUserId = req.user.id;

    // Verify ownership
    const ownershipCheck = await query(
      "SELECT id FROM kids_profiles WHERE id = ? AND parent_user_id = ?",
      [kidId, parentUserId]
    );

    if (ownershipCheck.length === 0) {
      return res.status(404).json({ error: "Kid profile not found" });
    }

    const stats = await query(
      `SELECT 
        -- Total watch time
        COALESCE(SUM(kvh.watch_duration_seconds), 0) as total_watch_seconds,
        -- Today's watch time
        COALESCE(SUM(CASE WHEN DATE(kvh.created_at) = CURDATE() THEN kvh.watch_duration_seconds ELSE 0 END), 0) as today_watch_seconds,
        -- This week's watch time
        COALESCE(SUM(CASE WHEN kvh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN kvh.watch_duration_seconds ELSE 0 END), 0) as week_watch_seconds,
        -- Total views
        COUNT(kvh.id) as total_views,
        -- Favorite genres
        (SELECT GROUP_CONCAT(DISTINCT g.name) 
         FROM kids_viewing_history kvh2
         JOIN contents c ON kvh2.content_id = c.id
         JOIN content_genres cg ON c.id = cg.content_id
         JOIN genres g ON cg.genre_id = g.id
         WHERE kvh2.kid_profile_id = ?
         GROUP BY g.name
         ORDER BY COUNT(*) DESC
         LIMIT 3) as favorite_genres,
        -- Most watched content
        (SELECT c.title 
         FROM kids_viewing_history kvh3
         JOIN contents c ON kvh3.content_id = c.id
         WHERE kvh3.kid_profile_id = ?
         GROUP BY c.id, c.title
         ORDER BY SUM(kvh3.watch_duration_seconds) DESC
         LIMIT 1) as most_watched_content
       FROM kids_viewing_history kvh
       WHERE kvh.kid_profile_id = ?`,
      [kidId, kidId, kidId]
    );

    const timeLimits = await query(
      "SELECT daily_time_limit_minutes, current_daily_usage FROM viewing_time_limits WHERE kid_profile_id = ?",
      [kidId]
    );

    res.json({
      ...stats[0],
      daily_limit: timeLimits[0]?.daily_time_limit_minutes || 120,
      daily_usage: timeLimits[0]?.current_daily_usage || 0,
      usage_percentage: timeLimits[0] ?
        Math.min(100, (timeLimits[0].current_daily_usage / timeLimits[0].daily_time_limit_minutes) * 100) : 0
    });

  } catch (error) {
    console.error("❌ Error fetching kid viewing stats:", error);
    res.status(500).json({ error: "Failed to fetch viewing statistics" });
  }
};

// ✅ Reset kid viewing time (for new day)
const resetKidViewingTime = async (req, res) => {
  try {
    const { kidId } = req.params;
    const parentUserId = req.user.id;

    // Verify ownership
    const ownershipCheck = await query(
      "SELECT id FROM kids_profiles WHERE id = ? AND parent_user_id = ?",
      [kidId, parentUserId]
    );

    if (ownershipCheck.length === 0) {
      return res.status(404).json({ error: "Kid profile not found" });
    }

    await query(
      `UPDATE viewing_time_limits 
       SET current_daily_usage = 0, last_reset_date = CURDATE(), updated_at = NOW()
       WHERE kid_profile_id = ?`,
      [kidId]
    );

    res.json({ message: "Viewing time reset successfully" });

  } catch (error) {
    console.error("❌ Error resetting viewing time:", error);
    res.status(500).json({ error: "Failed to reset viewing time" });
  }
};

// ✅ Get kid's watchlist
const getKidWatchlist = async (req, res) => {
  try {
    const { kidId } = req.params;
    const parentUserId = req.user.id;

    // Verify ownership
    const ownershipCheck = await query(
      "SELECT id FROM kids_profiles WHERE id = ? AND parent_user_id = ?",
      [kidId, parentUserId]
    );

    if (ownershipCheck.length === 0) {
      return res.status(404).json({ error: "Kid profile not found" });
    }

    const watchlist = await query(
      `SELECT 
        c.*,
        kw.added_at
       FROM kids_watchlist kw
       JOIN contents c ON kw.content_id = c.id
       WHERE kw.kid_profile_id = ?
       ORDER BY kw.added_at DESC`,
      [kidId]
    );

    res.json(watchlist);

  } catch (error) {
    console.error("❌ Error fetching kid watchlist:", error);
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
};

// ✅ Permanently delete kid profile (hard delete)
const permanentDeleteKidProfile = async (req, res) => {
  try {
    const { kidId } = req.params;
    const parentUserId = req.user.id;

    // Check if profile exists and belongs to parent
    const kidProfile = await query(
      "SELECT id, name FROM kids_profiles WHERE id = ? AND parent_user_id = ?",
      [kidId, parentUserId]
    );

    if (kidProfile.length === 0) {
      return res.status(404).json({ 
        error: "profile_not_found",
        message: "Kid profile not found"
      });
    }

    // Start transaction for permanent deletion
    await query("START TRANSACTION");

    try {
      // Get profile name for logging
      const profileName = kidProfile[0].name;

      // 1. Delete from kids_watchlist
      await query("DELETE FROM kids_watchlist WHERE kid_profile_id = ?", [kidId]);
      
      // 2. Delete from kids_viewing_history
      await query("DELETE FROM kids_viewing_history WHERE kid_profile_id = ?", [kidId]);
      
      // 3. Delete from viewing_time_limits
      await query("DELETE FROM viewing_time_limits WHERE kid_profile_id = ?", [kidId]);
      
      // 4. Delete from kids_content_restrictions
      await query("DELETE FROM kids_content_restrictions WHERE kid_profile_id = ?", [kidId]);
      
      // 5. Delete from kids_sessions
      await query("DELETE FROM kids_sessions WHERE kid_profile_id = ?", [kidId]);
      
      // 6. Delete from kids_activity_logs
      await query("DELETE FROM kids_activity_logs WHERE kid_profile_id = ?", [kidId]);
      
      // 7. Delete from kids_ratings_feedback
      await query("DELETE FROM kids_ratings_feedback WHERE kid_profile_id = ?", [kidId]);
      
      // 8. Delete from approved_content_overrides
      await query("DELETE FROM approved_content_overrides WHERE kid_profile_id = ?", [kidId]);
      
      // 9. Delete from kids_recommendations
      await query("DELETE FROM kids_recommendations WHERE kid_profile_id = ?", [kidId]);
      
      // 10. Finally delete from kids_profiles
      await query("DELETE FROM kids_profiles WHERE id = ?", [kidId]);

      await query("COMMIT");

      // Log the action
      await query(
        `INSERT INTO security_logs 
         (user_id, action, ip_address, status, details) 
         VALUES (?, 'kid_profile_permanent_delete', ?, 'success', ?)`,
        [
          parentUserId,
          req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
          JSON.stringify({
            profile_id: kidId,
            profile_name: profileName,
            timestamp: new Date().toISOString()
          })
        ]
      );

      res.json({
        message: "Kid profile permanently deleted",
        deleted_profile: profileName
      });

    } catch (error) {
      await query("ROLLBACK");
      console.error("❌ Database error in permanent deletion:", error);
      res.status(500).json({ 
        error: "database_error",
        message: "Failed to permanently delete profile"
      });
    }

  } catch (error) {
    console.error("❌ Error in permanent deletion:", error);
    res.status(500).json({ 
      error: "server_error",
      message: "Failed to delete profile"
    });
  }
};

module.exports = {
  getKidProfiles,
  getKidProfileById,
  createKidProfile,
  updateKidProfile,
  deleteKidProfile,
  updateKidAvatar,
  getKidViewingStats,
  resetKidViewingTime,
  getKidWatchlist,
  reactivateKidProfile,
  permanentDeleteKidProfile 
};