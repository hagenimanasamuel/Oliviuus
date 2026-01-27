// backend/config/isanzureDbConfig.js
const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for iSanzure database
const isanzureDb = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.ISANZURE_DB_NAME || 'isanzure_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Promisify query function
const isanzureQuery = (sql, values) => {
  return new Promise((resolve, reject) => {
    isanzureDb.query(sql, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Create the single users table
const createIsanzureUsersTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      oliviuus_user_id INT NOT NULL UNIQUE,
      
      -- User type
      user_type ENUM(
        'tenant', 
        'landlord', 
        'agent', 
        'property_manager'
      ) DEFAULT 'tenant',
      
      -- ID Verification
      id_verified BOOLEAN DEFAULT FALSE,
      id_document_type ENUM('national_id', 'passport', 'driving_license') DEFAULT NULL,
      id_verified_at TIMESTAMP NULL,
      
      -- Enhanced Verification System (NEW)
      verification_status ENUM('not_submitted', 'pending', 'approved', 'rejected') DEFAULT 'not_submitted',
      verification_submitted_at TIMESTAMP NULL,
      verification_processed_at TIMESTAMP NULL,
      verification_processed_by INT NULL,
      rejection_reason TEXT NULL,
      verification_reason TEXT NULL, -- Reason user provided for verification
      verification_letter_url VARCHAR(500) NULL,
      verification_letter_public_id VARCHAR(255) NULL,
      national_id_front_url VARCHAR(500) NULL,
      national_id_front_public_id VARCHAR(255) NULL,
      national_id_back_url VARCHAR(500) NULL,
      national_id_back_public_id VARCHAR(255) NULL,
      passport_photo_url VARCHAR(500) NULL,
      passport_photo_public_id VARCHAR(255) NULL,
      
      -- Account PIN (NEW)
      account_pin VARCHAR(255) NULL, -- Hashed PIN (4-digit hashed)
      pin_set_at TIMESTAMP NULL,
      pin_attempts INT DEFAULT 0,
      pin_locked_until TIMESTAMP NULL,
      has_pin BOOLEAN DEFAULT FALSE,
      
      -- Public Contact Information (NEW)
      public_phone VARCHAR(20) NULL,
      public_email VARCHAR(255) NULL,
      preferred_contact_methods JSON NULL, -- ['whatsapp', 'phone', 'email', 'sms']
      
      -- Withdrawal Account Info (NEW)
      withdrawal_method ENUM('bk', 'equity', 'mtn', 'airtel') NULL,
      withdrawal_account_name VARCHAR(1000) NULL,
      withdrawal_account_number VARCHAR(1000) NULL,
      withdrawal_phone_number VARCHAR(1000) NULL,
      withdrawal_bank_name VARCHAR(1000) NULL,
      withdrawal_set_at TIMESTAMP NULL,
      withdrawal_verified BOOLEAN DEFAULT FALSE,
      withdrawal_verified_at TIMESTAMP NULL,
      withdrawal_verified_by INT NULL,
      
      -- Registration info
      registration_source ENUM('oliviuus_sso', 'direct_isanzure') DEFAULT 'oliviuus_sso',
      last_isanzure_login TIMESTAMP NULL,
      
      -- Security & Audit (NEW)
      last_settings_update TIMESTAMP NULL,
      updated_by INT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      deactivated_at TIMESTAMP NULL,
      deactivation_reason TEXT NULL,
      
      -- Timestamps
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Indexes
      INDEX idx_oliviuus_user_id (oliviuus_user_id),
      INDEX idx_user_type (user_type),
      INDEX idx_created_at (created_at),
      INDEX idx_verification_status (verification_status),
      INDEX idx_id_verified (id_verified),
      INDEX idx_withdrawal_method (withdrawal_method),
      INDEX idx_pin_set_at (pin_set_at),
      INDEX idx_verification_submitted_at (verification_submitted_at),
      INDEX idx_is_active (is_active),
      
      -- Composite indexes for better query performance
      INDEX idx_status_verification (verification_status, id_verified),
      INDEX idx_user_status (user_type, is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await isanzureQuery(sql);
    console.log("✅ iSanzure users table is ready");
  } catch (err) {
    console.error("❌ Error creating iSanzure users table:", err);
  }
};

const createVerificationHistoryTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS verification_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      history_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id INT NOT NULL,
      
      -- Document URLs
      national_id_front_url VARCHAR(500) NOT NULL,
      national_id_front_public_id VARCHAR(255) NULL,
      national_id_back_url VARCHAR(500) NOT NULL,
      national_id_back_public_id VARCHAR(255) NULL,
      passport_photo_url VARCHAR(500) NOT NULL,
      passport_photo_public_id VARCHAR(255) NULL,
      verification_letter_url VARCHAR(500) NULL,
      verification_letter_public_id VARCHAR(255) NULL,
      
      -- Verification data
      verification_reason TEXT NOT NULL,
      document_type ENUM('national_id', 'passport', 'driving_license') DEFAULT 'national_id',
      
      -- Status tracking
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      rejection_reason TEXT NULL,
      
      -- User who submitted
      submitted_by_user_id INT NOT NULL,
      
      -- Admin who processed
      processed_by_admin_id INT NULL,
      processed_by_name VARCHAR(100) NULL,
      
      -- IP and device info
      submitted_ip VARCHAR(45) NULL,
      submitted_user_agent TEXT NULL,
      
      -- Timestamps
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP NULL,
      
      -- Indexes
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_submitted_at (submitted_at),
      INDEX idx_processed_at (processed_at),
      INDEX idx_processed_by_admin_id (processed_by_admin_id),
      INDEX idx_document_type (document_type),
      INDEX idx_user_status (user_id, status),
      INDEX idx_user_latest (user_id, submitted_at DESC),
      
      -- Foreign keys
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (processed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    await isanzureQuery(sql);
    console.log("✅ Verification history table is ready");
  } catch (err) {
    console.error("❌ Error creating verification history table:", err);
  }
};

const createWithdrawalAccountHistoryTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS withdrawal_account_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      history_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id INT NOT NULL,
      
      -- Account details
      withdrawal_method ENUM('bk', 'equity', 'mtn', 'airtel') NOT NULL,
      account_name VARCHAR(1000) NOT NULL,
      account_number VARCHAR(1000) NULL,
      phone_number VARCHAR(1000) NULL,
      bank_name VARCHAR(1000) NULL,
      
      -- Verification status
      verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
      verification_notes TEXT NULL,
      verified_by_admin_id INT NULL,
      verified_by_name VARCHAR(100) NULL,
      verified_at TIMESTAMP NULL,
      
      -- Audit info
      changed_by_user_id INT NOT NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      device_info JSON NULL,
      
      -- Status tracking
      is_current BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      
      -- Timestamps
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deactivated_at TIMESTAMP NULL,
      deactivation_reason TEXT NULL,
      
      -- Indexes
      INDEX idx_user_id (user_id),
      INDEX idx_is_current (is_current),
      INDEX idx_changed_at (changed_at),
      INDEX idx_withdrawal_method (withdrawal_method),
      INDEX idx_verification_status (verification_status),
      INDEX idx_is_active (is_active),
      INDEX idx_verified_by_admin_id (verified_by_admin_id),
      INDEX idx_user_current (user_id, is_current),
      INDEX idx_user_verified (user_id, verification_status),
      INDEX idx_method_current (withdrawal_method, is_current),
      
      -- Foreign keys
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (verified_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    await isanzureQuery(sql);
    console.log("✅ Withdrawal account history table is ready");
  } catch (err) {
    console.error("❌ Error creating withdrawal account history table:", err);
  }
};

const createPinChangeHistoryTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS pin_change_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      history_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id INT NOT NULL,
      change_type ENUM('set', 'update', 'reset') NOT NULL,
      changed_by INT NOT NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_user_id (user_id),
      INDEX idx_changed_at (changed_at),
      INDEX idx_change_type (change_type),
      INDEX idx_changed_by (changed_by),
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    await isanzureQuery(sql);
    console.log("✅ PIN change history table is ready");
  } catch (err) {
    console.error("❌ Error creating PIN change history table:", err);
  }
};

const createContactInfoHistoryTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contact_info_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      history_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id INT NOT NULL,
      public_phone VARCHAR(20) NULL,
      public_email VARCHAR(255) NULL,
      changed_by INT NOT NULL, -- This stores oliviuus_user_id, not users.id
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_user_id (user_id),
      INDEX idx_changed_at (changed_at),
      INDEX idx_changed_by (changed_by),
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      -- Removed foreign key constraint for changed_by since it references oliviuus_user_id
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    await isanzureQuery(sql);
    console.log("✅ Contact info history table is ready");
  } catch (err) {
    console.error("❌ Error creating contact info history table:", err);
  }
};

const createPinVerificationTokensTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS pin_verification_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      operation_type VARCHAR(50) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP NULL,
      ip_address VARCHAR(45) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_user_id (user_id),
      INDEX idx_token (token),
      INDEX idx_expires_at (expires_at),
      INDEX idx_operation_type (operation_type),
      INDEX idx_used_at (used_at),
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    await isanzureQuery(sql);
    console.log("✅ PIN verification tokens table is ready");
  } catch (err) {
    console.error("❌ Error creating PIN verification tokens table:", err);
  }
};

const createSecurityAuditLogTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS security_audit_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      log_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      user_id INT NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      metadata JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_user_id (user_id),
      INDEX idx_action_type (action_type),
      INDEX idx_created_at (created_at),
      INDEX idx_user_action (user_id, action_type),
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    await isanzureQuery(sql);
    console.log("✅ Security audit log table is ready");
  } catch (err) {
    console.error("❌ Error creating security audit log table:", err);
  }
};


// 1. Create properties table (Main table)
const createPropertiesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS properties (
      id INT AUTO_INCREMENT PRIMARY KEY,
      property_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      
      -- Basic Info (Step 1)
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      property_type ENUM(
        'apartment', 'house', 'villa', 'condo', 'studio', 
        'penthouse', 'townhouse', 'ghetto', 'living_house',
        'upmarket', 'service_apartment', 'guest_house', 
        'bungalow', 'commercial', 'hostel'
      ) DEFAULT 'ghetto',
      
      -- Location (Step 2)
      address TEXT NOT NULL,
      province VARCHAR(100),
      district VARCHAR(100),
      sector VARCHAR(100),
      cell VARCHAR(100),
      village VARCHAR(100),
      isibo VARCHAR(100),
      country VARCHAR(50) DEFAULT 'Rwanda',
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      
      -- Details (Step 3)
      area DECIMAL(10,2),
      max_guests INT DEFAULT 2,
      total_rooms INT DEFAULT 0,
      
      -- Status & Ownership
      landlord_id INT NOT NULL,
      status ENUM('draft', 'active', 'inactive', 'rented', 'under_maintenance') DEFAULT 'draft',
      is_featured BOOLEAN DEFAULT FALSE,
      is_verified BOOLEAN DEFAULT FALSE,
      verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
      
      -- Timestamps (All in UTC)
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      published_at TIMESTAMP NULL,
      verified_at TIMESTAMP NULL,
      
      -- Indexes
      INDEX idx_landlord_id (landlord_id),
      INDEX idx_property_uid (property_uid),
      INDEX idx_status (status),
      INDEX idx_property_type (property_type),
      INDEX idx_location (province, district, sector),
      INDEX idx_created_at (created_at),
      INDEX idx_verification_status (verification_status),
      
      FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await isanzureQuery(sql);
    console.log("✅ Properties table is ready");
  } catch (err) {
    console.error("❌ Error creating properties table:", err);
  }
};

// 2. Create property_images table
const createPropertyImagesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS property_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      property_id INT NOT NULL,
      image_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      image_url VARCHAR(500) NOT NULL,
      public_id VARCHAR(1000), -- For backward compatibility
      cloudinary_public_id VARCHAR(1000), -- For Cloudinary reference
      image_name VARCHAR(255),
      image_size INT,
      mime_type VARCHAR(50),
      is_cover BOOLEAN DEFAULT FALSE,
      display_order INT DEFAULT 0,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_property_id (property_id),
      INDEX idx_display_order (display_order),
      INDEX idx_image_uid (image_uid),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await isanzureQuery(sql);
    console.log("✅ Property images table is ready");
  } catch (err) {
    console.error("❌ Error creating property images table:", err);
  }
};

// 3. Create property_amenities lookup table
const createPropertyAmenitiesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS property_amenities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      amenity_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      amenity_key VARCHAR(100) UNIQUE NOT NULL,
      amenity_name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      icon_class VARCHAR(50),
      is_common BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_amenity_uid (amenity_uid),
      INDEX idx_category (category),
      INDEX idx_is_common (is_common)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await isanzureQuery(sql);
    console.log("✅ Property amenities lookup table is ready");

    // Insert default amenities (from your frontend)
    await seedDefaultAmenities();
  } catch (err) {
    console.error("❌ Error creating property amenities table:", err);
  }
};

// 3b. Create property_amenity_junction table
const createPropertyAmenityJunctionTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS property_amenity_junction (
      id INT AUTO_INCREMENT PRIMARY KEY,
      junction_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      property_id INT NOT NULL,
      amenity_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE KEY unique_property_amenity (property_id, amenity_id),
      INDEX idx_junction_uid (junction_uid),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (amenity_id) REFERENCES property_amenities(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await isanzureQuery(sql);
    console.log("✅ Property amenity junction table is ready");
  } catch (err) {
    console.error("❌ Error creating property amenity junction table:", err);
  }
};

// 4. Create property_rooms table
const createPropertyRoomsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS property_rooms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      room_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      property_id INT NOT NULL,
      room_type ENUM(
        'bedroom', 'bathroom', 'living_room', 'dining_room',
        'kitchen', 'storage', 'balcony', 'other'
      ) NOT NULL,
      count INT DEFAULT 0,
      description TEXT,
      
      INDEX idx_property_id (property_id),
      INDEX idx_room_uid (room_uid),
      INDEX idx_room_type (room_type),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await isanzureQuery(sql);
    console.log("✅ Property rooms table is ready");
  } catch (err) {
    console.error("❌ Error creating property rooms table:", err);
  }
};

// 5. Create property_equipment table
const createPropertyEquipmentTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS property_equipment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      equipment_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      property_id INT NOT NULL,
      equipment_type ENUM(
        'beds', 'mattresses', 'sofas', 'chairs', 'tables',
        'wardrobes', 'shelves', 'lamps', 'curtains', 'mirrors'
      ) NOT NULL,
      count INT DEFAULT 0,
      description TEXT,
      
      INDEX idx_property_id (property_id),
      INDEX idx_equipment_uid (equipment_uid),
      INDEX idx_equipment_type (equipment_type),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await isanzureQuery(sql);
    console.log("✅ Property equipment table is ready");
  } catch (err) {
    console.error("❌ Error creating property equipment table:", err);
  }
};

// 6. Create property_pricing table
const createPropertyPricingTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS property_pricing (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pricing_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      property_id INT NOT NULL UNIQUE,
      
      -- Prices (in RWF)
      monthly_price DECIMAL(12,2) NOT NULL,
      weekly_price DECIMAL(12,2),
      daily_price DECIMAL(12,2),
      nightly_price DECIMAL(12,2),
      
      -- Calculated prices (for quick access)
      quarterly_price DECIMAL(12,2),
      semester_price DECIMAL(12,2),
      yearly_price DECIMAL(12,2),
      
      -- Payment periods accepted
      accept_monthly BOOLEAN DEFAULT TRUE,
      accept_weekly BOOLEAN DEFAULT FALSE,
      accept_daily BOOLEAN DEFAULT FALSE,
      accept_nightly BOOLEAN DEFAULT FALSE,
      accept_quarterly BOOLEAN DEFAULT FALSE,
      accept_semester BOOLEAN DEFAULT FALSE,
      accept_yearly BOOLEAN DEFAULT FALSE,
      
      -- Payment limits
      max_advance_months INT DEFAULT 3,
      max_single_payment_months INT DEFAULT 6,
      
      -- Utilities info
      utilities_min DECIMAL(10,2),
      utilities_max DECIMAL(10,2),
      utilities_included BOOLEAN DEFAULT FALSE,
      
      -- Commission
      platform_commission_rate DECIMAL(5,2) DEFAULT 10.00,
      
      -- Currency
      currency_code VARCHAR(3) DEFAULT 'RWF',
      
      -- Timestamps
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_pricing_uid (pricing_uid),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await isanzureQuery(sql);
    console.log("✅ Property pricing table is ready");
  } catch (err) {
    console.error("❌ Error creating property pricing table:", err);
  }
};

// 7. Create property_rules table
const createPropertyRulesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS property_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rule_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      property_id INT NOT NULL UNIQUE,
      
      -- Timing rules
      check_in_time TIME DEFAULT '14:00',
      check_out_time TIME DEFAULT '11:00',
      
      -- Cancellation policy
      cancellation_policy ENUM('flexible', 'moderate', 'strict') DEFAULT 'flexible',
      
      -- Boolean rules
      smoking_allowed BOOLEAN DEFAULT FALSE,
      pets_allowed BOOLEAN DEFAULT FALSE,
      events_allowed BOOLEAN DEFAULT FALSE,
      guests_allowed BOOLEAN DEFAULT FALSE,
      
      -- Payment rules
      late_payment_fee DECIMAL(5,2) DEFAULT 0.00,
      grace_period_days INT DEFAULT 3,
      
      -- Additional rules
      house_rules TEXT,
      
      -- Timestamps
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_rule_uid (rule_uid),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await isanzureQuery(sql);
    console.log("✅ Property rules table is ready");
  } catch (err) {
    console.error("❌ Error creating property rules table:", err);
  }
};

// 8. Create property_nearby_attractions table
const createPropertyNearbyAttractionsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS property_nearby_attractions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attraction_uid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
      property_id INT NOT NULL,
      attraction_name VARCHAR(255) NOT NULL,
      attraction_type ENUM('landmark', 'market', 'school', 'hospital', 'transport', 'park', 'other') DEFAULT 'landmark',
      distance_km DECIMAL(5,2),
      description TEXT,
      
      INDEX idx_property_id (property_id),
      INDEX idx_attraction_uid (attraction_uid),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await isanzureQuery(sql);
    console.log("✅ Property nearby attractions table is ready");
  } catch (err) {
    console.error("❌ Error creating property nearby attractions table:", err);
  }
};

// Seed default amenities
const seedDefaultAmenities = async () => {
  const amenities = [
    // Basic Infrastructure
    { key: 'electricity_24_7', name: '24/7 Electricity', category: 'infrastructure', is_common: true },
    { key: 'running_water', name: 'Running Water', category: 'infrastructure', is_common: true },
    { key: 'wifi', name: 'WiFi Internet', category: 'infrastructure', is_common: true },
    { key: 'borehole', name: 'Borehole Water', category: 'infrastructure', is_common: true },
    { key: 'solar_power', name: 'Solar Power', category: 'infrastructure', is_common: true },
    { key: 'generator', name: 'Generator Backup', category: 'infrastructure', is_common: false },

    // Security Features
    { key: 'compound_security', name: 'Compound Security', category: 'security', is_common: true },
    { key: 'watchman', name: 'Watchman/Guard', category: 'security', is_common: true },
    { key: 'cctv', name: 'CCTV Cameras', category: 'security', is_common: false },
    { key: 'alarm', name: 'Security Alarm', category: 'security', is_common: false },
    { key: 'gate', name: 'Electric Gate', category: 'security', is_common: false },

    // Comfort & Climate
    { key: 'air_conditioning', name: 'Air Conditioning', category: 'comfort', is_common: false },
    { key: 'ceiling_fans', name: 'Ceiling Fans', category: 'comfort', is_common: true },
    { key: 'heating', name: 'Water Heating', category: 'comfort', is_common: false },
    { key: 'fireplace', name: 'Fireplace', category: 'comfort', is_common: false },

    // Entertainment & Electronics
    { key: 'television', name: 'Television', category: 'entertainment', is_common: true },
    { key: 'dstv', name: 'DSTV/Freeview', category: 'entertainment', is_common: true },
    { key: 'sound_system', name: 'Sound System', category: 'entertainment', is_common: false },
    { key: 'smart_tv', name: 'Smart TV', category: 'entertainment', is_common: false },

    // Kitchen Facilities
    { key: 'fridge', name: 'Refrigerator', category: 'kitchen', is_common: true },
    { key: 'oven', name: 'Oven/Stove', category: 'kitchen', is_common: true },
    { key: 'microwave', name: 'Microwave', category: 'kitchen', is_common: false },
    { key: 'dishwasher', name: 'Dishwasher', category: 'kitchen', is_common: false },
    { key: 'kitchen_utensils', name: 'Kitchen Utensils', category: 'kitchen', is_common: true },

    // Laundry & Cleaning
    { key: 'washing_machine', name: 'Washing Machine', category: 'laundry', is_common: false },
    { key: 'dryer', name: 'Clothes Dryer', category: 'laundry', is_common: false },
    { key: 'iron', name: 'Iron & Board', category: 'laundry', is_common: true },
    { key: 'vacuum', name: 'Vacuum Cleaner', category: 'laundry', is_common: false },

    // Outdoor & Recreational
    { key: 'parking', name: 'Parking Space', category: 'outdoor', is_common: true },
    { key: 'garden', name: 'Garden/Yard', category: 'outdoor', is_common: false },
    { key: 'balcony', name: 'Balcony/Veranda', category: 'outdoor', is_common: true },
    { key: 'swimming_pool', name: 'Swimming Pool', category: 'outdoor', is_common: false },
    { key: 'bbq_area', name: 'BBQ Area', category: 'outdoor', is_common: false },

    // Fitness & Wellness
    { key: 'gym', name: 'Home Gym', category: 'fitness', is_common: false },
    { key: 'yoga_space', name: 'Yoga Space', category: 'fitness', is_common: false },

    // Business & Work
    { key: 'workspace', name: 'Workspace/Desk', category: 'work', is_common: true },
    { key: 'high_speed_wifi', name: 'High-Speed WiFi', category: 'work', is_common: false },
    { key: 'printer', name: 'Printer/Scanner', category: 'work', is_common: false },

    // Accessibility
    { key: 'elevator', name: 'Elevator', category: 'accessibility', is_common: false },
    { key: 'ramp', name: 'Wheelchair Ramp', category: 'accessibility', is_common: false },

    // Additional Features
    { key: 'storage', name: 'Storage Space', category: 'additional', is_common: true },
    { key: 'backup_power', name: 'Power Backup', category: 'additional', is_common: false },
    { key: 'rainwater', name: 'Rainwater Tank', category: 'additional', is_common: true },
    { key: 'water_filter', name: 'Water Filter', category: 'additional', is_common: false }
  ];

  try {
    for (const amenity of amenities) {
      const checkSql = `SELECT id FROM property_amenities WHERE amenity_key = ?`;
      const existing = await isanzureQuery(checkSql, [amenity.key]);

      if (existing.length === 0) {
        const insertSql = `
          INSERT INTO property_amenities (amenity_key, amenity_name, category, is_common) 
          VALUES (?, ?, ?, ?)
        `;
        await isanzureQuery(insertSql, [
          amenity.key,
          amenity.name,
          amenity.category,
          amenity.is_common
        ]);
      }
    }
    console.log("✅ Default amenities seeded successfully");
  } catch (err) {
    console.error("❌ Error seeding default amenities:", err);
  }
};

// Initialize iSanzure database 
const initializeIsanzureDatabase = async () => {
  try {
    console.log("🏡 Initializing iSanzure database...");

    // Create tables in order (respecting foreign key dependencies)
    await createIsanzureUsersTable();
    await createVerificationHistoryTable();
    await createWithdrawalAccountHistoryTable();
    await createPinChangeHistoryTable();
    await createContactInfoHistoryTable();
    await createPinVerificationTokensTable();
    await createSecurityAuditLogTable();
    await createPropertiesTable();
    await createPropertyImagesTable();
    await createPropertyAmenitiesTable();
    await createPropertyAmenityJunctionTable();
    await createPropertyRoomsTable();
    await createPropertyEquipmentTable();
    await createPropertyPricingTable();
    await createPropertyRulesTable();
    await createPropertyNearbyAttractionsTable();

    console.log("✅ iSanzure database initialization complete");
    return true;
  } catch (err) {
    console.error("❌ Error initializing iSanzure database:", err);
    return false;
  }
};

module.exports = {
  isanzureDb,
  isanzureQuery,
  initializeIsanzureDatabase
};