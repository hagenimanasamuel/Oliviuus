const { query } = require("../config/dbConfig");

// Get all categories with hierarchy and pagination
const getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      is_active = '',
      parent_id = '',
      sort_by = 'sort_order',
      sort_order = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (c.name LIKE ? OR c.slug LIKE ? OR c.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (is_active !== '') {
      whereClause += ' AND c.is_active = ?';
      params.push(is_active === 'true');
    }

    if (parent_id !== '') {
      if (parent_id === 'null' || parent_id === '0') {
        whereClause += ' AND c.parent_id IS NULL';
      } else {
        whereClause += ' AND c.parent_id = ?';
        params.push(parseInt(parent_id));
      }
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM categories c 
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get categories with parent information
    const categoriesSql = `
      SELECT 
        c.*,
        p.name as parent_name,
        p.slug as parent_slug,
        (SELECT COUNT(*) FROM categories sc WHERE sc.parent_id = c.id) as children_count,
        (SELECT COUNT(*) FROM content_categories cc WHERE cc.category_id = c.id) as content_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order}, c.name ASC
      LIMIT ? OFFSET ?
    `;
    
    const categories = await query(categoriesSql, [...params, parseInt(limit), offset]);

    res.status(200).json({
      success: true,
      data: categories,
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
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const categories = await query(`
      SELECT 
        c.*,
        p.name as parent_name,
        p.slug as parent_slug,
        (SELECT COUNT(*) FROM categories sc WHERE sc.parent_id = c.id) as children_count,
        (SELECT COUNT(*) FROM content_categories cc WHERE cc.category_id = c.id) as content_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.id = ?
    `, [id]);
    
    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: categories[0]
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// Get category tree for hierarchical display
const getCategoryTree = async (req, res) => {
  try {
    const categories = await query(`
      WITH RECURSIVE category_tree AS (
        SELECT 
          id, name, slug, parent_id, sort_order, is_active,
          0 as level,
          CAST(sort_order AS CHAR(255)) as path
        FROM categories 
        WHERE parent_id IS NULL
        
        UNION ALL
        
        SELECT 
          c.id, c.name, c.slug, c.parent_id, c.sort_order, c.is_active,
          ct.level + 1 as level,
          CONCAT(ct.path, '.', LPAD(c.sort_order, 3, '0')) as path
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = true
      )
      SELECT * FROM category_tree 
      ORDER BY path ASC
    `);

    // Build hierarchical structure
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    const tree = buildTree(categories);

    res.status(200).json({
      success: true,
      data: tree
    });

  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category tree',
      error: error.message
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      parent_id = null,
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
    const existingSlug = await query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existingSlug.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists'
      });
    }

    // Validate parent category if provided
    if (parent_id) {
      const parentCategory = await query('SELECT id FROM categories WHERE id = ?', [parent_id]);
      if (parentCategory.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    const sql = `
      INSERT INTO categories (
        name, slug, description, parent_id, is_active, sort_order, 
        meta_title, meta_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      name, slug, description, parent_id, is_active, sort_order,
      meta_title, meta_description
    ]);

    // Get the created category
    const newCategory = await query(`
      SELECT 
        c.*,
        p.name as parent_name,
        p.slug as parent_slug
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory[0]
    });

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if category exists
    const existingCategory = await query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existingCategory || existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Prevent circular reference
    if (updateData.parent_id == id) {
      return res.status(400).json({
        success: false,
        message: 'Category cannot be its own parent'
      });
    }

    // If slug is being updated, check for uniqueness
    if (updateData.slug) {
      const existingSlug = await query(
        'SELECT id FROM categories WHERE slug = ? AND id != ?',
        [updateData.slug, id]
      );
      if (existingSlug.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists'
        });
      }
    }

    // Validate parent category if provided
    if (updateData.parent_id !== undefined) {
      if (updateData.parent_id === null || updateData.parent_id === 0) {
        updateData.parent_id = null;
      } else {
        const parentCategory = await query('SELECT id FROM categories WHERE id = ?', [updateData.parent_id]);
        if (parentCategory.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Parent category not found'
          });
        }
      }
    }

    // Build dynamic update query
    const allowedFields = [
      'name', 'slug', 'description', 'parent_id', 'is_active', 'sort_order',
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

    const sql = `UPDATE categories SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await query(sql, updateValues);

    // Get updated category
    const updatedCategory = await query(`
      SELECT 
        c.*,
        p.name as parent_name,
        p.slug as parent_slug,
        (SELECT COUNT(*) FROM categories sc WHERE sc.parent_id = c.id) as children_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory[0]
    });

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existingCategory || existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has children
    const childrenCount = await query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
      [id]
    );

    if (childrenCount[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that has subcategories',
        has_children: true
      });
    }

    // Check if category is used in any content
    const contentUsage = await query(
      'SELECT COUNT(*) as count FROM content_categories WHERE category_id = ?',
      [id]
    );

    if (contentUsage[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that is being used by content',
        used_in_content: true
      });
    }

    await query('DELETE FROM categories WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// Bulk update categories
const bulkUpdateCategories = async (req, res) => {
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
      const { id, sort_order, is_active, parent_id } = update;
      
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

      if (parent_id !== undefined) {
        updateFields.push('parent_id = ?');
        updateValues.push(parent_id === 0 ? null : parent_id);
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        const sql = `UPDATE categories SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        await query(sql, updateValues);
        results.push({ id, success: true });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Categories updated successfully',
      data: results
    });

  } catch (error) {
    console.error('Error bulk updating categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update categories',
      error: error.message
    });
  }
};

// Get categories for public API (active only, with hierarchy)
const getPublicCategories = async (req, res) => {
  try {
    const categories = await query(`
      WITH RECURSIVE category_tree AS (
        SELECT 
          id, name, slug, description, parent_id, sort_order,
          0 as level
        FROM categories 
        WHERE parent_id IS NULL AND is_active = true
        
        UNION ALL
        
        SELECT 
          c.id, c.name, c.slug, c.description, c.parent_id, c.sort_order,
          ct.level + 1 as level
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = true
      )
      SELECT * FROM category_tree 
      ORDER BY sort_order ASC, name ASC
    `);

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get parent categories (categories without parents)
const getParentCategories = async (req, res) => {
  try {
    const categories = await query(`
      SELECT id, name, slug 
      FROM categories 
      WHERE parent_id IS NULL AND is_active = true
      ORDER BY sort_order ASC, name ASC
    `);

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching parent categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parent categories',
      error: error.message
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkUpdateCategories,
  getPublicCategories,
  getParentCategories
};