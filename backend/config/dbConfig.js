const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Promisify query function so we can use async/await
const query = (sql, values) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const createUsersTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      email_verified BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      subscription_plan ENUM('none', 'free_trial', 'basic', 'standard', 'premium', 'custom') DEFAULT 'none',
      role ENUM('viewer', 'admin') DEFAULT 'viewer',
      profile_avatar_url VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  try {
    await query(sql);
    console.log("✅ Users table is ready");
  } catch (err) {
    console.error("❌ Error creating users table:", err);
  }
};

const createEmailVerificationsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      code VARCHAR(10) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await query(sql);
    console.log("✅ email_verifications table is ready");
  } catch (err) {
    console.error("❌ Error creating email_verifications table:", err);
  }
};

const createUserPreferencesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      genres JSON DEFAULT NULL,
      language VARCHAR(10) DEFAULT 'en',
      notifications BOOLEAN DEFAULT TRUE,
      subtitles BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_preferences_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    );
  `;
  try {
    await query(sql);
    console.log("✅ user_preferences table is ready");
  } catch (err) {
    console.error("❌ Error creating user_preferences table:", err);
  }
};

const createUserSessionTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS user_session (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      session_token VARCHAR(255) NOT NULL,
      device_name VARCHAR(100),
      device_type ENUM('mobile','desktop','tablet') DEFAULT 'desktop',
      ip_address VARCHAR(45),
      location VARCHAR(100),
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      logout_time DATETIME DEFAULT NULL,
      user_agent TEXT,
      device_id VARCHAR(255),
      token_expires DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_session_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    );
  `;

  try {
    // assuming you have a 'query' function for MySQL
    await query(sql);
    console.log("✅ user_session table created or already exists");
  } catch (err) {
    console.error("❌ Failed to create user_session table:", err);
  }
};

const createSubscriptionsTables = async () => {
  try {
    // 1️⃣ Enhanced Subscriptions table
    const sqlSubscriptions = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE, -- plan name (Basic, Standard, Premium, Custom)
        type ENUM('monthly','yearly','custom') NOT NULL DEFAULT 'monthly', -- plan type
        price INT NOT NULL DEFAULT 0, -- price in RWF
        description TEXT DEFAULT NULL, -- admin can write plan description
        devices_allowed JSON NOT NULL, -- e.g., ["mobile","tablet"], ["all"]
        max_sessions INT NOT NULL DEFAULT 1, -- max concurrent sessions
        features JSON DEFAULT NULL, -- JSON for any extra features like quality, offline, ads_free
        is_active BOOLEAN DEFAULT TRUE, -- allows admin to enable/disable a plan
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await query(sqlSubscriptions);

    // 2️⃣ User subscriptions table
    const sqlUserSubscriptions = `
  CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subscription_id INT NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME DEFAULT NULL,
    status ENUM('active','expired','cancelled') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;
    await query(sqlUserSubscriptions);
    console.log("✅ subscriptions tables created successfully!");
  } catch (err) {
    console.error("❌ Error creating subscriptions tables:", err);
  }
};


module.exports = {
  db,
  query,
  createUsersTable,
  createEmailVerificationsTable,
  createUserPreferencesTable,
  createUserSessionTable,
  createSubscriptionsTables,
};
