const bcrypt = require("bcrypt");
const { query } = require("../config/dbConfig");

// Helper function to generate valid oliviuus_id
const generateOliviuusId = () => {
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(4);
  const hexString = randomBytes.toString('hex').toUpperCase();
  return `OLV-USR-${hexString}`;
};

const createAdminSeed = async () => {
  try {
    const email = "shagenimana60@gmail.com";
    const plainPassword = "Umugisha123!";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Check if admin already exists
    const existingAdmin = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingAdmin.length > 0) {
      console.log("Admin already exists. No action taken.");
      return;
    }

    // Generate a valid oliviuus_id
    const oliviuusId = generateOliviuusId();

    // Insert admin with generated oliviuus_id
    await query(
      `INSERT INTO users (
        oliviuus_id,
        username,
        email,
        password,
        email_verified,
        phone_verified,
        username_verified,
        is_active,
        is_locked,
        is_deleted,
        first_name,
        last_name,
        role,
        global_account_tier,
        two_factor_enabled,
        marketing_consent,
        newsletter_subscribed,
        created_by,
        registration_source,
        email_verified_at,
        last_login_at
       ) VALUES (
        ?,
        ?,
        ?,
        ?,
        true,
        false,
        true,
        true,
        false,
        false,
        ?,
        ?,
        ?,
        ?,
        false,
        true,
        true,
        ?,
        ?,
        NOW(),
        NOW()
       )`,
      [
        oliviuusId,
        "admin",
        email,
        hashedPassword,
        "System",
        "Administrator",
        "admin",
        "enterprise",
        "system",
        "seed"
      ]
    );

    console.log('✅ Admin created successfully');

  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  }
};

module.exports = createAdminSeed;