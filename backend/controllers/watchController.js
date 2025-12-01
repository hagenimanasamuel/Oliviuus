// controllers/watchController.js - CLEANED VERSION
const { query } = require("../config/dbConfig");

// Track video watching progress and save views
const trackVideoWatching = async (req, res) => {
    try {
        const { contentId } = req.params;
        const userId = req.user.id;
        const {
            currentTime,
            duration,
            episodeId = null,
            mediaAssetId = null,
            device_type = 'web',
            session_id = null,
            watchDuration = 5,
            totalWatchTime = 0
        } = req.body;

        // Validate required fields
        if (!currentTime || !duration) {
            return res.status(400).json({
                success: false,
                error: 'Current time and duration are required'
            });
        }

        // Verify content exists and is accessible
        const content = await query(`
      SELECT id, content_type, status, visibility 
      FROM contents 
      WHERE id = ? 
        AND status = 'published' 
        AND visibility = 'public'
    `, [contentId]);

        if (content.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Content not found or not accessible'
            });
        }

        const percentageWatched = (currentTime / duration) * 100;

        // Check if this is an episode (series content)
        let actualContentId = contentId;
        let actualMediaAssetId = mediaAssetId;

        if (episodeId) {
            const episodeAssets = await query(`
        SELECT ma.id, ma.content_id
        FROM media_assets ma
        WHERE ma.id = ? 
          AND ma.asset_type = 'episodeVideo'
          AND ma.upload_status = 'completed'
      `, [episodeId]);

            if (episodeAssets.length > 0) {
                actualMediaAssetId = episodeId;
                actualContentId = episodeAssets[0].content_id;
            }
        }

        // Get or create watch session
        let watchSession = await query(`
  SELECT id, total_watch_time, max_watch_time, view_recorded
  FROM content_watch_sessions 
  WHERE user_id = ? AND content_id = ? 
    AND (session_id = ? OR (session_id IS NULL AND last_activity_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)))
  ORDER BY 
    CASE WHEN session_id = ? THEN 1 ELSE 2 END,
    last_activity_at DESC
  LIMIT 1
`, [userId, actualContentId, session_id, session_id]);

        if (watchSession.length > 0 && watchSession[0].view_recorded) {
            return res.json({
                success: true,
                data: {
                    session_id: watchSession[0].id,
                    total_watch_time: watchSession[0].total_watch_time,
                    percentage_watched: percentageWatched,
                    view_recorded: true,
                    current_time: currentTime
                },
                message: 'View already recorded'
            });
        }

        let sessionId;
        let sessionTotalWatchTime = totalWatchTime;
        let maxWatchTime = currentTime;
        let viewRecorded = false;

        if (watchSession.length > 0) {
            sessionId = watchSession[0].id;
            sessionTotalWatchTime = (watchSession[0].total_watch_time || 0) + watchDuration;
            maxWatchTime = Math.max(watchSession[0].max_watch_time || 0, currentTime);
            viewRecorded = watchSession[0].view_recorded || false;

            // Update last activity
            await query(`
        UPDATE content_watch_sessions 
        SET last_activity_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [sessionId]);
        } else {
            // Create new watch session
            const sessionResult = await query(`
        INSERT INTO content_watch_sessions 
        (user_id, content_id, media_asset_id, session_id, device_type, started_at, last_activity_at, total_watch_time, max_watch_time)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)
      `, [userId, actualContentId, actualMediaAssetId, session_id, device_type, sessionTotalWatchTime, maxWatchTime]);

            sessionId = sessionResult.insertId;
        }

        // Update session with latest values
        await query(`
      UPDATE content_watch_sessions 
      SET total_watch_time = ?, max_watch_time = ?, last_activity_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [sessionTotalWatchTime, maxWatchTime, sessionId]);

        // Insert progress record
        await query(`
      INSERT INTO content_watch_progress 
      (session_id, playback_time, duration, percentage_watched, watch_duration)
      VALUES (?, ?, ?, ?, ?)
    `, [sessionId, currentTime, duration, percentageWatched, watchDuration]);

        // Check if we should record a view (5 seconds condition)
        let shouldRecordView = false;

        if (!viewRecorded) {
            // Condition 1: Watched at least 5 seconds continuously
            if (sessionTotalWatchTime >= 5) {
                shouldRecordView = true;
            }
            // Condition 2: User reached near the end (last 10%) even if less than 5 seconds
            else if (percentageWatched >= 90) {
                shouldRecordView = true;
            }
        }

        if (shouldRecordView && !viewRecorded) {
            const viewResult = await recordContentView(userId, actualContentId, {
                watch_duration_seconds: sessionTotalWatchTime,
                percentage_watched: percentageWatched,
                device_type: device_type,
                session_id: session_id
            });

            if (viewResult) {
                // Mark view as recorded in session
                await query(`
          UPDATE content_watch_sessions 
          SET view_recorded = TRUE, view_recorded_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [sessionId]);

                viewRecorded = true;
            }
        }

        // Save playback position for resume functionality
        if (currentTime > 5 && currentTime < (duration - 30)) {
            await savePlaybackPosition(userId, actualContentId, actualMediaAssetId, currentTime, duration);
        }

        res.json({
            success: true,
            data: {
                session_id: sessionId,
                total_watch_time: sessionTotalWatchTime,
                percentage_watched: percentageWatched,
                view_recorded: viewRecorded,
                current_time: currentTime
            },
            message: viewRecorded ? 'View recorded successfully' : 'Progress saved successfully'
        });

    } catch (error) {
        console.error('Error tracking video watching:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to track video progress',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Record a content view 
const recordContentView = async (userId, contentId, viewData) => {
  try {
    // More specific duplicate check
    const existingView = await query(`
      SELECT id FROM content_view_history 
      WHERE user_id = ? AND content_id = ? 
        AND (session_id = ? OR created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR))
      LIMIT 1
    `, [userId, contentId, viewData.session_id]);

    if (existingView.length > 0) {
      return true;
    }

    // Insert into content_view_history with error handling for constraints
    try {
      const viewResult = await query(`
        INSERT INTO content_view_history 
        (content_id, user_id, watch_duration_seconds, percentage_watched, device_type, session_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        contentId,
        userId,
        viewData.watch_duration_seconds,
        viewData.percentage_watched,
        viewData.device_type,
        viewData.session_id
      ]);

      // Update content view count
      await query(`
        UPDATE contents 
        SET view_count = COALESCE(view_count, 0) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [contentId]);

      return true;

    } catch (insertError) {
      // Handle unique constraint violations specifically
      if (insertError.code === 'ER_DUP_ENTRY' || insertError.errno === 1062) {
        return true; // Consider it successful since duplicate was prevented
      }
      throw insertError; // Re-throw other errors
    }

  } catch (error) {
    console.error('Error recording content view:', error);
    return false;
  }
};

// Save playback position for resume functionality
const savePlaybackPosition = async (userId, contentId, mediaAssetId, currentTime, duration) => {
    try {
        const resumeThreshold = 10;

        if (currentTime < resumeThreshold || currentTime > (duration - resumeThreshold)) {
            return;
        }

        const percentage = (currentTime / duration) * 100;
        if (percentage < 5) {
            return;
        }

        const existingPosition = await query(`
      SELECT playback_time 
      FROM user_playback_positions 
      WHERE user_id = ? AND content_id = ? AND media_asset_id = ?
      LIMIT 1
    `, [userId, contentId, mediaAssetId]);

        if (existingPosition.length > 0) {
            const existingTime = existingPosition[0].playback_time;
            if (Math.abs(currentTime - existingTime) < 30) {
                return;
            }
        }

        await query(`
      INSERT INTO user_playback_positions 
      (user_id, content_id, media_asset_id, playback_time, duration, percentage_watched, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE 
        playback_time = VALUES(playback_time),
        duration = VALUES(duration),
        percentage_watched = VALUES(percentage_watched),
        updated_at = VALUES(updated_at)
    `, [userId, contentId, mediaAssetId, currentTime, duration, percentage]);

    } catch (error) {
        console.error('Error saving playback position:', error);
    }
};

// Get playback position for resume
const getPlaybackPosition = async (req, res) => {
    try {
        const { contentId } = req.params;
        const userId = req.user.id;
        const { episodeId = null } = req.query;

        let mediaAssetId = episodeId;

        if (episodeId) {
            const episodeAssets = await query(`
        SELECT ma.id, ma.content_id
        FROM media_assets ma
        WHERE ma.id = ? 
          AND ma.asset_type = 'episodeVideo'
          AND ma.upload_status = 'completed'
      `, [episodeId]);

            if (episodeAssets.length === 0) {
                return res.json({
                    success: true,
                    data: { currentTime: 0, duration: 0, percentage: 0 }
                });
            }
        }

        const position = await query(`
      SELECT playback_time, duration, percentage_watched, updated_at
      FROM user_playback_positions 
      WHERE user_id = ? AND content_id = ? AND media_asset_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `, [userId, contentId, mediaAssetId]);

        if (position.length === 0) {
            return res.json({
                success: true,
                data: { currentTime: 0, duration: 0, percentage: 0 }
            });
        }

        const pos = position[0];

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (new Date(pos.updated_at) < thirtyDaysAgo) {
            await query(`
        DELETE FROM user_playback_positions 
        WHERE user_id = ? AND content_id = ? AND media_asset_id = ?
      `, [userId, contentId, mediaAssetId]);

            return res.json({
                success: true,
                data: { currentTime: 0, duration: 0, percentage: 0 }
            });
        }

        res.json({
            success: true,
            data: {
                currentTime: pos.playback_time,
                duration: pos.duration,
                percentage: pos.percentage_watched,
                lastUpdated: pos.updated_at
            }
        });

    } catch (error) {
        console.error('Error getting playback position:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to get playback position'
        });
    }
};

// Clear playback position
const clearPlaybackPosition = async (req, res) => {
    try {
        const { contentId } = req.params;
        const userId = req.user.id;
        const { episodeId = null } = req.body;

        await query(`
      DELETE FROM user_playback_positions 
      WHERE user_id = ? AND content_id = ? AND media_asset_id = ?
    `, [userId, contentId, episodeId]);

        res.json({
            success: true,
            message: 'Playback position cleared successfully'
        });

    } catch (error) {
        console.error('Error clearing playback position:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to clear playback position'
        });
    }
};

// Get watch statistics for user
const getWatchStatistics = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        const stats = await query(`
      SELECT 
        COUNT(*) as total_views,
        SUM(watch_duration_seconds) as total_watch_time,
        AVG(percentage_watched) as avg_completion_rate,
        COUNT(DISTINCT content_id) as unique_contents_watched
      FROM content_view_history 
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [userId, parseInt(days)]);

        const recentWatches = await query(`
      SELECT 
        cvh.*,
        c.title,
        c.content_type,
        c.duration_minutes,
        (
          SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
          FROM media_assets ma 
          WHERE ma.content_id = c.id 
            AND ma.asset_type IN ('thumbnail', 'poster')
            AND (ma.is_primary = 1 OR ma.is_primary IS NULL)
            AND ma.upload_status = 'completed'
          ORDER BY ma.is_primary DESC, ma.created_at DESC
          LIMIT 1
        ) as thumbnail_url
      FROM content_view_history cvh
      JOIN contents c ON cvh.content_id = c.id
      WHERE cvh.user_id = ?
      ORDER BY cvh.created_at DESC
      LIMIT 10
    `, [process.env.R2_PUBLIC_URL_ID, userId]);

        res.json({
            success: true,
            data: {
                statistics: stats[0] || {},
                recent_watches: recentWatches
            }
        });

    } catch (error) {
        console.error('Error getting watch statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to get watch statistics'
        });
    }
};

module.exports = {
    trackVideoWatching,
    getPlaybackPosition,
    clearPlaybackPosition,
    getWatchStatistics
};