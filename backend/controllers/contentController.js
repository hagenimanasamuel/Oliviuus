const { query } = require("../config/dbConfig");

// Create new content
const createContent = async (req, res) => {
  const userId = req.user.id;

  try {
    const {
      // Basic info
      title,
      description,
      short_description,
      content_type,

      // Classification
      age_rating,
      primary_language,
      genre,
      categories,

      // Metadata
      duration,
      release_date,
      director,

      // Frontend fields that actually exist
      production_company,
      budget,
      subject,
      location,
      festival,

      // Series-specific
      total_seasons,
      episodes_per_season,
      episode_duration,

      // Live event specific
      event_date,
      event_location,
      expected_audience,

      // Rights and distribution
      license_type,
      regions,
      start_date,
      end_date,
      exclusive,
      downloadable,
      shareable,

      // Content classification
      content_warnings,
      languages,
      subtitles,

      // SEO fields
      meta_title,
      meta_description,
      keywords,
      canonical_url,

      // Publishing control
      scheduled_publish_at,
      featured,
      trending,
      featured_order,

      // Content quality
      content_quality,
      has_subtitles,
      has_dubbing

    } = req.body;

    // Validate required fields
    if (!title || !description || !content_type || !age_rating || !genre) {
      return res.status(400).json({
        error: "Missing required fields: title, description, content_type, age_rating, genre"
      });
    }

    // Generate slug from title
    const slug = generateSlug(title);

    // Start transaction
    await query('START TRANSACTION');

    // 1. Insert main content - WITH ALL FIELDS FROM YOUR TABLE
    const contentResult = await query(
      `INSERT INTO contents (
        title, slug, description, short_description, content_type, status, visibility,
        age_rating, primary_language, duration_minutes, release_date, director,
        production_company, budget, subject, location, festival,
        total_seasons, episodes_per_season, episode_duration_minutes,
        event_date, event_location, expected_audience,
        meta_title, meta_description, keywords, canonical_url,
        scheduled_publish_at, featured, trending, featured_order,
        content_quality, has_subtitles, has_dubbing,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, 'draft', 'private', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        description,
        short_description || description.substring(0, 150),
        content_type,
        age_rating,
        primary_language || 'en',
        duration ? parseInt(duration) : null,
        release_date || null,
        director || null,
        // Actual frontend fields
        production_company || null,
        budget ? parseFloat(budget) : null,
        subject || null,
        location || null,
        festival || null,
        // Series data
        total_seasons ? parseInt(total_seasons) : null,
        episodes_per_season ? parseInt(episodes_per_season) : null,
        episode_duration ? parseInt(episode_duration) : null,
        // Live event data
        event_date || null,
        event_location || null,
        expected_audience ? parseInt(expected_audience) : null,
        // SEO fields
        meta_title || null,
        meta_description || null,
        keywords ? JSON.stringify(keywords) : null,
        canonical_url || null,
        // Publishing control
        scheduled_publish_at || null,
        featured || false,
        trending || false,
        featured_order || 0,
        // Content quality
        content_quality || 'HD',
        has_subtitles || false,
        has_dubbing || false,
        userId,
        userId
      ]
    );

    const contentId = contentResult.insertId;

    // 2. Insert content rights
    if (license_type) {
      const actualStartDate = (license_type === 'perpetual') ? null : (start_date || new Date().toISOString().split('T')[0]);

      await query(
        `INSERT INTO content_rights (
          content_id, license_type, allowed_regions, start_date, end_date,
          exclusive, downloadable, shareable, commercial_use, georestricted,
          blocked_countries, license_fee, revenue_share_percentage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contentId,
          license_type,
          JSON.stringify(regions || []),
          actualStartDate,
          end_date || null,
          exclusive || false,
          downloadable || false,
          shareable || false,
          false, // commercial_use default
          false, // georestricted default
          JSON.stringify([]), // blocked_countries default
          null, // license_fee default
          null // revenue_share_percentage default
        ]
      );
    }

    // 3. Link genre
    const genreExists = await query('SELECT id FROM genres WHERE id = ? AND is_active = TRUE', [genre]);
    if (genreExists.length === 0) {
      await query('ROLLBACK');
      return res.status(400).json({
        error: `Invalid genre ID: ${genre}. Genre does not exist or is not active.`
      });
    }

    await query(
      'INSERT INTO content_genres (content_id, genre_id, is_primary) VALUES (?, ?, ?)',
      [contentId, genre, true]
    );

    // 4. Link categories
    if (categories && categories.length > 0) {
      const categoryIds = categories.map(id => parseInt(id)).filter(id => !isNaN(id));

      if (categoryIds.length > 0) {
        const placeholders = categoryIds.map(() => '?').join(',');
        const existingCategories = await query(
          `SELECT id FROM categories WHERE id IN (${placeholders}) AND is_active = TRUE`,
          categoryIds
        );

        const existingCategoryIds = existingCategories.map(cat => cat.id);
        const invalidCategories = categoryIds.filter(id => !existingCategoryIds.includes(id));

        if (invalidCategories.length > 0) {
          await query('ROLLBACK');
          return res.status(400).json({
            error: `Invalid category IDs: ${invalidCategories.join(', ')}. These categories do not exist or are not active.`
          });
        }

        const categoryValues = existingCategoryIds.map(category_id => [contentId, category_id]);
        await query(
          'INSERT INTO content_categories (content_id, category_id) VALUES ?',
          [categoryValues]
        );
      }
    }

    // 5. Insert content warnings
    if (content_warnings && content_warnings.length > 0) {
      const warningValues = content_warnings.map(warning_type => [
        contentId,
        warning_type,
        'moderate'
      ]);
      await query(
        'INSERT INTO content_warnings (content_id, warning_type, severity) VALUES ?',
        [warningValues]
      );
    }

    // 6. Insert available languages/subtitles
    const allLanguages = [...new Set([...(languages || []), ...(subtitles || [])])];
    if (allLanguages.length > 0) {
      const languageValues = allLanguages.map(language_code => [
        contentId,
        language_code,
        language_code === (primary_language || 'en')
      ]);
      await query(
        'INSERT INTO content_subtitles (content_id, language_code, is_default) VALUES ?',
        [languageValues]
      );
    }

    // Commit transaction
    await query('COMMIT');

    // Fetch the created content with all relations
    const content = await getContentById(contentId);

    res.status(201).json({
      success: true,
      message: 'Content created successfully with all data',
      content
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('❌ Error creating content:', error);

    res.status(500).json({
      error: 'Failed to create content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create content warnings for existing content
const createContentWarnings = async (req, res) => {
  const { contentId } = req.params;

  try {
    const { warnings } = req.body;

    if (!warnings || !Array.isArray(warnings)) {
      return res.status(400).json({
        error: "Warnings array is required"
      });
    }

    // Start transaction
    await query('START TRANSACTION');

    // Delete existing warnings first
    await query('DELETE FROM content_warnings WHERE content_id = ?', [contentId]);

    // Insert new warnings
    if (warnings.length > 0) {
      const warningValues = warnings.map(warning => [
        contentId,
        warning.warning_type,
        warning.severity || 'moderate'
      ]);
      
      await query(
        'INSERT INTO content_warnings (content_id, warning_type, severity) VALUES ?',
        [warningValues]
      );
    }

    // Commit transaction
    await query('COMMIT');

    res.json({
      success: true,
      message: 'Content warnings created successfully',
      warnings: warnings.length
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    
    res.status(500).json({
      error: 'Failed to create content warnings',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Create content rights for existing content
const createContentRights = async (req, res) => {
  const { contentId } = req.params;

  try {
    const {
      license_type,
      regions,
      start_date,
      end_date,
      exclusive,
      downloadable,
      shareable,
      commercial_use,
      georestricted
    } = req.body;

    if (!license_type) {
      return res.status(400).json({
        error: "License type is required"
      });
    }

    // Start transaction
    await query('START TRANSACTION');

    // Delete existing rights first
    await query('DELETE FROM content_rights WHERE content_id = ?', [contentId]);

    const actualStartDate = (license_type === 'perpetual') ? null : (start_date || new Date().toISOString().split('T')[0]);

    // Insert new rights
    await query(
      `INSERT INTO content_rights (
        content_id, license_type, allowed_regions, start_date, end_date,
        exclusive, downloadable, shareable, commercial_use, georestricted,
        blocked_countries, license_fee, revenue_share_percentage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contentId,
        license_type,
        JSON.stringify(regions || []),
        actualStartDate,
        end_date || null,
        exclusive || false,
        downloadable || false,
        shareable || false,
        commercial_use || false,
        georestricted || false,
        JSON.stringify([]), // blocked_countries default
        null, // license_fee default
        null // revenue_share_percentage default
      ]
    );

    // Commit transaction
    await query('COMMIT');

    res.json({
      success: true,
      message: 'Content rights created successfully'
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error creating content rights:', error);

    res.status(500).json({
      error: 'Failed to create content rights',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get content by ID with ALL relations from ALL tables
const getContentById = async (contentId) => {
  try {
    // Check if contentId is problematic
    if (contentId !== null && contentId !== undefined && typeof contentId.toString !== 'function') {
      // Try to fix it
      contentId = contentId.id || contentId.contentId || parseInt(contentId) || null;
    }

    // Get main content with ALL fields
    const contentRows = await query(
      `SELECT * FROM contents WHERE id = ?`,
      [parseInt(contentId)]  // Ensure it's a number
    );

    if (contentRows.length === 0) {
      return null;
    }

    const content = contentRows[0];

    // Get content rights with ALL fields
    const rightsRows = await query(
      `SELECT * FROM content_rights WHERE content_id = ?`,
      [parseInt(contentId)]
    );
    content.rights = rightsRows[0] || {};

    // Get genres
    const genreRows = await query(
      `SELECT g.*, cg.is_primary 
       FROM content_genres cg 
       JOIN genres g ON cg.genre_id = g.id 
       WHERE cg.content_id = ?`,
      [parseInt(contentId)]
    );
    content.genres = genreRows;

    // Get categories
    const categoryRows = await query(
      `SELECT c.* 
       FROM content_categories cc 
       JOIN categories c ON cc.category_id = c.id 
       WHERE cc.content_id = ?`,
      [parseInt(contentId)]
    );
    content.categories = categoryRows;

    // Get content warnings
    const warningRows = await query(
      `SELECT * FROM content_warnings WHERE content_id = ?`,
      [parseInt(contentId)]
    );
    content.content_warnings = warningRows;

    // Get subtitles/languages
    const subtitleRows = await query(
      `SELECT * FROM content_subtitles WHERE content_id = ?`,
      [parseInt(contentId)]
    );
    content.available_languages = subtitleRows;

    // Get media assets with ALL fields
    const mediaRows = await query(
      `SELECT * FROM media_assets 
       WHERE content_id = ? 
       ORDER BY asset_type, season_number, episode_number, created_at DESC`,
      [parseInt(contentId)]
    );

    // Generate public URLs and process JSON fields
    content.media_assets = mediaRows.map(asset => {
      let subtitleLanguages = [];
      let validationErrors = null;

      try {
        if (asset.subtitle_languages) {
          subtitleLanguages = JSON.parse(asset.subtitle_languages);
        }
      } catch (e) {
        subtitleLanguages = [];
      }

      try {
        if (asset.validation_errors) {
          validationErrors = JSON.parse(asset.validation_errors);
        }
      } catch (e) {
        validationErrors = null;
      }

      return {
        ...asset,
        url: asset.upload_status === 'completed'
          ? `https://pub-${process.env.R2_PUBLIC_URL_ID}.r2.dev/${asset.file_path}`
          : null,
        subtitle_languages: subtitleLanguages,
        validation_errors: validationErrors
      };
    });

    return content;

  } catch (error) {
    console.error('❌ Error in getContentById:', error);
    throw error;
  }
};

// Get all contents with pagination and ALL data
const getContents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const contentType = req.query.content_type;
    const featured = req.query.featured;
    const trending = req.query.trending;

    // Build WHERE clause dynamically
    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    if (status) {
      whereClause += ' AND status = ?';
      queryParams.push(status);
    }

    if (contentType) {
      whereClause += ' AND content_type = ?';
      queryParams.push(contentType);
    }

    if (featured !== undefined) {
      whereClause += ' AND featured = ?';
      queryParams.push(featured === 'true');
    }

    if (trending !== undefined) {
      whereClause += ' AND trending = ?';
      queryParams.push(trending === 'true');
    }

    // Get contents
    const contents = await query(
      `SELECT * FROM contents 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get ALL related data for all contents
    const contentIds = contents.map(content => content.id);

    if (contentIds.length > 0) {
      const placeholders = contentIds.map(() => '?').join(',');

      // Get media assets for all contents
      const mediaAssets = await query(
        `SELECT ma.*
         FROM media_assets ma 
         WHERE ma.content_id IN (${placeholders}) 
         ORDER BY ma.asset_type, ma.created_at DESC`,
        contentIds
      );

      // Get primary genres for all contents
      const primaryGenres = await query(
        `SELECT cg.content_id, g.* 
         FROM content_genres cg 
         JOIN genres g ON cg.genre_id = g.id 
         WHERE cg.content_id IN (${placeholders}) AND cg.is_primary = TRUE`,
        contentIds
      );

      // Group data by content_id
      const mediaByContent = {};
      const genreByContent = {};

      mediaAssets.forEach(asset => {
        if (!mediaByContent[asset.content_id]) {
          mediaByContent[asset.content_id] = [];
        }
        const assetWithUrl = {
          ...asset,
          url: asset.upload_status === 'completed'
            ? `https://pub-${process.env.R2_PUBLIC_URL_ID}.r2.dev/${asset.file_path}`
            : null,
          subtitle_languages: asset.subtitle_languages ? JSON.parse(asset.subtitle_languages) : []
        };
        mediaByContent[asset.content_id].push(assetWithUrl);
      });

      primaryGenres.forEach(genre => {
        genreByContent[genre.content_id] = genre;
      });

      // Attach all data to each content
      const contentsWithAllData = contents.map(content => ({
        ...content,
        media_assets: mediaByContent[content.id] || [],
        primary_genre: genreByContent[content.id] || null,
        keywords: content.keywords ? JSON.parse(content.keywords) : null
      }));

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM contents ${whereClause}`,
        queryParams
      );
      const total = countResult[0].total;

      res.json({
        success: true,
        contents: contentsWithAllData,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      res.json({
        success: true,
        contents: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch contents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update content with ALL fields
const updateContent = async (req, res) => {
  const userId = req.user.id;
  const { contentId } = req.params;

  try {
    const {
      title,
      description,
      short_description,
      age_rating,
      primary_language,
      genre,
      categories,
      duration,
      release_date,
      director,
      status,
      visibility,
      production_company,
      budget,
      subject,
      location,
      festival,
      total_seasons,
      episodes_per_season,
      episode_duration,
      event_date,
      event_location,
      expected_audience,
      meta_title,
      meta_description,
      keywords,
      canonical_url,
      scheduled_publish_at,
      featured,
      trending,
      featured_order,
      content_quality,
      has_subtitles,
      has_dubbing,
      view_count,
      like_count,
      share_count,
      average_rating,
      rating_count
    } = req.body;

    // Start transaction
    await query('START TRANSACTION');

    // Update main content with ALL fields
    await query(
      `UPDATE contents 
       SET title = ?, description = ?, short_description = ?, age_rating = ?, 
           primary_language = ?, duration_minutes = ?, release_date = ?, director = ?,
           status = ?, visibility = ?, production_company = ?, budget = ?, subject = ?,
           location = ?, festival = ?, total_seasons = ?, episodes_per_season = ?,
           episode_duration_minutes = ?, event_date = ?, event_location = ?,
           expected_audience = ?, meta_title = ?, meta_description = ?, keywords = ?,
           canonical_url = ?, scheduled_publish_at = ?, featured = ?, trending = ?,
           featured_order = ?, content_quality = ?, has_subtitles = ?, has_dubbing = ?,
           view_count = ?, like_count = ?, share_count = ?, average_rating = ?, rating_count = ?,
           updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        title,
        description,
        short_description,
        age_rating,
        primary_language,
        duration ? parseInt(duration) : null,
        release_date,
        director,
        status,
        visibility,
        production_company || null,
        budget ? parseFloat(budget) : null,
        subject || null,
        location || null,
        festival || null,
        total_seasons ? parseInt(total_seasons) : null,
        episodes_per_season ? parseInt(episodes_per_season) : null,
        episode_duration ? parseInt(episode_duration) : null,
        event_date || null,
        event_location || null,
        expected_audience ? parseInt(expected_audience) : null,
        meta_title || null,
        meta_description || null,
        keywords ? JSON.stringify(keywords) : null,
        canonical_url || null,
        scheduled_publish_at || null,
        featured || false,
        trending || false,
        featured_order || 0,
        content_quality || 'HD',
        has_subtitles || false,
        has_dubbing || false,
        view_count ? parseInt(view_count) : 0,
        like_count ? parseInt(like_count) : 0,
        share_count ? parseInt(share_count) : 0,
        average_rating ? parseFloat(average_rating) : 0.00,
        rating_count ? parseInt(rating_count) : 0,
        userId,
        contentId
      ]
    );

    // Update genre if provided
    if (genre) {
      await query(
        'UPDATE content_genres SET genre_id = ? WHERE content_id = ? AND is_primary = TRUE',
        [genre, contentId]
      );
    }

    // Update categories if provided
    if (categories) {
      // Delete existing categories
      await query('DELETE FROM content_categories WHERE content_id = ?', [contentId]);

      // Insert new categories
      if (categories.length > 0) {
        const categoryValues = categories.map(category_id => [contentId, category_id]);
        await query(
          'INSERT INTO content_categories (content_id, category_id) VALUES ?',
          [categoryValues]
        );
      }
    }

    // Commit transaction
    await query('COMMIT');

    // Fetch updated content
    const content = await getContentById(contentId);

    res.json({
      success: true,
      message: 'Content updated successfully',
      content
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');

    res.status(500).json({
      error: 'Failed to update content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Partial update content - ONLY updates provided fields
const updateContentPartial = async (req, res) => {
  const userId = req.user.id;
  const { contentId } = req.params;

  try {
    // Get only the fields that are actually provided
    const updateFields = req.body;

    // Validate content exists
    const contentExists = await query('SELECT id FROM contents WHERE id = ?', [contentId]);
    if (contentExists.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // If no fields provided, return early
    if (Object.keys(updateFields).length === 0) {
      const content = await getContentById(contentId);
      return res.json({
        success: true,
        message: 'No fields to update',
        content
      });
    }

    // Start transaction
    await query('START TRANSACTION');

    // Build dynamic UPDATE query based on provided fields only
    const allowedFields = [
      'title', 'description', 'short_description', 'status', 'visibility',
      'featured', 'trending', 'featured_order', 'content_quality',
      'has_subtitles', 'has_dubbing', 'age_rating', 'primary_language',
      'duration_minutes', 'release_date', 'director', 'production_company',
      'budget', 'subject', 'location', 'festival', 'total_seasons',
      'episodes_per_season', 'episode_duration_minutes', 'event_date',
      'event_location', 'expected_audience', 'meta_title', 'meta_description',
      'keywords', 'canonical_url', 'scheduled_publish_at'
    ];

    const setClauses = [];
    const values = [];

    // Only include fields that are provided in request
    Object.keys(updateFields).forEach(field => {
      if (allowedFields.includes(field) && updateFields[field] !== undefined) {
        setClauses.push(`${field} = ?`);

        // Handle special field types
        if (field === 'keywords' && updateFields[field]) {
          values.push(JSON.stringify(updateFields[field]));
        } else if (['duration_minutes', 'episode_duration_minutes', 'expected_audience', 'total_seasons', 'episodes_per_season'].includes(field)) {
          values.push(updateFields[field] ? parseInt(updateFields[field]) : null);
        } else if (field === 'budget') {
          values.push(updateFields[field] ? parseFloat(updateFields[field]) : null);
        } else {
          values.push(updateFields[field]);
        }
      }
    });

    // If no valid fields to update
    if (setClauses.length === 0) {
      await query('ROLLBACK');
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add updated_by and updated_at
    setClauses.push('updated_by = ?', 'updated_at = NOW()');
    values.push(userId, contentId);

    // Execute update - ONLY the provided fields
    const updateQuery = `UPDATE contents SET ${setClauses.join(', ')} WHERE id = ?`;
    await query(updateQuery, values);

    // Commit transaction
    await query('COMMIT');

    // Return updated content
    const updatedContent = await getContentById(contentId);

    res.json({
      success: true,
      message: 'Content updated successfully',
      content: updatedContent
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error in partial update:', error);

    res.status(500).json({
      error: 'Failed to update content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete content (already complete - deletes from all related tables)
const deleteContent = async (req, res) => {
  const { contentId } = req.params;

  try {
    // Start transaction
    await query('START TRANSACTION');

    // Delete from ALL related tables
    await query('DELETE FROM content_rights WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_genres WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_categories WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_warnings WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_subtitles WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_people WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_ratings WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_view_history WHERE content_id = ?', [contentId]);
    await query('DELETE FROM media_assets WHERE content_id = ?', [contentId]);
    await query('DELETE FROM media_asset_subtitles WHERE media_asset_id IN (SELECT id FROM media_assets WHERE content_id = ?)', [contentId]);
    await query('DELETE FROM person_awards WHERE content_id = ?', [contentId]);

    // Delete seasons and episodes for series
    const seasons = await query('SELECT id FROM seasons WHERE content_id = ?', [contentId]);
    const seasonIds = seasons.map(season => season.id);
    if (seasonIds.length > 0) {
      const placeholders = seasonIds.map(() => '?').join(',');
      await query(`DELETE FROM episodes WHERE season_id IN (${placeholders})`, seasonIds);
    }
    await query('DELETE FROM seasons WHERE content_id = ?', [contentId]);

    // Delete main content
    await query('DELETE FROM contents WHERE id = ?', [contentId]);

    // Commit transaction
    await query('COMMIT');

    res.json({
      success: true,
      message: 'Content and all related data deleted successfully'
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');

    res.status(500).json({
      error: 'Failed to delete content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Publish content
const publishContent = async (req, res) => {
  const { contentId } = req.params;

  try {
    await query(
      `UPDATE contents 
       SET status = 'published', published_at = NOW(), updated_at = NOW() 
       WHERE id = ?`,
      [contentId]
    );

    const content = await getContentById(contentId);

    res.json({
      success: true,
      message: 'Content published successfully',
      content
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to publish content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 255);
};

// Archive content
const archiveContent = async (req, res) => {
  const { contentId } = req.params;

  try {
    await query(
      `UPDATE contents 
       SET status = 'archived', updated_at = NOW() 
       WHERE id = ?`,
      [contentId]
    );

    const content = await getContentById(contentId);

    res.json({
      success: true,
      message: 'Content archived successfully',
      content
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to archive content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Duplicate content with ALL data
const duplicateContent = async (req, res) => {
  const userId = req.user.id;
  const { contentId } = req.params;

  try {
    // Get original content with ALL data
    const originalContent = await getContentById(contentId);
    if (!originalContent) {
      return res.status(404).json({
        error: "Content not found"
      });
    }

    // Start transaction
    await query('START TRANSACTION');

    // Generate new slug
    const newSlug = generateSlug(originalContent.title + ' copy');

    // Insert new content with ALL fields
    const contentResult = await query(
      `INSERT INTO contents (
        title, slug, description, short_description, content_type, status, visibility,
        age_rating, primary_language, duration_minutes, release_date, director,
        production_company, budget, subject, location, festival,
        total_seasons, episodes_per_season, episode_duration_minutes,
        event_date, event_location, expected_audience,
        meta_title, meta_description, keywords, canonical_url,
        scheduled_publish_at, featured, trending, featured_order,
        content_quality, has_subtitles, has_dubbing,
        view_count, like_count, share_count, average_rating, rating_count,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, 'draft', 'private', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        originalContent.title + ' (Copy)',
        newSlug,
        originalContent.description,
        originalContent.short_description,
        originalContent.content_type,
        originalContent.age_rating,
        originalContent.primary_language,
        originalContent.duration_minutes,
        originalContent.release_date,
        originalContent.director,
        originalContent.production_company,
        originalContent.budget,
        originalContent.subject,
        originalContent.location,
        originalContent.festival,
        originalContent.total_seasons,
        originalContent.episodes_per_season,
        originalContent.episode_duration_minutes,
        originalContent.event_date,
        originalContent.event_location,
        originalContent.expected_audience,
        originalContent.meta_title,
        originalContent.meta_description,
        originalContent.keywords,
        originalContent.canonical_url,
        originalContent.scheduled_publish_at,
        originalContent.featured,
        originalContent.trending,
        originalContent.featured_order,
        originalContent.content_quality,
        originalContent.has_subtitles,
        originalContent.has_dubbing,
        0, // Reset engagement metrics
        0,
        0,
        0.00,
        0,
        userId,
        userId
      ]
    );

    const newContentId = contentResult.insertId;

    // Copy content rights if they exist
    if (originalContent.rights && Object.keys(originalContent.rights).length > 0) {
      await query(
        `INSERT INTO content_rights (
          content_id, license_type, allowed_regions, start_date, end_date,
          exclusive, downloadable, shareable, commercial_use, georestricted,
          blocked_countries, license_fee, revenue_share_percentage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newContentId,
          originalContent.rights.license_type,
          originalContent.rights.allowed_regions,
          originalContent.rights.start_date,
          originalContent.rights.end_date,
          originalContent.rights.exclusive,
          originalContent.rights.downloadable,
          originalContent.rights.shareable,
          originalContent.rights.commercial_use || false,
          originalContent.rights.georestricted || false,
          originalContent.rights.blocked_countries || JSON.stringify([]),
          originalContent.rights.license_fee,
          originalContent.rights.revenue_share_percentage
        ]
      );
    }

    // Copy genres
    if (originalContent.genres && originalContent.genres.length > 0) {
      const genreValues = originalContent.genres.map(genre => [
        newContentId,
        genre.id,
        genre.is_primary
      ]);
      await query(
        'INSERT INTO content_genres (content_id, genre_id, is_primary) VALUES ?',
        [genreValues]
      );
    }

    // Copy categories
    if (originalContent.categories && originalContent.categories.length > 0) {
      const categoryValues = originalContent.categories.map(category => [
        newContentId,
        category.id
      ]);
      await query(
        'INSERT INTO content_categories (content_id, category_id) VALUES ?',
        [categoryValues]
      );
    }

    // Copy content warnings
    if (originalContent.content_warnings && originalContent.content_warnings.length > 0) {
      const warningValues = originalContent.content_warnings.map(warning => [
        newContentId,
        warning.warning_type,
        warning.severity
      ]);
      await query(
        'INSERT INTO content_warnings (content_id, warning_type, severity) VALUES ?',
        [warningValues]
      );
    }

    // Copy available languages
    if (originalContent.available_languages && originalContent.available_languages.length > 0) {
      const languageValues = originalContent.available_languages.map(lang => [
        newContentId,
        lang.language_code,
        lang.is_default
      ]);
      await query(
        'INSERT INTO content_subtitles (content_id, language_code, is_default) VALUES ?',
        [languageValues]
      );
    }

    // Commit transaction
    await query('COMMIT');

    // Fetch the duplicated content
    const newContent = await getContentById(newContentId);

    res.status(201).json({
      success: true,
      message: 'Content duplicated successfully',
      content: newContent
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');

    res.status(500).json({
      error: 'Failed to duplicate content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update content settings
const updateContentSettings = async (req, res) => {
  const userId = req.user.id;
  const { contentId } = req.params;

  // === FIX: Ensure contentId is a proper number ===
  // If contentId is an object, try to extract the ID
  if (contentId && typeof contentId === 'object') {
    console.warn('ContentId is object, attempting to extract:', contentId);
    contentId = contentId.id || contentId.contentId || contentId[0];
  }

  // Parse to integer
  const parsedContentId = parseInt(contentId);
  if (isNaN(parsedContentId)) {
    return res.status(400).json({
      error: 'Invalid content ID',
      details: `Content ID must be a number, got: ${contentId}`
    });
  }

  // Use the parsed contentId everywhere
  contentId = parsedContentId;

  try {
    const {
      // Basic info
      title,
      description,
      short_description,
      content_type,

      // Publishing control
      status,
      visibility,
      featured,
      trending,
      featured_order,
      scheduled_publish_at,

      // Classification
      age_rating,
      primary_language,

      // Content quality
      content_quality,
      has_subtitles,
      has_dubbing,

      // Metadata
      duration_minutes,
      release_date,
      director,

      // Additional fields
      production_company,
      budget,
      subject,
      location,
      festival,

      // Series-specific
      total_seasons,
      episodes_per_season,
      episode_duration_minutes,

      // Live event specific
      event_date,
      event_location,
      expected_audience,

      // SEO
      meta_title,
      meta_description,
      keywords,
      canonical_url,

      // Content warnings and languages (handle separately)
      content_warnings,
      languages,
      subtitles

    } = req.body;

    // === ADD DEBUGGING HERE ===
    console.log('=== DEBUG updateContentSettings START ===');
    console.log('contentId:', contentId, 'type:', typeof contentId);
    console.log('userId:', userId, 'type:', typeof userId);
    console.log('req.body keys:', Object.keys(req.body));

    // Debug each parameter individually
    const debugParams = {
      title, description, short_description, content_type,
      status, visibility, featured, trending, featured_order, scheduled_publish_at,
      age_rating, primary_language, content_quality, has_subtitles, has_dubbing,
      duration_minutes, release_date, director, production_company, budget,
      subject, location, festival, total_seasons, episodes_per_season,
      episode_duration_minutes, event_date, event_location, expected_audience,
      meta_title, meta_description, keywords, canonical_url,
      content_warnings, languages, subtitles
    };

    console.log('=== PARAMETER TYPES AND VALUES ===');
    Object.keys(debugParams).forEach(key => {
      const value = debugParams[key];
      console.log(`${key}:`, value, '| type:', typeof value, '| has toString:', typeof value?.toString === 'function');

      // Check for problematic values
      if (value !== null && value !== undefined && typeof value.toString !== 'function') {
        console.error(`❌ PROBLEMATIC PARAMETER: ${key} =`, value);
      }
    });
    console.log('=== DEBUG updateContentSettings END ===');
    // === END DEBUGGING ===

    // Start transaction
    await query('START TRANSACTION');

    // FIXED: Handle keywords properly - ensure it's a string or null
    let keywordsValue = null;
    if (keywords) {
      if (Array.isArray(keywords)) {
        keywordsValue = JSON.stringify(keywords);
      } else if (typeof keywords === 'string') {
        // If it's already a string, use it directly
        keywordsValue = keywords.includes('[') ? keywords : JSON.stringify(keywords.split(',').map(k => k.trim()).filter(k => k));
      }
    }

    // === ADD DEBUGGING FOR THE FINAL QUERY PARAMETERS ===
    console.log('=== DEBUG QUERY PARAMETERS START ===');

    const updateParams = [
      title || null,
      description || null,
      short_description || null,
      content_type || 'movie',
      status || 'draft',
      visibility || 'private',
      age_rating || null,
      primary_language || 'en',
      duration_minutes ? parseInt(duration_minutes) : null,
      release_date || null,
      director || null,
      production_company || null,
      budget ? parseFloat(budget) : null,
      subject || null,
      location || null,
      festival || null,
      total_seasons ? parseInt(total_seasons) : null,
      episodes_per_season ? parseInt(episodes_per_season) : null,
      episode_duration_minutes ? parseInt(episode_duration_minutes) : null,
      event_date || null,
      event_location || null,
      expected_audience ? parseInt(expected_audience) : null,
      meta_title || null,
      meta_description || null,
      keywordsValue,
      canonical_url || null,
      scheduled_publish_at || null,
      Boolean(featured),
      Boolean(trending),
      parseInt(featured_order) || 0,
      content_quality || 'HD',
      Boolean(has_subtitles),
      Boolean(has_dubbing),
      userId,
      parseInt(contentId)
    ];

    console.log('Final updateParams array length:', updateParams.length);
    updateParams.forEach((param, index) => {
      console.log(`Param[${index}]:`, param, '| type:', typeof param, '| has toString:', typeof param?.toString === 'function');

      if (param !== null && param !== undefined && typeof param.toString !== 'function') {
        console.error(`❌ PROBLEMATIC QUERY PARAM at index ${index}:`, param);
      }
    });
    console.log('=== DEBUG QUERY PARAMETERS END ===');

    // FIXED: Update main content with ALL fields - using proper parameter handling
    const updateQuery = `
      UPDATE contents 
      SET 
        title = ?, 
        description = ?, 
        short_description = ?, 
        content_type = ?,
        status = ?, 
        visibility = ?, 
        age_rating = ?, 
        primary_language = ?,
        duration_minutes = ?, 
        release_date = ?, 
        director = ?,
        production_company = ?, 
        budget = ?, 
        subject = ?, 
        location = ?, 
        festival = ?,
        total_seasons = ?, 
        episodes_per_season = ?, 
        episode_duration_minutes = ?,
        event_date = ?, 
        event_location = ?, 
        expected_audience = ?,
        meta_title = ?, 
        meta_description = ?, 
        keywords = ?,
        canonical_url = ?,
        scheduled_publish_at = ?, 
        featured = ?, 
        trending = ?, 
        featured_order = ?,
        content_quality = ?, 
        has_subtitles = ?, 
        has_dubbing = ?,
        updated_by = ?, 
        updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateQuery, updateParams);

    // FIXED: Handle content warnings if provided - USE SEPARATE INSERTS
    if (content_warnings && Array.isArray(content_warnings)) {
      // Delete existing warnings
      await query('DELETE FROM content_warnings WHERE content_id = ?', [contentId]);

      // Insert new warnings - FIXED: Use individual inserts instead of batch insert
      if (content_warnings.length > 0 && content_warnings[0] !== 'None') {
        for (const warning of content_warnings) {
          const warningType = typeof warning === 'string' ? warning : warning.warning_type;
          if (warningType && warningType !== 'None') {
            await query(
              'INSERT INTO content_warnings (content_id, warning_type, severity) VALUES (?, ?, ?)',
              [parseInt(contentId), warningType, 'moderate']
            );
          }
        }
      }
    }

    // FIXED: Handle languages/subtitles if provided - USE SEPARATE INSERTS
    if (languages && Array.isArray(languages)) {
      // Delete existing languages
      await query('DELETE FROM content_subtitles WHERE content_id = ?', [contentId]);

      // Insert new languages - FIXED: Use individual inserts instead of batch insert
      if (languages.length > 0) {
        for (const language_code of languages) {
          if (language_code) {
            const isDefault = language_code === (primary_language || 'en');
            await query(
              'INSERT INTO content_subtitles (content_id, language_code, is_default) VALUES (?, ?, ?)',
              [parseInt(contentId), language_code, isDefault]
            );
          }
        }
      }
    }

    // Commit transaction
    await query('COMMIT');

    // Fetch updated content
    const updatedContent = await getContentById(contentId);

    res.json({
      success: true,
      message: 'Content settings updated successfully',
      content: updatedContent
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('❌ Error updating content settings:', error);

    res.status(500).json({
      error: 'Failed to update content settings',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update content rights with ALL fields
const updateContentRights = async (req, res) => {
  const userId = req.user.id;
  const { contentId } = req.params;

  try {
    const {
      license_type,
      exclusive,
      downloadable,
      shareable,
      start_date,
      end_date,
      allowed_regions,
      license_fee,
      revenue_share_percentage,
      commercial_use,
      georestricted,
      blocked_countries
    } = req.body;

    // Start transaction
    await query('START TRANSACTION');

    // Check if rights record exists
    const existingRights = await query(
      'SELECT * FROM content_rights WHERE content_id = ?',
      [contentId]
    );

    if (existingRights.length > 0) {
      // Update existing rights
      await query(
        `UPDATE content_rights 
         SET license_type = ?, exclusive = ?, downloadable = ?, shareable = ?,
             start_date = ?, end_date = ?, allowed_regions = ?,
             license_fee = ?, revenue_share_percentage = ?,
             commercial_use = ?, georestricted = ?, blocked_countries = ?, updated_at = NOW()
         WHERE content_id = ?`,
        [
          license_type,
          exclusive,
          downloadable,
          shareable,
          start_date || null,
          end_date || null,
          JSON.stringify(allowed_regions || []),
          license_fee ? parseFloat(license_fee) : null,
          revenue_share_percentage ? parseFloat(revenue_share_percentage) : null,
          commercial_use || false,
          georestricted || false,
          JSON.stringify(blocked_countries || []),
          contentId
        ]
      );
    } else {
      // Insert new rights record
      await query(
        `INSERT INTO content_rights (
          content_id, license_type, exclusive, downloadable, shareable,
          start_date, end_date, allowed_regions, license_fee, revenue_share_percentage,
          commercial_use, georestricted, blocked_countries
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contentId,
          license_type,
          exclusive,
          downloadable,
          shareable,
          start_date || null,
          end_date || null,
          JSON.stringify(allowed_regions || []),
          license_fee ? parseFloat(license_fee) : null,
          revenue_share_percentage ? parseFloat(revenue_share_percentage) : null,
          commercial_use || false,
          georestricted || false,
          JSON.stringify(blocked_countries || [])
        ]
      );
    }

    // Commit transaction
    await query('COMMIT');

    // Fetch updated content with rights
    const content = await getContentById(contentId);

    res.json({
      success: true,
      message: 'Content rights updated successfully',
      content
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error updating content rights:', error);

    res.status(500).json({
      error: 'Failed to update content rights',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


module.exports = {
  createContent,
  createContentRights,
  createContentWarnings,
  getContents,
  getContentById,
  updateContent,
  updateContentPartial,
  deleteContent,
  publishContent,
  archiveContent,
  duplicateContent,
  updateContentSettings,
  updateContentRights,
};