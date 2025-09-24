// backend/models/User.js
const { pool } = require('../config/dbConfig');

const User = {
  create: async (userData) => {
    const { full_name, email, password } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
      [full_name, email, password]
    );
    return result;
  },

  findByEmail: async (email) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0];
  },

  update: async (id, updates) => {
    const fields = Object.keys(updates).map(f => `${f} = ?`).join(', ');
    const values = Object.values(updates);
    const [result] = await pool.query(`UPDATE users SET ${fields} WHERE id = ?`, [...values, id]);
    return result;
  }
};

module.exports = User;
