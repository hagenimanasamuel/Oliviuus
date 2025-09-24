const bcrypt = require("bcrypt");
const { query } = require("../config/dbConfig");

const createAdminSeed = async () => {
  try {
    const email = "shagenimana60@gmail.com";
    const plainPassword = "Umugisha123!";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const existingAdmin = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingAdmin.length > 0) {
      console.log("Admin already exists. No action taken.");
      return;
    }

    await query(
      `INSERT INTO users (email, password, email_verified, is_active, role, subscription_plan)
       VALUES (?, ?, true, true, 'admin', 'none')`,
      [email, hashedPassword]
    );

    console.log("✅ Admin created successfully!");
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  }
};

module.exports = createAdminSeed;
