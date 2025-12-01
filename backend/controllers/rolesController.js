// backend/controllers/rolesController.js
const { query } = require("../config/dbConfig");

// ✅ Get all roles with features
const getRoles = async (req, res) => {
  try {
    const rolesSql = `SELECT * FROM roles ORDER BY created_at DESC`;
    const roles = await query(rolesSql);

    // Fetch features for each role
    for (let role of roles) {
      const featuresSql = `SELECT feature_key FROM role_features WHERE role_id = ?`;
      const features = await query(featuresSql, [role.id]);
      role.features = features.map(f => f.feature_key);
    }

    res.status(200).json({ success: true, roles });
  } catch (err) {
    console.error("❌ Error fetching roles:", err);
    res.status(500).json({ success: false, message: "Failed to fetch roles" });
  }
};

// ✅ Create a new role
const createRole = async (req, res) => {
  try {
    const { role_code, role_name, description, features } = req.body;

    if (!role_code || !role_name || !features || !Array.isArray(features) || features.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Role code, role name, and at least one feature are required" 
      });
    }

    // Insert into roles table
    const insertRoleSql = `
      INSERT INTO roles (role_code, name, description)
      VALUES (?, ?, ?)
    `;
    const result = await query(insertRoleSql, [role_code, role_name, description || ""]);
    const roleId = result.insertId;

    // Insert features into role_features table
    const featurePromises = features.map(f => 
      query(`INSERT INTO role_features (role_id, feature_key) VALUES (?, ?)`, [roleId, f])
    );
    await Promise.all(featurePromises);

    res.status(201).json({ success: true, message: "Role created successfully" });
  } catch (err) {
    console.error("❌ Error creating role:", err);
    res.status(500).json({ success: false, message: "Failed to create role" });
  }
};

// ✅ Update existing role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_code, role_name, description, features } = req.body;

    if (!role_code || !role_name || !features || !Array.isArray(features) || features.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Role code, role name, and at least one feature are required" 
      });
    }

    // Update role info
    const updateRoleSql = `
      UPDATE roles
      SET role_code = ?, name = ?, description = ?
      WHERE id = ?
    `;
    const result = await query(updateRoleSql, [role_code, role_name, description || "", id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    // Delete old features
    await query(`DELETE FROM role_features WHERE role_id = ?`, [id]);

    // Insert updated features
    const featurePromises = features.map(f =>
      query(`INSERT INTO role_features (role_id, feature_key) VALUES (?, ?)`, [id, f])
    );
    await Promise.all(featurePromises);

    res.status(200).json({ success: true, message: "Role updated successfully" });
  } catch (err) {
    console.error("❌ Error updating role:", err);
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
};

// ✅ Delete role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM roles WHERE id = ?`;
    const result = await query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    // role_features table has ON DELETE CASCADE, so features are automatically removed

    res.status(200).json({ success: true, message: "Role deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting role:", err);
    res.status(500).json({ success: false, message: "Failed to delete role" });
  }
};

module.exports = {
  getRoles,
  createRole,
  updateRole,
  deleteRole
};
