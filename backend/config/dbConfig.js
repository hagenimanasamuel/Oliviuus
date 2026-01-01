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
      onboarding_completed BOOLEAN DEFAULT FALSE,
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
        genres JSON,
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
    
    session_mode ENUM('parent', 'kid') NULL,
    active_kid_profile_id INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_session_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE,
    
    -- ADD THIS FOREIGN KEY:
    CONSTRAINT fk_user_session_kid_profile
      FOREIGN KEY (active_kid_profile_id) 
      REFERENCES kids_profiles(id) 
      ON DELETE SET NULL
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

const createSecurityLogsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS security_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      action VARCHAR(100) NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      device_info JSON, -- REMOVED DEFAULT NULL
      status ENUM('success', 'failed', 'blocked') NOT NULL,
      details JSON, -- REMOVED DEFAULT NULL
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_action (action),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at),
      INDEX idx_ip_address (ip_address),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `;

  try {
    await query(sql);
    console.log("✅ security_logs table is ready");
  } catch (err) {
    console.error("❌ Error creating security_logs table:", err);
  }
};

const createSubscriptionsTables = async () => {
  try {
    // 1️⃣ Subscriptions table
  const sqlSubscriptions = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      name_translations JSON,
      type ENUM('mobile','basic','standard','family','free','custom') NOT NULL DEFAULT 'free',
      price INT NOT NULL DEFAULT 0,
      original_price INT DEFAULT NULL,
      description TEXT DEFAULT NULL,
      description_translations JSON,
      tagline VARCHAR(255) DEFAULT NULL,
      tagline_translations JSON,
      currency VARCHAR(3) DEFAULT 'RWF',
      devices_allowed JSON NOT NULL,
      max_sessions INT NOT NULL DEFAULT 1,
      max_devices_registered INT DEFAULT 10,
      supported_platforms JSON,
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
      content_restrictions JSON,
      max_profiles INT DEFAULT 1,
      is_family_plan BOOLEAN DEFAULT FALSE,
      parental_controls BOOLEAN DEFAULT FALSE,
      
      -- Family Plan Column (NEW)
      max_family_members INT DEFAULT 0,
      
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
    
    -- Subscription details at time of purchase (in case plan changes)
    subscription_name VARCHAR(255) NOT NULL,
    subscription_price DECIMAL(10,2) NOT NULL,
    subscription_currency VARCHAR(10) DEFAULT 'RWF',
    payment_reference VARCHAR(255) DEFAULT NULL,
    
    -- Date tracking
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    trial_end_date DATETIME DEFAULT NULL,
    cancelled_at DATETIME DEFAULT NULL,
    
    -- Status and billing
    status ENUM('active', 'expired', 'cancelled', 'past_due', 'trialing') DEFAULT 'active',
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method_id INT DEFAULT NULL, -- Reference to payment methods table
    
    -- Cancellation details
    cancellation_reason ENUM('user_cancelled', 'payment_failed', 'upgraded', 'downgraded', 'other') DEFAULT NULL,
    
    -- Grace period for expired subscriptions
    grace_period_ends DATETIME DEFAULT NULL,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date),
    INDEX idx_user_status (user_id, status),
    INDEX idx_payment_reference (payment_reference)
  );
`;

    await query(sqlUserSubscriptions);

    // 3️⃣ Payment methods table
    const sqlPaymentMethods = `
  CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Payment method details
    type ENUM('card', 'mobile_money', 'bank_transfer', 'paypal') NOT NULL,
    provider ENUM('stripe', 'paypal', 'momo', 'airtel_money', 'bank') NOT NULL,
    
    -- Generic payment method identifier (last 4 digits, phone number, etc.)
    last_four VARCHAR(4) DEFAULT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    bank_name VARCHAR(100) DEFAULT NULL,
    account_name VARCHAR(255) DEFAULT NULL,
    
    -- For card payments
    brand VARCHAR(50) DEFAULT NULL, -- visa, mastercard, etc.
    expiry_month INT DEFAULT NULL,
    expiry_year INT DEFAULT NULL,
    
    -- Provider-specific identifiers
    provider_payment_method_id VARCHAR(255) DEFAULT NULL, -- stripe_pm_xxx, etc.
    provider_customer_id VARCHAR(255) DEFAULT NULL, -- stripe_cus_xxx, etc.
    
    -- Security
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255) DEFAULT NULL,
    
    -- Status
    status ENUM('active', 'inactive', 'expired', 'failed') DEFAULT 'active',
    
    -- Metadata
    metadata JSON,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    verified_at DATETIME DEFAULT NULL,
    
    -- Indexes (without WHERE clauses for MariaDB compatibility)
    INDEX idx_user_id (user_id),
    INDEX idx_user_default (user_id, is_default),
    INDEX idx_provider_id (provider_payment_method_id),
    INDEX idx_status (status),
    INDEX idx_user_provider_default (user_id, provider, is_default)
  );
`;

    await query(sqlPaymentMethods);

    const sqlPaymentTransactions = `
  CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subscription_id INT NULL,
    user_subscription_id INT NULL,
    payment_method_id INT NULL,
    
    -- Transaction details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RWF',
    status ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
    transaction_type ENUM('subscription', 'one_time', 'refund') NOT NULL,
    fee_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) DEFAULT NULL,
    amount_sent DECIMAL(10,2) DEFAULT NULL,
    
    -- Provider details
    provider ENUM('stripe', 'paypal', 'momo', 'airtel_money', 'bank') NOT NULL,
    provider_transaction_id VARCHAR(255) DEFAULT NULL, -- stripe_pi_xxx, etc.
    provider_payment_intent_id VARCHAR(255) DEFAULT NULL,
    
    -- Description
    description TEXT DEFAULT NULL,
    invoice_id VARCHAR(255) DEFAULT NULL,
    
    -- Error handling
    error_code VARCHAR(100) DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    
    -- Timestamps
    paid_at DATETIME DEFAULT NULL,
    refunded_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (user_subscription_id) REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_provider_transaction (provider_transaction_id),
    INDEX idx_created_at (created_at),
    INDEX idx_user_subscription (user_subscription_id)
  );
`;

    await query(sqlPaymentTransactions);
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

const createNotificationsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('unread', 'read', 'archived') DEFAULT 'unread',
      metadata JSON,
      
      -- Icon field for frontend - remove any constraints
      icon VARCHAR(100) DEFAULT 'bell',
      
      -- Reference to related entity
      reference_id INT DEFAULT NULL,
      reference_type ENUM(
        'subscription', 
        'user_session', 
        'contact', 
        'user', 
        'system'
      ) DEFAULT NULL,
      
      -- Action URL for frontend navigation
      action_url VARCHAR(500) DEFAULT NULL,
      
      -- Priority for sorting/filtering
      priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
      
      -- Timestamps for lifecycle tracking
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL DEFAULT NULL,
      expires_at TIMESTAMP NULL DEFAULT NULL,
      
      -- Foreign key constraint
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      
      -- Indexes for performance
      INDEX idx_notifications_user_id (user_id),
      INDEX idx_notifications_status (status),
      INDEX idx_notifications_created_at (created_at),
      INDEX idx_notifications_type (type),
      INDEX idx_notifications_reference (reference_type, reference_id),
      INDEX idx_notifications_user_status (user_id, status),
      INDEX idx_notifications_type_created (type, created_at)
    );
  `;

  try {
    await query(sql);
    console.log("✅ notifications table is ready");
  } catch (err) {
    console.error("❌ Error creating notifications table:", err);
  }
};

const createContentTables = async () => {
  try {
    // 1. Genres table
    const sqlGenres = `
      CREATE TABLE IF NOT EXISTS genres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_genres_slug (slug),
        INDEX idx_genres_active (is_active),
        INDEX idx_genres_order (sort_order)
      );
    `;
    await query(sqlGenres);

    // 2. Categories table
    const sqlCategories = `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        parent_id INT DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_categories_slug (slug),
        INDEX idx_categories_parent (parent_id),
        INDEX idx_categories_active (is_active)
      );
    `;
    await query(sqlCategories);

    // 3. Main contents table with SEO optimization
    const sqlContents = `
      CREATE TABLE IF NOT EXISTS contents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Basic identification
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        short_description TEXT,
        
        -- Content classification
        content_type ENUM('movie', 'series', 'documentary', 'short_film', 'live_event') NOT NULL,
        status ENUM('draft', 'published', 'archived', 'scheduled') DEFAULT 'draft',
        visibility ENUM('public', 'private', 'unlisted') DEFAULT 'public',

        -- optional fields
        production_company VARCHAR(255) DEFAULT NULL,
        budget DECIMAL(15,2) DEFAULT NULL,
        subject VARCHAR(255) DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        festival VARCHAR(255) DEFAULT NULL,
        
        -- Core metadata
        age_rating VARCHAR(10) DEFAULT 'G',
        primary_language VARCHAR(10) DEFAULT 'en',
        duration_minutes INT,
        release_date DATE,
        director VARCHAR(255),
        
        -- Series-specific fields
        total_seasons INT DEFAULT NULL,
        episodes_per_season INT DEFAULT NULL,
        episode_duration_minutes INT DEFAULT NULL,
        
        -- Live event specific
        event_date DATETIME DEFAULT NULL,
        event_location VARCHAR(255) DEFAULT NULL,
        expected_audience INT DEFAULT NULL,
        
        -- SEO optimization
        meta_title VARCHAR(255),
        meta_description TEXT,
        keywords TEXT,
        canonical_url VARCHAR(500),
        
        -- Publishing control
        published_at DATETIME DEFAULT NULL,
        scheduled_publish_at DATETIME DEFAULT NULL,
        featured BOOLEAN DEFAULT FALSE,
        trending BOOLEAN DEFAULT FALSE,
        featured_order INT DEFAULT 0,
        
        -- Engagement metrics
        view_count BIGINT DEFAULT 0,
        like_count INT DEFAULT 0,
        share_count INT DEFAULT 0,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        rating_count INT DEFAULT 0,
        
        -- Content quality
        content_quality ENUM('SD', 'HD', 'FHD', 'UHD') DEFAULT 'HD',
        has_subtitles BOOLEAN DEFAULT FALSE,
        has_dubbing BOOLEAN DEFAULT FALSE,
        
        -- Ownership & timestamps
        created_by INT NOT NULL,
        updated_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign keys
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE,
        
        -- SEO and performance indexes
        INDEX idx_contents_slug (slug),
        INDEX idx_contents_type_status (content_type, status),
        INDEX idx_contents_status_visibility (status, visibility),
        INDEX idx_contents_published (published_at),
        INDEX idx_contents_featured (featured, featured_order),
        INDEX idx_contents_trending (trending),
        INDEX idx_contents_release_date (release_date),
        INDEX idx_contents_view_count (view_count),
        INDEX idx_contents_rating (average_rating),
        INDEX idx_contents_created_at (created_at),
        INDEX idx_contents_scheduled (scheduled_publish_at),
        FULLTEXT KEY idx_contents_ft_search (title, description, keywords)
      );
    `;
    await query(sqlContents);

    // 4. Content warnings
    const sqlContentWarnings = `
      CREATE TABLE IF NOT EXISTS content_warnings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NOT NULL,
        warning_type VARCHAR(100) NOT NULL,
        severity ENUM('mild', 'moderate', 'strong') DEFAULT 'mild',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        INDEX idx_content_warnings_content (content_id),
        INDEX idx_content_warnings_type (warning_type)
      );
    `;
    await query(sqlContentWarnings);

    // 5. Content subtitles
    const sqlContentSubtitles = `
      CREATE TABLE IF NOT EXISTS content_subtitles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NOT NULL,
        language_code VARCHAR(10) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT,
        is_auto_generated BOOLEAN DEFAULT FALSE,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        UNIQUE KEY unique_content_language (content_id, language_code),
        INDEX idx_subtitles_content (content_id),
        INDEX idx_subtitles_language (language_code)
      );
    `;
    await query(sqlContentSubtitles);

    // 6. Media assets table
    const sqlMediaAssets = `
      CREATE TABLE IF NOT EXISTS media_assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NOT NULL,
        
        -- Asset classification
        asset_type ENUM(
        'thumbnail', 'poster', 'mainVideo', 'trailer', 'behind_scenes',
        'screenshot', 'teaser', 'key_art', 'season_poster',
        'episodeVideo', 'episodeThumbnail', 'episodeTrailer'
      ) NOT NULL,
        
        -- File information
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        
        -- Enhanced metadata fields
        asset_title VARCHAR(255), -- Custom title for the asset
        asset_description TEXT,   -- Custom description for the asset
        
        -- Media-specific metadata
        resolution VARCHAR(20),
        duration_seconds INT,
        bitrate INT,
        format VARCHAR(50),
        
        -- For series/episode assets
        season_number INT DEFAULT NULL,
        episode_number INT DEFAULT NULL,
        
        -- Episode-specific metadata
        episode_title VARCHAR(255), -- Title of the episode this asset belongs to
        episode_description TEXT,   -- Description of the episode
        
        -- Processing status
        upload_status ENUM('pending', 'uploading', 'processing', 'completed', 'failed') DEFAULT 'pending',
        processing_progress INT DEFAULT 0,
        
        -- Quality/validation
        is_primary BOOLEAN DEFAULT FALSE,
        is_optimized BOOLEAN DEFAULT FALSE,
        validation_errors JSON,
        
        -- SEO for images
        alt_text VARCHAR(255),
        caption TEXT,
        
        -- Subtitle tracking
        has_subtitles BOOLEAN DEFAULT FALSE,
        subtitle_languages JSON, -- Stores array of available subtitle languages ['en', 'fr', 'rw', 'sw']
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        
        -- Performance indexes
        INDEX idx_media_content (content_id),
        INDEX idx_media_type (asset_type),
        INDEX idx_media_status (upload_status),
        INDEX idx_media_season_episode (season_number, episode_number),
        INDEX idx_media_primary (is_primary),
        INDEX idx_media_has_subtitles (has_subtitles),
        
        -- Regular unique constraint
        UNIQUE KEY unique_content_asset (content_id, asset_type, season_number, episode_number)
      );
    `;
    await query(sqlMediaAssets);

    // 7. Content rights and licensing
    const sqlContentRights = `
      CREATE TABLE IF NOT EXISTS content_rights (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NOT NULL,
        
        -- License information
        license_type ENUM('exclusive', 'non-exclusive', 'limited', 'perpetual') NOT NULL,
        start_date DATE,
        end_date DATE,
        exclusive BOOLEAN DEFAULT FALSE,
        
        -- Usage rights
        downloadable BOOLEAN DEFAULT FALSE,
        shareable BOOLEAN DEFAULT FALSE,
        commercial_use BOOLEAN DEFAULT FALSE,
        georestricted BOOLEAN DEFAULT FALSE,
        
        -- Geographical restrictions
        allowed_regions JSON,
        blocked_countries JSON,
        
        -- Financial
        license_fee DECIMAL(10,2),
        revenue_share_percentage DECIMAL(5,2),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        UNIQUE KEY unique_content_rights (content_id),
        INDEX idx_rights_license_type (license_type),
        INDEX idx_rights_dates (start_date, end_date)
      );
    `;
    await query(sqlContentRights);

    // 8. Content-genre relationships - FIXED VERSION
    const sqlContentGenres = `
      CREATE TABLE IF NOT EXISTS content_genres (
        content_id INT NOT NULL,
        genre_id INT NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
        PRIMARY KEY (content_id, genre_id),
        INDEX idx_content_genres_primary (is_primary)
      );
    `;
    await query(sqlContentGenres);

    // 9. Content-category relationships - FIXED VERSION
    const sqlContentCategories = `
      CREATE TABLE IF NOT EXISTS content_categories (
        content_id INT NOT NULL,
        category_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (content_id, category_id)
      );
    `;
    await query(sqlContentCategories);

    // 10. Seasons table (for series content)
    const sqlSeasons = `
      CREATE TABLE IF NOT EXISTS seasons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NOT NULL,
        season_number INT NOT NULL,
        title VARCHAR(255),
        description TEXT,
        
        -- Enhanced metadata
        season_title VARCHAR(255), -- Custom title for this season
        season_description TEXT,   -- Custom description for this season
        
        release_date DATE,
        episode_count INT DEFAULT 0,
        
        -- Media tracking
        has_poster BOOLEAN DEFAULT FALSE,
        poster_asset_id INT DEFAULT NULL,
        
        -- SEO
        slug VARCHAR(255),
        meta_title VARCHAR(255),
        meta_description TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (poster_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL,
        UNIQUE KEY unique_season (content_id, season_number),
        INDEX idx_seasons_content (content_id),
        INDEX idx_seasons_number (season_number),
        INDEX idx_seasons_slug (slug),
        INDEX idx_seasons_has_poster (has_poster)
      );
    `;
    await query(sqlSeasons);

    // 11. Episodes table
    const sqlEpisodes = `
      CREATE TABLE IF NOT EXISTS episodes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        season_id INT NOT NULL,
        episode_number INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        
        -- Enhanced metadata
        episode_title VARCHAR(255), -- Custom title for this specific episode
        episode_description TEXT,   -- Custom description for this episode
        
        duration_minutes INT,
        release_date DATE,
        
        -- SEO
        slug VARCHAR(255),
        meta_title VARCHAR(255),
        meta_description TEXT,
        
        -- Engagement
        view_count BIGINT DEFAULT 0,
        like_count INT DEFAULT 0,
        
        -- Media tracking
        has_media_assets BOOLEAN DEFAULT FALSE,
        media_assets_count INT DEFAULT 0,
        
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
        UNIQUE KEY unique_episode (season_id, episode_number),
        INDEX idx_episodes_season (season_id),
        INDEX idx_episodes_number (episode_number),
        INDEX idx_episodes_slug (slug),
        INDEX idx_episodes_order (sort_order),
        INDEX idx_episodes_has_media (has_media_assets)
      );
    `;
    await query(sqlEpisodes);

    // 12. Content reviews and ratings
    const sqlContentRatings = `
      CREATE TABLE IF NOT EXISTS content_ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NOT NULL,
        user_id INT NOT NULL,
        rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_title VARCHAR(255),
        review_text TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        helpful_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_content_user_rating (content_id, user_id),
        INDEX idx_ratings_content (content_id),
        INDEX idx_ratings_user (user_id),
        INDEX idx_ratings_rating (rating),
        INDEX idx_ratings_verified (is_verified),
        FULLTEXT KEY idx_ratings_ft_search (review_title, review_text)
      );
    `;
    await query(sqlContentRatings);

    // 13. Content view history for recommendations
  const sqlContentViewHistory = `
    CREATE TABLE IF NOT EXISTS content_view_history (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      content_id INT NOT NULL,
      user_id INT NOT NULL,
      session_id VARCHAR(255) NOT NULL,
      watch_duration_seconds INT NOT NULL,
      percentage_watched DECIMAL(5,2),
      device_type ENUM('web', 'mobile', 'tablet', 'smarttv'),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      
      -- UNIQUE CONSTRAINTS TO PREVENT DUPLICATES (MariaDB compatible)
      UNIQUE KEY unique_user_content_session (user_id, content_id, session_id),
      
      INDEX idx_view_history_content (content_id),
      INDEX idx_view_history_user (user_id),
      INDEX idx_view_history_created (created_at),
      INDEX idx_view_history_user_content (user_id, content_id),
      INDEX idx_view_history_session (session_id)
    );
  `;
    await query(sqlContentViewHistory);

    // 14. Media asset subtitles
    const sqlMediaAssetSubtitles = `
      CREATE TABLE IF NOT EXISTS media_asset_subtitles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        media_asset_id INT NOT NULL,
        language_code VARCHAR(10) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT,
        is_default BOOLEAN DEFAULT FALSE,
        is_auto_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE CASCADE,
        UNIQUE KEY unique_asset_language (media_asset_id, language_code),
        INDEX idx_asset_subtitles_asset (media_asset_id),
        INDEX idx_asset_subtitles_language (language_code)
      );
    `;
    await query(sqlMediaAssetSubtitles);

    console.log("✅ All content tables created successfully!");

    // Insert default genres
    await insertDefaultGenres();
    await insertDefaultCategories();
    console.log("✅ Default genres inserted");

  } catch (err) {
    console.error("❌ Error creating content tables:", err);
  }
};

const createShareTables = async () => {
  try {
    // Content shares table
    const sqlContentShares = `
      CREATE TABLE IF NOT EXISTS content_shares (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NOT NULL,
        user_id INT NOT NULL,
        platform VARCHAR(50) NOT NULL DEFAULT 'direct',
        method VARCHAR(50) DEFAULT 'share_modal',
        share_url VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_shares_content (content_id),
        INDEX idx_shares_user (user_id),
        INDEX idx_shares_platform (platform),
        INDEX idx_shares_created (created_at),
        INDEX idx_shares_content_user (content_id, user_id)
      );
    `;
    await query(sqlContentShares);

    console.log("✅ Share tracking table created successfully!");

  } catch (error) {
    console.error("❌ Error creating share tracking table:", error);
  }
};

// Helper function to insert default genres
const insertDefaultGenres = async () => {
  const defaultGenres = [
    { name: 'Action', slug: 'action', description: 'High-energy action movies' },
    { name: 'Comedy', slug: 'comedy', description: 'Funny and entertaining content' },
    { name: 'Drama', slug: 'drama', description: 'Emotional and character-driven stories' },
    { name: 'Romance', slug: 'romance', description: 'Love and relationship stories' },
    { name: 'Thriller', slug: 'thriller', description: 'Suspenseful and exciting content' },
    { name: 'Horror', slug: 'horror', description: 'Scary and frightening content' },
    { name: 'Documentary', slug: 'documentary', description: 'Factual and educational content' },
    { name: 'Sci-Fi', slug: 'sci-fi', description: 'Science fiction and futuristic stories' },
    { name: 'Fantasy', slug: 'fantasy', description: 'Magical and imaginative stories' },
    { name: 'Animation', slug: 'animation', description: 'Animated content for all ages' },
    { name: 'Family', slug: 'family', description: 'Content suitable for all family members' },
    { name: 'Adventure', slug: 'adventure', description: 'Exciting journey and exploration stories' }
  ];

  for (const genre of defaultGenres) {
    const sql = `
      INSERT IGNORE INTO genres (name, slug, description) 
      VALUES (?, ?, ?)
    `;
    await query(sql, [genre.name, genre.slug, genre.description]);
  }
};

const insertDefaultCategories = async () => {
  try {
    const defaultCategories = [
      { id: 1, name: 'Action', slug: 'action', description: 'High-energy content with exciting sequences' },
      { id: 2, name: 'Comedy', slug: 'comedy', description: 'Funny and entertaining content' },
      { id: 3, name: 'Drama', slug: 'drama', description: 'Serious, emotional storytelling' },
      { id: 4, name: 'Horror', slug: 'horror', description: 'Scary and suspenseful content' },
      { id: 5, name: 'Sci-Fi', slug: 'sci-fi', description: 'Science fiction and futuristic content' },
      { id: 6, name: 'Documentary', slug: 'documentary', description: 'Factual and educational content' },
      { id: 7, name: 'Animation', slug: 'animation', description: 'Animated films and series' },
      { id: 8, name: 'Thriller', slug: 'thriller', description: 'Suspenseful and exciting content' },
      { id: 9, name: 'Romance', slug: 'romance', description: 'Love stories and romantic content' },
      { id: 10, name: 'Adventure', slug: 'adventure', description: 'Exciting journeys and exploration' },
      { id: 11, name: 'Fantasy', slug: 'fantasy', description: 'Magical and mythical content' },
      { id: 12, name: 'Mystery', slug: 'mystery', description: 'Puzzle-solving and detective stories' },
      { id: 13, name: 'Crime', slug: 'crime', description: 'Criminal activities and investigations' },
      { id: 14, name: 'Family', slug: 'family', description: 'Content suitable for all ages' },
      { id: 15, name: 'Music', slug: 'music', description: 'Music-related content and concerts' },
      { id: 16, name: 'Sports', slug: 'sports', description: 'Sports events and athletic content' },
      { id: 17, name: 'Biography', slug: 'biography', description: 'Life stories and historical figures' },
      { id: 18, name: 'History', slug: 'history', description: 'Historical events and periods' },
      { id: 19, name: 'War', slug: 'war', description: 'Military and wartime content' },
      { id: 20, name: 'Western', slug: 'western', description: 'Cowboy and frontier stories' }
    ];

    for (const category of defaultCategories) {
      await query(
        `INSERT IGNORE INTO categories 
        (id, name, slug, description, is_active, sort_order, created_at, updated_at) 
        VALUES (?, ?, ?, ?, TRUE, ?, NOW(), NOW())`,
        [category.id, category.name, category.slug, category.description, category.id]
      );
    }

    console.log("✅ Default categories inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting default categories:", error);
  }
};

const createPeopleTables = async () => {
  try {
    // People table (actors, directors, crew members)
    const sqlPeople = `
      CREATE TABLE IF NOT EXISTS people (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Basic information
        full_name VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        bio TEXT,
        
        -- Personal details
        date_of_birth DATE,
        place_of_birth VARCHAR(255),
        nationality VARCHAR(100),
        gender ENUM('male', 'female', 'other') DEFAULT 'other',
        
        -- Professional details
        primary_role ENUM('actor', 'director', 'producer', 'writer', 'cinematographer', 'composer', 'editor', 'other') NOT NULL,
        other_roles JSON,
        
        -- Contact and representation (optional)
        agent_name VARCHAR(255),
        agent_contact VARCHAR(255),
        
        -- Media and assets
        profile_image_url VARCHAR(500),
        gallery_images JSON,
        
        -- Social media and links
        website_url VARCHAR(500),
        imdb_url VARCHAR(500),
        wikipedia_url VARCHAR(500),
        social_links JSON,
        
        -- Status and metadata
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        popularity_score INT DEFAULT 0,
        
        -- SEO and discovery
        search_keywords JSON,
        slug VARCHAR(255) UNIQUE NOT NULL,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes for performance
        INDEX idx_people_name (full_name),
        INDEX idx_people_role (primary_role),
        INDEX idx_people_active (is_active),
        INDEX idx_people_slug (slug),
        INDEX idx_people_popularity (popularity_score),
        FULLTEXT KEY idx_people_search (full_name, display_name, bio)
      );
    `;
    await query(sqlPeople);

    // Content people relationships (casting)
    const sqlContentPeople = `
      CREATE TABLE IF NOT EXISTS content_people (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NOT NULL,
        person_id INT NOT NULL,
        
        -- Role in this specific content
        role_type ENUM('actor', 'director', 'producer', 'writer', 'cinematographer', 'composer', 'editor', 'crew') NOT NULL,
        character_name VARCHAR(255) DEFAULT NULL, -- For actors
        role_description TEXT DEFAULT NULL, -- For other roles
        
        -- Billing and credits
        billing_order INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        credit_type ENUM('starring', 'supporting', 'guest', 'cameo', 'voice') DEFAULT 'supporting',
        
        -- Episode-specific for series (NULL for movies)
        season_number INT DEFAULT NULL,
        episode_number INT DEFAULT NULL,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign keys
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
        
        -- Indexes
        UNIQUE KEY unique_content_person_role (content_id, person_id, role_type, season_number, episode_number),
        INDEX idx_content_people_content (content_id),
        INDEX idx_content_people_person (person_id),
        INDEX idx_content_people_role (role_type),
        INDEX idx_content_people_billing (billing_order)
      );
    `;
    await query(sqlContentPeople);

    // Awards and nominations table
    const sqlAwards = `
      CREATE TABLE IF NOT EXISTS person_awards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        person_id INT NOT NULL,
        content_id INT NULL,
        
        -- Award details
        award_name VARCHAR(255) NOT NULL,
        award_category VARCHAR(255) NOT NULL,
        award_year YEAR NOT NULL,
        award_organization VARCHAR(255) NOT NULL,
        
        -- Result
        result ENUM('won', 'nominated', 'honored') NOT NULL,
        
        -- Ceremony details
        ceremony_date DATE,
        ceremony_name VARCHAR(255),
        
        -- Additional information
        notes TEXT,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign keys
        FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE SET NULL,
        
        -- Indexes
        INDEX idx_awards_person (person_id),
        INDEX idx_awards_year (award_year),
        INDEX idx_awards_result (result)
      );
    `;
    await query(sqlAwards);

    console.log("✅ People management tables created successfully!");

  } catch (error) {
    console.error("❌ Error creating people tables:", error);
  }
};

const createUserPreferencesTables = async () => {
  try {
    // User watchlist table
    const sqlWatchlist = `
      CREATE TABLE IF NOT EXISTS user_watchlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content_id INT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_content (user_id, content_id),
        INDEX idx_watchlist_user (user_id),
        INDEX idx_watchlist_content (content_id),
        INDEX idx_watchlist_added (added_at)
      );
    `;
    await query(sqlWatchlist);

    // User likes table
    const sqlLikes = `
      CREATE TABLE IF NOT EXISTS user_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unliked_at TIMESTAMP NULL,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_content_like (user_id, content_id),
        INDEX idx_likes_user (user_id),
        INDEX idx_likes_content (content_id),
        INDEX idx_likes_active (is_active),
        INDEX idx_likes_liked_at (liked_at)
      );
    `;
    await query(sqlLikes);

    console.log("✅ User preferences tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating user preferences tables:", error);
  }
};

const createWatchTrackingTables = async () => {
  try {
    // Content watch sessions table - FIXED
    const sqlWatchSessions = `
      CREATE TABLE IF NOT EXISTS content_watch_sessions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content_id INT NOT NULL,
        media_asset_id INT NULL,
        session_id VARCHAR(255) NOT NULL,
        device_type ENUM('web', 'mobile', 'tablet', 'smarttv') DEFAULT 'web',
        total_watch_time INT DEFAULT 0,
        max_watch_time INT DEFAULT 0,
        view_recorded BOOLEAN DEFAULT FALSE,
        view_recorded_at DATETIME NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL,
        
        INDEX idx_watch_sessions_user (user_id),
        INDEX idx_watch_sessions_content (content_id),
        INDEX idx_watch_sessions_session (session_id),
        INDEX idx_watch_sessions_activity (last_activity_at),
        INDEX idx_watch_sessions_user_content (user_id, content_id),
        INDEX idx_watch_sessions_created (created_at)
      );
    `;
    await query(sqlWatchSessions);

    // Content watch progress table - FIXED
    const sqlWatchProgress = `
      CREATE TABLE IF NOT EXISTS content_watch_progress (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        session_id BIGINT NOT NULL,
        playback_time DECIMAL(10,2) NOT NULL,
        duration DECIMAL(10,2) NOT NULL,
        percentage_watched DECIMAL(5,2) NOT NULL,
        watch_duration INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (session_id) REFERENCES content_watch_sessions(id) ON DELETE CASCADE,
        
        INDEX idx_watch_progress_session (session_id),
        INDEX idx_watch_progress_created (created_at)
      );
    `;
    await query(sqlWatchProgress);

    // User playback positions table - FIXED
    const sqlPlaybackPositions = `
      CREATE TABLE IF NOT EXISTS user_playback_positions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content_id INT NOT NULL,
        media_asset_id INT NULL,
        playback_time DECIMAL(10,2) NOT NULL,
        duration DECIMAL(10,2) NOT NULL,
        percentage_watched DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL,
        
        UNIQUE KEY unique_user_content_asset (user_id, content_id, media_asset_id),
        INDEX idx_playback_positions_user (user_id),
        INDEX idx_playback_positions_content (content_id),
        INDEX idx_playback_positions_updated (updated_at),
        INDEX idx_playback_positions_created (created_at)
      );
    `;
    await query(sqlPlaybackPositions);

    console.log("✅ Watch tracking tables created successfully!");

  } catch (error) {
    console.error("❌ Error creating watch tracking tables:", error);
  }
};

const createKidsTables = async () => {
  try {
    // 1. Main kids profiles table
    const sqlKidsProfiles = `
      CREATE TABLE IF NOT EXISTS kids_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        avatar_url VARCHAR(500) DEFAULT NULL,
        birth_date DATE NOT NULL,
        calculated_age INT NULL,
        
        -- Custom age ratings (using actual ages like 11+, 13+, etc.)
        max_content_age_rating VARCHAR(10) DEFAULT '7+',
        allowed_content_types JSON,
        
        -- Appearance & Experience
        theme_color VARCHAR(50) DEFAULT 'blue',
        interface_mode ENUM('simple', 'regular', 'detailed') DEFAULT 'simple',
        
        -- Parental Controls
        is_active BOOLEAN DEFAULT TRUE,
        require_pin_to_exit BOOLEAN DEFAULT TRUE,
        
        -- Time Restrictions
        daily_time_limit_minutes INT DEFAULT 120,
        bedtime_start TIME DEFAULT '21:00:00',
        bedtime_end TIME DEFAULT '07:00:00',
        
        -- Tracking
        total_watch_time_minutes INT DEFAULT 0,
        last_active_at TIMESTAMP NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_parent_kid_name (parent_user_id, name),
        INDEX idx_kids_parent (parent_user_id),
        INDEX idx_kids_active (is_active),
        INDEX idx_kids_age_rating (max_content_age_rating),
        INDEX idx_kids_birth_date (birth_date)
      );
    `;
    await query(sqlKidsProfiles);
    console.log("✅ kids_profiles table created");

    // 2. Kids content restrictions table
    const sqlKidsContentRestrictions = `
      CREATE TABLE IF NOT EXISTS kids_content_restrictions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kid_profile_id INT NOT NULL,
        
        -- Age-based restrictions
        max_age_rating VARCHAR(10) NOT NULL DEFAULT '7+',
        
        -- Content type restrictions
        allow_movies BOOLEAN DEFAULT TRUE,
        allow_series BOOLEAN DEFAULT TRUE,
        allow_live_events BOOLEAN DEFAULT FALSE,
        
        -- Genre restrictions
        blocked_genres JSON,
        allowed_genres JSON,
        
        -- Specific content restrictions
        blocked_content_ids JSON,
        allowed_content_ids JSON,
        
        -- Search & Discovery restrictions
        allow_search BOOLEAN DEFAULT TRUE,
        allow_trending BOOLEAN DEFAULT TRUE,
        allow_recommendations BOOLEAN DEFAULT TRUE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        UNIQUE KEY unique_kid_restrictions (kid_profile_id),
        INDEX idx_restrictions_age_rating (max_age_rating)
      );
    `;
    await query(sqlKidsContentRestrictions);
    console.log("✅ kids_content_restrictions table created");

    // 3. Kids viewing history table
    const sqlKidsViewingHistory = `
      CREATE TABLE IF NOT EXISTS kids_viewing_history (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        kid_profile_id INT NOT NULL,
        content_id INT NOT NULL,
        media_asset_id INT DEFAULT NULL,
        
        -- Viewing details
        watch_duration_seconds INT NOT NULL,
        percentage_watched DECIMAL(5,2) NOT NULL,
        device_type ENUM('web', 'mobile', 'tablet', 'smarttv') DEFAULT 'web',
        
        -- Session info
        session_id VARCHAR(255) NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        
        -- Engagement metrics
        liked_content BOOLEAN DEFAULT NULL,
        rating_given TINYINT DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL,
        
        INDEX idx_kids_history_kid (kid_profile_id),
        INDEX idx_kids_history_content (content_id),
        INDEX idx_kids_history_session (session_id),
        INDEX idx_kids_history_created (created_at),
        INDEX idx_kids_history_completed (completed_at)
      );
    `;
    await query(sqlKidsViewingHistory);
    console.log("✅ kids_viewing_history table created");

    // 4. Kids watchlist table
    const sqlKidsWatchlist = `
      CREATE TABLE IF NOT EXISTS kids_watchlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kid_profile_id INT NOT NULL,
        content_id INT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sort_order INT DEFAULT 0,
        
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_kid_watchlist (kid_profile_id, content_id),
        INDEX idx_kids_watchlist_kid (kid_profile_id),
        INDEX idx_kids_watchlist_content (content_id),
        INDEX idx_kids_watchlist_added (added_at)
      );
    `;
    await query(sqlKidsWatchlist);
    console.log("✅ kids_watchlist table created");

    // 5. Parental controls master table
    const sqlParentalControls = `
      CREATE TABLE IF NOT EXISTS parental_controls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_user_id INT NOT NULL,
        
        -- Master controls
        master_pin_code VARCHAR(64) NOT NULL,
        
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_parent_controls (parent_user_id),
        INDEX idx_parental_controls_parent (parent_user_id)
      );
    `;
    await query(sqlParentalControls);
    console.log("✅ parental_controls table created");

    // 6. Viewing time limits table
    const sqlViewingTimeLimits = `
      CREATE TABLE IF NOT EXISTS viewing_time_limits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kid_profile_id INT NOT NULL,
        
        -- Daily limits
        daily_time_limit_minutes INT DEFAULT 120,
        current_daily_usage INT DEFAULT 0,
        last_reset_date DATE DEFAULT CURDATE(),
        
        -- Weekly limits
        weekly_time_limit_minutes INT DEFAULT 600,
        current_weekly_usage INT DEFAULT 0,
        last_weekly_reset DATE DEFAULT CURDATE(),
        
        -- Time window restrictions
        allowed_start_time TIME DEFAULT '07:00:00',
        allowed_end_time TIME DEFAULT '21:00:00',
        
        -- Break reminders
        break_reminder_minutes INT DEFAULT 45,
        require_break_after_limit BOOLEAN DEFAULT TRUE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        UNIQUE KEY unique_kid_time_limits (kid_profile_id),
        INDEX idx_time_limits_kid (kid_profile_id)
      );
    `;
    await query(sqlViewingTimeLimits);
    console.log("✅ viewing_time_limits table created");

    // 7. Approved content overrides table
    const sqlApprovedContentOverrides = `
      CREATE TABLE IF NOT EXISTS approved_content_overrides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kid_profile_id INT NOT NULL,
        content_id INT NOT NULL,
        parent_user_id INT NOT NULL,
        
        -- Override details
        override_reason ENUM('educational', 'family_time', 'special_occasion', 'parent_choice') DEFAULT 'parent_choice',
        approved_until DATE DEFAULT NULL, -- NULL means permanently approved
        notes TEXT DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_kid_content_override (kid_profile_id, content_id),
        INDEX idx_approved_kid (kid_profile_id),
        INDEX idx_approved_content (content_id),
        INDEX idx_approved_parent (parent_user_id)
      );
    `;
    await query(sqlApprovedContentOverrides);
    console.log("✅ approved_content_overrides table created");

    // 8. Kids sessions table
    const sqlKidsSessions = `
      CREATE TABLE IF NOT EXISTS kids_sessions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        kid_profile_id INT NOT NULL,
        parent_user_id INT NOT NULL,
        
        -- Session details
        session_token VARCHAR(255) NOT NULL,
        device_type ENUM('web', 'mobile', 'tablet', 'smarttv') DEFAULT 'web',
        device_name VARCHAR(100),
        ip_address VARCHAR(45),
        
        -- Timing
        login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        logout_time DATETIME DEFAULT NULL,
        expires_at DATETIME NOT NULL,
        
        -- Status
        is_active BOOLEAN DEFAULT TRUE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_session_token (session_token),
        INDEX idx_kids_sessions_kid (kid_profile_id),
        INDEX idx_kids_sessions_parent (parent_user_id),
        INDEX idx_kids_sessions_active (is_active),
        INDEX idx_kids_sessions_expires (expires_at)
      );
    `;
    await query(sqlKidsSessions);
    console.log("✅ kids_sessions table created");

    // 9. Kids mode switches audit table
    const sqlKidsModeSwitches = `
      CREATE TABLE IF NOT EXISTS kids_mode_switches (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        parent_user_id INT NOT NULL,
        kid_profile_id INT NOT NULL,
        
        -- Switch details
        action ENUM('entered_kids_mode', 'exited_kids_mode') NOT NULL,
        entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        exited_at TIMESTAMP NULL,
        
        -- Duration calculation
        duration_seconds INT GENERATED ALWAYS AS (
          CASE 
            WHEN exited_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, entered_at, exited_at)
            ELSE NULL 
          END
        ) VIRTUAL,
        
        -- Context
        device_type ENUM('web', 'mobile', 'tablet', 'smarttv') DEFAULT 'web',
        ip_address VARCHAR(45),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        
        INDEX idx_mode_switches_parent (parent_user_id),
        INDEX idx_mode_switches_kid (kid_profile_id),
        INDEX idx_mode_switches_action (action),
        INDEX idx_mode_switches_entered (entered_at)
      );
    `;
    await query(sqlKidsModeSwitches);
    console.log("✅ kids_mode_switches table created");

    // 10. Kids recommendations table
    const sqlKidsRecommendations = `
      CREATE TABLE IF NOT EXISTS kids_recommendations (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        kid_profile_id INT NOT NULL,
        content_id INT NOT NULL,
        
        -- Recommendation details
        recommendation_score DECIMAL(5,4) NOT NULL,
        recommendation_reason ENUM('viewing_history', 'similar_kids', 'educational', 'trending', 'new_release') NOT NULL,
        
        -- Display & sorting
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_kid_recommendation (kid_profile_id, content_id),
        INDEX idx_kids_recommendations_kid (kid_profile_id),
        INDEX idx_kids_recommendations_score (recommendation_score),
        INDEX idx_kids_recommendations_active (is_active)
      );
    `;
    await query(sqlKidsRecommendations);
    console.log("✅ kids_recommendations table created");

    // 11. Kids ratings feedback table
    const sqlKidsRatingsFeedback = `
      CREATE TABLE IF NOT EXISTS kids_ratings_feedback (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        kid_profile_id INT NOT NULL,
        content_id INT NOT NULL,
        
        -- Simple kid-friendly ratings
        reaction ENUM('like', 'dislike', 'love', 'meh') NOT NULL,
        
        -- Optional simple feedback
        favorite_character VARCHAR(100) DEFAULT NULL,
        would_watch_again BOOLEAN DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_kid_content_feedback (kid_profile_id, content_id),
        INDEX idx_kids_feedback_kid (kid_profile_id),
        INDEX idx_kids_feedback_content (content_id),
        INDEX idx_kids_feedback_reaction (reaction)
      );
    `;
    await query(sqlKidsRatingsFeedback);
    console.log("✅ kids_ratings_feedback table created");

    // 12. Kids activity logs table
    const sqlKidsActivityLogs = `
      CREATE TABLE IF NOT EXISTS kids_activity_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        kid_profile_id INT NOT NULL,
        
        -- Activity details
        activity_type ENUM('search', 'content_view', 'content_attempt', 'time_limit', 'pin_entry', 'mode_switch') NOT NULL,
        activity_details JSON,
        
        -- Content context
        content_id INT DEFAULT NULL,
        search_query VARCHAR(500) DEFAULT NULL,
        
        -- Access control
        was_allowed BOOLEAN DEFAULT TRUE,
        restriction_reason VARCHAR(255) DEFAULT NULL,
        
        -- Device & location
        device_type ENUM('web', 'mobile', 'tablet', 'smarttv') DEFAULT 'web',
        ip_address VARCHAR(45),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE SET NULL,
        
        INDEX idx_kids_activity_kid (kid_profile_id),
        INDEX idx_kids_activity_type (activity_type),
        INDEX idx_kids_activity_allowed (was_allowed),
        INDEX idx_kids_activity_created (created_at)
      );
    `;
    await query(sqlKidsActivityLogs);
    console.log("✅ kids_activity_logs table created");

    // 13. Parent notifications table
    const sqlParentNotifications = `
      CREATE TABLE IF NOT EXISTS parent_notifications (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        parent_user_id INT NOT NULL,
        kid_profile_id INT NOT NULL,
        
        -- Notification details
        notification_type ENUM(
          'time_limit_reached', 
          'restricted_content_attempt', 
          'weekly_report', 
          'new_kid_activity',
          'pin_changed',
          'settings_updated'
        ) NOT NULL,
        
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        
        -- Content context
        content_id INT DEFAULT NULL,
        additional_data JSON,
        
        -- Delivery status
        status ENUM('pending', 'sent', 'read', 'dismissed') DEFAULT 'pending',
        sent_at TIMESTAMP NULL,
        read_at TIMESTAMP NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE SET NULL,
        
        INDEX idx_parent_notifications_parent (parent_user_id),
        INDEX idx_parent_notifications_kid (kid_profile_id),
        INDEX idx_parent_notifications_type (notification_type),
        INDEX idx_parent_notifications_status (status),
        INDEX idx_parent_notifications_created (created_at)
      );
    `;
    await query(sqlParentNotifications);
    console.log("✅ parent_notifications table created");

    console.log("🎉 All kids tables created successfully!");

  } catch (error) {
    console.error("❌ Error creating kids tables:", error);
    throw error;
  }
};

const createFamilyMembersTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS family_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      
      -- Core relationships
      user_id INT NOT NULL,
      family_owner_id INT NOT NULL,
      
      -- Member role and status
      member_role ENUM('owner', 'parent', 'teen', 'child', 'guest') DEFAULT 'child',
      relationship VARCHAR(100) DEFAULT NULL,
      invitation_status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
      
      -- Dashboard type control
      dashboard_type ENUM('normal', 'kid') DEFAULT 'normal',
      
      -- Access controls and restrictions
      content_restrictions JSON, -- REMOVED DEFAULT NULL
      max_daily_watch_time INT DEFAULT NULL,
      allowed_content_types JSON, -- REMOVED DEFAULT NULL
      blocked_categories JSON, -- REMOVED DEFAULT NULL
      
      -- Account suspension control
      is_suspended BOOLEAN DEFAULT FALSE,
      suspended_until DATETIME DEFAULT NULL,
      suspension_reason VARCHAR(255) DEFAULT NULL,
      
      -- Sleep time restrictions
      sleep_time_start TIME DEFAULT NULL,
      sleep_time_end TIME DEFAULT NULL,
      enforce_sleep_time BOOLEAN DEFAULT FALSE,
      
      -- Usage windows
      allowed_access_start TIME DEFAULT '06:00:00',
      allowed_access_end TIME DEFAULT '22:00:00',
      enforce_access_window BOOLEAN DEFAULT FALSE,
      
      -- Spending controls
      monthly_spending_limit DECIMAL(10,2) DEFAULT 0.00,
      current_month_spent DECIMAL(10,2) DEFAULT 0.00,
      
      -- Invitation system
      invitation_token VARCHAR(255) DEFAULT NULL,
      invited_by INT DEFAULT NULL,
      invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      invitation_expires_at DATETIME DEFAULT NULL,
      
      -- Member status
      is_active BOOLEAN DEFAULT TRUE,
      joined_at TIMESTAMP NULL DEFAULT NULL,
      last_accessed_at TIMESTAMP NULL DEFAULT NULL,
      
      -- Custom permissions
      custom_permissions JSON, -- REMOVED DEFAULT NULL
      
      -- Timestamps
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Foreign keys
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (family_owner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
      
      -- Indexes for performance
      INDEX idx_family_members_user (user_id),
      INDEX idx_family_members_owner (family_owner_id),
      INDEX idx_family_members_role (member_role),
      INDEX idx_family_members_status (invitation_status),
      INDEX idx_family_members_active (is_active),
      INDEX idx_family_members_suspended (is_suspended),
      INDEX idx_family_members_dashboard (dashboard_type),
      INDEX idx_family_members_token (invitation_token),
      INDEX idx_family_members_user_owner (user_id, family_owner_id),
      INDEX idx_family_members_owner_status (family_owner_id, invitation_status),
      INDEX idx_family_members_sleep_time (sleep_time_start, sleep_time_end),
      INDEX idx_family_members_access_time (allowed_access_start, allowed_access_end)
    );
  `;

  try {
    await query(sql);
    console.log("✅ family_members table is ready");
  } catch (err) {
    console.error("❌ Error creating family_members table:", err);
  }
};

const createFamilyPinSecurityTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS family_pin_security (
      id INT AUTO_INCREMENT PRIMARY KEY,
      family_member_id INT NOT NULL,
      
      -- PIN Security
      pin_attempts INT DEFAULT 0,
      last_pin_attempt DATETIME DEFAULT NULL,
      is_pin_locked BOOLEAN DEFAULT FALSE,
      pin_locked_until DATETIME DEFAULT NULL,
      
      -- PIN History (to prevent reuse)
      previous_pins JSON,
      
      -- Security Settings
      max_pin_attempts INT DEFAULT 5,
      pin_lock_duration_minutes INT DEFAULT 30,
      
      -- PIN Metadata
      pin_set_at DATETIME DEFAULT NULL,
      pin_changed_at DATETIME DEFAULT NULL,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE,
      
      INDEX idx_pin_security_member (family_member_id),
      INDEX idx_pin_locked_status (is_pin_locked),
      INDEX idx_pin_lock_until (pin_locked_until)
    );
  `;

  try {
    await query(sql);
    console.log("✅ family_pin_security table is ready");
  } catch (err) {
    console.error("❌ Error creating family_pin_security table:", err);
  }
};

const createFeedbackTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      
      -- User Information
      user_id INT DEFAULT NULL,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(150) NOT NULL,
      
      -- Feedback Content
      category ENUM(
        'FEATURE_REQUEST',
        'BUG_REPORT', 
        'STREAMING_ISSUE',
        'CONTENT_SUGGESTION',
        'ACCOUNT_ISSUE',
        'PAYMENT_ISSUE',
        'WEBSITE_APP_FEEDBACK',
        'CUSTOMER_SERVICE',
        'GENERAL_FEEDBACK',
        'LIKE_DISLIKE'
      ) NOT NULL DEFAULT 'GENERAL_FEEDBACK',
      
      -- Feedback Type (for simple like/dislike or detailed)
      feedback_type ENUM('LIKE', 'DISLIKE', 'DETAILED') NOT NULL DEFAULT 'DETAILED',
      
      -- Rating (1-5 stars, NULL allowed for simple feedback)
      rating TINYINT DEFAULT NULL,
      
      -- Message (NULL for simple like/dislike, TEXT for detailed)
      message TEXT DEFAULT NULL,
      
      -- Platform Information
      platform ENUM('WEB', 'ANDROID', 'IOS', 'SMART_TV', 'TABLET', 'DESKTOP_APP') NOT NULL DEFAULT 'WEB',
      
      -- Contact Permission
      allow_contact BOOLEAN DEFAULT FALSE,
      
      -- Status
      status ENUM('NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'NEW',
      
      -- Metadata
      ip_address VARCHAR(45) DEFAULT NULL,
      user_agent TEXT DEFAULT NULL,
      
      -- Timestamps
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Indexes
      INDEX idx_feedback_user_id (user_id),
      INDEX idx_feedback_user_email (user_email),
      INDEX idx_feedback_category (category),
      INDEX idx_feedback_status (status),
      INDEX idx_feedback_feedback_type (feedback_type),
      INDEX idx_feedback_created_at (created_at),
      
      -- Foreign Key
      CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
    );
  `;
  
  try {
    await query(sql);
    console.log("✅ feedback table is ready");
  } catch (err) {
    console.error("❌ Error creating feedback table:", err);
  }
};

const createGameTables = async () => {
  try {
    // 1. GAMES TABLE (Master list of games)
    const sqlGames = `
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_key VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon_emoji VARCHAR(10) DEFAULT '🎮',
        color_gradient VARCHAR(100) DEFAULT 'from-[#FF5722] to-[#FF9800]',
        category ENUM('Math', 'Puzzles', 'Colors', 'Memory', 'Science', 'Language', 'Racing', 'Logic', 'Action') DEFAULT 'Math',
        age_minimum INT DEFAULT 3,
        age_maximum INT DEFAULT 8,
        is_active BOOLEAN DEFAULT TRUE,
        requires_internet BOOLEAN DEFAULT TRUE,
        game_component VARCHAR(100),
        metadata JSON,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_games_key (game_key),
        INDEX idx_games_category (category),
        INDEX idx_games_active (is_active),
        INDEX idx_games_sort_order (sort_order)
      );
    `;
    await query(sqlGames);

    // 2. GAME_SESSIONS TABLE (Supports both kid types)
    const sqlGameSessions = `
      CREATE TABLE IF NOT EXISTS game_sessions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        
        -- Identity fields for both kid types
        user_id INT NULL,           -- For family member kids (references users.id)
        kid_profile_id INT NULL,    -- For kid profile kids (references kids_profiles.id)
        family_member_id INT NULL,  -- Alternative for family member kids
        
        -- Game information
        game_id INT NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        
        -- Session details
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME DEFAULT NULL,
        duration_seconds INT DEFAULT 0,
        
        -- Device information
        device_type ENUM('web', 'mobile', 'tablet', 'smarttv') DEFAULT 'web',
        device_name VARCHAR(100),
        user_agent TEXT DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        
        -- Session data (temporary game state)
        session_data JSON,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign keys
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        
        -- Indexes for performance
        INDEX idx_game_sessions_game (game_id),
        INDEX idx_game_sessions_session (session_id),
        INDEX idx_game_sessions_start (start_time),
        INDEX idx_game_sessions_user (user_id),
        INDEX idx_game_sessions_kid (kid_profile_id),
        INDEX idx_game_sessions_family (family_member_id),
        INDEX idx_game_sessions_device (device_type),
        INDEX idx_game_sessions_created (created_at)
      );
    `;
    await query(sqlGameSessions);

    // 3. GAME_PROGRESS TABLE (Permanent progress tracking)
    const sqlGameProgress = `
      CREATE TABLE IF NOT EXISTS game_progress (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        
        -- Identity fields (same as sessions)
        user_id INT NULL,
        kid_profile_id INT NULL,
        family_member_id INT NULL,
        
        -- Game information
        game_id INT NOT NULL,
        
        -- Progress metrics
        highest_score INT DEFAULT 0,
        total_playtime_seconds INT DEFAULT 0,
        levels_completed INT DEFAULT 0,
        times_played INT DEFAULT 0,
        
        -- Game-specific save state
        save_state JSON,
        last_level_played INT DEFAULT 1,
        
        -- Achievements and unlockables
        unlocked_features JSON,
        achievements_json JSON,
        
        -- Statistics
        average_session_time INT DEFAULT 0,
        last_played DATETIME DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign keys
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        
        -- Unique constraints for each identity type
        UNIQUE KEY unique_user_game (user_id, game_id),
        UNIQUE KEY unique_kid_game (kid_profile_id, game_id),
        UNIQUE KEY unique_family_game (family_member_id, game_id),
        
        -- Indexes for performance
        INDEX idx_game_progress_game (game_id),
        INDEX idx_game_progress_user (user_id),
        INDEX idx_game_progress_kid (kid_profile_id),
        INDEX idx_game_progress_family (family_member_id),
        INDEX idx_game_progress_score (highest_score),
        INDEX idx_game_progress_last_played (last_played),
        INDEX idx_game_progress_times_played (times_played)
      );
    `;
    await query(sqlGameProgress);

    // 4. GAME_SCORES TABLE (Individual score records)
    const sqlGameScores = `
      CREATE TABLE IF NOT EXISTS game_scores (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        
        -- Identity fields
        user_id INT NULL,
        kid_profile_id INT NULL,
        family_member_id INT NULL,
        
        -- Game and session reference
        game_id INT NOT NULL,
        session_id BIGINT NOT NULL,
        
        -- Score details
        score_value INT NOT NULL,
        level INT DEFAULT 1,
        moves_count INT DEFAULT 0,
        time_taken_seconds INT DEFAULT 0,
        accuracy_percentage DECIMAL(5,2) DEFAULT 0,
        
        -- Additional metrics (game-specific)
        metrics_json JSON,
        
        -- Completion flags
        is_high_score BOOLEAN DEFAULT FALSE,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at DATETIME DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign keys
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
        
        -- Indexes for performance
        INDEX idx_game_scores_game (game_id),
        INDEX idx_game_scores_session (session_id),
        INDEX idx_game_scores_user (user_id),
        INDEX idx_game_scores_kid (kid_profile_id),
        INDEX idx_game_scores_family (family_member_id),
        INDEX idx_game_scores_score (score_value),
        INDEX idx_game_scores_high_score (is_high_score),
        INDEX idx_game_scores_level (level),
        INDEX idx_game_scores_created (created_at),
        INDEX idx_game_scores_completed (is_completed)
      );
    `;
    await query(sqlGameScores);

    // 5. EDUCATIONAL_SKILLS TABLE (Learning objectives)
    const sqlEducationalSkills = `
      CREATE TABLE IF NOT EXISTS educational_skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        skill_key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        
        -- Age appropriateness
        age_range_min INT DEFAULT 3,
        age_range_max INT DEFAULT 8,
        
        -- Classification
        category ENUM('math', 'language', 'memory', 'logic', 'motor', 'social', 'creativity') NOT NULL,
        difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
        
        -- Metadata
        icon_emoji VARCHAR(10) DEFAULT '🎯',
        is_active BOOLEAN DEFAULT TRUE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes
        INDEX idx_skills_key (skill_key),
        INDEX idx_skills_category (category),
        INDEX idx_skills_difficulty (difficulty_level),
        INDEX idx_skills_age_range (age_range_min, age_range_max),
        INDEX idx_skills_active (is_active)
      );
    `;
    await query(sqlEducationalSkills);

    // 6. GAME_SKILLS_MAPPING TABLE (Games to skills relationship)
    const sqlGameSkillsMapping = `
      CREATE TABLE IF NOT EXISTS game_skills_mapping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        game_id INT NOT NULL,
        skill_id INT NOT NULL,
        
        -- Strength of relationship
        strength_level ENUM('primary', 'secondary', 'supplementary') DEFAULT 'secondary',
        
        -- Expected improvement
        expected_improvement_percentage INT DEFAULT 10,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign keys
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES educational_skills(id) ON DELETE CASCADE,
        
        -- Unique constraint
        UNIQUE KEY unique_game_skill (game_id, skill_id),
        
        -- Indexes
        INDEX idx_mapping_game (game_id),
        INDEX idx_mapping_skill (skill_id),
        INDEX idx_mapping_strength (strength_level)
      );
    `;
    await query(sqlGameSkillsMapping);

    // 7. KIDS_SKILL_PROGRESS TABLE (Track skill improvement per kid)
    const sqlKidsSkillProgress = `
      CREATE TABLE IF NOT EXISTS kids_skill_progress (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        
        -- Identity fields
        kid_profile_id INT NOT NULL,  -- Only for kid profiles
        user_id INT NULL,             -- For family member kids
        
        skill_id INT NOT NULL,
        
        -- Progress metrics
        baseline_score INT DEFAULT 0,
        current_score INT DEFAULT 0,
        improvement_percentage DECIMAL(5,2) DEFAULT 0,
        
        -- Assessment history
        assessments JSON,
        
        -- Activity tracking
        last_assessed_date DATE,
        games_played_count INT DEFAULT 0,
        total_playtime_minutes INT DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign keys
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES educational_skills(id) ON DELETE CASCADE,
        
        -- Unique constraint
        UNIQUE KEY unique_kid_skill (kid_profile_id, skill_id),
        UNIQUE KEY unique_user_skill (user_id, skill_id),
        
        -- Indexes
        INDEX idx_skill_progress_kid (kid_profile_id),
        INDEX idx_skill_progress_user (user_id),
        INDEX idx_skill_progress_skill (skill_id),
        INDEX idx_skill_progress_score (current_score),
        INDEX idx_skill_progress_improvement (improvement_percentage),
        INDEX idx_skill_progress_last_assessed (last_assessed_date)
      );
    `;
    await query(sqlKidsSkillProgress);

    // 8. GAME_ACHIEVEMENTS TABLE (Badges and rewards)
    const sqlGameAchievements = `
      CREATE TABLE IF NOT EXISTS game_achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Identity fields
        user_id INT NULL,
        kid_profile_id INT NULL,
        family_member_id INT NULL,
        
        -- Game reference
        game_id INT NOT NULL,
        
        -- Achievement details
        achievement_key VARCHAR(100) NOT NULL,
        achievement_name VARCHAR(255) NOT NULL,
        description TEXT,
        icon_emoji VARCHAR(10) DEFAULT '🏆',
        
        -- Unlock criteria
        unlock_value INT DEFAULT 0,
        unlock_type ENUM('score', 'level', 'time', 'streak', 'completion') DEFAULT 'score',
        current_progress INT DEFAULT 0,
        
        -- Status
        is_unlocked BOOLEAN DEFAULT FALSE,
        unlocked_at DATETIME DEFAULT NULL,
        
        -- Display
        rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common',
        display_order INT DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign keys
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        
        -- Unique constraints
        UNIQUE KEY unique_user_game_achievement (user_id, game_id, achievement_key),
        UNIQUE KEY unique_kid_game_achievement (kid_profile_id, game_id, achievement_key),
        UNIQUE KEY unique_family_game_achievement (family_member_id, game_id, achievement_key),
        
        -- Indexes
        INDEX idx_game_achievements_game (game_id),
        INDEX idx_game_achievements_user (user_id),
        INDEX idx_game_achievements_kid (kid_profile_id),
        INDEX idx_game_achievements_family (family_member_id),
        INDEX idx_game_achievements_unlocked (is_unlocked),
        INDEX idx_game_achievements_key (achievement_key),
        INDEX idx_game_achievements_rarity (rarity)
      );
    `;
    await query(sqlGameAchievements);

    // 9. PARENT_GAME_REPORTS TABLE (Activity reports for parents)
    const sqlParentGameReports = `
      CREATE TABLE IF NOT EXISTS parent_game_reports (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        
        parent_user_id INT NOT NULL,
        kid_profile_id INT NULL,      -- For kid profiles
        kid_user_id INT NULL,         -- For family member kids
        
        -- Report type and period
        report_type ENUM('daily', 'weekly', 'monthly', 'achievement', 'summary') NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        
        -- Activity summary
        games_played_count INT DEFAULT 0,
        total_playtime_minutes INT DEFAULT 0,
        average_session_minutes INT DEFAULT 0,
        
        -- Progress highlights
        new_achievements JSON,
        skill_improvements JSON,
        top_games JSON,
        
        -- Recommendations
        recommendations JSON,
        suggested_games JSON,
        
        -- Report status
        status ENUM('generated', 'sent', 'viewed', 'archived') DEFAULT 'generated',
        sent_at DATETIME DEFAULT NULL,
        viewed_at DATETIME DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign keys
        FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (kid_user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        -- Unique constraint
        UNIQUE KEY unique_period_report (parent_user_id, kid_profile_id, kid_user_id, report_type, period_start),
        
        -- Indexes
        INDEX idx_game_reports_parent (parent_user_id),
        INDEX idx_game_reports_kid_profile (kid_profile_id),
        INDEX idx_game_reports_kid_user (kid_user_id),
        INDEX idx_game_reports_type (report_type),
        INDEX idx_game_reports_period (period_start, period_end),
        INDEX idx_game_reports_status (status),
        INDEX idx_game_reports_created (created_at)
      );
    `;
    await query(sqlParentGameReports);

    // 10. GAME_TIME_LIMITS TABLE (Game-specific time restrictions)
    const sqlGameTimeLimits = `
      CREATE TABLE IF NOT EXISTS game_time_limits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Identity fields
        kid_profile_id INT NOT NULL,  -- Primary for kid profiles
        
        -- Daily limits
        daily_game_time_minutes INT DEFAULT 60,
        current_daily_game_usage INT DEFAULT 0,
        last_reset_date DATE DEFAULT NULL,
        
        -- Per-game specific limits
        per_game_limits JSON,
        
        -- Break settings
        game_break_reminder_minutes INT DEFAULT 20,
        enforce_game_breaks BOOLEAN DEFAULT TRUE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign key
        FOREIGN KEY (kid_profile_id) REFERENCES kids_profiles(id) ON DELETE CASCADE,
        
        -- Unique constraint
        UNIQUE KEY unique_kid_game_limits (kid_profile_id),
        
        -- Indexes
        INDEX idx_game_limits_kid (kid_profile_id),
        INDEX idx_game_limits_last_reset (last_reset_date)
      );
    `;
    await query(sqlGameTimeLimits);

    console.log("🎉 All game tables created successfully!");

    // Insert default games data
    await insertDefaultGames();
    await insertDefaultSkills();
    
  } catch (error) {
    console.error("❌ Error creating game tables:", error);
    throw error;
  }
};

// Insert default games
const insertDefaultGames = async () => {
  try {
    const defaultGames = [
      {
        game_key: 'counting_game',
        title: 'Counting Adventure',
        description: 'Learn addition with fun visuals',
        icon_emoji: '🎮',
        color_gradient: 'from-[#FF5722] to-[#FF9800]',
        category: 'Math',
        age_minimum: 3,
        age_maximum: 8,
        game_component: 'CountingGame',
        metadata: JSON.stringify({ features: ['Addition', 'Subtraction', 'Visual Learning'], difficulty: 'beginner' }),
        sort_order: 1
      },
      {
        game_key: 'shape_match_game',
        title: 'Shape Match',
        description: 'Match shapes and patterns',
        icon_emoji: '🔺',
        color_gradient: 'from-[#2196F3] to-[#03A9F4]',
        category: 'Puzzles',
        age_minimum: 3,
        age_maximum: 6,
        game_component: 'ShapeMatchGame',
        metadata: JSON.stringify({ features: ['Shapes', 'Patterns', 'Matching'], difficulty: 'beginner' }),
        sort_order: 2
      },
      {
        game_key: 'color_quest_game',
        title: 'Color Quest',
        description: 'Learn colors through games',
        icon_emoji: '🎨',
        color_gradient: 'from-[#9C27B0] to-[#E91E63]',
        category: 'Colors',
        age_minimum: 2,
        age_maximum: 5,
        game_component: 'ColorQuestGame',
        metadata: JSON.stringify({ features: ['Color Recognition', 'Matching', 'Memory'], difficulty: 'beginner' }),
        sort_order: 3
      },
      {
        game_key: 'memory_match_game',
        title: 'Memory Match',
        description: 'Improve memory skills',
        icon_emoji: '🧠',
        color_gradient: 'from-[#4CAF50] to-[#8BC34A]',
        category: 'Memory',
        age_minimum: 4,
        age_maximum: 8,
        game_component: 'MemoryMatchGame',
        metadata: JSON.stringify({ features: ['Memory', 'Concentration', 'Matching'], difficulty: 'intermediate' }),
        sort_order: 4
      },
      {
        game_key: 'animal_safari_game',
        title: 'Animal Safari',
        description: 'Learn about animals',
        icon_emoji: '🦁',
        color_gradient: 'from-[#FF9800] to-[#FFC107]',
        category: 'Science',
        age_minimum: 3,
        age_maximum: 7,
        game_component: 'AnimalSafariGame',
        metadata: JSON.stringify({ features: ['Animals', 'Sounds', 'Habitats'], difficulty: 'beginner' }),
        sort_order: 5
      },
      {
        game_key: 'alphabet_race_game',
        title: 'Alphabet Race',
        description: 'Learn letters while racing',
        icon_emoji: '🚗',
        color_gradient: 'from-[#3F51B5] to-[#2196F3]',
        category: 'Language',
        age_minimum: 3,
        age_maximum: 6,
        game_component: 'AlphabetRaceGame',
        metadata: JSON.stringify({ features: ['Alphabet', 'Letters', 'Racing'], difficulty: 'beginner' }),
        sort_order: 6
      },
      {
        game_key: 'pro_racing_challenge',
        title: 'Pro Racing Challenge',
        description: 'Race through traffic and collect power-ups',
        icon_emoji: '🏎️',
        color_gradient: 'from-[#FF0000] to-[#FF8800]',
        category: 'Racing',
        age_minimum: 5,
        age_maximum: 10,
        game_component: 'ProRacingChallenge',
        metadata: JSON.stringify({ features: ['Racing', 'Power-ups', 'Obstacles'], difficulty: 'intermediate' }),
        sort_order: 7
      },
      {
        game_key: 'water_sort_puzzle',
        title: 'Water Sort Puzzle',
        description: 'Sort colorful water in tubes',
        icon_emoji: '💧',
        color_gradient: 'from-[#2196F3] to-[#03A9F4]',
        category: 'Logic',
        age_minimum: 5,
        age_maximum: 12,
        game_component: 'WaterSortPuzzle',
        metadata: JSON.stringify({ features: ['Logic', 'Puzzle', 'Problem Solving'], difficulty: 'advanced' }),
        sort_order: 8
      }
    ];

    for (const game of defaultGames) {
      await query(
        `INSERT IGNORE INTO games 
        (game_key, title, description, icon_emoji, color_gradient, category, 
         age_minimum, age_maximum, game_component, metadata, sort_order) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          game.game_key, game.title, game.description, game.icon_emoji, 
          game.color_gradient, game.category, game.age_minimum, game.age_maximum,
          game.game_component, game.metadata, game.sort_order
        ]
      );
    }
    console.log("✅ Default games inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting default games:", error);
  }
};

// Insert default educational skills
const insertDefaultSkills = async () => {
  try {
    const defaultSkills = [
      {
        skill_key: 'basic_addition',
        name: 'Basic Addition',
        description: 'Simple addition with numbers 1-10',
        age_range_min: 3,
        age_range_max: 6,
        category: 'math',
        difficulty_level: 'beginner',
        icon_emoji: '➕'
      },
      {
        skill_key: 'color_recognition',
        name: 'Color Recognition',
        description: 'Identifying and naming basic colors',
        age_range_min: 2,
        age_range_max: 5,
        category: 'creativity',
        difficulty_level: 'beginner',
        icon_emoji: '🎨'
      },
      {
        skill_key: 'shape_recognition',
        name: 'Shape Recognition',
        description: 'Identifying basic geometric shapes',
        age_range_min: 3,
        age_range_max: 6,
        category: 'math',
        difficulty_level: 'beginner',
        icon_emoji: '🔺'
      },
      {
        skill_key: 'memory_skills',
        name: 'Memory Skills',
        description: 'Improving short-term memory and recall',
        age_range_min: 4,
        age_range_max: 8,
        category: 'memory',
        difficulty_level: 'intermediate',
        icon_emoji: '🧠'
      },
      {
        skill_key: 'letter_recognition',
        name: 'Letter Recognition',
        description: 'Identifying alphabet letters',
        age_range_min: 3,
        age_range_max: 6,
        category: 'language',
        difficulty_level: 'beginner',
        icon_emoji: '🔤'
      },
      {
        skill_key: 'problem_solving',
        name: 'Problem Solving',
        description: 'Logical thinking and puzzle solving',
        age_range_min: 5,
        age_range_max: 12,
        category: 'logic',
        difficulty_level: 'advanced',
        icon_emoji: '💡'
      },
      {
        skill_key: 'hand_eye_coordination',
        name: 'Hand-Eye Coordination',
        description: 'Motor skills and timing',
        age_range_min: 4,
        age_range_max: 10,
        category: 'motor',
        difficulty_level: 'intermediate',
        icon_emoji: '🎯'
      },
      {
        skill_key: 'pattern_recognition',
        name: 'Pattern Recognition',
        description: 'Identifying and completing patterns',
        age_range_min: 4,
        age_range_max: 8,
        category: 'logic',
        difficulty_level: 'intermediate',
        icon_emoji: '🔢'
      }
    ];

    for (const skill of defaultSkills) {
      await query(
        `INSERT IGNORE INTO educational_skills 
        (skill_key, name, description, age_range_min, age_range_max, 
         category, difficulty_level, icon_emoji) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          skill.skill_key, skill.name, skill.description, 
          skill.age_range_min, skill.age_range_max, skill.category,
          skill.difficulty_level, skill.icon_emoji
        ]
      );
    }
    console.log("✅ Default educational skills inserted successfully!");

    // Insert game-skill mappings
    await insertGameSkillMappings();
  } catch (error) {
    console.error("❌ Error inserting default skills:", error);
  }
};

// Insert game-skill mappings
const insertGameSkillMappings = async () => {
  try {
    // Get game IDs
    const games = await query("SELECT id, game_key FROM games");
    const gameMap = {};
    games.forEach(game => gameMap[game.game_key] = game.id);

    // Get skill IDs
    const skills = await query("SELECT id, skill_key FROM educational_skills");
    const skillMap = {};
    skills.forEach(skill => skillMap[skill.skill_key] = skill.id);

    // Define mappings
    const mappings = [
      // Counting Game
      { game_key: 'counting_game', skill_key: 'basic_addition', strength: 'primary' },
      { game_key: 'counting_game', skill_key: 'pattern_recognition', strength: 'secondary' },
      
      // Shape Match Game
      { game_key: 'shape_match_game', skill_key: 'shape_recognition', strength: 'primary' },
      { game_key: 'shape_match_game', skill_key: 'memory_skills', strength: 'secondary' },
      
      // Color Quest Game
      { game_key: 'color_quest_game', skill_key: 'color_recognition', strength: 'primary' },
      { game_key: 'color_quest_game', skill_key: 'memory_skills', strength: 'secondary' },
      
      // Memory Match Game
      { game_key: 'memory_match_game', skill_key: 'memory_skills', strength: 'primary' },
      { game_key: 'memory_match_game', skill_key: 'pattern_recognition', strength: 'secondary' },
      
      // Animal Safari Game
      { game_key: 'animal_safari_game', skill_key: 'memory_skills', strength: 'primary' },
      
      // Alphabet Race Game
      { game_key: 'alphabet_race_game', skill_key: 'letter_recognition', strength: 'primary' },
      { game_key: 'alphabet_race_game', skill_key: 'hand_eye_coordination', strength: 'secondary' },
      
      // Pro Racing Challenge
      { game_key: 'pro_racing_challenge', skill_key: 'hand_eye_coordination', strength: 'primary' },
      { game_key: 'pro_racing_challenge', skill_key: 'problem_solving', strength: 'secondary' },
      
      // Water Sort Puzzle
      { game_key: 'water_sort_puzzle', skill_key: 'problem_solving', strength: 'primary' },
      { game_key: 'water_sort_puzzle', skill_key: 'pattern_recognition', strength: 'secondary' }
    ];

    for (const mapping of mappings) {
      const gameId = gameMap[mapping.game_key];
      const skillId = skillMap[mapping.skill_key];
      
      if (gameId && skillId) {
        await query(
          `INSERT IGNORE INTO game_skills_mapping (game_id, skill_id, strength_level) 
           VALUES (?, ?, ?)`,
          [gameId, skillId, mapping.strength]
        );
      }
    }
    console.log("✅ Game-skill mappings inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting game-skill mappings:", error);
  }
};

// ✅ Add this table creation function
const createLivePresenceTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS live_presence (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(255) UNIQUE NOT NULL,
      
      -- User identification (can be NULL for anonymous)
      user_id INT DEFAULT NULL,
      user_type ENUM('authenticated', 'anonymous', 'kid_profile', 'family_member') DEFAULT 'authenticated',
      
      -- Session type
      session_type ENUM('viewing', 'browsing', 'idle') DEFAULT 'browsing',
      device_type ENUM('web', 'mobile', 'tablet', 'smarttv', 'desktop') DEFAULT 'web',
      device_name VARCHAR(100),
      
      -- Content being watched (if any)
      content_id INT DEFAULT NULL,
      media_asset_id INT DEFAULT NULL,
      content_type ENUM('movie', 'series', 'documentary', 'short_film', 'live_event', 'game') DEFAULT NULL,
      content_title VARCHAR(255),
      
      -- Playback state
      playback_time DECIMAL(10,2) DEFAULT 0,
      duration DECIMAL(10,2) DEFAULT 0,
      percentage_watched DECIMAL(5,2) DEFAULT 0,
      
      -- Location & Network
      ip_address VARCHAR(45),
      country_code VARCHAR(2),
      region VARCHAR(100),
      city VARCHAR(100),
      
      -- Connection info
      connection_type VARCHAR(50), -- wifi, mobile, cable
      bandwidth_estimate INT, -- kbps
      
      -- Activity tracking
      last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL,
      
      -- Session metadata
      user_agent TEXT,
      screen_resolution VARCHAR(50),
      language_preference VARCHAR(10) DEFAULT 'en',
      
      -- Engagement metrics
      total_watch_time_seconds INT DEFAULT 0,
      total_actions INT DEFAULT 0, -- clicks, scrolls, etc.
      page_views INT DEFAULT 0,
      
      -- Quality of service
      buffering_count INT DEFAULT 0,
      quality_changes INT DEFAULT 0,
      current_quality ENUM('SD', 'HD', 'FHD', 'UHD') DEFAULT 'HD',
      
      -- Performance metrics
      network_latency INT, -- ms
      frame_rate DECIMAL(5,2), -- fps
      
      -- Status
      is_active BOOLEAN DEFAULT TRUE,
      disconnected_at TIMESTAMP NULL,
      
      INDEX idx_session_id (session_id),
      INDEX idx_user_id (user_id),
      INDEX idx_content_id (content_id),
      INDEX idx_last_activity (last_activity),
      INDEX idx_is_active (is_active),
      INDEX idx_user_type (user_type),
      INDEX idx_device_type (device_type),
      INDEX idx_country_code (country_code),
      INDEX idx_session_type (session_type),
      INDEX idx_expires_at (expires_at),
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE SET NULL,
      FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL
    );
  `;

  try {
    await query(sql);
    console.log("✅ live_presence table created");
  } catch (err) {
    console.error("❌ Error creating live_presence table:", err);
  }
};

// ✅ Add this table for aggregated live stats
const createLiveStatsSnapshotsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS live_stats_snapshots (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      
      -- Total counts
      total_live_users INT DEFAULT 0,
      authenticated_users INT DEFAULT 0,
      anonymous_users INT DEFAULT 0,
      kid_profiles INT DEFAULT 0,
      family_members INT DEFAULT 0,
      
      -- Activity breakdown
      viewing_users INT DEFAULT 0,
      browsing_users INT DEFAULT 0,
      idle_users INT DEFAULT 0,
      
      -- Device breakdown
      web_users INT DEFAULT 0,
      mobile_users INT DEFAULT 0,
      tablet_users INT DEFAULT 0,
      smarttv_users INT DEFAULT 0,
      desktop_users INT DEFAULT 0,
      
      -- Content breakdown
      watching_movies INT DEFAULT 0,
      watching_series INT DEFAULT 0,
      playing_games INT DEFAULT 0,
      
      -- Geographic breakdown
      countries_count INT DEFAULT 0,
      top_countries JSON,
      
      -- Performance metrics
      avg_bandwidth INT DEFAULT 0,
      avg_latency INT DEFAULT 0,
      avg_buffer_ratio DECIMAL(5,2) DEFAULT 0,
      
      -- Engagement metrics
      avg_watch_time_minutes INT DEFAULT 0,
      peak_concurrent_users INT DEFAULT 0,
      
      -- Time period
      snapshot_type ENUM('real_time', 'hourly', 'daily') DEFAULT 'real_time',
      time_bucket DATETIME,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_snapshot_type (snapshot_type),
      INDEX idx_created_at (created_at),
      INDEX idx_time_bucket (time_bucket)
    );
  `;

  try {
    await query(sql);
    console.log("✅ live_stats_snapshots table created");
  } catch (err) {
    console.error("❌ Error creating live_stats_snapshots table:", err);
  }
};

// ✅ Add this table for live events (joins, leaves, actions)
const createLiveEventsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS live_events (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      user_id INT DEFAULT NULL,
      
      event_type ENUM(
        'user_joined',
        'user_left',
        'content_started',
        'content_paused',
        'content_resumed',
        'content_completed',
        'quality_changed',
        'buffering_started',
        'buffering_ended',
        'device_changed',
        'location_changed',
        'heartbeat'
      ) NOT NULL,
      
      event_data JSON,
      metadata JSON,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_session_id (session_id),
      INDEX idx_user_id (user_id),
      INDEX idx_event_type (event_type),
      INDEX idx_created_at (created_at)
    );
  `;

  try {
    await query(sql);
    console.log("✅ live_events table created");
  } catch (err) {
    console.error("❌ Error creating live_events table:", err);
  }
};


const initializeDatabase = async () => {
  try {
    console.log("🚀 Starting database initialization...");
    
    // ====================
    // PHASE 1: ABSOLUTE CORE TABLES (no foreign keys or self-contained)
    // ====================
    console.log("📦 Phase 1: Creating core tables...");
    await createUsersTable(); // Must be FIRST - everything references this
    await createEmailVerificationsTable();
    await createRolesTable();
    await createContactInfoTable(); // No foreign keys
    
    // ====================
    // PHASE 2: SIMPLE USER DEPENDENCIES
    // ====================
    console.log("👤 Phase 2: Creating user-dependent tables...");
    await createUserPreferencesTable(); // References users
    await createPasswordResetsTable(); // References users
    await createSecurityLogsTable(); // References users
    await createFeedbackTable(); // References users
    
    // ====================
    // PHASE 3: CONTENT FOUNDATION
    // ====================
    console.log("🎬 Phase 3: Creating content foundation...");
    await createContentTables(); // This creates contents, genres, categories, media_assets
    await createPeopleTables(); // Creates people table
    
    // ====================
    // PHASE 4: TABLES THAT REFERENCE CONTENT
    // ====================
    console.log("📊 Phase 4: Creating content-dependent tables...");
    // These need contents table to exist first
    await createUserPreferencesTables(); // user_watchlist, user_likes
    await createWatchTrackingTables(); // content_watch_sessions, etc
    await createShareTables(); // content_shares
    // Note: createPeopleTables already called in Phase 3, remove duplicate if needed
    
    // ====================
    // PHASE 5: CONTACT TABLES (depend on users and contacts)
    // ====================
    console.log("📞 Phase 5: Creating contact tables...");
    await createContactsTable(); // References users
    await createContactResponsesTable(); // References contacts and users
    
    // ====================
    // PHASE 6: SUBSCRIPTIONS
    // ====================
    console.log("💳 Phase 6: Creating subscription tables...");
    await createSubscriptionsTables();
    
    // ====================
    // PHASE 7: KIDS PROFILES
    // ====================
    console.log("👶 Phase 7: Creating kids tables...");
    await createKidsTables(); // References users
    
    // ====================
    // PHASE 8: FAMILY
    // ====================
    console.log("👨‍👩‍👧‍👦 Phase 8: Creating family tables...");
    await createFamilyMembersTable(); // References users
    await createFamilyPinSecurityTable(); // References family_members
    
    // ====================
    // PHASE 9: GAMES
    // ====================
    console.log("🎮 Phase 9: Creating game tables...");
    await createGameTables(); // References users and kids_profiles
    
    // ====================
    // PHASE 10: ROLE FEATURES
    // ====================
    console.log("🔐 Phase 10: Creating role features...");
    await createRoleFeaturesTable(); // References roles
    
    // ====================
    // PHASE 11: NOTIFICATIONS
    // ====================
    console.log("🔔 Phase 11: Creating notifications...");
    await createNotificationsTable(); // References users
    
    // ====================
    // PHASE 12: USER SESSION (LAST - references everything)
    // ====================
    console.log("💻 Phase 12: Creating user session...");
    await createUserSessionTable(); // References users and kids_profiles

    // ====================
    // FINAL STEP: LIVE USER TRACKING TABLES
    // ====================
    console.log("📊 Creating live user tracking tables...");
    await createLivePresenceTable();
    await createLiveStatsSnapshotsTable();
    await createLiveEventsTable();

    console.log("✅ Live tracking tables created!");
    
    console.log("✅ All tables created successfully!");
    
    // ====================
    // INSERT DEFAULT DATA
    // ====================
    console.log("📥 Inserting default data...");
    // First, check if we need to insert default genres/categories
    const checkGenres = await query("SELECT COUNT(*) as count FROM genres");
    if (checkGenres[0].count === 0) {
      await insertDefaultGenres();
    }
    
    const checkCategories = await query("SELECT COUNT(*) as count FROM categories");
    if (checkCategories[0].count === 0) {
      await insertDefaultCategories();
    }
    
    console.log("✅ Database initialization complete!");
    return true;
    
  } catch (err) {
    console.error("❌ Error initializing database:", err);
    // Log more details about the error
    if (err.code === 'ER_CANT_CREATE_TABLE') {
      console.error("Foreign key constraint error details:", {
        message: err.sqlMessage,
        sql: err.sql ? err.sql.substring(0, 500) + "..." : 'No SQL available',
        code: err.code
      });
    }
    return false;
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
  createNotificationsTable,
  createSecurityLogsTable,
  createContentTables,
  createPeopleTables,
  createUserPreferencesTables,
  createWatchTrackingTables,
  createShareTables,
  createKidsTables,
  createFamilyMembersTable,
  createFamilyPinSecurityTable,
  createFeedbackTable,
  createGameTables,
  initializeDatabase
};
