const { query } = require("../config/dbConfig");

// ✅ Verify code using unified verifications table
const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    // Validate input
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    // Check if verification code exists and is valid
    const verificationResults = await query(
      `SELECT id, identifier, identifier_type, expires_at, attempts, is_verified
       FROM verifications 
       WHERE identifier = ? 
       AND identifier_type = 'email' 
       AND code = ? 
       AND is_verified = FALSE`,
      [email, code]
    );

    if (verificationResults.length === 0) {
      // Increment attempts for failed verification
      await query(
        `UPDATE verifications 
         SET attempts = attempts + 1 
         WHERE identifier = ? AND identifier_type = 'email'`,
        [email]
      );
      
      // Check if too many attempts
      const attemptResults = await query(
        `SELECT attempts FROM verifications 
         WHERE identifier = ? AND identifier_type = 'email'`,
        [email]
      );

      if (attemptResults.length > 0 && attemptResults[0].attempts >= 5) {
        return res.status(429).json({ 
          error: "Too many failed attempts. Please request a new code.",
          errorCode: "MAX_ATTEMPTS_EXCEEDED"
        });
      }

      return res.status(400).json({ 
        error: "Invalid verification code",
        errorCode: "INVALID_CODE"
      });
    }

    const verification = verificationResults[0];
    const now = new Date();

    // Check if code has expired
    if (now > new Date(verification.expires_at)) {
      // Delete expired code
      await query(
        `DELETE FROM verifications WHERE identifier = ? AND identifier_type = 'email' AND code = ?`,
        [email, code]
      );
      return res.status(400).json({ 
        error: "Verification code has expired",
        errorCode: "CODE_EXPIRED"
      });
    }

    // ✅ MARK AS VERIFIED FIRST (don't delete yet)
    await query(
      `UPDATE verifications 
       SET is_verified = TRUE, verified_at = NOW() 
       WHERE id = ?`,
      [verification.id]
    );

    // Check if user exists and update verification status if needed
    const userResults = await query(
      "SELECT id, email_verified FROM users WHERE email = ? AND is_deleted = FALSE", 
      [email]
    );
    
    if (userResults.length > 0) {
      const user = userResults[0];
      
      if (!user.email_verified) {
        await query(
          `UPDATE users 
           SET email_verified = true, email_verified_at = NOW() 
           WHERE email = ?`,
          [email]
        );
      }
      
      // ✅ DELETE VERIFICATION RECORD AFTER SUCCESS (as requested)
      await query(
        `DELETE FROM verifications WHERE id = ?`,
        [verification.id]
      );
    }

    return res.status(200).json({ 
      success: true,
      message: "Email verified successfully",
      verified: true,
      userExists: userResults.length > 0
    });
  } catch (err) {
    console.error("❌ Error in verifyCode:", err);
    res.status(500).json({ 
      error: "Something went wrong, please try again.",
      errorCode: "SERVER_ERROR"
    });
  }
};

module.exports = { verifyCode };