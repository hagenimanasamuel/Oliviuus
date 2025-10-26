const { query } = require("../config/dbConfig");

// Get all genres with pagination and filtering
const getAllGenres = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      is_active = '',
      sort_by = 'sort_order',
      sort_order = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR slug LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (is_active !== '') {
      whereClause += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM genres ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get genres
    const genresSql = `
      SELECT * FROM genres 
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order}, name ASC
      LIMIT ? OFFSET ?
    `;
    
    const genres = await query(genresSql, [...params, parseInt(limit), offset]);

    res.status(200).json({
      success: true,
      data: genres,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: parseInt(limit),
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch genres',
      error: error.message
    });
  }
};

// Get genre by ID
const getGenreById = async (req, res) => {
  try {
    const { id } = req.params;

    const genres = await query('SELECT * FROM genres WHERE id = ?', [id]);
    
    if (!genres || genres.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Genre not found'
      });
    }

    res.status(200).json({
      success: true,
      data: genres[0]
    });

  } catch (error) {
    console.error('Error fetching genre:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch genre',
      error: error.message
    });
  }
};

// Create new genre
const createGenre = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      is_active = true,
      sort_order = 0,
      meta_title,
      meta_description
    } = req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required'
      });
    }

    // Check if slug already exists
    const existingSlug = await query('SELECT id FROM genres WHERE slug = ?', [slug]);
    if (existingSlug.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists'
      });
    }

    const sql = `
      INSERT INTO genres (
        name, slug, description, is_active, sort_order, 
        meta_title, meta_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      name, slug, description, is_active, sort_order,
      meta_title, meta_description
    ]);

    // Get the created genre
    const newGenre = await query('SELECT * FROM genres WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Genre created successfully',
      data: newGenre[0]
    });

  } catch (error) {
    console.error('Error creating genre:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create genre',
      error: error.message
    });
  }
};

// Update genre
const updateGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if genre exists
    const existingGenre = await query('SELECT id FROM genres WHERE id = ?', [id]);
    if (!existingGenre || existingGenre.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Genre not found'
      });
    }

    // If slug is being updated, check for uniqueness
    if (updateData.slug) {
      const existingSlug = await query(
        'SELECT id FROM genres WHERE slug = ? AND id != ?',
        [updateData.slug, id]
      );
      if (existingSlug.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists'
        });
      }
    }

    // Build dynamic update query
    const allowedFields = [
      'name', 'slug', 'description', 'is_active', 'sort_order',
      'meta_title', 'meta_description'
    ];

    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateValues.push(id);

    const sql = `UPDATE genres SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await query(sql, updateValues);

    // Get updated genre
    const updatedGenre = await query('SELECT * FROM genres WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Genre updated successfully',
      data: updatedGenre[0]
    });

  } catch (error) {
    console.error('Error updating genre:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update genre',
      error: error.message
    });
  }
};

// Delete genre
const deleteGenre = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if genre exists
    const existingGenre = await query('SELECT id FROM genres WHERE id = ?', [id]);
    if (!existingGenre || existingGenre.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Genre not found'
      });
    }

    // Check if genre is used in any content
    const contentUsage = await query(
      'SELECT COUNT(*) as count FROM content_genres WHERE genre_id = ?',
      [id]
    );

    if (contentUsage[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete genre that is being used by content',
        used_in_content: true
      });
    }

    await query('DELETE FROM genres WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Genre deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting genre:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete genre',
      error: error.message
    });
  }
};

// Bulk update genres (for reordering, etc.)
const bulkUpdateGenres = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const results = [];
    
    for (const update of updates) {
      const { id, sort_order, is_active } = update;
      
      if (!id) continue;

      const updateFields = [];
      const updateValues = [];

      if (sort_order !== undefined) {
        updateFields.push('sort_order = ?');
        updateValues.push(sort_order);
      }

      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        const sql = `UPDATE genres SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        await query(sql, updateValues);
        results.push({ id, success: true });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Genres updated successfully',
      data: results
    });

  } catch (error) {
    console.error('Error bulk updating genres:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update genres',
      error: error.message
    });
  }
};

// Get genres for public API (active only)
const getPublicGenres = async (req, res) => {
  try {
    const genres = await query(`
      SELECT id, name, slug, description 
      FROM genres 
      WHERE is_active = true 
      ORDER BY sort_order ASC, name ASC
    `);

    res.status(200).json({
      success: true,
      data: genres
    });

  } catch (error) {
    console.error('Error fetching public genres:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch genres',
      error: error.message
    });
  }
};

module.exports = {
  getAllGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
  bulkUpdateGenres,
  getPublicGenres
};