const { query } = require("../config/dbConfig");
const StreamSecurityMiddleware = require("../middlewares/streamSecurityMiddleware");
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class StreamController {
  
  getCurrentUTC() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  getSecureStream = async (req, res) => {
    try {
      const { contentId } = req.params;
      const { quality } = req.query;
      const streamData = req.streamData;
      const currentUTC = this.getCurrentUTC();

      const mediaAssets = await query(`
        SELECT * FROM media_assets 
        WHERE content_id = ? 
          AND asset_type = 'mainVideo'
          AND upload_status = 'completed'
        ORDER BY 
          CASE 
            WHEN ? = 'UHD' AND resolution LIKE '%4k%' THEN 1
            WHEN ? = 'FHD' AND (resolution LIKE '%1080%' OR resolution LIKE '%fhd%') THEN 2
            WHEN ? = 'HD' AND (resolution LIKE '%720%' OR resolution LIKE '%hd%') THEN 3
            WHEN ? = 'SD' AND (resolution LIKE '%480%' OR resolution LIKE '%sd%') THEN 4
            ELSE 5 
          END,
          is_primary DESC,
          bitrate DESC
        LIMIT 1
      `, [contentId, quality, quality, quality, quality]);

      if (mediaAssets.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Video not available in requested quality',
          code: 'VIDEO_NOT_AVAILABLE'
        });
      }

      const mediaAsset = mediaAssets[0];
      
      const streamTokenExpiry = parseInt(process.env.STREAM_TOKEN_EXPIRY) || 7200;
      const expiresAtUTC = Math.floor(Date.now() / 1000) + streamTokenExpiry;

      const streamToken = StreamSecurityMiddleware.generateStreamToken({
        assetId: mediaAsset.id,
        contentId,
        userId: req.user.id,
        sessionId: streamData.sessionId,
        quality: streamData.quality,
        bitrate: streamData.bitrate,
        exp: expiresAtUTC
      }, process.env.STREAM_JWT_SECRET);

      const secureStreamUrl = `/api/stream/secure/${mediaAsset.id}?token=${streamToken}`;

      res.json({
        success: true,
        data: {
          stream_url: secureStreamUrl,
          quality: streamData.quality,
          bitrate: streamData.bitrate,
          expires_in: streamTokenExpiry,
          expires_at: new Date(expiresAtUTC * 1000).toISOString(),
          session_id: streamData.sessionId,
          formats: await this.getAvailableFormats(contentId),
          security: {
            token_type: 'JWT',
            encryption: 'AES-256',
            protocol: 'secure-stream'
          }
        },
        meta: {
          generated_at: currentUTC,
          content_id: contentId,
          user_id: req.user.id
        }
      });

    } catch (error) {
      console.error('Stream URL generation error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to generate stream URL',
        code: 'STREAM_URL_GENERATION_FAILED'
      });
    }
  };

  streamVideo = async (req, res) => {
    try {
      const { assetId } = req.params;
      const { token } = req.query;
      const currentUTC = this.getCurrentUTC();

      const decoded = StreamSecurityMiddleware.verifyStreamToken(token, process.env.STREAM_JWT_SECRET);
      if (!decoded) {
        return res.status(403).json({ 
          success: false,
          error: 'Invalid or expired stream token',
          code: 'INVALID_STREAM_TOKEN'
        });
      }

      const { assetId: tokenAssetId, userId, sessionId, quality, bitrate } = decoded;

      if (parseInt(tokenAssetId) !== parseInt(assetId)) {
        return res.status(403).json({ 
          success: false,
          error: 'Token mismatch',
          code: 'TOKEN_MISMATCH'
        });
      }

      const mediaAssets = await query(`
        SELECT * FROM media_assets 
        WHERE id = ? AND upload_status = 'completed'
      `, [assetId]);

      if (mediaAssets.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Media asset not found',
          code: 'ASSET_NOT_FOUND'
        });
      }

      const mediaAsset = mediaAssets[0];
      
      const filePath = this.constructFilePath(mediaAsset);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
          success: false,
          error: 'Video file not found on server',
          code: 'FILE_NOT_FOUND'
        });
      }

      await query(`
        UPDATE content_watch_sessions 
        SET last_activity_at = CONVERT_TZ(NOW(), @@session.time_zone, '+00:00')
        WHERE session_id = ?
      `, [sessionId]);

      this.streamSecureVideo(filePath, req, res, sessionId, userId, mediaAsset.content_id);

    } catch (error) {
      console.error('Video streaming error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Streaming failed',
        code: 'STREAMING_ERROR'
      });
    }
  };

  streamSecureVideo(filePath, req, res, sessionId, userId, contentId) {
    try {
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
      res.setHeader('X-Stream-Source', 'secure-streaming-server-v1.0');
      res.setHeader('X-Stream-Session', sessionId);
      res.setHeader('Content-Disposition', 'inline; filename="stream.mp4"');

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        if (start >= fileSize || end >= fileSize) {
          res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
          return res.end();
        }

        const maxChunkSize = 512 * 1024;
        const chunksize = (end - start) + 1;
        const actualChunkSize = Math.min(chunksize, maxChunkSize);
        const actualEnd = start + actualChunkSize - 1;

        const file = fs.createReadStream(filePath, { 
          start, 
          end: actualEnd,
          highWaterMark: 64 * 1024
        });
        
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${actualEnd}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', actualChunkSize);

        this.trackViewProgress(sessionId, userId, contentId, start, fileSize);

        file.pipe(res);
      } else {
        const chunkSize = 256 * 1024;
        const file = fs.createReadStream(filePath, { 
          highWaterMark: chunkSize 
        });
        
        res.setHeader('Content-Length', fileSize);

        this.trackViewProgress(sessionId, userId, contentId, 0, fileSize);

        file.pipe(res);
      }
    } catch (error) {
      console.error('Secure video streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false,
          error: 'Streaming failed',
          code: 'STREAMING_INTERNAL_ERROR'
        });
      }
    }
  }

  constructFilePath(mediaAsset) {
    const basePath = process.env.NODE_ENV === 'production' 
      ? '/var/www/media' 
      : path.join(process.cwd(), 'media');
    
    return path.join(basePath, mediaAsset.file_path);
  }

  async trackViewProgress(sessionId, userId, contentId, currentTime, totalDuration) {
    try {
      const percentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
      
      await query(`
        UPDATE content_watch_sessions 
        SET 
          total_watch_time = total_watch_time + 1,
          max_watch_time = GREATEST(max_watch_time, ?),
          last_activity_at = CONVERT_TZ(NOW(), @@session.time_zone, '+00:00')
        WHERE session_id = ?
      `, [currentTime, sessionId]);

      if (percentage % 10 < 1 || currentTime % 30 < 1) {
        await query(`
          INSERT INTO content_watch_progress 
          (session_id, playback_time, duration, percentage_watched, watch_duration, created_at)
          VALUES (?, ?, ?, ?, 1, CONVERT_TZ(NOW(), @@session.time_zone, '+00:00'))
        `, [sessionId, currentTime, totalDuration, percentage]);
      }

      await query(`
        INSERT INTO user_playback_positions 
        (user_id, content_id, playback_time, duration, percentage_watched, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CONVERT_TZ(NOW(), @@session.time_zone, '+00:00'), CONVERT_TZ(NOW(), @@session.time_zone, '+00:00'))
        ON DUPLICATE KEY UPDATE 
          playback_time = VALUES(playback_time),
          duration = VALUES(duration),
          percentage_watched = VALUES(percentage_watched),
          updated_at = VALUES(updated_at)
      `, [userId, contentId, currentTime, totalDuration, percentage]);

      if (currentTime > 30 && currentTime < 60) {
        const existingView = await query(`
          SELECT 1 FROM content_view_history 
          WHERE user_id = ? AND content_id = ? AND session_id = ?
        `, [userId, contentId, sessionId]);

        if (existingView.length === 0) {
          await query(`
            INSERT INTO content_view_history 
            (content_id, user_id, session_id, watch_duration_seconds, percentage_watched, device_type, created_at)
            VALUES (?, ?, ?, ?, ?, 'web', CONVERT_TZ(NOW(), @@session.time_zone, '+00:00'))
          `, [contentId, userId, sessionId, Math.floor(currentTime), percentage]);

          await query(`
            UPDATE content_watch_sessions 
            SET view_recorded = TRUE, view_recorded_at = CONVERT_TZ(NOW(), @@session.time_zone, '+00:00')
            WHERE session_id = ?
          `, [sessionId]);
        }
      }
    } catch (error) {
      console.error('Progress tracking error:', error);
    }
  }

  async getAvailableFormats(contentId) {
    try {
      const formats = await query(`
        SELECT 
          asset_type,
          resolution,
          bitrate,
          file_size,
          duration_seconds
        FROM media_assets 
        WHERE content_id = ? 
          AND asset_type IN ('mainVideo', 'trailer')
          AND upload_status = 'completed'
        ORDER BY 
          CASE asset_type 
            WHEN 'mainVideo' THEN 1
            WHEN 'trailer' THEN 2
            ELSE 3 
          END,
          bitrate DESC
      `, [contentId]);

      return formats.map(format => ({
        type: format.asset_type,
        quality: format.resolution,
        bitrate: format.bitrate,
        size: this.formatFileSize(format.file_size),
        duration: format.duration_seconds
      }));
    } catch (error) {
      console.error('Format retrieval error:', error);
      return [];
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new StreamController();