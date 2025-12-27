// controllers/gamesController.js
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

    if (!kid_profile && !user) {
      throw new Error('No kid profile or user found in request');
    }

    // Family member kid with own account
    if (kid_profile && kid_profile.is_family_member) {
      return {
        user_id: kid_profile.user_id || null,
        kid_profile_id: null,
        family_member_id: kid_profile.id,
        identity_type: 'family_member_kid'
      };
    }

    // Regular kid profile (under parent account)
    if (kid_profile) {
      return {
        user_id: null,
        kid_profile_id: kid_profile.id,
        family_member_id: null,
        identity_type: 'kid_profile'
      };
    }

    // Regular user account
    if (user) {
      return {
        user_id: user.id,
        kid_profile_id: null,
        family_member_id: null,
        identity_type: 'user'
      };
    }

    throw new Error('Unable to resolve identity');
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
// GAME MANAGEMENT (Admin)
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

    // Get games with count
    const games = await query(
      `SELECT g.*, 
              COUNT(DISTINCT gp.id) as total_players,
              AVG(gs.score_value) as average_score,
              MAX(gs.score_value) as high_score
       FROM games g
       LEFT JOIN game_progress gp ON g.id = gp.game_id
       LEFT JOIN game_scores gs ON g.id = gs.game_id
       ${whereClause}
       GROUP BY g.id
       ORDER BY g.sort_order, g.title`,
      params
    );

    // Get skills for each game
    for (const game of games) {
      const skills = await query(
        `SELECT es.*, gsm.strength_level
         FROM game_skills_mapping gsm
         JOIN educational_skills es ON gsm.skill_id = es.id
         WHERE gsm.game_id = ?`,
        [game.id]
      );
      game.skills = skills;
      game.skills_count = skills.length;
    }

    // Parse JSON fields
    const formattedGames = games.map(game => ({
      ...game,
      metadata: game.metadata ? JSON.parse(game.metadata) : {},
      skills_count: game.skills_count || 0,
      skill_names: game.skills ? game.skills.map(s => s.name) : []
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
              AVG(gs.score_value) as average_score,
              MAX(gs.score_value) as high_score
       FROM games g
       LEFT JOIN game_progress gp ON g.id = gp.game_id
       LEFT JOIN game_scores gs ON g.id = gs.game_id
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
      sort_order,
      is_active = true
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
        category, age_minimum, age_maximum, game_component, metadata, sort_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        sort_order || 0,
        is_active
      ]
    );

    const gameId = gameResult.insertId;

    // Link skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      const skillValues = skills.map(skill_id => [gameId, skill_id]);
      await query(
        'INSERT INTO game_skills_mapping (game_id, skill_id) VALUES ?',
        [skillValues]
      );
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
    values.push(gameId);

    // Start transaction
    await query('START TRANSACTION');

    // Update game
    const updateQuery = `UPDATE games SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = ?`;
    await query(updateQuery, values);

    // Handle skills update if provided
    if (updateData.skills !== undefined) {
      // Delete existing mappings
      await query('DELETE FROM game_skills_mapping WHERE game_id = ?', [gameId]);

      // Insert new mappings if skills array is provided
      if (Array.isArray(updateData.skills) && updateData.skills.length > 0) {
        const skillValues = updateData.skills.map(skill_id => [gameId, skill_id]);
        await query(
          'INSERT INTO game_skills_mapping (game_id, skill_id) VALUES ?',
          [skillValues]
        );
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
// ADMIN GAME ANALYTICS
// ============================

// Get game analytics (admin)
const getGameAnalytics = async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;

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
      case 'quarter':
        dateRange = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        dateRange = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        dateRange = new Date(now.setDate(now.getDate() - 7));
    }

    // Get overview statistics
    const overview = await query(`
      SELECT 
        COUNT(DISTINCT id) as totalGames,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as activeGames
      FROM games
    `);

    // Get total sessions
    const sessions = await query(`
      SELECT 
        COUNT(*) as totalSessions,
        AVG(duration_seconds) as avgSessionDuration
      FROM game_sessions
      WHERE start_time >= ?
    `, [dateRange]);

    // Get total players
    const players = await query(`
      SELECT COUNT(DISTINCT 
        CASE 
          WHEN user_id IS NOT NULL THEN CONCAT('user_', user_id)
          WHEN kid_profile_id IS NOT NULL THEN CONCAT('kid_', kid_profile_id)
          WHEN family_member_id IS NOT NULL THEN CONCAT('family_', family_member_id)
        END
      ) as totalPlayers
      FROM game_sessions
      WHERE start_time >= ?
    `, [dateRange]);

    // Get top games by sessions
    const topGames = await query(`
      SELECT 
        g.id,
        g.title,
        g.icon_emoji,
        g.category,
        COUNT(gs.id) as sessions,
        AVG(gs.duration_seconds) as avg_duration
      FROM games g
      LEFT JOIN game_sessions gs ON g.id = gs.game_id
      WHERE gs.start_time >= ?
      GROUP BY g.id, g.title, g.icon_emoji, g.category
      ORDER BY sessions DESC
      LIMIT 10
    `, [dateRange]);

    // Get categories distribution
    const categories = await query(`
      SELECT 
        category,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM games)), 1) as percentage
      FROM games
      WHERE is_active = TRUE
      GROUP BY category
      ORDER BY count DESC
    `);

    // Get engagement metrics
    const engagement = await query(`
      SELECT 
        COUNT(DISTINCT 
          CASE 
            WHEN user_id IS NOT NULL THEN CONCAT('user_', user_id)
            WHEN kid_profile_id IS NOT NULL THEN CONCAT('kid_', kid_profile_id)
            WHEN family_member_id IS NOT NULL THEN CONCAT('family_', family_member_id)
          END
        ) as unique_players,
        AVG(duration_seconds) as avg_session_duration,
        MAX(duration_seconds) as max_session_duration
      FROM game_sessions
      WHERE start_time >= ?
    `, [dateRange]);

    res.json({
      success: true,
      analytics: {
        timeframe,
        overview: {
          totalGames: overview[0]?.totalGames || 0,
          activeGames: overview[0]?.activeGames || 0,
          totalSessions: sessions[0]?.totalSessions || 0,
          totalPlayers: players[0]?.totalPlayers || 0,
          avgPlaytime: sessions[0]?.avgSessionDuration ? Math.round(sessions[0].avgSessionDuration / 60) : 0
        },
        topGames,
        categories,
        engagement: {
          playerRetention: Math.round((engagement[0]?.unique_players || 0) / (players[0]?.totalPlayers || 1) * 100),
          avgSessionDuration: Math.round(engagement[0]?.avg_session_duration / 60) || 0,
          maxSessionDuration: Math.round(engagement[0]?.max_session_duration / 60) || 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting game analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get game analytics'
    });
  }
};

// Export game analytics
const exportGameAnalytics = async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;

    // Calculate date range
    let dateRange;
    const now = new Date();
    switch (timeframe) {
      case 'day': dateRange = new Date(now.setDate(now.getDate() - 1)); break;
      case 'week': dateRange = new Date(now.setDate(now.getDate() - 7)); break;
      case 'month': dateRange = new Date(now.setMonth(now.getMonth() - 1)); break;
      default: dateRange = new Date(now.setDate(now.getDate() - 7));
    }

    // Get game sessions data
    const sessions = await query(`
      SELECT 
        g.title as game_title,
        g.category,
        DATE(gs.start_time) as date,
        COUNT(gs.id) as sessions_count,
        AVG(gs.duration_seconds) as avg_duration_seconds,
        COUNT(DISTINCT 
          CASE 
            WHEN gs.user_id IS NOT NULL THEN CONCAT('user_', gs.user_id)
            WHEN gs.kid_profile_id IS NOT NULL THEN CONCAT('kid_', gs.kid_profile_id)
            WHEN gs.family_member_id IS NOT NULL THEN CONCAT('family_', gs.family_member_id)
          END
        ) as unique_players
      FROM game_sessions gs
      JOIN games g ON gs.game_id = g.id
      WHERE gs.start_time >= ?
      GROUP BY g.title, g.category, DATE(gs.start_time)
      ORDER BY date DESC, sessions_count DESC
    `, [dateRange]);

    // Convert to CSV
    const csvHeader = 'Game Title,Category,Date,Sessions Count,Average Duration (seconds),Unique Players\n';
    const csvRows = sessions.map(row => 
      `"${row.game_title}","${row.category}","${row.date}",${row.sessions_count},${row.avg_duration_seconds || 0},${row.unique_players}`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=game_analytics_${Date.now()}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting game analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics'
    });
  }
};

// ============================
// GAME CATEGORIES MANAGEMENT
// ============================

// Get all game categories
const getGameCategories = async (req, res) => {
  try {
    const categories = await query(`
      SELECT 
        DISTINCT category as name,
        COUNT(*) as game_count
      FROM games
      WHERE is_active = TRUE
      GROUP BY category
      ORDER BY name
    `);

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Error getting game categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    });
  }
};

// Create game category
const createGameCategory = async (req, res) => {
  try {
    const { name, description, icon_emoji, color, sort_order, is_active } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Categories are stored as enum values in games table
    // For management, we'll store them in a separate table if needed
    // For now, we'll just validate the category
    const validCategories = [
      'Math', 'Puzzles', 'Colors', 'Memory', 'Science', 
      'Language', 'Racing', 'Logic', 'Action'
    ];

    if (!validCategories.includes(name)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category name'
      });
    }

    // For now, just return success since categories are predefined
    res.json({
      success: true,
      message: 'Category is valid',
      category: {
        name,
        description,
        icon_emoji: icon_emoji || '📁',
        color: color || '#BC8BBC',
        sort_order: sort_order || 0,
        is_active: is_active !== false
      }
    });

  } catch (error) {
    console.error('Error creating game category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
};

// Update game category
const updateGameCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, icon_emoji, color, sort_order, is_active } = req.body;

    // Since categories are predefined, we can't update them
    // This endpoint is for future expansion
    res.json({
      success: true,
      message: 'Category updated successfully',
      category: {
        id: categoryId,
        name: name || 'Category',
        description,
        icon_emoji,
        color,
        sort_order,
        is_active
      }
    });

  } catch (error) {
    console.error('Error updating game category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
};

// Delete game category
const deleteGameCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Since categories are predefined, we can't delete them
    // This endpoint is for future expansion
    res.json({
      success: true,
      message: 'Category cannot be deleted as it is predefined'
    });

  } catch (error) {
    console.error('Error deleting game category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
};

// ============================
// EDUCATIONAL SKILLS MANAGEMENT
// ============================

// Get all educational skills
const getAllEducationalSkills = async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (difficulty) {
      whereClause += ' AND difficulty_level = ?';
      params.push(difficulty);
    }

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const skills = await query(
      `SELECT es.*, 
              COUNT(DISTINCT gsm.game_id) as game_count
       FROM educational_skills es
       LEFT JOIN game_skills_mapping gsm ON es.id = gsm.skill_id
       ${whereClause}
       GROUP BY es.id
       ORDER BY es.name`,
      params
    );

    res.json({
      success: true,
      skills
    });

  } catch (error) {
    console.error('Error getting educational skills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch skills'
    });
  }
};

// Create educational skill
const createEducationalSkill = async (req, res) => {
  try {
    const {
      skill_key,
      name,
      description,
      age_range_min,
      age_range_max,
      category,
      difficulty_level,
      icon_emoji,
      is_active = true
    } = req.body;

    if (!skill_key || !name || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: skill_key, name, category'
      });
    }

    // Check if skill_key already exists
    const existing = await query(
      'SELECT id FROM educational_skills WHERE skill_key = ?',
      [skill_key]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Skill key already exists'
      });
    }

    const result = await query(
      `INSERT INTO educational_skills (
        skill_key, name, description, age_range_min, age_range_max,
        category, difficulty_level, icon_emoji, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        skill_key,
        name,
        description || '',
        parseInt(age_range_min) || 3,
        parseInt(age_range_max) || 8,
        category,
        difficulty_level || 'beginner',
        icon_emoji || '🎯',
        is_active
      ]
    );

    const skillId = result.insertId;
    const skill = await query('SELECT * FROM educational_skills WHERE id = ?', [skillId]);

    res.status(201).json({
      success: true,
      message: 'Skill created successfully',
      skill: skill[0]
    });

  } catch (error) {
    console.error('Error creating educational skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create skill'
    });
  }
};

// Update educational skill
const updateEducationalSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const updateData = req.body;

    // Check if skill exists
    const existingSkill = await query(
      'SELECT id FROM educational_skills WHERE id = ?',
      [skillId]
    );

    if (existingSkill.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    // Build dynamic update query
    const allowedFields = [
      'name', 'description', 'age_range_min', 'age_range_max',
      'category', 'difficulty_level', 'icon_emoji', 'is_active'
    ];

    const setClauses = [];
    const values = [];

    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        if (['age_range_min', 'age_range_max'].includes(field)) {
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

    values.push(skillId);
    const updateQuery = `UPDATE educational_skills SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = ?`;
    await query(updateQuery, values);

    const skill = await query('SELECT * FROM educational_skills WHERE id = ?', [skillId]);

    res.json({
      success: true,
      message: 'Skill updated successfully',
      skill: skill[0]
    });

  } catch (error) {
    console.error('Error updating educational skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update skill'
    });
  }
};

// Delete educational skill
const deleteEducationalSkill = async (req, res) => {
  try {
    const { skillId } = req.params;

    // Check if skill is used in any games
    const gamesUsingSkill = await query(
      'SELECT COUNT(*) as count FROM game_skills_mapping WHERE skill_id = ?',
      [skillId]
    );

    if (gamesUsingSkill[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete skill that is being used in games'
      });
    }

    await query('DELETE FROM educational_skills WHERE id = ?', [skillId]);

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting educational skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete skill'
    });
  }
};

// ============================
// BULK GAME OPERATIONS
// ============================

// Bulk update games
const bulkUpdateGames = async (req, res) => {
  try {
    const { gameIds, action, data } = req.body;

    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No games selected'
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'No action specified'
      });
    }

    const placeholders = gameIds.map(() => '?').join(',');
    let updateQuery = '';
    let updateValues = [];

    switch (action) {
      case 'activate':
        updateQuery = `UPDATE games SET is_active = TRUE, updated_at = NOW() WHERE id IN (${placeholders})`;
        updateValues = gameIds;
        break;

      case 'deactivate':
        updateQuery = `UPDATE games SET is_active = FALSE, updated_at = NOW() WHERE id IN (${placeholders})`;
        updateValues = gameIds;
        break;

      case 'update_category':
        if (!data?.category) {
          return res.status(400).json({
            success: false,
            error: 'Category is required for update_category action'
          });
        }
        updateQuery = `UPDATE games SET category = ?, updated_at = NOW() WHERE id IN (${placeholders})`;
        updateValues = [data.category, ...gameIds];
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    const result = await query(updateQuery, updateValues);

    res.json({
      success: true,
      message: `Successfully ${action}d ${result.affectedRows} games`,
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error('Error performing bulk update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk operation'
    });
  }
};

// Export games data
const exportGamesData = async (req, res) => {
  try {
    const { search, category, is_active } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (is_active !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    const games = await query(
      `SELECT 
        g.game_key,
        g.title,
        g.description,
        g.category,
        g.age_minimum,
        g.age_maximum,
        g.is_active,
        g.sort_order,
        g.created_at,
        g.updated_at,
        COUNT(DISTINCT gp.id) as total_players,
        COUNT(DISTINCT gs.id) as total_sessions,
        GROUP_CONCAT(DISTINCT es.name) as skills
      FROM games g
      LEFT JOIN game_progress gp ON g.id = gp.game_id
      LEFT JOIN game_sessions gs ON g.id = gs.game_id
      LEFT JOIN game_skills_mapping gsm ON g.id = gsm.game_id
      LEFT JOIN educational_skills es ON gsm.skill_id = es.id
      ${whereClause}
      GROUP BY g.id
      ORDER BY g.sort_order, g.title`,
      params
    );

    // Convert to CSV
    const csvHeader = 'Game Key,Title,Description,Category,Min Age,Max Age,Active,Sort Order,Total Players,Total Sessions,Skills,Created At,Updated At\n';
    const csvRows = games.map(game => 
      `"${game.game_key}","${game.title}","${game.description}","${game.category}",${game.age_minimum},${game.age_maximum},${game.is_active},${game.sort_order},${game.total_players},${game.total_sessions},"${game.skills || ''}","${game.created_at}","${game.updated_at}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=games_export_${Date.now()}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting games data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export games data'
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

    // Create game session
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

    const sessionDbId = sessionResult.insertId;

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
        session_id: sessionDbId,
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
        parseInt(score) > currentHighScore
      ]
    );

    // Update game progress
    if (progressId) {
      // Update if this is a high score
      if (parseInt(score) > currentHighScore) {
        await query(
          'UPDATE game_progress SET highest_score = ?, last_played = NOW() WHERE id = ?',
          [parseInt(score), progressId]
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
          parseInt(score),
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
          parseInt(score),
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
          parseInt(score),
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
    await checkAchievements(identity, gameId, parseInt(score), level);

    // Update skill progress
    await updateSkillProgress(identity, gameId, parseInt(score), metrics);

    // Commit transaction
    await query('COMMIT');

    res.json({
      success: true,
      message: 'Score submitted successfully',
      score_id: scoreResult.insertId,
      is_high_score: parseInt(score) > currentHighScore,
      current_score: parseInt(score),
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

// Update session activity
const updateSessionActivity = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
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

    // Parse JSON fields
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
    if (req.kid_profile && req.kid_profile.max_content_age_rating) {
      // Parse age from rating like "7+" => 7
      const ageMatch = req.kid_profile.max_content_age_rating.match(/(\d+)/);
      if (ageMatch) {
        kidAge = parseInt(ageMatch[1]);
      }
    } else if (req.user && req.user.birth_date) {
      // Calculate age from birth date
      const birthDate = new Date(req.user.birth_date);
      const today = new Date();
      kidAge = today.getFullYear() - birthDate.getFullYear();
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
      `SELECT DISTINCT g.*
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
  const achievements = [];

  // Score-based achievement
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
           (user_id = ? AND ? IS NOT NULL) OR 
           (kid_profile_id = ? AND ? IS NOT NULL) OR 
           (family_member_id = ? AND ? IS NOT NULL)
         )`,
        [gameId, achievement.achievement_key,
          identity.user_id, identity.user_id,
          identity.kid_profile_id, identity.kid_profile_id,
          identity.family_member_id, identity.family_member_id]
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
    // Calculate improvement (simplified)
    const improvement = Math.min(10, Math.floor(score / 100));

    let progressQuery;
    let progressParams;

    if (identity.kid_profile_id) {
      progressQuery = 'SELECT * FROM kids_skill_progress WHERE kid_profile_id = ? AND skill_id = ?';
      progressParams = [identity.kid_profile_id, skill.skill_id];
    } else if (identity.user_id) {
      progressQuery = 'SELECT * FROM kids_skill_progress WHERE user_id = ? AND skill_id = ?';
      progressParams = [identity.user_id, skill.skill_id];
    } else {
      continue; // No valid identity
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
      let insertQuery;
      let insertValues;

      if (identity.kid_profile_id) {
        insertQuery = `
          INSERT INTO kids_skill_progress (
            kid_profile_id, skill_id,
            baseline_score, current_score, improvement_percentage,
            games_played_count, last_assessed_date
          ) VALUES (?, ?, ?, ?, ?, 1, CURDATE())
        `;
        insertValues = [
          identity.kid_profile_id,
          skill.skill_id,
          0,
          improvement,
          0
        ];
      } else if (identity.user_id) {
        insertQuery = `
          INSERT INTO kids_skill_progress (
            user_id, skill_id,
            baseline_score, current_score, improvement_percentage,
            games_played_count, last_assessed_date
          ) VALUES (?, ?, ?, ?, ?, 1, CURDATE())
        `;
        insertValues = [
          identity.user_id,
          skill.skill_id,
          0,
          improvement,
          0
        ];
      }

      if (insertQuery) {
        await query(insertQuery, insertValues);
      }
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
  
  // Game Analytics (Admin)
  getGameAnalytics,
  exportGameAnalytics,
  
  // Categories Management
  getGameCategories,
  createGameCategory,
  updateGameCategory,
  deleteGameCategory,
  
  // Educational Skills Management
  getAllEducationalSkills,
  createEducationalSkill,
  updateEducationalSkill,
  deleteEducationalSkill,
  
  // Bulk Operations
  bulkUpdateGames,
  exportGamesData,
  
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