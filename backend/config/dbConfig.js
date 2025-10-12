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
    // 1️⃣ Subscriptions table
    const sqlSubscriptions = `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    name_translations JSON DEFAULT NULL,
    type ENUM('mobile','basic','standard','family','free','custom') NOT NULL DEFAULT 'free',
    price INT NOT NULL DEFAULT 0,
    original_price INT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    description_translations JSON DEFAULT NULL,
    tagline VARCHAR(255) DEFAULT NULL,
    tagline_translations JSON DEFAULT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    devices_allowed JSON NOT NULL,
    max_sessions INT NOT NULL DEFAULT 1,
    max_devices_registered INT DEFAULT 10,
    supported_platforms JSON DEFAULT '["web","mobile","tablet","smarttv"]',
    video_quality ENUM('SD','HD','FHD','UHD') DEFAULT 'SD',
    max_video_bitrate INT DEFAULT 2000,
    hdr_support BOOLEAN DEFAULT FALSE,
    offline_downloads BOOLEAN DEFAULT FALSE,
    max_downloads INT DEFAULT 0,
    download_quality ENUM('SD','HD','FHD','UHD') DEFAULT 'SD',
    download_expiry_days INT DEFAULT 30,
    simultaneous_downloads INT DEFAULT 1,
    early_access BOOLEAN DEFAULT FALSE,
    exclusive_content BOOLEAN DEFAULT FALSE,
    content_restrictions JSON DEFAULT NULL,
    max_profiles INT DEFAULT 1,
    parental_controls BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    is_popular BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_active (type, is_active),
    INDEX idx_price_active (price, is_active),
    INDEX idx_display_order (display_order),
    INDEX idx_popular_active (is_popular, is_active),
    INDEX idx_visible_active (is_visible, is_active)
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

const createRolesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,            
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  try {
    await query(sql);
    console.log("✅ roles table is ready");
  } catch (err) {
    console.error("❌ Error creating roles table:", err);
  }
};

const createRoleFeaturesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS role_features (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_id INT NOT NULL,
      feature_key VARCHAR(255) NOT NULL,     -- e.g., "/admin/users" or "library"
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );
  `;
  try {
    await query(sql);
    console.log("✅ role_features table is ready");
  } catch (err) {
    console.error("❌ Error creating role_features table:", err);
  }
};

const createPasswordResetsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS password_resets (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(500) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user (user_id),
      INDEX idx_token (token),
      CONSTRAINT fk_password_resets_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    );
  `;

  try {
    await query(sql);
    console.log("✅ password_resets table is ready");
  } catch (err) {
    console.error("❌ Error creating password_resets table:", err);
  }
};

const createContactsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      subject VARCHAR(500) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('new', 'open', 'in_progress', 'awaiting_reply', 'resolved', 'closed') DEFAULT 'new',
      priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
      user_id INT DEFAULT NULL,
      source ENUM('website', 'mobile_app', 'api', 'email') DEFAULT 'website',
      ip_address VARCHAR(45) DEFAULT NULL,
      user_agent TEXT DEFAULT NULL,
      read_at TIMESTAMP NULL DEFAULT NULL,
      first_response_at TIMESTAMP NULL DEFAULT NULL,
      resolved_at TIMESTAMP NULL DEFAULT NULL,
      response_count INT DEFAULT 0,
      last_response_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_contacts_status (status),
      INDEX idx_contacts_priority (priority),
      INDEX idx_contacts_category (category),
      INDEX idx_contacts_created_at (created_at),
      INDEX idx_contacts_user_id (user_id),
      INDEX idx_contacts_email (email),
      CONSTRAINT fk_contacts_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
    );
  `;
  try {
    await query(sql);
    console.log("✅ contacts table is ready");
  } catch (err) {
    console.error("❌ Error creating contacts table:", err);
  }
};

const createContactResponsesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contact_responses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contact_id INT NOT NULL,
      responder_id INT DEFAULT NULL,
      message TEXT NOT NULL,
      is_internal BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_contact_responses_contact_id (contact_id),
      INDEX idx_contact_responses_created_at (created_at),
      CONSTRAINT fk_contact_responses_contact
        FOREIGN KEY (contact_id) REFERENCES contacts(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_contact_responses_responder
        FOREIGN KEY (responder_id) REFERENCES users(id)
        ON DELETE SET NULL
    );
  `;
  try {
    await query(sql);
    console.log("✅ contact_responses table is ready");
  } catch (err) {
    console.error("❌ Error creating contact_responses table:", err);
  }
};

const createContactInfoTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contact_info (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_contact_info_email (email)
    );
  `;
  try {
    await query(sql);
    console.log("✅ contact_info table is ready");
    
    // Insert default data
    const insertSql = `INSERT IGNORE INTO contact_info (email, phone) VALUES ('oliviuusteam@gmail.com', '+250 788 880 266')`;
    await query(insertSql);
    console.log("✅ Default contact info inserted");
  } catch (err) {
    console.error("❌ Error creating contact_info table:", err);
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
  createRolesTable,
  createRoleFeaturesTable,
  createPasswordResetsTable,
  createContactsTable,
  createContactResponsesTable,
  createContactInfoTable,
};
