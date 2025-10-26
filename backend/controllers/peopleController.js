const { query } = require("../config/dbConfig");

// Get all people with filtering and pagination
const getAllPeople = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      is_active = '',
      sort_by = 'full_name',
      sort_order = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (full_name LIKE ? OR display_name LIKE ? OR bio LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      whereClause += ' AND primary_role = ?';
      params.push(role);
    }

    if (is_active !== '') {
      whereClause += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM people ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get people
    const peopleSql = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM content_people cp WHERE cp.person_id = p.id) as content_count
      FROM people p 
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order}, full_name ASC
      LIMIT ? OFFSET ?
    `;
    
    const people = await query(peopleSql, [...params, parseInt(limit), offset]);

    res.status(200).json({
      success: true,
      data: people,
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
    console.error('Error fetching people:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch people',
      error: error.message
    });
  }
};

// Get person by ID
const getPersonById = async (req, res) => {
  try {
    const { id } = req.params;

    const people = await query(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM content_people cp WHERE cp.person_id = p.id) as content_count,
        (SELECT COUNT(*) FROM person_awards pa WHERE pa.person_id = p.id AND pa.result = 'won') as awards_won,
        (SELECT COUNT(*) FROM person_awards pa WHERE pa.person_id = p.id) as awards_nominated
      FROM people p
      WHERE p.id = ?
    `, [id]);
    
    if (!people || people.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }

    // Get person's content credits
    const credits = await query(`
      SELECT 
        cp.*,
        c.title as content_title,
        c.content_type,
        c.slug as content_slug
      FROM content_people cp
      LEFT JOIN contents c ON cp.content_id = c.id
      WHERE cp.person_id = ?
      ORDER BY cp.billing_order ASC, c.release_date DESC
    `, [id]);

    // Get person's awards
    const awards = await query(`
      SELECT 
        pa.*,
        c.title as content_title
      FROM person_awards pa
      LEFT JOIN contents c ON pa.content_id = c.id
      WHERE pa.person_id = ?
      ORDER BY pa.award_year DESC, pa.ceremony_date DESC
    `, [id]);

    const person = {
      ...people[0],
      credits: credits || [],
      awards: awards || []
    };

    res.status(200).json({
      success: true,
      data: person
    });

  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch person',
      error: error.message
    });
  }
};

// Create new person
const createPerson = async (req, res) => {
  try {
    const {
      full_name,
      display_name,
      bio,
      date_of_birth,
      place_of_birth,
      nationality,
      gender,
      primary_role,
      other_roles,
      agent_name,
      agent_contact,
      profile_image_url,
      website_url,
      imdb_url,
      wikipedia_url,
      social_links,
      search_keywords,
      slug
    } = req.body;

    // Validation
    if (!full_name || !primary_role || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Full name, primary role, and slug are required'
      });
    }

    // Check if slug already exists
    const existingSlug = await query('SELECT id FROM people WHERE slug = ?', [slug]);
    if (existingSlug.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists'
      });
    }

    const sql = `
      INSERT INTO people (
        full_name, display_name, bio, date_of_birth, place_of_birth, nationality,
        gender, primary_role, other_roles, agent_name, agent_contact, profile_image_url,
        website_url, imdb_url, wikipedia_url, social_links, search_keywords, slug
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      full_name, display_name, bio, date_of_birth, place_of_birth, nationality,
      gender, primary_role, other_roles ? JSON.stringify(other_roles) : null,
      agent_name, agent_contact, profile_image_url, website_url, imdb_url,
      wikipedia_url, social_links ? JSON.stringify(social_links) : null,
      search_keywords ? JSON.stringify(search_keywords) : null, slug
    ]);

    // Get the created person
    const newPerson = await query('SELECT * FROM people WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Person created successfully',
      data: newPerson[0]
    });

  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create person',
      error: error.message
    });
  }
};

// Update person
const updatePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if person exists
    const existingPerson = await query('SELECT id FROM people WHERE id = ?', [id]);
    if (!existingPerson || existingPerson.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }

    // If slug is being updated, check for uniqueness
    if (updateData.slug) {
      const existingSlug = await query(
        'SELECT id FROM people WHERE slug = ? AND id != ?',
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
      'full_name', 'display_name', 'bio', 'date_of_birth', 'place_of_birth', 'nationality',
      'gender', 'primary_role', 'other_roles', 'agent_name', 'agent_contact', 'profile_image_url',
      'website_url', 'imdb_url', 'wikipedia_url', 'social_links', 'search_keywords', 'slug',
      'is_active', 'is_verified', 'popularity_score'
    ];

    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        
        // Handle JSON fields
        if (['other_roles', 'social_links', 'search_keywords'].includes(key)) {
          updateValues.push(updateData[key] ? JSON.stringify(updateData[key]) : null);
        } else {
          updateValues.push(updateData[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateValues.push(id);

    const sql = `UPDATE people SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await query(sql, updateValues);

    // Get updated person
    const updatedPerson = await query('SELECT * FROM people WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Person updated successfully',
      data: updatedPerson[0]
    });

  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update person',
      error: error.message
    });
  }
};

// Delete person
const deletePerson = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if person exists
    const existingPerson = await query('SELECT id FROM people WHERE id = ?', [id]);
    if (!existingPerson || existingPerson.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }

    // Check if person is used in any content
    const contentUsage = await query(
      'SELECT COUNT(*) as count FROM content_people WHERE person_id = ?',
      [id]
    );

    if (contentUsage[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete person that is associated with content',
        used_in_content: true
      });
    }

    await query('DELETE FROM people WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Person deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete person',
      error: error.message
    });
  }
};

// Search people for casting
const searchPeople = async (req, res) => {
  try {
    const { q, role, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    let sql = `
      SELECT id, full_name, display_name, primary_role, profile_image_url
      FROM people 
      WHERE (full_name LIKE ? OR display_name LIKE ?)
      AND is_active = true
    `;
    
    const params = [`%${q}%`, `%${q}%`];

    if (role) {
      sql += ' AND primary_role = ?';
      params.push(role);
    }

    sql += ' ORDER BY popularity_score DESC, full_name ASC LIMIT ?';
    params.push(parseInt(limit));

    const people = await query(sql, params);

    res.status(200).json({
      success: true,
      data: people
    });

  } catch (error) {
    console.error('Error searching people:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search people',
      error: error.message
    });
  }
};

// Get casting for specific content with multiple roles support
const getContentCasting = async (req, res) => {
  try {
    const { content_id, role_type, season_number, episode_number, group_by_person = false } = req.query;

    if (!content_id) {
      return res.status(400).json({
        success: false,
        message: 'Content ID is required'
      });
    }

    let sql = `
      SELECT 
        cp.*,
        p.full_name,
        p.display_name,
        p.profile_image_url,
        p.primary_role,
        p.nationality,
        p.popularity_score,
        c.title as content_title,
        c.content_type,
        c.slug as content_slug
      FROM content_people cp
      INNER JOIN people p ON cp.person_id = p.id
      INNER JOIN contents c ON cp.content_id = c.id
      WHERE cp.content_id = ?
    `;

    const params = [content_id];

    if (role_type) {
      sql += ' AND cp.role_type = ?';
      params.push(role_type);
    }

    if (season_number) {
      sql += ' AND cp.season_number = ?';
      params.push(season_number);
    }

    if (episode_number) {
      sql += ' AND cp.episode_number = ?';
      params.push(episode_number);
    }

    sql += ' ORDER BY cp.role_type, cp.billing_order ASC, p.full_name ASC';

    const casting = await query(sql, params);

    // Group by role type
    const groupedByRole = casting.reduce((acc, item) => {
      const roleType = item.role_type;
      if (!acc[roleType]) {
        acc[roleType] = [];
      }
      acc[roleType].push(item);
      return acc;
    }, {});

    // Group by person for person-centric view
    const groupedByPerson = casting.reduce((acc, item) => {
      const personId = item.person_id;
      if (!acc[personId]) {
        acc[personId] = {
          person: {
            id: item.person_id,
            full_name: item.full_name,
            display_name: item.display_name,
            profile_image_url: item.profile_image_url,
            primary_role: item.primary_role,
            nationality: item.nationality,
            popularity_score: item.popularity_score
          },
          roles: []
        };
      }
      
      // Add role to person's roles array
      acc[personId].roles.push({
        id: item.id,
        role_type: item.role_type,
        character_name: item.character_name,
        role_description: item.role_description,
        billing_order: item.billing_order,
        is_featured: item.is_featured,
        credit_type: item.credit_type,
        season_number: item.season_number,
        episode_number: item.episode_number,
        created_at: item.created_at,
        updated_at: item.updated_at
      });
      
      return acc;
    }, {});

    // Convert to array and calculate statistics
    const personStats = Object.values(groupedByPerson).map(personData => {
      const roles = personData.roles;
      const isFeatured = roles.some(role => role.is_featured);
      const primaryRole = roles[0]?.role_type;
      const totalBilling = Math.min(...roles.map(role => role.billing_order || 9999));
      
      return {
        ...personData,
        is_featured: isFeatured,
        primary_display_role: primaryRole,
        display_billing_order: totalBilling,
        role_count: roles.length
      };
    });

    // Sort persons by display billing order
    personStats.sort((a, b) => a.display_billing_order - b.display_billing_order);

    res.status(200).json({
      success: true,
      data: casting,
      grouped_by_role: groupedByRole,
      grouped_by_person: personStats,
      total: casting.length,
      unique_people: Object.keys(groupedByPerson).length,
      statistics: {
        total_roles: casting.length,
        unique_people: Object.keys(groupedByPerson).length,
        people_with_multiple_roles: personStats.filter(p => p.roles.length > 1).length,
        role_distribution: Object.keys(groupedByRole).reduce((acc, role) => {
          acc[role] = groupedByRole[role].length;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Error fetching content casting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch casting information',
      error: error.message
    });
  }
};

// Add person to content (single role)
const addPersonToContent = async (req, res) => {
  try {
    const {
      content_id,
      person_id,
      role_type,
      character_name,
      role_description,
      billing_order,
      is_featured,
      credit_type,
      season_number,
      episode_number
    } = req.body;

    // Validation
    if (!content_id || !person_id || !role_type) {
      return res.status(400).json({
        success: false,
        message: 'Content ID, person ID, and role type are required'
      });
    }

    // Check if content exists
    const contentExists = await query('SELECT id FROM contents WHERE id = ?', [content_id]);
    if (contentExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Check if person exists
    const personExists = await query('SELECT id FROM people WHERE id = ?', [person_id]);
    if (personExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }

    // Check if exact same role already exists
    const existingRelationship = await query(
      `SELECT id FROM content_people 
       WHERE content_id = ? AND person_id = ? AND role_type = ? 
       AND character_name <=> ? AND season_number <=> ? AND episode_number <=> ?`,
      [content_id, person_id, role_type, character_name, season_number, episode_number]
    );

    if (existingRelationship.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This exact role already exists for this person'
      });
    }

    const sql = `
      INSERT INTO content_people (
        content_id, person_id, role_type, character_name, role_description,
        billing_order, is_featured, credit_type, season_number, episode_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      content_id, person_id, role_type, character_name, role_description,
      billing_order || 0, is_featured || false, credit_type || 'supporting',
      season_number, episode_number
    ]);

    // Get the complete casting record with person details
    const newCasting = await query(`
      SELECT 
        cp.*,
        p.full_name,
        p.display_name,
        p.profile_image_url,
        p.primary_role,
        p.nationality,
        c.title as content_title
      FROM content_people cp
      INNER JOIN people p ON cp.person_id = p.id
      INNER JOIN contents c ON cp.content_id = c.id
      WHERE cp.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Person added to content successfully',
      data: newCasting[0]
    });

  } catch (error) {
    console.error('Error adding person to content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add person to content',
      error: error.message
    });
  }
};

// Add multiple roles for a person in content
const addPersonRolesToContent = async (req, res) => {
  try {
    const { content_id, person_id, roles } = req.body;

    if (!content_id || !person_id || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content ID, person ID, and roles array are required'
      });
    }

    // Check if content exists
    const contentExists = await query('SELECT id FROM contents WHERE id = ?', [content_id]);
    if (contentExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Check if person exists
    const personExists = await query('SELECT id FROM people WHERE id = ?', [person_id]);
    if (personExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }

    const connection = await require('../config/dbConfig').getConnection();
    await connection.beginTransaction();

    try {
      const insertedRoles = [];

      for (const roleData of roles) {
        const {
          role_type,
          character_name,
          role_description,
          billing_order,
          is_featured,
          credit_type,
          season_number,
          episode_number
        } = roleData;

        // Check if this specific role already exists
        const [existingRole] = await connection.execute(
          `SELECT id FROM content_people 
           WHERE content_id = ? AND person_id = ? AND role_type = ? 
           AND character_name <=> ? AND season_number <=> ? AND episode_number <=> ?`,
          [content_id, person_id, role_type, character_name, season_number, episode_number]
        );

        if (existingRole.length === 0) {
          const [result] = await connection.execute(
            `INSERT INTO content_people (
              content_id, person_id, role_type, character_name, role_description,
              billing_order, is_featured, credit_type, season_number, episode_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              content_id, person_id, role_type, character_name, role_description,
              billing_order || 0, is_featured || false, credit_type || 'supporting',
              season_number, episode_number
            ]
          );

          // Get the complete role record
          const [newRole] = await connection.execute(`
            SELECT cp.*, p.full_name, p.display_name, p.profile_image_url
            FROM content_people cp
            INNER JOIN people p ON cp.person_id = p.id
            WHERE cp.id = ?
          `, [result.insertId]);

          insertedRoles.push(newRole[0]);
        }
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: `Added ${insertedRoles.length} role(s) for person in content`,
        data: insertedRoles,
        skipped: roles.length - insertedRoles.length
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error adding bulk roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add roles for person',
      error: error.message
    });
  }
};

// Update casting information
const updateCasting = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if casting exists
    const existingCasting = await query(
      'SELECT id FROM content_people WHERE id = ?',
      [id]
    );

    if (!existingCasting || existingCasting.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Casting record not found'
      });
    }

    // Build dynamic update query
    const allowedFields = [
      'role_type', 'character_name', 'role_description', 'billing_order',
      'is_featured', 'credit_type', 'season_number', 'episode_number'
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

    const sql = `
      UPDATE content_people 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    await query(sql, updateValues);

    // Get updated casting with person details
    const updatedCasting = await query(`
      SELECT 
        cp.*,
        p.full_name,
        p.display_name,
        p.profile_image_url,
        p.primary_role,
        c.title as content_title
      FROM content_people cp
      INNER JOIN people p ON cp.person_id = p.id
      INNER JOIN contents c ON cp.content_id = c.id
      WHERE cp.id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: 'Casting updated successfully',
      data: updatedCasting[0]
    });

  } catch (error) {
    console.error('Error updating casting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update casting',
      error: error.message
    });
  }
};

// Enhanced search for casting
const searchPeopleForCasting = async (req, res) => {
  try {
    const { 
      q, 
      role, 
      content_id, 
      exclude_current = false, 
      limit = 20 
    } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    let sql = `
      SELECT 
        p.id,
        p.full_name,
        p.display_name,
        p.primary_role,
        p.profile_image_url,
        p.nationality,
        p.popularity_score,
        (SELECT COUNT(*) FROM content_people cp WHERE cp.person_id = p.id) as content_count
      FROM people p
      WHERE (p.full_name LIKE ? OR p.display_name LIKE ? OR p.search_keywords LIKE ?)
      AND p.is_active = true
    `;
    
    const params = [`%${q}%`, `%${q}%`, `%${q}%`];

    if (role) {
      sql += ' AND p.primary_role = ?';
      params.push(role);
    }

    // Exclude people already in this content
    if (exclude_current === 'true' && content_id) {
      sql += ` AND p.id NOT IN (
        SELECT person_id FROM content_people WHERE content_id = ?
      )`;
      params.push(content_id);
    }

    sql += ' ORDER BY p.popularity_score DESC, p.full_name ASC LIMIT ?';
    params.push(parseInt(limit));

    const people = await query(sql, params);

    res.status(200).json({
      success: true,
      data: people,
      total: people.length
    });

  } catch (error) {
    console.error('Error searching people for casting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search people',
      error: error.message
    });
  }
};

// Remove person from content (single role)
const removePersonFromContent = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM content_people WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content-person relationship not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Person removed from content successfully'
    });

  } catch (error) {
    console.error('Error removing person from content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove person from content',
      error: error.message
    });
  }
};

// Get person's roles in specific content
const getPersonRolesInContent = async (req, res) => {
  try {
    const { person_id, content_id } = req.params;

    const roles = await query(`
      SELECT 
        cp.*,
        c.title as content_title,
        c.content_type,
        c.thumbnail_url
      FROM content_people cp
      INNER JOIN contents c ON cp.content_id = c.id
      WHERE cp.person_id = ? AND cp.content_id = ?
      ORDER BY cp.role_type, cp.billing_order
    `, [person_id, content_id]);

    res.status(200).json({
      success: true,
      data: roles,
      total: roles.length
    });

  } catch (error) {
    console.error('Error fetching person roles in content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch person roles',
      error: error.message
    });
  }
};

module.exports = {
  getAllPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
  addPersonToContent,
  removePersonFromContent,
  updateCasting,
  getContentCasting,
  searchPeople: searchPeopleForCasting,
  getPersonRolesInContent,
  addPersonRolesToContent
};