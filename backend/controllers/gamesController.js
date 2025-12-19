const { query } = require("../config/dbConfig");
const crypto = require('crypto');

// Helper function to generate session ID
const generateSessionId = () => {
  return `kidgame_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

// Helper to resolve kid identity (supports both kid types)
const resolveKidIdentity = (req) => {
  try {
    const { kid_profile, user } = req;

    if (!kid_profile) {
      // Check if it's a family member kid
      if (req.user && req.user.id) {
        return {
          user_id: req.user.id,
          kid_profile_id: null,
          family_member_id: null,
          identity_type: 'user'
        };
      }

      throw new Error('No kid profile or user found in request');
    }

    // Family member kid with own account
    if (kid_profile.is_family_member) {
      return {
        user_id: kid_profile.user_id || null,
        kid_profile_id: null,
        family_member_id: kid_profile.id,
        identity_type: 'family_member_kid'
      };
    }

    // Regular kid profile (under parent account)
    return {
      user_id: null,
      kid_profile_id: kid_profile.id,
      family_member_id: null,
      identity_type: 'kid_profile'
    };
  } catch (error) {
    console.error('Error resolving kid identity:', error);
    return {
      user_id: null,
      kid_profile_id: null,
      family_member_id: null,
      identity_type: 'unknown'
    };
  }
};

// ============================
// GAME MANAGEMENT (Admin/Global)
// ============================

// Get all games (admin/global view)
const getAllGames = async (req, res) => {
  try {
    const { category, is_active, age_min, age_max, search } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (is_active !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    if (age_min) {
      whereClause += ' AND age_maximum >= ?';
      params.push(parseInt(age_min));
    }

    if (age_max) {
      whereClause += ' AND age_minimum <= ?';
      params.push(parseInt(age_max));
    }

    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const games = await query(
      `SELECT g.*, 
              COUNT(DISTINCT gs.skill_id) as skills_count,
              GROUP_CONCAT(DISTINCT es.name) as skill_names
       FROM games g
       LEFT JOIN game_skills_mapping gs ON g.id = gs.game_id
       LEFT JOIN educational_skills es ON gs.skill_id = es.id
       ${whereClause}
       GROUP BY g.id
       ORDER BY g.sort_order, g.title`,
      params
    );

    // Parse JSON fields
    const formattedGames = games.map(game => ({
      ...game,
      metadata: game.metadata ? JSON.parse(game.metadata) : {},
      skills_count: game.skills_count || 0,
      skill_names: game.skill_names ? game.skill_names.split(',') : []
    }));

    res.json({
      success: true,
      games: formattedGames,
      total: formattedGames.length
    });

  } catch (error) {
    console.error('Error getting all games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games'
    });
  }
};

// Get game by ID (global)
const getGameById = async (req, res) => {
  try {
    const { gameId } = req.params;

    const games = await query(
      `SELECT g.*, 
              COUNT(DISTINCT gp.id) as total_players,
              AVG(gsc.score_value) as average_score,
              MAX(gsc.score_value) as high_score
       FROM games g
       LEFT JOIN game_progress gp ON g.id = gp.game_id
       LEFT JOIN game_scores gsc ON g.id = gsc.game_id
       WHERE g.id = ?
       GROUP BY g.id`,
      [gameId]
    );

    if (games.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    const game = games[0];

    // Get game skills
    const skills = await query(
      `SELECT es.*, gsm.strength_level
       FROM game_skills_mapping gsm
       JOIN educational_skills es ON gsm.skill_id = es.id
       WHERE gsm.game_id = ?
       ORDER BY gsm.strength_level`,
      [gameId]
    );

    // Get total sessions
    const sessions = await query(
      'SELECT COUNT(*) as total_sessions FROM game_sessions WHERE game_id = ?',
      [gameId]
    );

    const result = {
      ...game,
      metadata: game.metadata ? JSON.parse(game.metadata) : {},
      skills: skills,
      statistics: {
        total_players: game.total_players || 0,
        total_sessions: sessions[0]?.total_sessions || 0,
        average_score: Math.round(game.average_score || 0),
        high_score: game.high_score || 0
      }
    };

    res.json({
      success: true,
      game: result
    });

  } catch (error) {
    console.error('Error getting game by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game'
    });
  }
};

// Create new game (admin only)
const createGame = async (req, res) => {
  try {
    const {
      game_key,
      title,
      description,
      icon_emoji,
      color_gradient,
      category,
      age_minimum,
      age_maximum,
      game_component,
      metadata,
      skills, // Array of skill IDs
      sort_order
    } = req.body;

    // Validation
    if (!game_key || !title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: game_key, title, description, category'
      });
    }

    // Check if game_key already exists
    const existing = await query(
      'SELECT id FROM games WHERE game_key = ?',
      [game_key]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Game key already exists'
      });
    }

    // Start transaction
    await query('START TRANSACTION');

    // Insert game
    const gameResult = await query(
      `INSERT INTO games (
        game_key, title, description, icon_emoji, color_gradient,
        category, age_minimum, age_maximum, game_component, metadata, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        game_key,
        title,
        description,
        icon_emoji || '🎮',
        color_gradient || 'from-[#FF5722] to-[#FF9800]',
        category,
        parseInt(age_minimum) || 3,
        parseInt(age_maximum) || 8,
        game_component,
        metadata ? JSON.stringify(metadata) : null,
        sort_order || 0
      ]
    );

    const gameId = gameResult.insertId;

    // Link skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      // Validate skills exist
      const placeholders = skills.map(() => '?').join(',');
      const validSkills = await query(
        `SELECT id FROM educational_skills WHERE id IN (${placeholders})`,
        skills
      );

      const validSkillIds = validSkills.map(s => s.id);

      if (validSkillIds.length > 0) {
        const skillValues = validSkillIds.map(skill_id => [gameId, skill_id]);
        await query(
          'INSERT INTO game_skills_mapping (game_id, skill_id) VALUES ?',
          [skillValues]
        );
      }
    }

    // Commit transaction
    await query('COMMIT');

    // Fetch created game
    const game = await getGameByIdHelper(gameId);

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      game
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error creating game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create game'
    });
  }
};

// Update game (admin only)
const updateGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const updateData = req.body;

    // Check if game exists
    const existingGame = await query(
      'SELECT id FROM games WHERE id = ?',
      [gameId]
    );

    if (existingGame.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Build dynamic update query
    const allowedFields = [
      'title', 'description', 'icon_emoji', 'color_gradient',
      'category', 'age_minimum', 'age_maximum', 'game_component',
      'metadata', 'is_active', 'sort_order'
    ];

    const setClauses = [];
    const values = [];

    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        setClauses.push(`${field} = ?`);

        // Handle special fields
        if (field === 'metadata' && updateData[field]) {
          values.push(JSON.stringify(updateData[field]));
        } else if (['age_minimum', 'age_maximum', 'sort_order'].includes(field)) {
          values.push(parseInt(updateData[field]));
        } else {
          values.push(updateData[field]);
        }
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Add updated_at
    setClauses.push('updated_at = NOW()');
    values.push(gameId);

    // Start transaction
    await query('START TRANSACTION');

    // Update game
    const updateQuery = `UPDATE games SET ${setClauses.join(', ')} WHERE id = ?`;
    await query(updateQuery, values);

    // Handle skills update if provided
    if (updateData.skills !== undefined) {
      // Delete existing mappings
      await query('DELETE FROM game_skills_mapping WHERE game_id = ?', [gameId]);

      // Insert new mappings if skills array is provided
      if (Array.isArray(updateData.skills) && updateData.skills.length > 0) {
        const validSkills = await query(
          `SELECT id FROM educational_skills WHERE id IN (${updateData.skills.map(() => '?').join(',')})`,
          updateData.skills
        );

        if (validSkills.length > 0) {
          const skillValues = validSkills.map(s => [gameId, s.id]);
          await query(
            'INSERT INTO game_skills_mapping (game_id, skill_id) VALUES ?',
            [skillValues]
          );
        }
      }
    }

    // Commit transaction
    await query('COMMIT');

    // Fetch updated game
    const game = await getGameByIdHelper(gameId);

    res.json({
      success: true,
      message: 'Game updated successfully',
      game
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error updating game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update game'
    });
  }
};

// Delete game (admin only) - Soft delete
const deleteGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    // Soft delete - mark as inactive
    await query(
      'UPDATE games SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [gameId]
    );

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete game'
    });
  }
};

// ============================
// KID GAME PLAY (For both kid types)
// ============================

// Start game session (for any kid type)
const startGameSession = async (req, res) => {
  try {
    const { gameId } = req.params;
    const identity = resolveKidIdentity(req);
    const device_type = req.device_info?.device_type || 'web';
    const session_id = generateSessionId();

    // Check if game exists and is active
    const game = await query(
      'SELECT id, title FROM games WHERE id = ? AND is_active = TRUE',
      [gameId]
    );

    if (game.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found or inactive'
      });
    }

    // Start transaction
    await query('START TRANSACTION');

    // Create game session - using ACTUAL columns from your schema
    const sessionResult = await query(
      `INSERT INTO game_sessions (
        user_id, kid_profile_id, family_member_id,
        game_id, session_id, device_type,
        start_time, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        identity.user_id,
        identity.kid_profile_id,
        identity.family_member_id,
        gameId,
        session_id,
        device_type,
        req.ip || null,
        req.headers['user-agent'] || null
      ]
    );

    const sessionId = sessionResult.insertId;

    // Check if game progress exists, if not, create it
    let progressQuery;
    let progressParams;

    if (identity.user_id) {
      progressQuery = 'SELECT id FROM game_progress WHERE user_id = ? AND game_id = ?';
      progressParams = [identity.user_id, gameId];
    } else if (identity.kid_profile_id) {
      progressQuery = 'SELECT id FROM game_progress WHERE kid_profile_id = ? AND game_id = ?';
      progressParams = [identity.kid_profile_id, gameId];
    } else if (identity.family_member_id) {
      progressQuery = 'SELECT id FROM game_progress WHERE family_member_id = ? AND game_id = ?';
      progressParams = [identity.family_member_id, gameId];
    }

    const existingProgress = await query(progressQuery, progressParams);

    if (existingProgress.length === 0) {
      // Create new progress entry
      let insertProgressQuery;
      let insertProgressValues;

      if (identity.user_id) {
        insertProgressQuery = `
          INSERT INTO game_progress (
            user_id, game_id, times_played, last_played
          ) VALUES (?, ?, 1, NOW())
        `;
        insertProgressValues = [identity.user_id, gameId];
      } else if (identity.kid_profile_id) {
        insertProgressQuery = `
          INSERT INTO game_progress (
            kid_profile_id, game_id, times_played, last_played
          ) VALUES (?, ?, 1, NOW())
        `;
        insertProgressValues = [identity.kid_profile_id, gameId];
      } else if (identity.family_member_id) {
        insertProgressQuery = `
          INSERT INTO game_progress (
            family_member_id, game_id, times_played, last_played
          ) VALUES (?, ?, 1, NOW())
        `;
        insertProgressValues = [identity.family_member_id, gameId];
      }

      if (insertProgressQuery) {
        await query(insertProgressQuery, insertProgressValues);
      }
    } else {
      // Increment times played
      await query(
        'UPDATE game_progress SET times_played = times_played + 1, last_played = NOW() WHERE id = ?',
        [existingProgress[0].id]
      );
    }

    // Commit transaction
    await query('COMMIT');

    res.json({
      success: true,
      message: 'Game session started',
      session: {
        session_id: sessionId,
        session_token: session_id,
        game_id: gameId,
        game_title: game[0].title
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error starting game session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start game session',
      details: error.message
    });
  }
};

// Submit game score (for any kid type)
const submitGameScore = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { session_id, score, level, moves, time_taken, accuracy, metrics } = req.body;
    const identity = resolveKidIdentity(req);

    // Validate required fields
    if (!session_id || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: session_id, score'
      });
    }

    // Get session
    const session = await query(
      'SELECT id FROM game_sessions WHERE session_id = ? AND game_id = ?',
      [session_id, gameId]
    );

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game session not found'
      });
    }

    const sessionId = session[0].id;

    // Start transaction
    await query('START TRANSACTION');

    // Get current high score BEFORE inserting new score
    let currentHighScore = 0;
    let progressId = null;

    // Get game progress to check current high score
    let progressQuery;
    let progressParams;

    if (identity.user_id) {
      progressQuery = 'SELECT id, highest_score FROM game_progress WHERE user_id = ? AND game_id = ?';
      progressParams = [identity.user_id, gameId];
    } else if (identity.kid_profile_id) {
      progressQuery = 'SELECT id, highest_score FROM game_progress WHERE kid_profile_id = ? AND game_id = ?';
      progressParams = [identity.kid_profile_id, gameId];
    } else if (identity.family_member_id) {
      progressQuery = 'SELECT id, highest_score FROM game_progress WHERE family_member_id = ? AND game_id = ?';
      progressParams = [identity.family_member_id, gameId];
    }

    if (progressQuery) {
      const progress = await query(progressQuery, progressParams);

      if (progress.length > 0) {
        currentHighScore = progress[0].highest_score || 0;
        progressId = progress[0].id;
      }
    }

    // Submit score
    const scoreResult = await query(
      `INSERT INTO game_scores (
        user_id, kid_profile_id, family_member_id,
        game_id, session_id, score_value,
        level, moves_count, time_taken_seconds,
        accuracy_percentage, metrics_json,
        is_high_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        identity.user_id,
        identity.kid_profile_id,
        identity.family_member_id,
        gameId,
        sessionId,
        parseInt(score),
        parseInt(level) || 1,
        parseInt(moves) || 0,
        parseInt(time_taken) || 0,
        parseFloat(accuracy) || 0,
        metrics ? JSON.stringify(metrics) : null,
        score > currentHighScore // Set is_high_score based on comparison
      ]
    );

    // Update game progress
    if (progressId) {
      // Update if this is a high score
      if (score > currentHighScore) {
        await query(
          'UPDATE game_progress SET highest_score = ?, last_played = NOW() WHERE id = ?',
          [score, progressId]
        );
      }

      // Update total playtime
      await query(
        'UPDATE game_progress SET total_playtime_seconds = total_playtime_seconds + ? WHERE id = ?',
        [time_taken || 0, progressId]
      );

      // Update levels completed if applicable
      if (level && level > 0) {
        const currentLevelResult = await query(
          'SELECT last_level_played FROM game_progress WHERE id = ?',
          [progressId]
        );

        const currentLevelValue = currentLevelResult[0]?.last_level_played || 0;
        if (level > currentLevelValue) {
          await query(
            'UPDATE game_progress SET last_level_played = ?, levels_completed = ? WHERE id = ?',
            [level, level, progressId]
          );
        }
      }
    } else {
      // Create new progress record if it doesn't exist
      let insertProgressQuery;
      let insertProgressValues;

      if (identity.user_id) {
        insertProgressQuery = `
          INSERT INTO game_progress (
            user_id, game_id, highest_score, total_playtime_seconds,
            levels_completed, times_played, last_level_played, last_played
          ) VALUES (?, ?, ?, ?, ?, 1, ?, NOW())
        `;
        insertProgressValues = [
          identity.user_id,
          gameId,
          score,
          time_taken || 0,
          level || 1,
          level || 1
        ];
      } else if (identity.kid_profile_id) {
        insertProgressQuery = `
          INSERT INTO game_progress (
            kid_profile_id, game_id, highest_score, total_playtime_seconds,
            levels_completed, times_played, last_level_played, last_played
          ) VALUES (?, ?, ?, ?, ?, 1, ?, NOW())
        `;
        insertProgressValues = [
          identity.kid_profile_id,
          gameId,
          score,
          time_taken || 0,
          level || 1,
          level || 1
        ];
      } else if (identity.family_member_id) {
        insertProgressQuery = `
          INSERT INTO game_progress (
            family_member_id, game_id, highest_score, total_playtime_seconds,
            levels_completed, times_played, last_level_played, last_played
          ) VALUES (?, ?, ?, ?, ?, 1, ?, NOW())
        `;
        insertProgressValues = [
          identity.family_member_id,
          gameId,
          score,
          time_taken || 0,
          level || 1,
          level || 1
        ];
      }

      if (insertProgressQuery) {
        await query(insertProgressQuery, insertProgressValues);
      }
    }

    // Update session end time and duration
    if (time_taken) {
      await query(
        'UPDATE game_sessions SET duration_seconds = duration_seconds + ?, end_time = NOW() WHERE id = ?',
        [time_taken, sessionId]
      );
    } else {
      // Just update end time
      await query(
        'UPDATE game_sessions SET end_time = NOW() WHERE id = ?',
        [sessionId]
      );
    }

    // Check for achievements
    await checkAchievements(identity, gameId, score, level);

    // Update skill progress
    await updateSkillProgress(identity, gameId, score, metrics);

    // Commit transaction
    await query('COMMIT');

    res.json({
      success: true,
      message: 'Score submitted successfully',
      score_id: scoreResult.insertId,
      is_high_score: score > currentHighScore,
      current_score: score,
      previous_high_score: currentHighScore
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error submitting score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit score',
      details: error.message
    });
  }
};

// Save game progress (for games like Water Sort Puzzle)
const saveGameProgress = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { save_state, level } = req.body;
    const identity = resolveKidIdentity(req);

    if (!save_state) {
      return res.status(400).json({
        success: false,
        error: 'Missing save_state'
      });
    }

    // Get or create progress record
    let progressQuery;
    let progressParams;

    if (identity.user_id) {
      progressQuery = 'SELECT id FROM game_progress WHERE user_id = ? AND game_id = ?';
      progressParams = [identity.user_id, gameId];
    } else if (identity.kid_profile_id) {
      progressQuery = 'SELECT id FROM game_progress WHERE kid_profile_id = ? AND game_id = ?';
      progressParams = [identity.kid_profile_id, gameId];
    } else if (identity.family_member_id) {
      progressQuery = 'SELECT id FROM game_progress WHERE family_member_id = ? AND game_id = ?';
      progressParams = [identity.family_member_id, gameId];
    }

    const progress = await query(progressQuery, progressParams);

    if (progress.length === 0) {
      // Create new progress with save state
      let insertQuery;
      let insertValues;

      if (identity.user_id) {
        insertQuery = `
          INSERT INTO game_progress (
            user_id, game_id, save_state, last_level_played, last_played
          ) VALUES (?, ?, ?, ?, NOW())
        `;
        insertValues = [identity.user_id, gameId, JSON.stringify(save_state), parseInt(level) || 1];
      } else if (identity.kid_profile_id) {
        insertQuery = `
          INSERT INTO game_progress (
            kid_profile_id, game_id, save_state, last_level_played, last_played
          ) VALUES (?, ?, ?, ?, NOW())
        `;
        insertValues = [identity.kid_profile_id, gameId, JSON.stringify(save_state), parseInt(level) || 1];
      } else if (identity.family_member_id) {
        insertQuery = `
          INSERT INTO game_progress (
            family_member_id, game_id, save_state, last_level_played, last_played
          ) VALUES (?, ?, ?, ?, NOW())
        `;
        insertValues = [identity.family_member_id, gameId, JSON.stringify(save_state), parseInt(level) || 1];
      }

      if (insertQuery) {
        await query(insertQuery, insertValues);
      }
    } else {
      // Update existing progress
      await query(
        'UPDATE game_progress SET save_state = ?, last_level_played = ?, last_played = NOW() WHERE id = ?',
        [JSON.stringify(save_state), parseInt(level) || 1, progress[0].id]
      );
    }

    res.json({
      success: true,
      message: 'Game progress saved'
    });

  } catch (error) {
    console.error('Error saving game progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save game progress',
      details: error.message
    });
  }
};

// Update session activity (can be called periodically)
const updateSessionActivity = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Just update the updated_at timestamp
    await query(
      'UPDATE game_sessions SET updated_at = NOW() WHERE session_id = ?',
      [sessionId]
    );
    
    res.json({
      success: true,
      message: 'Session activity updated'
    });
    
  } catch (error) {
    console.error('Error updating session activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session activity'
    });
  }
};

// Load game progress
const loadGameProgress = async (req, res) => {
  try {
    const { gameId } = req.params;
    const identity = resolveKidIdentity(req);

    let progressQuery;
    let progressParams;

    if (identity.user_id) {
      progressQuery = 'SELECT * FROM game_progress WHERE user_id = ? AND game_id = ?';
      progressParams = [identity.user_id, gameId];
    } else if (identity.kid_profile_id) {
      progressQuery = 'SELECT * FROM game_progress WHERE kid_profile_id = ? AND game_id = ?';
      progressParams = [identity.kid_profile_id, gameId];
    } else if (identity.family_member_id) {
      progressQuery = 'SELECT * FROM game_progress WHERE family_member_id = ? AND game_id = ?';
      progressParams = [identity.family_member_id, gameId];
    }

    const progress = await query(progressQuery, progressParams);

    if (progress.length === 0) {
      return res.json({
        success: true,
        has_progress: false,
        progress: null
      });
    }

    const progressData = progress[0];

    // Parse JSON fields (if they exist)
    const result = {
      ...progressData,
      save_state: progressData.save_state ? JSON.parse(progressData.save_state) : null,
      unlocked_features: progressData.unlocked_features ? JSON.parse(progressData.unlocked_features) : null,
      achievements_json: progressData.achievements_json ? JSON.parse(progressData.achievements_json) : null,
      metadata: progressData.metadata ? JSON.parse(progressData.metadata) : null
    };

    res.json({
      success: true,
      has_progress: true,
      progress: result
    });

  } catch (error) {
    console.error('Error loading game progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load game progress',
      details: error.message
    });
  }
};

// Get kid's game history
const getKidGameHistory = async (req, res) => {
  try {
    const identity = resolveKidIdentity(req);
    const { limit = 20, offset = 0 } = req.query;

    let historyQuery;
    let queryParams = [];

    if (identity.user_id) {
      historyQuery = `
        SELECT gs.*, g.title, g.icon_emoji, g.category,
               gs.session_id, gs.start_time, gs.duration_seconds,
               COALESCE(gsc.score_value, 0) as last_score
        FROM game_sessions gs
        JOIN games g ON gs.game_id = g.id
        LEFT JOIN game_scores gsc ON gs.id = gsc.session_id AND gsc.is_high_score = TRUE
        WHERE gs.user_id = ?
        ORDER BY gs.start_time DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [identity.user_id, parseInt(limit), parseInt(offset)];
    } else if (identity.kid_profile_id) {
      historyQuery = `
        SELECT gs.*, g.title, g.icon_emoji, g.category,
               gs.session_id, gs.start_time, gs.duration_seconds,
               COALESCE(gsc.score_value, 0) as last_score
        FROM game_sessions gs
        JOIN games g ON gs.game_id = g.id
        LEFT JOIN game_scores gsc ON gs.id = gsc.session_id AND gsc.is_high_score = TRUE
        WHERE gs.kid_profile_id = ?
        ORDER BY gs.start_time DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [identity.kid_profile_id, parseInt(limit), parseInt(offset)];
    } else if (identity.family_member_id) {
      historyQuery = `
        SELECT gs.*, g.title, g.icon_emoji, g.category,
               gs.session_id, gs.start_time, gs.duration_seconds,
               COALESCE(gsc.score_value, 0) as last_score
        FROM game_sessions gs
        JOIN games g ON gs.game_id = g.id
        LEFT JOIN game_scores gsc ON gs.id = gsc.session_id AND gsc.is_high_score = TRUE
        WHERE gs.family_member_id = ?
        ORDER BY gs.start_time DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [identity.family_member_id, parseInt(limit), parseInt(offset)];
    }

    const history = await query(historyQuery, queryParams);

    // Get total count
    let countQuery;
    let countParams;

    if (identity.user_id) {
      countQuery = 'SELECT COUNT(*) as total FROM game_sessions WHERE user_id = ?';
      countParams = [identity.user_id];
    } else if (identity.kid_profile_id) {
      countQuery = 'SELECT COUNT(*) as total FROM game_sessions WHERE kid_profile_id = ?';
      countParams = [identity.kid_profile_id];
    } else if (identity.family_member_id) {
      countQuery = 'SELECT COUNT(*) as total FROM game_sessions WHERE family_member_id = ?';
      countParams = [identity.family_member_id];
    }

    const countResult = await query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      history: history,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + history.length) < total
      }
    });

  } catch (error) {
    console.error('Error getting game history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get game history'
    });
  }
};

// Get available games for kid (age-appropriate)
const getAvailableGames = async (req, res) => {
  try {
    const identity = resolveKidIdentity(req);
    const { category, skill } = req.query;

    // Get kid's age from profile
    let kidAge = 5; // Default age
    if (req.kid_profile.max_age_rating) {
      // Parse age from rating like "7+" => 7
      const ageMatch = req.kid_profile.max_age_rating.match(/(\d+)/);
      if (ageMatch) {
        kidAge = parseInt(ageMatch[1]);
      }
    }

    let whereClause = 'WHERE g.is_active = TRUE';
    const params = [];

    // Age filter
    whereClause += ' AND g.age_minimum <= ? AND g.age_maximum >= ?';
    params.push(kidAge, kidAge);

    // Category filter
    if (category) {
      whereClause += ' AND g.category = ?';
      params.push(category);
    }

    // Skill filter
    let joinClause = '';
    if (skill) {
      joinClause = 'JOIN game_skills_mapping gsm ON g.id = gsm.game_id JOIN educational_skills es ON gsm.skill_id = es.id';
      whereClause += ' AND es.skill_key = ?';
      params.push(skill);
    }

    const games = await query(
      `SELECT DISTINCT g.*, 
              (SELECT COUNT(*) FROM game_skills_mapping WHERE game_id = g.id) as skills_count
       FROM games g
       ${joinClause}
       ${whereClause}
       ORDER BY g.sort_order, g.title`,
      params
    );

    // Parse JSON fields
    const formattedGames = games.map(game => ({
      ...game,
      metadata: game.metadata ? JSON.parse(game.metadata) : {}
    }));

    // Get kid's progress for each game
    const gameIds = formattedGames.map(g => g.id);
    if (gameIds.length > 0) {
      let progressQuery;
      let progressParams;

      if (identity.user_id) {
        progressQuery = `SELECT * FROM game_progress WHERE user_id = ? AND game_id IN (${gameIds.map(() => '?').join(',')})`;
        progressParams = [identity.user_id, ...gameIds];
      } else if (identity.kid_profile_id) {
        progressQuery = `SELECT * FROM game_progress WHERE kid_profile_id = ? AND game_id IN (${gameIds.map(() => '?').join(',')})`;
        progressParams = [identity.kid_profile_id, ...gameIds];
      } else if (identity.family_member_id) {
        progressQuery = `SELECT * FROM game_progress WHERE family_member_id = ? AND game_id IN (${gameIds.map(() => '?').join(',')})`;
        progressParams = [identity.family_member_id, ...gameIds];
      }

      if (progressQuery) {
        const progress = await query(progressQuery, progressParams);

        // Map progress to games
        const progressMap = {};
        progress.forEach(p => {
          progressMap[p.game_id] = {
            highest_score: p.highest_score,
            levels_completed: p.levels_completed,
            times_played: p.times_played,
            last_played: p.last_played
          };
        });

        formattedGames.forEach(game => {
          game.progress = progressMap[game.id] || null;
        });
      }
    }

    res.json({
      success: true,
      games: formattedGames,
      total: formattedGames.length
    });

  } catch (error) {
    console.error('Error getting available games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available games'
    });
  }
};

// ============================
// PARENT/ADMIN ANALYTICS
// ============================

// Get kid game analytics (for parents)
const getKidGameAnalytics = async (req, res) => {
  try {
    const { kidId } = req.params;
    const { timeframe = 'week' } = req.query;

    // Verify parent has access to this kid
    const parentId = req.user.id;

    // Check if kid belongs to parent
    const kidCheck = await query(
      `SELECT id FROM kids_profiles 
       WHERE id = ? AND parent_user_id = ?`,
      [kidId, parentId]
    );

    if (kidCheck.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this kid profile'
      });
    }

    // Calculate date range
    let dateRange;
    const now = new Date();

    switch (timeframe) {
      case 'day':
        dateRange = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        dateRange = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        dateRange = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        dateRange = new Date(now.setDate(now.getDate() - 7));
    }

    // Get game sessions
    const sessions = await query(
      `SELECT gs.*, g.title, g.category, g.icon_emoji
       FROM game_sessions gs
       JOIN games g ON gs.game_id = g.id
       WHERE gs.kid_profile_id = ? AND gs.start_time >= ?
       ORDER BY gs.start_time DESC`,
      [kidId, dateRange]
    );

    // Get scores
    const scores = await query(
      `SELECT gsc.*, g.title
       FROM game_scores gsc
       JOIN games g ON gsc.game_id = g.id
       WHERE gsc.kid_profile_id = ? AND gsc.created_at >= ?
       ORDER BY gsc.score_value DESC
       LIMIT 50`,
      [kidId, dateRange]
    );

    // Get progress
    const progress = await query(
      `SELECT gp.*, g.title
       FROM game_progress gp
       JOIN games g ON gp.game_id = g.id
       WHERE gp.kid_profile_id = ?
       ORDER BY gp.last_played DESC`,
      [kidId]
    );

    // Calculate statistics
    const totalPlaytime = sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);
    const gamesPlayed = [...new Set(sessions.map(s => s.game_id))].length;
    const totalSessions = sessions.length;

    // Most played games
    const gamePlayCount = {};
    sessions.forEach(session => {
      if (!gamePlayCount[session.game_id]) {
        gamePlayCount[session.game_id] = {
          count: 0,
          title: session.title,
          category: session.category,
          icon: session.icon_emoji
        };
      }
      gamePlayCount[session.game_id].count++;
    });

    const mostPlayedGames = Object.values(gamePlayCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Skill improvements
    const skillProgress = await query(
      `SELECT esp.*, es.name, es.category, es.icon_emoji
       FROM kids_skill_progress esp
       JOIN educational_skills es ON esp.skill_id = es.id
       WHERE esp.kid_profile_id = ?`,
      [kidId]
    );

    res.json({
      success: true,
      analytics: {
        timeframe,
        total_playtime_minutes: Math.round(totalPlaytime / 60),
        games_played: gamesPlayed,
        total_sessions: totalSessions,
        average_session_minutes: totalSessions > 0 ? Math.round(totalPlaytime / totalSessions / 60) : 0,
        most_played_games: mostPlayedGames,
        recent_sessions: sessions.slice(0, 10),
        high_scores: scores.filter(s => s.is_high_score).slice(0, 10),
        skill_progress: skillProgress,
        game_progress: progress
      }
    });

  } catch (error) {
    console.error('Error getting kid game analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get game analytics'
    });
  }
};

// ============================
// HELPER FUNCTIONS
// ============================

// Helper to get game by ID
const getGameByIdHelper = async (gameId) => {
  const games = await query(
    `SELECT g.*, 
            GROUP_CONCAT(DISTINCT es.name) as skill_names
     FROM games g
     LEFT JOIN game_skills_mapping gsm ON g.id = gsm.game_id
     LEFT JOIN educational_skills es ON gsm.skill_id = es.id
     WHERE g.id = ?
     GROUP BY g.id`,
    [gameId]
  );

  if (games.length === 0) return null;

  const game = games[0];

  // Get detailed skills
  const skills = await query(
    `SELECT es.*, gsm.strength_level
     FROM game_skills_mapping gsm
     JOIN educational_skills es ON gsm.skill_id = es.id
     WHERE gsm.game_id = ?`,
    [gameId]
  );

  return {
    ...game,
    metadata: game.metadata ? JSON.parse(game.metadata) : {},
    skill_names: game.skill_names ? game.skill_names.split(',') : [],
    skills: skills
  };
};

// Check achievements
const checkAchievements = async (identity, gameId, score, level) => {
  // Achievement logic based on score, level, etc.
  // This is a simplified version - expand as needed
  const achievements = [];

  // Example: Score-based achievement
  if (score >= 1000) {
    achievements.push({
      achievement_key: 'score_master_1000',
      achievement_name: 'Score Master 1000',
      description: 'Scored 1000 points in a single game',
      icon_emoji: '🏆',
      unlock_value: 1000,
      unlock_type: 'score',
      rarity: 'uncommon'
    });
  }

  // Level-based achievement
  if (level >= 10) {
    achievements.push({
      achievement_key: 'level_expert_10',
      achievement_name: 'Level Expert 10',
      description: 'Reached level 10',
      icon_emoji: '⭐',
      unlock_value: 10,
      unlock_type: 'level',
      rarity: 'common'
    });
  }

  // Save achievements if any unlocked
  if (achievements.length > 0) {
    for (const achievement of achievements) {
      // Check if already unlocked
      const existing = await query(
        `SELECT id FROM game_achievements 
         WHERE game_id = ? AND achievement_key = ? 
         AND (
           (user_id = ?) OR 
           (kid_profile_id = ?) OR 
           (family_member_id = ?)
         )`,
        [gameId, achievement.achievement_key,
          identity.user_id, identity.kid_profile_id, identity.family_member_id]
      );

      if (existing.length === 0) {
        await query(
          `INSERT INTO game_achievements (
            user_id, kid_profile_id, family_member_id,
            game_id, achievement_key, achievement_name,
            description, icon_emoji, unlock_value,
            unlock_type, current_progress, is_unlocked, unlocked_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
          [
            identity.user_id,
            identity.kid_profile_id,
            identity.family_member_id,
            gameId,
            achievement.achievement_key,
            achievement.achievement_name,
            achievement.description,
            achievement.icon_emoji,
            achievement.unlock_value,
            achievement.unlock_type,
            achievement.unlock_type === 'score' ? score : level,
          ]
        );
      }
    }
  }
};

// Update skill progress
const updateSkillProgress = async (identity, gameId, score, metrics) => {
  // Get skills for this game
  const skills = await query(
    `SELECT gsm.skill_id, gsm.strength_level, es.name
     FROM game_skills_mapping gsm
     JOIN educational_skills es ON gsm.skill_id = es.id
     WHERE gsm.game_id = ?`,
    [gameId]
  );

  for (const skill of skills) {
    // Calculate improvement (simplified - adjust based on your logic)
    const improvement = Math.min(10, Math.floor(score / 100));

    let progressQuery;
    let progressParams;

    if (identity.user_id) {
      progressQuery = 'SELECT * FROM kids_skill_progress WHERE user_id = ? AND skill_id = ?';
      progressParams = [identity.user_id, skill.skill_id];
    } else if (identity.kid_profile_id) {
      progressQuery = 'SELECT * FROM kids_skill_progress WHERE kid_profile_id = ? AND skill_id = ?';
      progressParams = [identity.kid_profile_id, skill.skill_id];
    } else {
      continue; // Family member kids might not have skill progress
    }

    const existingProgress = await query(progressQuery, progressParams);

    if (existingProgress.length > 0) {
      // Update existing progress
      const currentScore = existingProgress[0].current_score || 0;
      const newScore = currentScore + improvement;
      const improvementPct = ((newScore - (existingProgress[0].baseline_score || 0)) / 100) * 100;

      await query(
        `UPDATE kids_skill_progress 
         SET current_score = ?, improvement_percentage = ?, 
             games_played_count = games_played_count + 1,
             last_assessed_date = CURDATE(),
             updated_at = NOW()
         WHERE id = ?`,
        [newScore, improvementPct, existingProgress[0].id]
      );
    } else {
      // Create new progress record
      await query(
        `INSERT INTO kids_skill_progress (
          kid_profile_id, user_id, skill_id,
          baseline_score, current_score, improvement_percentage,
          games_played_count, last_assessed_date
        ) VALUES (?, ?, ?, ?, ?, ?, 1, CURDATE())`,
        [
          identity.kid_profile_id,
          identity.user_id,
          skill.skill_id,
          0,
          improvement,
          0
        ]
      );
    }
  }
};

module.exports = {
  // Game Management (Admin)
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,

  // Kid Game Play
  startGameSession,
  submitGameScore,
  saveGameProgress,
  loadGameProgress,
  getKidGameHistory,
  getAvailableGames,
  updateSessionActivity,

  // Parent Analytics
  getKidGameAnalytics,

  // Helper (for internal use)
  resolveKidIdentity
};