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

const createSecurityLogsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS security_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      action VARCHAR(100) NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      device_info JSON DEFAULT NULL,
      status ENUM('success', 'failed', 'blocked') NOT NULL,
      details JSON DEFAULT NULL,
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
    
    -- Subscription details at time of purchase (in case plan changes)
    subscription_name VARCHAR(255) NOT NULL,
    subscription_price DECIMAL(10,2) NOT NULL,
    subscription_currency VARCHAR(10) DEFAULT 'RWF',
    
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
    INDEX idx_user_status (user_id, status)
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
    metadata JSON DEFAULT NULL,
    
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
      metadata JSON DEFAULT NULL,
      
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
        session_id VARCHAR(255),
        watch_duration_seconds INT NOT NULL,
        percentage_watched DECIMAL(5,2),
        device_type ENUM('web', 'mobile', 'tablet', 'smarttv'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_view_history_content (content_id),
        INDEX idx_view_history_user (user_id),
        INDEX idx_view_history_created (created_at),
        INDEX idx_view_history_user_content (user_id, content_id)
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
        other_roles JSON DEFAULT NULL,
        
        -- Contact and representation (optional)
        agent_name VARCHAR(255),
        agent_contact VARCHAR(255),
        
        -- Media and assets
        profile_image_url VARCHAR(500),
        gallery_images JSON DEFAULT NULL,
        
        -- Social media and links
        website_url VARCHAR(500),
        imdb_url VARCHAR(500),
        wikipedia_url VARCHAR(500),
        social_links JSON DEFAULT NULL,
        
        -- Status and metadata
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        popularity_score INT DEFAULT 0,
        
        -- SEO and discovery
        search_keywords JSON DEFAULT NULL,
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
};
