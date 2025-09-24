const { query } = require("../config/dbConfig");

// Verify code and delete from database if valid
const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    // Validate input
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    // Check if verification code exists and is valid
    const verificationResults = await query(
      "SELECT id, expires_at FROM email_verifications WHERE email = ? AND code = ?",
      [email, code]
    );

    if (verificationResults.length === 0) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    const verification = verificationResults[0];
    const now = new Date();

    // Check if code has expired
    if (now > new Date(verification.expires_at)) {
      // Delete expired code
      await query(
        "DELETE FROM email_verifications WHERE email = ? AND code = ?",
        [email, code]
      );
      return res.status(400).json({ error: "Verification code has expired" });
    }

    // Code is valid - delete it from database
    await query(
      "DELETE FROM email_verifications WHERE email = ? AND code = ?",
      [email, code]
    );

    // Check if user exists and update verification status if needed
    const userResults = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (userResults.length > 0) {
      await query(
        "UPDATE users SET email_verified = true WHERE email = ?",
        [email]
      );
    }

    return res.status(200).json({ 
      message: "Email verified successfully",
      verified: true
    });
  } catch (err) {
    console.error("❌ Error in verifyCode:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};

module.exports = { verifyCode };