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
      subtitles

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

    // 1. Insert main content - WITH ACTUAL FRONTEND FIELDS
    const contentResult = await query(
      `INSERT INTO contents (
        title, slug, description, short_description, content_type, status, visibility,
        age_rating, primary_language, duration_minutes, release_date, director,
        production_company, budget, subject, location, festival,
        total_seasons, episodes_per_season, episode_duration_minutes,
        event_date, event_location, expected_audience,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, 'draft', 'private', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          exclusive, downloadable, shareable
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contentId,
          license_type,
          JSON.stringify(regions || []),
          actualStartDate,
          end_date || null,
          exclusive || false,
          downloadable || false,
          shareable || false
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

// Get content by ID with all relations
const getContentById = async (contentId) => {
  try {
    // Get main content with NEW fields
    const contentRows = await query(
      `SELECT * FROM contents WHERE id = ?`,
      [contentId]
    );

    if (contentRows.length === 0) {
      return null;
    }

    const content = contentRows[0];

    // Get content rights
    const rightsRows = await query(
      `SELECT * FROM content_rights WHERE content_id = ?`,
      [contentId]
    );
    content.rights = rightsRows[0] || {};

    // Get genres
    const genreRows = await query(
      `SELECT g.*, cg.is_primary 
       FROM content_genres cg 
       JOIN genres g ON cg.genre_id = g.id 
       WHERE cg.content_id = ?`,
      [contentId]
    );
    content.genres = genreRows;

    // Get categories
    const categoryRows = await query(
      `SELECT c.* 
       FROM content_categories cc 
       JOIN categories c ON cc.category_id = c.id 
       WHERE cc.content_id = ?`,
      [contentId]
    );
    content.categories = categoryRows;

    // Get content warnings
    const warningRows = await query(
      `SELECT * FROM content_warnings WHERE content_id = ?`,
      [contentId]
    );
    content.content_warnings = warningRows;

    // Get subtitles/languages
    const subtitleRows = await query(
      `SELECT * FROM content_subtitles WHERE content_id = ?`,
      [contentId]
    );
    content.available_languages = subtitleRows;

    // Get media assets
    const mediaRows = await query(
      `SELECT id, asset_type, file_name, file_path, file_size, upload_status, 
              is_primary, asset_title, asset_description, season_number, episode_number,
              episode_title, episode_description, created_at, updated_at
       FROM media_assets 
       WHERE content_id = ? 
       ORDER BY asset_type, season_number, episode_number, created_at DESC`,
      [contentId]
    );

    // Generate public URLs
    content.media_assets = mediaRows.map(asset => ({
      ...asset,
      url: asset.upload_status === 'completed'
        ? `https://pub-${process.env.R2_PUBLIC_URL_ID}.r2.dev/${asset.file_path}`
        : null
    }));

    return content;

  } catch (error) {
    console.error('Error getting content by ID:', error);
    throw error;
  }
};

// Get all contents with pagination
const getContents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const contentType = req.query.content_type;

    // Build WHERE clause dynamically
    let whereClause = '';
    let queryParams = [];

    if (status) {
      whereClause += 'WHERE status = ?';
      queryParams.push(status);
    }

    if (contentType) {
      if (whereClause) {
        whereClause += ' AND content_type = ?';
      } else {
        whereClause += 'WHERE content_type = ?';
      }
      queryParams.push(contentType);
    }

    // If no filters, get all content
    if (!whereClause) {
      whereClause = 'WHERE 1=1';
    }

    // Get contents
    const contents = await query(
      `SELECT * FROM contents 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get media assets for all contents
    const contentIds = contents.map(content => content.id);
    let mediaAssets = [];

    if (contentIds.length > 0) {
      const placeholders = contentIds.map(() => '?').join(',');
      mediaAssets = await query(
        `SELECT ma.*
         FROM media_assets ma 
         WHERE ma.content_id IN (${placeholders}) 
         ORDER BY ma.asset_type, ma.created_at DESC`,
        contentIds
      );
    }

    // Group media assets by content_id and generate URLs
    const mediaByContent = {};
    mediaAssets.forEach(asset => {
      if (!mediaByContent[asset.content_id]) {
        mediaByContent[asset.content_id] = [];
      }

      // Generate URL with correct folder structure
      const assetWithUrl = {
        ...asset,
        url: asset.upload_status === 'completed'
          ? `https://pub-${process.env.R2_PUBLIC_URL_ID}.r2.dev/${asset.file_path}`
          : null
      };

      mediaByContent[asset.content_id].push(assetWithUrl);
    });

    // Attach media assets to each content
    const contentsWithMedia = contents.map(content => ({
      ...content,
      media_assets: mediaByContent[content.id] || []
    }));

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM contents ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    res.json({
      success: true,
      contents: contentsWithMedia,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch contents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Update content
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
      visibility
    } = req.body;

    // Start transaction
    await query('START TRANSACTION');

    // Update main content
    await query(
      `UPDATE contents 
       SET title = ?, description = ?, short_description = ?, age_rating = ?, 
           primary_language = ?, duration_minutes = ?, release_date = ?, director = ?,
           status = ?, visibility = ?, updated_by = ?, updated_at = NOW()
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

// Delete content
const deleteContent = async (req, res) => {
  const { contentId } = req.params;

  try {
    // Start transaction
    await query('START TRANSACTION');

    // Delete all related records first
    await query('DELETE FROM content_rights WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_genres WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_categories WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_warnings WHERE content_id = ?', [contentId]);
    await query('DELETE FROM content_subtitles WHERE content_id = ?', [contentId]);
    await query('DELETE FROM media_assets WHERE content_id = ?', [contentId]);

    // Delete main content
    await query('DELETE FROM contents WHERE id = ?', [contentId]);

    // Commit transaction
    await query('COMMIT');

    res.json({
      success: true,
      message: 'Content deleted successfully'
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

// Duplicate content
const duplicateContent = async (req, res) => {
  const userId = req.user.id;
  const { contentId } = req.params;

  try {
    // Get original content
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

    // Insert new content
    const contentResult = await query(
      `INSERT INTO contents (
        title, slug, description, short_description, content_type, status, visibility,
        age_rating, primary_language, duration_minutes, release_date, director,
        total_seasons, episodes_per_season, episode_duration_minutes,
        event_date, event_location, expected_audience,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, 'draft', 'private', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        originalContent.total_seasons,
        originalContent.episodes_per_season,
        originalContent.episode_duration_minutes,
        originalContent.event_date,
        originalContent.event_location,
        originalContent.expected_audience,
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
          exclusive, downloadable, shareable
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newContentId,
          originalContent.rights.license_type,
          originalContent.rights.allowed_regions,
          originalContent.rights.start_date,
          originalContent.rights.end_date,
          originalContent.rights.exclusive,
          originalContent.rights.downloadable,
          originalContent.rights.shareable
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

  try {
    const {
      visibility,
      status,
      age_rating,
      primary_language,
      downloadable,
      shareable,
      content_warnings,
      custom_tags
    } = req.body;

    // Start transaction
    await query('START TRANSACTION');

    // Update main content settings
    await query(
      `UPDATE contents 
       SET visibility = ?, status = ?, age_rating = ?, primary_language = ?, 
           updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        visibility,
        status,
        age_rating,
        primary_language,
        userId,
        contentId
      ]
    );

    // Update content rights if provided
    if (downloadable !== undefined || shareable !== undefined) {
      await query(
        `UPDATE content_rights 
         SET downloadable = ?, shareable = ?, updated_at = NOW()
         WHERE content_id = ?`,
        [
          downloadable || false,
          shareable || false,
          contentId
        ]
      );
    }

    // Update content warnings if provided
    if (content_warnings) {
      // Delete existing warnings
      await query('DELETE FROM content_warnings WHERE content_id = ?', [contentId]);

      // Insert new warnings
      if (content_warnings.length > 0) {
        const warningValues = content_warnings.map(warning => [
          contentId,
          warning.warning_type || warning,
          warning.severity || 'moderate'
        ]);
        await query(
          'INSERT INTO content_warnings (content_id, warning_type, severity) VALUES ?',
          [warningValues]
        );
      }
    }

    // Commit transaction
    await query('COMMIT');

    // Fetch updated content
    const content = await getContentById(contentId);

    res.json({
      success: true,
      message: 'Content settings updated successfully',
      content
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');

    res.status(500).json({
      error: 'Failed to update content settings',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createContent,
  getContents,
  getContentById,
  updateContent,
  deleteContent,
  publishContent,
  archiveContent,
  duplicateContent,
  updateContentSettings,
};