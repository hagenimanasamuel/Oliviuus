const socketIo = require('socket.io');
const { query } = require('../config/dbConfig');

let io;

const initLiveWebSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('New client connected for live updates - Socket ID:', socket.id);

    // Join admin room for live updates
    socket.on('admin:join-live', () => {
      socket.join('admin-live-updates');
      console.log(`Socket ${socket.id} joined admin-live-updates room`);
    });

    // Handle heartbeat from client
    socket.on('heartbeat', async (data) => {
      try {
        const { 
          sessionId, 
          userId, 
          userType = 'anonymous',
          deviceType = 'web',
          deviceName,
          ipAddress,
          countryCode,
          sessionType = 'browsing',
          contentId = null,
          mediaAssetId = null,
          contentTitle = null,
          contentType = null,
          playbackTime = 0,
          duration = 0,
          percentageWatched = 0,
          networkLatency = null,
          frameRate = null,
          bandwidthEstimate = null,
          connectionType = null,
          screenResolution = null,
          languagePreference = 'en',
          userAgent = null
        } = data;

        // Validate required fields
        if (!sessionId) {
          console.warn('Heartbeat missing sessionId');
          return;
        }

        // First, check if session exists to get joined_at
        let existingJoinedAt = new Date();
        const existingSession = await query(`
          SELECT joined_at 
          FROM live_presence 
          WHERE session_id = ?
        `, [sessionId]);

        if (existingSession.length > 0) {
          existingJoinedAt = existingSession[0].joined_at;
        }

        // Update or insert live presence (FIXED QUERY)
        await query(`
          INSERT INTO live_presence (
            session_id, user_id, user_type, device_type, device_name,
            ip_address, country_code, session_type, content_id, media_asset_id,
            content_title, content_type, playback_time, duration, percentage_watched,
            network_latency, frame_rate, bandwidth_estimate, connection_type,
            screen_resolution, language_preference, user_agent,
            last_activity, joined_at, expires_at, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, DATE_ADD(NOW(), INTERVAL 30 SECOND), TRUE)
          ON DUPLICATE KEY UPDATE 
            user_id = VALUES(user_id),
            user_type = VALUES(user_type),
            device_type = VALUES(device_type),
            device_name = VALUES(device_name),
            ip_address = VALUES(ip_address),
            country_code = VALUES(country_code),
            session_type = VALUES(session_type),
            content_id = VALUES(content_id),
            media_asset_id = VALUES(media_asset_id),
            content_title = VALUES(content_title),
            content_type = VALUES(content_type),
            playback_time = VALUES(playback_time),
            duration = VALUES(duration),
            percentage_watched = VALUES(percentage_watched),
            network_latency = VALUES(network_latency),
            frame_rate = VALUES(frame_rate),
            bandwidth_estimate = VALUES(bandwidth_estimate),
            connection_type = VALUES(connection_type),
            screen_resolution = VALUES(screen_resolution),
            language_preference = VALUES(language_preference),
            user_agent = VALUES(user_agent),
            last_activity = NOW(),
            expires_at = DATE_ADD(NOW(), INTERVAL 30 SECOND),
            is_active = TRUE
        `, [
          sessionId, userId, userType, deviceType, deviceName,
          ipAddress, countryCode, sessionType, contentId, mediaAssetId,
          contentTitle, contentType, playbackTime, duration, percentageWatched,
          networkLatency, frameRate, bandwidthEstimate, connectionType,
          screenResolution, languagePreference, userAgent,
          existingJoinedAt // Use the existing joined_at or current time
        ]);

        // Record the event
        await query(`
          INSERT INTO live_events (
            session_id, user_id, event_type, event_data, metadata
          ) VALUES (?, ?, 'heartbeat', ?, ?)
        `, [
          sessionId,
          userId,
          JSON.stringify({
            deviceType,
            sessionType,
            contentId,
            percentageWatched,
            networkLatency,
            frameRate
          }),
          JSON.stringify({
            timestamp: new Date().toISOString(),
            socketId: socket.id
          })
        ]);

        // Broadcast update to admin room (throttled to avoid spam)
        if (Date.now() % 10 === 0) { // Only broadcast 10% of heartbeats
          io.to('admin-live-updates').emit('live:heartbeat', {
            sessionId,
            userType,
            deviceType,
            sessionType,
            contentId,
            contentTitle,
            percentageWatched,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error('Error processing heartbeat:', error);
      }
    });

    // Handle session info from client (when they start a session)
    socket.on('session:start', async (data) => {
      try {
        const { 
          sessionId,
          userId,
          userType = 'anonymous',
          deviceType = 'web',
          deviceName,
          ipAddress,
          countryCode,
          userAgent,
          screenResolution,
          languagePreference = 'en'
        } = data;

        if (!sessionId) return;

        // Check if session already exists
        const existingSession = await query(`
          SELECT id FROM live_presence WHERE session_id = ?
        `, [sessionId]);

        if (existingSession.length === 0) {
          // New session - insert with all details
          await query(`
            INSERT INTO live_presence (
              session_id, user_id, user_type, device_type, device_name,
              ip_address, country_code, user_agent, screen_resolution,
              language_preference, last_activity, joined_at, expires_at, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 30 SECOND), TRUE)
          `, [
            sessionId, userId, userType, deviceType, deviceName,
            ipAddress, countryCode, userAgent, screenResolution,
            languagePreference
          ]);

          // Record session start event
          await query(`
            INSERT INTO live_events (
              session_id, user_id, event_type, event_data, metadata
            ) VALUES (?, ?, 'user_joined', ?, ?)
          `, [
            sessionId,
            userId,
            JSON.stringify({
              deviceType,
              deviceName,
              userAgent
            }),
            JSON.stringify({
              timestamp: new Date().toISOString(),
              socketId: socket.id
            })
          ]);

          // Broadcast new session to admin room
          io.to('admin-live-updates').emit('live:user-joined', {
            sessionId,
            userType,
            deviceType,
            deviceName,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error processing session start:', error);
      }
    });

    // Handle user disconnected (clean up)
    socket.on('user:disconnected', async (data) => {
      try {
        const { sessionId } = data;
        if (sessionId) {
          await query(`
            UPDATE live_presence 
            SET 
              is_active = FALSE,
              disconnected_at = NOW(),
              expires_at = NOW()
            WHERE session_id = ?
          `, [sessionId]);

          await query(`
            INSERT INTO live_events (
              session_id, event_type, event_data
            ) VALUES (?, 'user_left', ?)
          `, [sessionId, JSON.stringify({ reason: 'socket_disconnected' })]);

          io.to('admin-live-updates').emit('live:disconnected', {
            sessionId,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error processing disconnect:', error);
      }
    });

    // Handle admin actions
    socket.on('admin:disconnect-user', async (data) => {
      try {
        const { sessionId, adminId } = data;
        
        await query(`
          UPDATE live_presence 
          SET 
            is_active = FALSE,
            disconnected_at = NOW(),
            expires_at = NOW()
          WHERE session_id = ?
        `, [sessionId]);

        await query(`
          INSERT INTO live_events (
            session_id, event_type, event_data, metadata
          ) VALUES (?, 'user_left', ?, ?)
        `, [
          sessionId,
          JSON.stringify({ reason: 'admin_disconnected' }),
          JSON.stringify({ adminId, timestamp: new Date().toISOString() })
        ]);

        // Notify specific socket if connected
        io.to(sessionId).emit('force:disconnect', {
          reason: 'admin_disconnect',
          timestamp: new Date().toISOString()
        });

        // Broadcast to admin room
        io.to('admin-live-updates').emit('live:admin-disconnected', {
          sessionId,
          adminId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error disconnecting user:', error);
      }
    });

    // Clean up on socket disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected - Socket ID: ${socket.id}, Reason: ${reason}`);
    });
  });

  // Broadcast live stats every 3 seconds
  const statsInterval = setInterval(async () => {
    try {
      const stats = await getLiveStatsForBroadcast();
      io.to('admin-live-updates').emit('live:stats', {
        ...stats,
        timestamp: new Date().toISOString(),
        serverTime: Date.now()
      });
    } catch (error) {
      console.error('Error broadcasting stats:', error);
    }
  }, 3000);

  // Clean up expired sessions every minute
  const cleanupInterval = setInterval(async () => {
    try {
      await query(`
        UPDATE live_presence 
        SET 
          is_active = FALSE,
          disconnected_at = NOW()
        WHERE expires_at < NOW() 
        AND is_active = TRUE
      `);
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }, 60000);

  // Clean up on server shutdown
  const cleanup = () => {
    clearInterval(statsInterval);
    clearInterval(cleanupInterval);
    if (io) {
      io.close();
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  console.log('Live WebSocket service initialized');
  return io;
};

const getLiveStatsForBroadcast = async () => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_live,
        COUNT(CASE WHEN session_type = 'viewing' THEN 1 END) as viewing,
        COUNT(CASE WHEN session_type = 'browsing' THEN 1 END) as browsing,
        COUNT(CASE WHEN session_type = 'idle' THEN 1 END) as idle,
        COUNT(DISTINCT content_id) as unique_contents,
        COUNT(DISTINCT country_code) as countries,
        COUNT(CASE WHEN user_type = 'authenticated' THEN 1 END) as authenticated,
        COUNT(CASE WHEN user_type = 'anonymous' THEN 1 END) as anonymous,
        COUNT(CASE WHEN user_type = 'kid_profile' THEN 1 END) as kid_profiles,
        COUNT(CASE WHEN user_type = 'family_member' THEN 1 END) as family_members,
        COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile,
        COUNT(CASE WHEN device_type = 'web' THEN 1 END) as web,
        COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet,
        COUNT(CASE WHEN device_type = 'smarttv' THEN 1 END) as smarttv,
        COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop,
        AVG(network_latency) as avg_latency,
        AVG(frame_rate) as avg_frame_rate,
        AVG(bandwidth_estimate) as avg_bandwidth
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
    `);

    return stats[0] || {
      total_live: 0,
      viewing: 0,
      browsing: 0,
      idle: 0,
      unique_contents: 0,
      countries: 0,
      authenticated: 0,
      anonymous: 0,
      kid_profiles: 0,
      family_members: 0,
      mobile: 0,
      web: 0,
      tablet: 0,
      smarttv: 0,
      desktop: 0,
      avg_latency: 0,
      avg_frame_rate: 0,
      avg_bandwidth: 0
    };
  } catch (error) {
    console.error('Error getting live stats:', error);
    return {
      total_live: 0,
      viewing: 0,
      browsing: 0,
      idle: 0,
      unique_contents: 0,
      countries: 0,
      authenticated: 0,
      anonymous: 0,
      kid_profiles: 0,
      family_members: 0,
      mobile: 0,
      web: 0,
      tablet: 0,
      smarttv: 0,
      desktop: 0,
      avg_latency: 0,
      avg_frame_rate: 0,
      avg_bandwidth: 0,
      error: true
    };
  }
};

// Function to get WebSocket instance
const getWebSocketInstance = () => {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initLiveWebSocket first.');
  }
  return io;
};

module.exports = {
  initLiveWebSocket,
  getWebSocketInstance,
  getLiveStatsForBroadcast
};