const { query } = require("../config/dbConfig");
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendAccountCreatedEmail } = require("../services/emailService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Helper function to generate valid oliviuus_id (internal)
const generateOliviuusId = () => {
  const randomBytes = crypto.randomBytes(4);
  const hexString = randomBytes.toString('hex').toUpperCase();
  return `OLV-USR-${hexString}`;
};

// Generate alphanumeric verification code
const generateCode = (length = 6) => {
  const chars = "123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};


// New checkIdentifier controller (replace your old checkEmail)
const checkIdentifier = async (req, res) => {
  const { identifier, language = 'en' } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: "Identifier is required" });
  }

  try {
    const identifierType = determineIdentifierType(identifier);

    // Check if user exists
    const userResult = await query(
      `SELECT id, oliviuus_id, email, phone, username, 
              email_verified, phone_verified, password,
              is_active, role, profile_avatar_url
       FROM users 
       WHERE email = ? OR phone = ? OR username = ?
       LIMIT 1`,
      [identifier, identifier, identifier]
    );

    if (userResult.length > 0) {
      const user = userResult[0];

      // Determine matched identifier type
      let matchedIdentifierType;
      if (user.email === identifier) matchedIdentifierType = 'email';
      else if (user.phone === identifier) matchedIdentifierType = 'phone';
      else matchedIdentifierType = 'username';

      if (!user.is_active) {
        return res.status(403).json({
          exists: true,
          error: "Account is disabled"
        });
      }

      let isVerified = false;
      let nextStep = 'password';

      if (matchedIdentifierType === 'email') {
        isVerified = user.email_verified;
        nextStep = isVerified ? 'password' : 'code';
      } else if (matchedIdentifierType === 'phone') {
        isVerified = user.phone_verified;
        nextStep = isVerified ? 'password' : 'code';
      } else if (matchedIdentifierType === 'username') {
        nextStep = user.password ? 'password' : 'userInfo';
      }

      // If user exists and needs verification, send code
      if (matchedIdentifierType === 'email' && !isVerified) {
        await handleVerificationForExistingUser(identifier, 'email', language, res);
        return;
      } else if (matchedIdentifierType === 'phone' && !isVerified) {
        await handleVerificationForExistingUser(identifier, 'phone', language, res);
        return;
      }

      return res.json({
        exists: true,
        isVerified,
        identifierType: matchedIdentifierType,
        nextStep,
        user: {
          id: user.id,
          oliviuus_id: user.oliviuus_id,
          email: user.email,
          phone: user.phone,
          username: user.username,
          role: user.role,
          profile_avatar_url: user.profile_avatar_url
        }
      });
    }

    // User doesn't exist - handle based on identifier type
    switch (identifierType) {
      case 'email':
        await handleNewEmailRegistration(identifier, language, res);
        break;
      case 'phone':
        await handleNewPhoneRegistration(identifier, language, res);
        break;
      case 'username':
        res.json({
          exists: false,
          error: "No Oliviuus account found with this ID",
          identifierType: 'username',
          nextStep: 'createCustomAccount'
        });
        break;
      default:
        res.status(400).json({
          exists: false,
          error: "Invalid identifier format"
        });
    }

  } catch (err) {
    console.error("❌ Error in checkIdentifier:", err);
    res.status(500).json({
      error: "Something went wrong, please try again."
    });
  }
};

// Helper function for new email registration
const handleNewEmailRegistration = async (email, language, res) => {
  try {
    // Clean email
    const cleanEmail = email.trim().toLowerCase();

    // Check existing verification with MORE DETAILS
    const existingVerification = await query(
      `SELECT id, attempts, expires_at, is_verified, code, created_at
       FROM verifications 
       WHERE identifier = ? AND identifier_type = 'email'
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail]
    );

    // Check if blocked (5+ attempts)
    if (existingVerification.length > 0 && existingVerification[0].attempts >= 5) {
      return res.status(429).json({
        exists: false,
        blocked: true,
        error: "Too many verification attempts. Please try again later."
      });
    }

    // Check if we recently sent a code (within last 30 seconds)
    if (existingVerification.length > 0) {
      const verification = existingVerification[0];
      const lastSent = new Date(verification.created_at);
      const now = new Date();
      const secondsSinceLast = Math.floor((now - lastSent) / 1000);

      // If code was sent less than 30 seconds ago, return existing code info
      if (secondsSinceLast < 30 && !verification.is_verified) {
        console.log(`⚠️ Code already sent to ${cleanEmail} ${secondsSinceLast} seconds ago. Using existing code.`);

        return res.json({
          exists: false,
          isVerified: false,
          identifierType: 'email',
          nextStep: 'code',
          message: "Verification code already sent. Please check your email.",
          codeExists: true,
          cooldown: 30 - secondsSinceLast
        });
      }
    }

    // Generate a SINGLE new code
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(`📧 Generating new verification code for: ${cleanEmail}`);
    console.log(`📧 Code: ${code}`);

    // Insert or update verification record
    if (existingVerification.length > 0) {
      await query(
        `UPDATE verifications 
         SET code = ?, expires_at = ?, created_at = NOW(), 
             attempts = attempts + 1, last_attempt_at = NOW(),
             is_verified = FALSE, verified_at = NULL
         WHERE identifier = ? AND identifier_type = 'email'`,
        [code, expiresAt, cleanEmail]
      );
    } else {
      await query(
        `INSERT INTO verifications (identifier, identifier_type, code, expires_at, attempts)
         VALUES (?, 'email', ?, ?, 1)`,
        [cleanEmail, code, expiresAt]
      );
    }

    // Send email using your working email service
    console.log(`📧 Sending verification email to: ${cleanEmail}`);
    await sendVerificationEmail(cleanEmail, code, language);
    console.log(`✅ Email sent successfully to: ${cleanEmail}`);

    return res.json({
      exists: false,
      isVerified: false,
      identifierType: 'email',
      nextStep: 'code',
      message: "Verification code sent successfully"
    });

  } catch (err) {
    console.error("❌ Error in handleNewEmailRegistration:", err);

    // Check if it's a duplicate email error
    if (err.message && err.message.includes('already sent') || err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        exists: false,
        error: "Verification code already sent. Please check your email."
      });
    }

    res.status(500).json({
      error: "Failed to send verification email"
    });
  }
};

// Helper function for existing users who need verification
const handleVerificationForExistingUser = async (identifier, identifierType, language, res) => {
  try {
    const cleanIdentifier = identifierType === 'phone'
      ? identifier.replace(/[\s\-\(\)\+]/g, '')
      : identifier.trim().toLowerCase();

    // Check existing verification with timestamp check
    const existingVerification = await query(
      `SELECT id, attempts, expires_at, is_verified, code, created_at
       FROM verifications 
       WHERE identifier = ? AND identifier_type = ?
       ORDER BY created_at DESC LIMIT 1`,
      [cleanIdentifier, identifierType]
    );

    // Check if blocked (5+ attempts)
    if (existingVerification.length > 0 && existingVerification[0].attempts >= 5) {
      return res.status(429).json({
        exists: true,
        blocked: true,
        error: "Too many verification attempts. Please try again later."
      });
    }

    // Check if we recently sent a code (within last 30 seconds)
    if (existingVerification.length > 0) {
      const verification = existingVerification[0];
      const lastSent = new Date(verification.created_at);
      const now = new Date();
      const secondsSinceLast = Math.floor((now - lastSent) / 1000);

      if (secondsSinceLast < 30 && !verification.is_verified) {
        console.log(`⚠️ Code already sent to ${cleanIdentifier} ${secondsSinceLast} seconds ago. Using existing code.`);

        return res.json({
          exists: true,
          isVerified: false,
          identifierType,
          nextStep: 'code',
          message: "Verification code already sent. Please check your email.",
          codeExists: true
        });
      }
    }

    // Generate a SINGLE new code
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`📧 Generating verification code for existing user: ${cleanIdentifier}`);

    // Insert or update verification record
    if (existingVerification.length > 0) {
      await query(
        `UPDATE verifications 
         SET code = ?, expires_at = ?, created_at = NOW(), 
             attempts = attempts + 1, last_attempt_at = NOW(),
             is_verified = FALSE, verified_at = NULL
         WHERE identifier = ? AND identifier_type = ?`,
        [code, expiresAt, cleanIdentifier, identifierType]
      );
    } else {
      // Get user_id for existing user
      const userResult = await query(
        `SELECT id FROM users WHERE ${identifierType === 'email' ? 'email' : 'phone'} = ? LIMIT 1`,
        [cleanIdentifier]
      );

      const userId = userResult.length > 0 ? userResult[0].id : null;

      await query(
        `INSERT INTO verifications (identifier, identifier_type, code, expires_at, attempts, user_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cleanIdentifier, identifierType, code, expiresAt, 1, userId]
      );
    }

    // Send verification
    if (identifierType === 'email') {
      console.log(`📧 Sending verification email to existing user: ${cleanIdentifier}`);
      await sendVerificationEmail(cleanIdentifier, code, language);
      console.log(`✅ Email sent successfully to: ${cleanIdentifier}`);
    } else if (identifierType === 'phone') {
      console.log(`📱 SMS code ${code} sent to ${cleanIdentifier}`);
      // Implement SMS sending here
    }

    return res.json({
      exists: true,
      isVerified: false,
      identifierType,
      nextStep: 'code',
      message: "Verification code sent successfully"
    });

  } catch (err) {
    console.error("❌ Error in handleVerificationForExistingUser:", err);
    res.status(500).json({
      error: "Failed to send verification code"
    });
  }
};

const sendVerificationCode = async (identifier, identifierType, language, isInitial = false, res) => {
  try {
    const cleanIdentifier = identifierType === 'phone'
      ? identifier.replace(/[\s\-\(\)\+]/g, '')
      : identifier;

    // Check existing verification
    const existingVerification = await query(
      `SELECT id, attempts, expires_at, is_verified, created_at
       FROM verifications 
       WHERE identifier = ? AND identifier_type = ?
       ORDER BY created_at DESC LIMIT 1`,
      [cleanIdentifier, identifierType]
    );

    let currentAttempts = 0;
    let verificationId = null;

    if (existingVerification.length > 0) {
      const verification = existingVerification[0];
      verificationId = verification.id;
      currentAttempts = verification.attempts || 0;

      // Check if already verified
      if (verification.is_verified) {
        return res.status(400).json({
          error: "Already verified. Please continue to next step."
        });
      }

      // Check if max attempts reached (5 attempts)
      if (currentAttempts >= 5) {
        return res.status(429).json({
          error: "Too many verification attempts. Please try again later.",
          blocked: true,
          errorCode: "MAX_ATTEMPTS_EXCEEDED"
        });
      }

      // Check cooldown (30 seconds minimum between sends)
      const lastCreated = new Date(verification.created_at);
      const now = new Date();
      const secondsSinceLast = Math.floor((now - lastCreated) / 1000);

      if (secondsSinceLast < 30) {
        return res.status(429).json({
          error: "Please wait before requesting a new code.",
          cooldown: 30 - secondsSinceLast,
          errorCode: "RESEND_COOLDOWN"
        });
      }
    }

    // Generate new code
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Calculate new attempts count
    const newAttempts = existingVerification.length > 0 ? currentAttempts + 1 : 1;

    // Insert or update verification record
    if (existingVerification.length > 0) {
      await query(
        `UPDATE verifications 
         SET code = ?, expires_at = ?, attempts = ?, created_at = NOW(),
             last_attempt_at = NOW(), is_verified = FALSE, verified_at = NULL
         WHERE id = ?`,
        [code, expiresAt, newAttempts, verificationId]
      );
    } else {
      await query(
        `INSERT INTO verifications (identifier, identifier_type, code, expires_at, attempts)
         VALUES (?, ?, ?, ?, ?)`,
        [cleanIdentifier, identifierType, code, expiresAt, 1]
      );
    }

    // Send the code
    if (identifierType === 'email') {
      await sendVerificationEmail(cleanIdentifier, code, language);
    } else if (identifierType === 'phone') {
      console.log(`SMS code ${code} sent to ${cleanIdentifier}`);
      // Implement SMS sending here
    }

    // Return response
    if (isInitial) {
      return res.json({
        exists: false,
        isVerified: false,
        identifierType,
        nextStep: 'code',
        message: "Verification code sent successfully",
        attemptsRemaining: 5 - newAttempts
      });
    } else {
      return res.json({
        success: true,
        message: "New verification code sent successfully",
        resendDelay: 30,
        attemptsRemaining: 5 - newAttempts
      });
    }

  } catch (err) {
    console.error("❌ Error sending verification code:", err);

    if (isInitial && res) {
      res.status(500).json({
        error: "Something went wrong, please try again."
      });
    } else if (res) {
      res.status(500).json({
        error: "Failed to send verification code"
      });
    }
    throw err;
  }
};

// Helper: Determine identifier type
const determineIdentifierType = (identifier) => {
  if (!identifier) return 'unknown';

  // Check if it's an email
  if (identifier.includes('@') && identifier.includes('.')) {
    return 'email';
  }

  // Check if it's a phone number (numbers only, 9-15 digits)
  const phoneRegex = /^[0-9]{9,15}$/;
  if (phoneRegex.test(identifier.replace(/[\s\-\(\)\+]/g, ''))) {
    return 'phone';
  }

  // Default to username
  return 'username';
};

// Handle new email registration
const handleNewEmail = async (email, language, res) => {
  try {
    // Check for existing verification attempts
    const existingVerification = await query(
      `SELECT id, attempts, expires_at, is_verified 
       FROM verifications 
       WHERE identifier = ? AND identifier_type = 'email'
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    // If user has exceeded max attempts
    if (existingVerification.length > 0) {
      const verification = existingVerification[0];

      if (verification.attempts >= 5) {
        return res.status(429).json({
          exists: false,
          blocked: true,
          error: "Too many verification attempts. Please try again in 15 minutes or contact support."
        });
      }

      if (!verification.is_verified && verification.expires_at > new Date()) {
        // Existing valid verification exists, use it
        return res.json({
          exists: false,
          isVerified: false,
          identifierType: 'email',
          nextStep: 'code',
          user: null,
          message: "Verification code already sent. Please check your email.",
          canResend: false // Frontend should use this to show timer
        });
      }
    }

    // Generate verification code
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Insert or update verification record WITHOUT incrementing attempts
    if (existingVerification.length > 0) {
      await query(
        `UPDATE verifications 
         SET code = ?, expires_at = ?, 
             created_at = NOW(), is_verified = FALSE, verified_at = NULL
         WHERE identifier = ? AND identifier_type = 'email'`,
        [code, expiresAt, email]
      );
    } else {
      await query(
        `INSERT INTO verifications (identifier, identifier_type, code, expires_at)
         VALUES (?, 'email', ?, ?)`,
        [email, code, expiresAt]
      );
    }

    // Send verification email
    await sendVerificationEmail(email, code, language);

    return res.json({
      exists: false,
      isVerified: false,
      identifierType: 'email',
      nextStep: 'code',
      user: null,
      message: "Verification code sent successfully",
      canResend: false,
      resendDelay: 60 // 60 seconds before next resend
    });

  } catch (err) {
    console.error("❌ Error handling new email:", err);
    throw err;
  }
};

// New endpoint JUST for resending verification code
const resendVerification = async (req, res) => {
  const { identifier, identifierType, language = 'en' } = req.body;

  if (!identifier || !identifierType) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const cleanIdentifier = identifierType === 'phone'
      ? identifier.replace(/[\s\-\(\)\+]/g, '')
      : identifier;

    // Check existing verification
    const existingVerification = await query(
      `SELECT id, attempts, expires_at, is_verified, created_at
       FROM verifications 
       WHERE identifier = ? AND identifier_type = ?
       ORDER BY created_at DESC LIMIT 1`,
      [cleanIdentifier, identifierType]
    );

    if (existingVerification.length === 0) {
      return res.status(404).json({
        error: "No verification request found. Please start over."
      });
    }

    const verification = existingVerification[0];

    // Check if already verified
    if (verification.is_verified) {
      return res.status(400).json({
        error: "Already verified. Please continue to next step."
      });
    }

    // Check if max attempts reached
    if (verification.attempts >= 5) {
      return res.status(429).json({
        error: "Too many verification attempts. Please try again later.",
        blocked: true,
        errorCode: "MAX_ATTEMPTS_EXCEEDED"
      });
    }

    // Check cooldown (30 seconds minimum)
    const lastCreated = new Date(verification.created_at);
    const now = new Date();
    const secondsSinceLast = Math.floor((now - lastCreated) / 1000);

    if (secondsSinceLast < 30) {
      return res.status(429).json({
        error: "Please wait before requesting a new code.",
        cooldown: 30 - secondsSinceLast,
        errorCode: "RESEND_COOLDOWN"
      });
    }

    // Generate new code
    const newCode = generateCode(6);
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Update with new code and increment attempts
    await query(
      `UPDATE verifications 
       SET code = ?, expires_at = ?, attempts = attempts + 1, 
           created_at = NOW(), last_attempt_at = NOW()
       WHERE id = ?`,
      [newCode, newExpiresAt, verification.id]
    );

    // Send the code
    if (identifierType === 'email') {
      await sendVerificationEmail(cleanIdentifier, newCode, language);
    } else if (identifierType === 'phone') {
      console.log(`SMS code ${newCode} sent to ${cleanIdentifier}`);
      // Implement SMS sending here
    }

    return res.json({
      success: true,
      message: "New verification code sent successfully",
      resendDelay: 30
    });

  } catch (err) {
    console.error("❌ Error resending verification:", err);

    // Check if email service error
    if (err.message && err.message.includes('email')) {
      res.status(500).json({
        error: "Failed to send verification email. Please try again."
      });
    } else {
      res.status(500).json({
        error: "Something went wrong, please try again."
      });
    }
  }
};

// Handle new phone registration
const handleNewPhone = async (phone, language, res) => {
  try {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');

    // Check for existing verification attempts
    const existingVerification = await query(
      `SELECT id, attempts, expires_at, is_verified 
       FROM verifications 
       WHERE identifier = ? AND identifier_type = 'phone'
       ORDER BY created_at DESC LIMIT 1`,
      [cleanPhone]
    );

    // If user has exceeded max attempts
    if (existingVerification.length > 0) {
      const verification = existingVerification[0];

      if (verification.attempts >= 5) {
        return res.status(429).json({
          exists: false,
          blocked: true,
          error: "Too many verification attempts. Please try again in 15 minutes or contact support."
        });
      }

      if (!verification.is_verified && verification.expires_at > new Date()) {
        // Existing valid verification exists
        return res.json({
          exists: false,
          isVerified: false,
          identifierType: 'phone',
          nextStep: 'code',
          user: null,
          message: "Verification code already sent. Please check your phone."
        });
      }
    }

    // Generate verification code
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Insert or update verification record
    if (existingVerification.length > 0) {
      await query(
        `UPDATE verifications 
         SET code = ?, attempts = attempts + 1, expires_at = ?, 
             created_at = NOW(), is_verified = FALSE, verified_at = NULL
         WHERE identifier = ? AND identifier_type = 'phone'`,
        [cleanPhone, code, expiresAt]
      );
    } else {
      await query(
        `INSERT INTO verifications (identifier, identifier_type, code, expires_at)
         VALUES (?, 'phone', ?, ?)`,
        [cleanPhone, code, expiresAt]
      );
    }

    // Here you would typically send SMS using a service like Twilio
    // For now, we'll simulate it
    console.log(`SMS verification code ${code} sent to ${cleanPhone}`);

    return res.json({
      exists: false,
      isVerified: false,
      identifierType: 'phone',
      nextStep: 'code',
      user: null,
      message: "Verification code sent successfully"
    });

  } catch (err) {
    console.error("❌ Error handling new phone:", err);
    throw err;
  }
};

// Handle username check
const handleNewUsername = async (username, res) => {
  return res.json({
    exists: false,
    isVerified: false,
    identifierType: 'username',
    nextStep: 'password', // For custom account creation, this will go through different flow
    user: null,
    message: "No Oliviuus account found with this ID. Create a new account?"
  });
};

// Verification code verification controller
const verifyCode = async (req, res) => {
  const { identifier, code, identifierType } = req.body;

  if (!identifier || !code || !identifierType) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const cleanIdentifier = identifierType === 'phone'
      ? identifier.replace(/[\s\-\(\)\+]/g, '')
      : identifier;

    // Get verification record
    const verificationResult = await query(
      `SELECT id, attempts, expires_at, is_verified
       FROM verifications 
       WHERE identifier = ? AND identifier_type = ? AND code = ?
       ORDER BY created_at DESC LIMIT 1`,
      [cleanIdentifier, identifierType, code]
    );

    if (verificationResult.length === 0) {
      // Code doesn't match - JUST return error, NO attempts increment
      return res.status(400).json({
        verified: false,
        error: "Invalid verification code. Please try again.",
        errorCode: "INVALID_CODE"
      });
    }

    const verification = verificationResult[0];

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({
        verified: false,
        error: "Verification code has expired. Please request a new one.",
        errorCode: "EXPIRED_CODE"
      });
    }

    // Check if already verified
    if (verification.is_verified) {
      return res.json({
        verified: true,
        message: "Already verified",
        nextStep: "password"
      });
    }

    // DELETE the verification record after successful verification
    await query(
      `DELETE FROM verifications WHERE id = ?`,
      [verification.id]
    );

    return res.json({
      verified: true,
      success: true,
      message: "Verification successful",
      nextStep: "userInfo"
    });

  } catch (err) {
    console.error("❌ Error verifying code:", err);
    res.status(500).json({
      error: "Something went wrong, please try again."
    });
  }
};

// Helper: Increment verification attempts
const incrementVerificationAttempts = async (identifier, identifierType) => {
  await query(
    `UPDATE verifications 
     SET attempts = attempts + 1, last_attempt_at = NOW()
     WHERE identifier = ? AND identifier_type = ?`,
    [identifier, identifierType]
  );
};

// ULTRA SIMPLE Registration with better error handling
const completeRegistration = async (req, res) => {
  try {
    const { email, firstName, lastName, password, confirmPassword } = req.body;

    console.log("🚀 Saving new user:", { email, firstName });

    // 1. Basic validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    if (!firstName) {
      return res.status(400).json({
        success: false,
        error: "First name is required"
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters"
      });
    }

    // 2. Check if email exists
    const existing = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      console.log("❌ Email already exists:", email);
      return res.status(400).json({
        success: false,
        error: "Email already registered. Please sign in instead."
      });
    }

    // 3. Generate username
    let username;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      username = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}${lastName ? lastName.charAt(0).toLowerCase() : ''}${Math.floor(100 + Math.random() * 900)}`;

      // Check if username exists
      const usernameCheck = await query("SELECT id FROM users WHERE username = ?", [username]);
      if (usernameCheck.length === 0) {
        break; // Username available
      }

      if (attempts === maxAttempts) {
        // Last attempt, use timestamp
        username = `user${Date.now().toString().slice(-8)}`;
      }
    }

    console.log("🔤 Generated username:", username);

    // 4. Generate Oliviuus ID
    const oliviuusId = generateOliviuusId();
    console.log("🆔 Generated Oliviuus ID:", oliviuusId);

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Save to database
    console.log("💾 Attempting to save user to database...");

    const result = await query(
      `INSERT INTO users 
       (oliviuus_id, username, email, password, first_name, last_name,
        profile_avatar_url, email_verified, is_active, role, global_account_tier, created_by, registration_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, true, true, 'viewer', 'free', 'self', 'email_registration')`,
      [
        oliviuusId,
        username,
        email,
        hashedPassword,
        firstName,
        lastName || null,
        `https://api.dicebear.com/7.x/shapes/svg?seed=${oliviuusId}`
      ]
    );

    const userId = result.insertId;
    console.log(`✅ User saved successfully! ID: ${userId}, Username: ${username}`);

    // 7. Insert preferences
    await query(
      `INSERT INTO user_preferences (user_id, language) VALUES (?, 'en')`,
      [userId]
    );

    // 8. Send welcome email in background
    setTimeout(async () => {
      try {
        await sendWelcomeEmail(email, 'en', firstName);
        console.log("📧 Welcome email sent to:", email);
      } catch (emailErr) {
        console.error("⚠️ Failed to send welcome email:", emailErr);
      }
    }, 1000);

    // 9. Return success
    return res.json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: userId,
        oliviuus_id: oliviuusId,
        username: username,
        firstName: firstName,
        lastName: lastName || '',
        email: email,
        profile_avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${oliviuusId}`
      },
      redirectUrl: req.body.redirectUrl || "/"
    });

  } catch (err) {
    console.error("❌ Registration error DETAILS:", {
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });

    // Specific error handling
    if (err.code === 'ER_DUP_ENTRY') {
      let errorMessage = "Username already taken. Please try again.";

      if (err.message.includes('email')) {
        errorMessage = "Email already registered. Please sign in instead.";
      } else if (err.message.includes('oliviuus_id')) {
        errorMessage = "System error. Please try again.";
      } else if (err.message.includes('username')) {
        errorMessage = "Username already taken. Please try again.";
      }

      return res.status(400).json({
        success: false,
        error: errorMessage,
        errorCode: 'DUPLICATE_ENTRY'
      });
    }

    // Constraint violation
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({
        success: false,
        error: "Database constraint violation. Please contact support.",
        errorCode: 'CONSTRAINT_VIOLATION'
      });
    }

    // General error
    return res.status(500).json({
      success: false,
      error: "Failed to create account. Please try again.",
      errorCode: 'SERVER_ERROR'
    });
  }
};

// Helper: Generate auto username based on first and last name
const generateAutoUsername = async (firstName, lastName = '') => {
  // Clean names
  const cleanFirstName = firstName.toLowerCase().trim().replace(/[^a-z]/g, '');
  const cleanLastName = lastName.toLowerCase().trim().replace(/[^a-z]/g, '');

  // Generate options
  const options = [];

  // Option 1: firstname.lastname
  if (cleanLastName) {
    options.push(`${cleanFirstName}.${cleanLastName}`);
  }

  // Option 2: firstnamelastname
  if (cleanLastName) {
    options.push(`${cleanFirstName}${cleanLastName}`);
  }

  // Option 3: firstname + random number
  options.push(`${cleanFirstName}${Math.floor(100 + Math.random() * 900)}`);

  // Option 4: firstinitial + lastname
  if (cleanLastName) {
    options.push(`${cleanFirstName.charAt(0)}${cleanLastName}`);
  }

  // Option 5: firstname + lastinitial
  if (cleanLastName) {
    options.push(`${cleanFirstName}${cleanLastName.charAt(0)}`);
  }

  // Try each option
  for (const username of options) {
    // Validate format
    if (username.length >= 3 && username.length <= 30 && /^[a-z0-9.]+$/.test(username)) {
      const existing = await query(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );

      if (existing.length === 0) {
        return username;
      }
    }
  }

  // Fallback: completely random
  return `user${Date.now().toString().slice(-6)}`;
};

// Phone Registration Version
const completePhoneRegistration = async (req, res) => {
  const {
    phone,
    code,
    firstName,
    lastName,
    password,
    confirmPassword,
    redirectUrl = "/",
    language = 'en',
    device_name = 'Unknown',
    device_type = 'web',
    user_agent = 'Unknown'
  } = req.body;

  // Clean phone number
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');

  // Validate required fields
  if (!cleanPhone || !code || !firstName || !password) {
    return res.status(400).json({
      error: "Phone, verification code, first name, and password are required"
    });
  }

  // Validate password confirmation
  if (password !== confirmPassword) {
    return res.status(400).json({
      error: "Passwords do not match"
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long"
    });
  }

  try {
    // Step 1: Verify the code first
    const verifyResult = await query(
      `SELECT id, identifier, identifier_type, user_id, is_verified 
       FROM verifications 
       WHERE identifier = ? AND code = ? AND is_verified = FALSE 
       AND expires_at > NOW()`,
      [cleanPhone, code]
    );

    if (verifyResult.length === 0) {
      return res.status(400).json({
        error: "Invalid or expired verification code"
      });
    }

    // Check if phone already registered
    const existingUser = await query(
      "SELECT id FROM users WHERE phone = ?",
      [cleanPhone]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        error: "Phone number already registered"
      });
    }

    // Step 2: Generate auto username
    const autoUsername = await generateAutoUsername(firstName, lastName);

    // Step 3: Generate Oliviuus ID
    const oliviuusId = generateOliviuusId();

    // Step 4: Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Step 5: Generate avatar URL using DiceBear
    const avatarUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${oliviuusId}`;

    // Step 6: Insert user into database
    const result = await query(
      `INSERT INTO users 
      (oliviuus_id, username, phone, password, first_name, last_name, 
       profile_avatar_url, phone_verified, is_active, 
       role, global_account_tier, created_by, registration_source)
      VALUES (?, ?, ?, ?, ?, ?, ?, true, true, 'viewer', 'free', 'self', 'phone_registration')`,
      [
        oliviuusId,
        autoUsername,
        cleanPhone,
        hashedPassword,
        firstName,
        lastName || null, // lastName can be optional
        avatarUrl,
      ]
    );

    const userId = result.insertId;

    // Step 7: Mark verification as used
    await query(
      `UPDATE verifications 
       SET user_id = ?, is_verified = TRUE, verified_at = NOW()
       WHERE id = ?`,
      [userId, verifyResult[0].id]
    );

    // Step 8: Update user verification timestamp
    await query(
      "UPDATE users SET phone_verified_at = NOW() WHERE id = ?",
      [userId]
    );

    // Step 9: Insert user preferences
    await query(
      `INSERT INTO user_preferences (user_id, language) VALUES (?, ?)`,
      [userId, language]
    );

    // Step 10: Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        role: "user",
        oliviuus_id: oliviuusId,
        username: autoUsername,
        account_type: 'phone'
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Step 11: Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Step 12: Record session
    const ip_address = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown";

    await query(
      `INSERT INTO user_session 
      (user_id, session_token, device_name, device_type, ip_address, 
       user_agent, token_expires)
      VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [
        userId,
        token,
        device_name,
        device_type,
        ip_address,
        user_agent
      ]
    );

    // Step 13: Update last login time
    await query(
      "UPDATE users SET last_login_at = NOW(), last_active_at = NOW() WHERE id = ?",
      [userId]
    );

    // Step 14: Send welcome SMS (simulated - you'd integrate with SMS service)
    console.log(`Sending welcome SMS to ${cleanPhone} for ${firstName}`);

    // Step 15: Send welcome notifications
    await sendWelcomeNotifications(userId, language);

    // Step 16: Log security event
    await query(
      `INSERT INTO security_logs 
      (user_id, action, ip_address, status, details)
      VALUES (?, 'phone_registration', ?, 'success', ?)`,
      [
        userId,
        ip_address,
        JSON.stringify({
          registration_type: 'phone',
          device_type: device_type,
          username_generated: autoUsername
        })
      ]
    );

    // Step 17: Return success response
    return res.status(200).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: userId,
        oliviuus_id: oliviuusId,
        username: autoUsername,
        phone: cleanPhone,
        firstName: firstName,
        lastName: lastName || '',
        profile_avatar_url: avatarUrl,
        role: "user",
      },
      security: {
        account_type: 'phone',
        phone_verified: true
      },
      token: token,
      redirectUrl: redirectUrl
    });

  } catch (err) {
    console.error("❌ Error in completePhoneRegistration:", err);

    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('phone')) {
        return res.status(400).json({
          error: "Phone number already registered"
        });
      }
    }

    res.status(500).json({
      error: "Something went wrong while creating your account. Please try again."
    });
  }
};

// Unified registration endpoint that handles both email and phone
const completeRegistrationUnified = async (req, res) => {
  const { email, phone, code, ...otherData } = req.body;

  console.log("🔄 completeRegistrationUnified called with:", { email, phone });

  // Determine if it's email or phone registration
  let identifier, identifierType;

  if (email) {
    identifier = email;
    identifierType = 'email';
  } else if (phone) {
    identifier = phone.replace(/[\s\-\(\)\+]/g, '');
    identifierType = 'phone';
  } else {
    return res.status(400).json({
      success: false,
      error: "Either email or phone is required"
    });
  }

  // Call completeRegistration directly with the original request
  // Don't modify req or create a new object
  return await completeRegistration(req, res);
};


// Comprehensive blocked username system
const BLOCKED_USERNAMES = {
  // Reserved system usernames
  system: ['admin', 'administrator', 'superadmin', 'superuser', 'root', 'system', 'sysadmin', 'moderator'],

  // Oliviuus brand names
  brand: ['oliviuus', 'oliviu', 'oliviuusteam', 'oliviuusapp', 'oliviuusweb'],

  // Common forbidden patterns
  offensive: [
    // Hate speech and offensive terms
    'abuse', 'asshole', 'bitch', 'bastard', 'cunt', 'dick', 'faggot', 'fag', 'fuck', 'fucker',
    'idiot', 'moron', 'retard', 'shit', 'slut', 'whore', 'nigger', 'nigga', 'kike',

    // Religious offense
    'allah', 'god', 'jesus', 'christ', 'buddha', 'muhammad', 'prophet',

    // Political
    'hitler', 'nazi', 'isis', 'taliban', 'terrorist'
  ],

  // Common words that should be reserved
  common: [
    'account', 'accounts', 'api', 'app', 'application', 'auth', 'authentication',
    'billing', 'blog', 'cart', 'checkout', 'contact', 'contacts', 'copyright',
    'dashboard', 'developer', 'developers', 'docs', 'documentation', 'download',
    'email', 'emails', 'faq', 'faqs', 'feedback', 'forum', 'forums', 'help',
    'home', 'homepage', 'info', 'information', 'invite', 'invites', 'jobs',
    'legal', 'license', 'login', 'logout', 'mail', 'media', 'news', 'newsletter',
    'official', 'page', 'pages', 'password', 'passwords', 'policy', 'policies',
    'privacy', 'profile', 'profiles', 'register', 'registration', 'reset',
    'security', 'settings', 'signin', 'signout', 'signup', 'sitemap', 'staff',
    'status', 'support', 'team', 'teams', 'terms', 'test', 'testing', 'tests',
    'update', 'updates', 'upload', 'uploads', 'user', 'users', 'verify',
    'verified', 'verification', 'video', 'videos', 'watch', 'watching', 'web',
    'website', 'www'
  ],

  // File extensions and tech terms
  technical: [
    'css', 'js', 'json', 'xml', 'html', 'php', 'sql', 'db', 'database',
    'server', 'client', 'backend', 'frontend', 'localhost', '127.0.0.1',
    'index', 'main', 'config', 'env', 'git', 'github', 'bitbucket', 'gitlab'
  ],

  // Common first/last names (prevent identity confusion)
  commonNames: [
    'john', 'jane', 'smith', 'doe'
  ],

  // Country and region names
  geographic: [
    'rwanda', 'kigali', 'africa', 'europe', 'america', 'usa',
    'france', 'germany', 'china', 'india', 'japan', 'canada', 'australia'
  ],

  // Generic/sample/test names
  generic: [
    'sample', 'sampling', 'test', 'testing', 'tester', 'demo', 'demos',
    'example', 'examples', 'guest', 'guests', 'visitor', 'visitors',
    'anonymous', 'anon', 'unknown', 'user1', 'user2', 'user3', 'user4',
    'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'newuser',
    'olduser', 'tempuser', 'temporary', 'placeholder', 'dummy'
  ]
};

// Advanced username patterns to block
const BLOCKED_PATTERNS = [
  /^[0-9]+$/, // All numbers only
  /^[^a-z0-9]+$/i, // No alphanumeric characters
  /.*admin.*/i, // Contains 'admin'
  /.*mod.*/i, // Contains 'mod'
  /.*support.*/i, // Contains 'support'
  /.*help.*/i, // Contains 'help'
  /.*staff.*/i, // Contains 'staff'
  /.*official.*/i, // Contains 'official'
  /.*oliviuus.*/i, // Contains brand name
  /^[^a-z0-9]+/, // Starts with non-alphanumeric
  /[^a-z0-9._-]$/, // Ends with non-alphanumeric (except allowed)
  /\.\./, // Double dots
  /__/, // Double underscores
  /--/, // Double hyphens
  /\._/, // Dot followed by underscore
  /_\./, // Underscore followed by dot
  /-\./, // Hyphen followed by dot
  /\.-/, // Dot followed by hyphen
];

// Enhanced username validation function
const validateUsernameEnhanced = (username) => {
  const errors = [];

  // Basic length check
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (username.length > 30) {
    errors.push('Username must be no more than 30 characters');
  }

  // Character set validation
  if (!/^[a-z0-9._-]+$/.test(username)) {
    errors.push('Username can only contain lowercase letters, numbers, dots, underscores, and hyphens');
  }

  // Start/end validation
  if (!/^[a-z0-9]/.test(username)) {
    errors.push('Username must start with a letter or number');
  }

  if (!/[a-z0-9]$/.test(username)) {
    errors.push('Username must end with a letter or number');
  }

  // Check against blocked patterns
  BLOCKED_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(username)) {
      errors.push('Username contains forbidden pattern');
    }
  });

  // Check all blocked username categories
  Object.values(BLOCKED_USERNAMES).forEach(category => {
    if (category.includes(username.toLowerCase())) {
      errors.push('This username is reserved');
    }
  });

  // Check for common offensive patterns (case-insensitive)
  const offensivePatterns = [
    /f+u+c+k+/i,
    /s+h+i+t+/i,
    /a+s+s+/i,
    /b+i+t+c+h+/i,
    /d+i+c+k+/i,
    /p+u+s+s+y+/i,
    /c+u+n+t+/i,
    /n+i+g+[ae]r+/i,
  ];

  offensivePatterns.forEach(pattern => {
    if (pattern.test(username)) {
      errors.push('Username contains offensive content');
    }
  });

  // Check for leetspeak variations
  const leetVariations = {
    'a': ['4', '@'],
    'e': ['3'],
    'i': ['1', '!'],
    'o': ['0'],
    's': ['5', '$'],
    't': ['7']
  };

  // Convert leetspeak back to normal for checking
  let normalizedUsername = username.toLowerCase();
  Object.entries(leetVariations).forEach(([letter, variations]) => {
    variations.forEach(variation => {
      normalizedUsername = normalizedUsername.replace(new RegExp(variation, 'g'), letter);
    });
  });

  // Check normalized username against blocked list
  Object.values(BLOCKED_USERNAMES).forEach(category => {
    category.forEach(blockedName => {
      if (normalizedUsername.includes(blockedName.toLowerCase())) {
        errors.push('Username contains forbidden content');
      }
    });
  });

  // Check for repetitive characters
  if (/(.)\1\1/.test(username)) {
    errors.push('Username contains too many repetitive characters');
  }

  // Check for sequential patterns (abc, 123, qwe, etc.)
  const sequentialPatterns = [
    'abcdefghijklmnopqrstuvwxyz',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
    '0123456789'
  ];

  for (let pattern of sequentialPatterns) {
    for (let i = 0; i <= pattern.length - 3; i++) {
      const sequence = pattern.substring(i, i + 3);
      if (username.toLowerCase().includes(sequence)) {
        errors.push('Username contains predictable sequence');
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.slice(0, 3) // Return only first 3 errors
  };
};

// Calculate username strength score (0-100)
const calculateUsernameStrength = (username) => {
  let score = 0;

  // Length bonus
  if (username.length >= 8) score += 25;
  else if (username.length >= 6) score += 20;
  else if (username.length >= 4) score += 15;
  else score += 5;

  // Character diversity
  const hasLetters = /[a-z]/.test(username);
  const hasNumbers = /\d/.test(username);
  const hasSpecial = /[._-]/.test(username);

  if (hasLetters && hasNumbers && hasSpecial) score += 30;
  else if (hasLetters && hasNumbers) score += 20;
  else if (hasLetters && hasSpecial) score += 15;
  else if (hasNumbers && hasSpecial) score += 10;
  else if (hasLetters) score += 5;

  // Uniqueness factor (approximate)
  const uniqueChars = new Set(username).size;
  const uniquenessRatio = uniqueChars / username.length;

  if (uniquenessRatio > 0.8) score += 25;
  else if (uniquenessRatio > 0.6) score += 15;
  else if (uniquenessRatio > 0.4) score += 5;

  // Pattern avoidance (negative scoring)
  if (/^[a-z]+$/.test(username)) score -= 10; // Letters only
  if (/^\d+$/.test(username)) score -= 20; // Numbers only
  if (/(.)\1\1/.test(username)) score -= 15; // Repeated chars

  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, score));
};

// Get username strength category
const getUsernameStrengthCategory = (score) => {
  if (score >= 80) return { level: 'strong', color: 'green', label: 'Strong' };
  if (score >= 60) return { level: 'good', color: 'blue', label: 'Good' };
  if (score >= 40) return { level: 'fair', color: 'yellow', label: 'Fair' };
  if (score >= 20) return { level: 'weak', color: 'orange', label: 'Weak' };
  return { level: 'poor', color: 'red', label: 'Poor' };
};

// Generate username suggestions with scoring
const generateSmartUsernameSuggestions = (firstName, lastName) => {
  if (!firstName) return [];

  const firstNameLower = firstName.toLowerCase().trim();
  const lastNameLower = lastName ? lastName.toLowerCase().trim() : '';
  const firstNameChar = firstNameLower.charAt(0);
  const lastNameChar = lastNameLower ? lastNameLower.charAt(0) : '';

  const suggestions = [];

  // Basic combinations
  const baseCombinations = [
    `${firstNameLower}${lastNameLower}`,
    `${firstNameLower}.${lastNameLower}`,
    `${firstNameLower}_${lastNameLower}`,
    `${firstNameLower}-${lastNameLower}`,
    `${firstNameChar}${lastNameLower}`,
    `${firstNameLower}${lastNameChar}`,
    `${firstNameChar}${lastNameChar}`,
  ];

  // Add random numbers for uniqueness
  const randomNumbers = [
    Math.floor(Math.random() * 100), // 0-99
    Math.floor(Math.random() * 1000), // 0-999
    Math.floor(Math.random() * 10000), // 0-9999
  ];

  // Generate all combinations
  baseCombinations.forEach(base => {
    if (base.length >= 3) {
      randomNumbers.forEach(num => {
        suggestions.push(`${base}${num}`);
      });
      suggestions.push(base);
    }
  });

  // Add some creative variations
  if (firstNameLower.length >= 3) {
    suggestions.push(
      `${firstNameLower.slice(0, 3)}${lastNameChar}${Math.floor(Math.random() * 100)}`,
      `${firstNameLower}${Math.floor(Math.random() * 1000)}`,
      `${firstNameLower}_${Math.floor(Math.random() * 100)}`
    );
  }

  // Filter, validate, and score suggestions
  const validSuggestions = suggestions
    .filter(s => {
      const validation = validateUsernameEnhanced(s);
      return validation.isValid && s.length >= 3 && s.length <= 30;
    })
    .slice(0, 12); // Limit to 12 suggestions

  // Score and sort suggestions
  return validSuggestions
    .map(s => ({
      username: s,
      strength: calculateUsernameStrength(s),
      strengthCategory: getUsernameStrengthCategory(calculateUsernameStrength(s))
    }))
    .sort((a, b) => b.strength - a.strength) // Sort by strength descending
    .slice(0, 6); // Return top 6 suggestions
};

// Enhanced checkUsernameAvailability function
const checkUsernameAvailabilityEnhanced = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // Step 1: Enhanced validation
    const validation = validateUsernameEnhanced(username);

    if (!validation.isValid) {
      return res.status(400).json({
        available: false,
        message: validation.errors[0] || "Invalid username",
        validationErrors: validation.errors
      });
    }

    // Step 2: Check against database
    const existingUser = await query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existingUser.length > 0) {
      return res.json({
        available: false,
        message: "This username is already taken",
        strength: calculateUsernameStrength(username),
        strengthCategory: getUsernameStrengthCategory(calculateUsernameStrength(username))
      });
    }

    // Step 3: Additional security checks
    const strength = calculateUsernameStrength(username);
    const strengthCategory = getUsernameStrengthCategory(strength);

    // Warn about weak usernames
    let warning = null;
    if (strength < 40) {
      warning = "This username is weak. Consider choosing a stronger one.";
    }

    return res.json({
      available: true,
      message: "Username is available",
      username: username,
      strength: strength,
      strengthCategory: strengthCategory,
      warning: warning,
      suggestions: strength < 50 ? generateSmartUsernameSuggestions(
        req.body.firstName || '',
        req.body.lastName || ''
      ) : []
    });

  } catch (err) {
    console.error("❌ Error checking username availability:", err);
    res.status(500).json({
      error: "Something went wrong, please try again.",
      available: null
    });
  }
};

// Enhanced generateUsernameSuggestions function
const generateUsernameSuggestionsEnhanced = async (req, res) => {
  const { firstName, lastName } = req.body;

  if (!firstName) {
    return res.status(400).json({ error: "First name is required" });
  }

  try {
    const suggestions = generateSmartUsernameSuggestions(firstName, lastName || '');

    if (suggestions.length === 0) {
      // Generate fallback suggestions
      const fallbacks = [
        `${firstName.toLowerCase()}${Math.floor(Math.random() * 10000)}`,
        `${firstName.charAt(0).toLowerCase()}${Math.floor(Math.random() * 100000)}`,
        `user${Math.floor(100000 + Math.random() * 900000)}`
      ];

      return res.json({
        suggestions: fallbacks.map(s => ({
          username: s,
          strength: calculateUsernameStrength(s),
          strengthCategory: getUsernameStrengthCategory(calculateUsernameStrength(s))
        }))
      });
    }

    return res.json({
      suggestions: suggestions
    });

  } catch (err) {
    console.error("❌ Error generating username suggestions:", err);
    res.status(500).json({
      error: "Something went wrong, please try again.",
      suggestions: []
    });
  }
};

// Enhanced username validation middleware
const validateUsernameMiddleware = (req, res, next) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      error: "Username is required"
    });
  }

  const validation = validateUsernameEnhanced(username);

  if (!validation.isValid) {
    return res.status(400).json({
      error: validation.errors[0] || "Invalid username format",
      validationErrors: validation.errors
    });
  }

  // Add username info to request for later use
  req.usernameValidation = {
    strength: calculateUsernameStrength(username),
    strengthCategory: getUsernameStrengthCategory(calculateUsernameStrength(username))
  };

  next();
};

// Update the createCustomAccount function to include username validation
const createCustomAccountEnhanced = async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    username,
    password,
    language = 'en',
    device_name = 'Unknown',
    device_type = 'web',
    user_agent = 'Unknown'
  } = req.body;

  // Validate required fields
  const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'username', 'password'];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  try {
    // Step 1: Enhanced username validation
    const usernameValidation = validateUsernameEnhanced(username);

    if (!usernameValidation.isValid) {
      return res.status(400).json({
        error: usernameValidation.errors[0] || "Invalid username format",
        validationErrors: usernameValidation.errors
      });
    }

    // Step 2: Check if username is already taken (double-check)
    const existingUserByUsername = await query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existingUserByUsername.length > 0) {
      return res.status(400).json({
        error: "This username is already taken. Please choose another one.",
        suggestions: generateSmartUsernameSuggestions(firstName, lastName)
      });
    }

    // Step 3: Validate date of birth (must be at least 13 years old)
    if (!validateDateOfBirth(dateOfBirth)) {
      return res.status(400).json({
        error: "You must be at least 13 years old to create an account"
      });
    }

    // Step 4: Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
    }

    // Step 5: Generate internal oliviuus_id
    const oliviuusId = generateOliviuusId();

    // Step 6: Hash the password
    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for security

    // Step 7: Generate avatar URL using DiceBear
    const avatarUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${username}`;

    // Step 8: Insert user into database with enhanced logging
    const result = await query(
      `INSERT INTO users 
      (oliviuus_id, username, first_name, last_name, password, profile_avatar_url, 
       date_of_birth, gender, role, global_account_tier, username_verified, 
       is_active, created_by, registration_source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'viewer', 'free', true, true, 'self', 'custom_registration')`,
      [oliviuusId, username, firstName, lastName, hashedPassword, avatarUrl,
        dateOfBirth, gender, calculateUsernameStrength(username)]
    );

    const userId = result.insertId;

    // Step 9: Insert user preferences
    const chosenLang = language || 'en';
    await query(
      `INSERT INTO user_preferences (user_id, language) VALUES (?, ?)`,
      [userId, chosenLang]
    );

    // Step 10: Log username creation for security audit
    await query(
      `INSERT INTO security_logs 
      (user_id, action, ip_address, status, details)
      VALUES (?, 'custom_account_creation', ?, 'success', ?)`,
      [
        userId,
        req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
        JSON.stringify({
          username: username,
          device_type: device_type,
          registration_type: 'custom'
        })
      ]
    );

    // Step 11: Generate JWT token with enhanced payload
    const token = jwt.sign(
      {
        id: userId,
        role: "user",
        oliviuus_id: oliviuusId,
        username: username,
        account_type: 'custom'
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Step 12: Set HTTP-only cookie with enhanced security
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      // domain: process.env.NODE_ENV === 'production' ? '.oliviuus.com' : undefined
    });

    // Step 13: Record session
    const ip_address = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown";

    await query(
      `INSERT INTO user_session 
      (user_id, session_token, device_name, device_type, ip_address, 
       user_agent, token_expires)
      VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [
        userId,
        token,
        device_name,
        device_type,
        ip_address,
        user_agent
      ]
    );

    // Step 14: Update last login time
    await query(
      "UPDATE users SET last_login_at = NOW(), last_active_at = NOW() WHERE id = ?",
      [userId]
    );

    // Step 15: Send welcome notifications
    await sendWelcomeNotifications(userId, chosenLang);

    // Step 16: Return success response with enhanced info
    return res.status(200).json({
      success: true,
      message: "Custom account created successfully",
      user: {
        id: userId,
        oliviuus_id: oliviuusId,
        username: username,
        firstName,
        lastName,
        profile_avatar_url: avatarUrl,
        role: "user",
      },
      security: {
        username_validation_passed: true,
        account_type: 'custom',
        requires_email_verification: false
      }
    });

  } catch (err) {
    console.error("❌ Error creating custom account:", err);

    // Enhanced error handling
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('username')) {
        return res.status(400).json({
          error: "This username is already taken. Please choose another one.",
          suggestions: generateSmartUsernameSuggestions(firstName, lastName)
        });
      }
    }

    // Log security failure
    await query(
      `INSERT INTO security_logs 
      (action, ip_address, status, details)
      VALUES ('custom_account_creation_failed', ?, 'failed', ?)`,
      [
        req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
        JSON.stringify({
          username: username,
          error: err.message,
          device_type: device_type
        })
      ]
    );

    res.status(500).json({
      error: "Something went wrong while creating your account. Please try again.",
      error_code: 'ACCOUNT_CREATION_FAILED'
    });
  }
};


// Helper: Validate date of birth (must be at least 13 years old)
const validateDateOfBirth = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age >= 13;
};

// Step 3: Complete custom account creation (username-based)
const createCustomAccount = async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    username,
    password,
    language = 'en',
    device_name = 'Unknown',
    device_type = 'web',
    user_agent = 'Unknown'
  } = req.body;

  // Validate required fields
  const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'username', 'password'];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  try {
    // 1. Validate username
    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
      return res.status(400).json({
        error: "Username can only contain letters, numbers, dots, underscores, and hyphens"
      });
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        error: "Username must be between 3 and 30 characters"
      });
    }

    if (!/^[a-zA-Z0-9]/.test(cleanUsername)) {
      return res.status(400).json({
        error: "Username must start with a letter or number"
      });
    }

    // 2. Check if username is already taken
    const existingUserByUsername = await query(
      "SELECT id FROM users WHERE username = ?",
      [cleanUsername]
    );

    if (existingUserByUsername.length > 0) {
      return res.status(400).json({
        error: "This username is already taken. Please choose another one."
      });
    }

    // 3. Validate date of birth (must be at least 13 years old)
    if (!validateDateOfBirth(dateOfBirth)) {
      return res.status(400).json({
        error: "You must be at least 13 years old to create an account"
      });
    }

    // 4. Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long"
      });
    }

    // 5. Generate internal oliviuus_id
    const oliviuusId = generateOliviuusId();

    // 6. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Generate avatar URL using DiceBear
    const avatarUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${cleanUsername}`;

    // 8. Insert user into database
    const result = await query(
      `INSERT INTO users 
      (oliviuus_id, username, first_name, last_name, password, profile_avatar_url, 
       date_of_birth, gender, role, global_account_tier, username_verified, 
       is_active, created_by, registration_source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'viewer', 'free', true, true, 'self', 'custom_registration')`,
      [oliviuusId, cleanUsername, firstName, lastName, hashedPassword, avatarUrl,
        dateOfBirth, gender]
    );

    const userId = result.insertId;

    // 9. Insert user preferences
    const chosenLang = language || 'en';
    await query(
      `INSERT INTO user_preferences (user_id, language) VALUES (?, ?)`,
      [userId, chosenLang]
    );

    // 10. Generate JWT token
    const token = jwt.sign(
      { id: userId, role: "user", oliviuus_id: oliviuusId, username: cleanUsername },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 11. Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 12. Record session
    const ip_address = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown";

    await query(
      `INSERT INTO user_session 
      (user_id, session_token, device_name, device_type, ip_address, 
       user_agent, token_expires)
      VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [
        userId,
        token,
        device_name,
        device_type,
        ip_address,
        user_agent
      ]
    );

    // 13. Send welcome notifications
    await sendWelcomeNotifications(userId, chosenLang);

    // 14. Return success response
    return res.status(200).json({
      success: true,
      message: "Custom account created successfully",
      user: {
        id: userId,
        oliviuus_id: oliviuusId,
        username: cleanUsername,
        firstName,
        lastName,
        profile_avatar_url: avatarUrl,
        role: "user"
      },
      token
    });

  } catch (err) {
    console.error("❌ Error creating custom account:", err);

    // Handle duplicate key errors
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('username')) {
        return res.status(400).json({
          error: "This username is already taken. Please choose another one."
        });
      } else if (err.message.includes('oliviuus_id')) {
        // Retry with new oliviuus_id (should be extremely rare)
        return createCustomAccount(req, res);
      }
    }

    res.status(500).json({
      error: "Something went wrong while creating your account. Please try again."
    });
  }
};

// Add email/phone to existing custom account
const addIdentifierToCustomAccount = async (req, res) => {
  const { identifier, identifierType, verificationCode } = req.body;
  const userId = req.user.id;

  if (!identifier || !identifierType) {
    return res.status(400).json({ error: "Identifier and identifier type are required" });
  }

  if (!['email', 'phone'].includes(identifierType)) {
    return res.status(400).json({ error: "Invalid identifier type. Must be 'email' or 'phone'" });
  }

  try {
    // Get user info
    const userRows = await query(
      "SELECT oliviuus_id, username FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRows[0];

    // Check if identifier already exists in the system
    const checkQuery = identifierType === 'email'
      ? "SELECT id FROM users WHERE email = ?"
      : "SELECT id FROM users WHERE phone = ?";

    const existingUser = await query(checkQuery, [identifier]);

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      return res.status(400).json({
        error: `This ${identifierType} is already associated with another account`
      });
    }

    // If adding email, check if verification code is provided and valid
    if (identifierType === 'email') {
      if (!verificationCode) {
        // Generate and send verification code
        const code = generateCode(6);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Store in verifications table
        await query(
          `INSERT INTO verifications (user_id, identifier, identifier_type, code, expires_at)
           VALUES (?, ?, 'email', ?, ?)
           ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)`,
          [userId, identifier, code, expiresAt]
        );

        // Send verification email
        await sendVerificationEmail(identifier, code, language || 'en');

        return res.json({
          success: true,
          message: "Verification code sent to your email",
          needsVerification: true,
          identifier
        });
      } else {
        // Verify the code
        const verificationResult = await query(
          `SELECT id FROM verifications 
           WHERE user_id = ? AND identifier = ? AND identifier_type = 'email' 
           AND code = ? AND expires_at > NOW() AND is_verified = FALSE`,
          [userId, identifier, verificationCode]
        );

        if (verificationResult.length === 0) {
          return res.status(400).json({
            error: "Invalid or expired verification code"
          });
        }

        // Mark as verified
        await query(
          `UPDATE verifications SET is_verified = TRUE, verified_at = NOW()
           WHERE id = ?`,
          [verificationResult[0].id]
        );
      }
    }

    // Update user with new identifier
    const updateQuery = identifierType === 'email'
      ? "UPDATE users SET email = ?, email_verified = true WHERE id = ?"
      : "UPDATE users SET phone = ?, phone_verified = true WHERE id = ?";

    await query(updateQuery, [identifier, userId]);

    // Update verification timestamp if email
    if (identifierType === 'email') {
      await query(
        "UPDATE users SET email_verified_at = NOW() WHERE id = ?",
        [userId]
      );
    }

    return res.json({
      success: true,
      message: `${identifierType.charAt(0).toUpperCase() + identifierType.slice(1)} added and verified successfully`,
      identifier,
      identifierType
    });

  } catch (err) {
    console.error(`❌ Error adding ${identifierType} to custom account:`, err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};

// Helper function to send welcome notifications
const sendWelcomeNotifications = async (userId, language) => {
  try {
    const currentTime = new Date();

    // Welcome notification
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'welcome', '🎉 Welcome to Oliviuus!', ?, 'party', 'user', ?, 'normal', ?, ?)`,
      [
        userId,
        `Welcome to Oliviuus! We're excited to have you on board. Start exploring thousands of movies and series tailored just for you.`,
        userId,
        JSON.stringify({
          timestamp: currentTime.toISOString(),
          language: language,
          is_welcome: true
        }),
        "/browse"
      ]
    );

    // Profile customization tip
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'tip', '👤 Personalize Your Experience', ?, 'user', 'user', ?, 'low', ?, ?)`,
      [
        userId,
        `Make Oliviuus truly yours! Customize your profile, set up multiple viewing profiles for family members, and adjust your preferences in account settings.`,
        userId,
        JSON.stringify({
          timestamp: currentTime.toISOString(),
          language: language,
          tip_type: 'profile_customization'
        }),
        "/account/settings"
      ]
    );

    // Content discovery tip
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'tip', '🎬 Discover Amazing Content', ?, 'film', 'user', ?, 'low', ?, ?)`,
      [
        userId,
        `Explore our vast library of movies and series. Use our smart recommendations to find content you'll love based on your preferences.`,
        userId,
        JSON.stringify({
          timestamp: currentTime.toISOString(),
          language: language,
          tip_type: 'content_discovery'
        }),
        "/browse"
      ]
    );

  } catch (error) {
    // Don't throw error to avoid breaking user registration flow
  }
};

// Helper: Find user by identifier (email, phone, or username)
const findUserByIdentifier = async (identifier) => {
  try {
    // Determine identifier type
    const identifierType = determineIdentifierType(identifier);

    let queryCondition;
    let queryValue = identifier;

    if (identifierType === 'email') {
      queryCondition = "email = ?";
    } else if (identifierType === 'phone') {
      queryCondition = "phone = ?";
      queryValue = identifier.replace(/[\s\-\(\)\+]/g, ''); // Clean phone number
    } else {
      // Username
      queryCondition = "username = ?";
    }

    // Get user with all necessary fields
    const rows = await query(
      `SELECT id, oliviuus_id, username, email, phone, password, 
              first_name, last_name, role, profile_avatar_url,
              is_active, is_locked, failed_login_attempts,
              account_lock_until, created_at, last_login_at
       FROM users 
       WHERE ${queryCondition} 
       AND (is_deleted IS NULL OR is_deleted = FALSE)
       LIMIT 1`,
      [queryValue]
    );

    return rows.length > 0 ? rows[0] : null;

  } catch (err) {
    console.error("❌ Error finding user by identifier:", err);
    return null;
  }
};

// Helper: Log failed login attempts
const logFailedLogin = async (userId, identifier, ip_address, device_name, device_type, reason) => {
  try {
    await query(
      `INSERT INTO security_logs 
       (user_id, action, ip_address, device_info, status, details) 
       VALUES (?, 'login_attempt', ?, ?, 'failed', ?)`,
      [
        userId,
        ip_address,
        JSON.stringify({
          device_name: device_name,
          device_type: device_type,
          identifier_used: identifier
        }),
        JSON.stringify({
          reason: reason,
          timestamp: new Date().toISOString()
        })
      ]
    );

    // Send notification for suspicious activity
    if (userId && (reason === 'invalid_password' || reason === 'account_locked')) {
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'security_alert', '🔒 Failed Login Attempt', ?, 'shield-alert', 'user', ?, 'high', ?, ?)`,
        [
          userId,
          `A failed login attempt was detected from ${device_name || 'an unknown device'} (${ip_address}). If this wasn't you, please secure your account.`,
          userId,
          JSON.stringify({
            ip_address: ip_address,
            device_name: device_name || 'Unknown',
            device_type: device_type || 'desktop',
            reason: reason,
            timestamp: new Date().toISOString()
          }),
          "/account/settings#security"
        ]
      );
    }

  } catch (error) {
    console.error('Error logging failed login:', error);
  }
};

// Helper: Log successful login
const logSuccessfulLogin = async (userId, identifier, ip_address, device_name, device_type, user_agent) => {
  try {
    // Check if this device has logged in before (within last 30 days)
    const existingSession = await query(
      `SELECT id FROM user_session 
       WHERE user_id = ? 
       AND ip_address = ? 
       AND device_type = ?
       AND is_active = true
       AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
       LIMIT 1`,
      [userId, ip_address, device_type]
    );

    const isNewDevice = !existingSession || existingSession.length === 0;

    // Log to security logs
    await query(
      `INSERT INTO security_logs 
       (user_id, action, ip_address, device_info, status, details) 
       VALUES (?, 'login_attempt', ?, ?, 'success', ?)`,
      [
        userId,
        ip_address,
        JSON.stringify({
          device_name: device_name,
          device_type: device_type,
          is_new_device: isNewDevice
        }),
        JSON.stringify({
          identifier: identifier,
          new_device: isNewDevice,
          user_agent: user_agent?.substring(0, 500) // Truncate if too long
        })
      ]
    );

    // Send notification for new device login
    if (isNewDevice) {
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'new_device_login', '📱 New Login Location', ?, 'devices', 'user', ?, 'high', ?, ?)`,
        [
          userId,
          `Your account was just accessed from a new ${device_type || 'device'} (${device_name || 'Unknown Device'}) at ${ip_address}. If this wasn't you, please secure your account immediately.`,
          userId,
          JSON.stringify({
            ip_address: ip_address,
            device_name: device_name || 'Unknown',
            device_type: device_type || 'desktop',
            timestamp: new Date().toISOString(),
            is_new_device: true
          }),
          "/account/settings#sessions"
        ]
      );
    }

  } catch (error) {
    console.error('Error logging successful login:', error);
  }
};

// ✅ UPDATED getMe function - More defensive
const getMe = async (req, res) => {
  try {
    console.log('\n🔍 GETME ENDPOINT ===========================');
    
    if (!req.user || !req.user.id) {
      console.log('❌ No user in request - auth middleware might have failed');
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: "Not authenticated"
      });
    }
    
    const userId = req.user.id;
    
    console.log('👤 User from authMiddleware:', {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email?.substring(0, 3) + '...',
      role: req.user.role
    });

    // Get user preferences
    const prefRows = await query(
      `SELECT language, genres, notifications, subtitles 
       FROM user_preferences 
       WHERE user_id = ?`,
      [userId]
    );
    
    const preferences = prefRows[0] || { 
      language: 'en', 
      notifications: true, 
      subtitles: true 
    };
    
    // Get active sessions
    const allSessions = await query(
      `SELECT 
        id, 
        session_token, 
        device_name, 
        device_type, 
        ip_address,
        login_time, 
        last_activity, 
        is_active,
        user_agent,
        token_expires,
        is_guest_mode
       FROM user_session
       WHERE user_id = ? 
         AND is_active = TRUE
         AND token_expires > NOW()
       ORDER BY last_activity DESC`,
      [userId]
    );
    
    console.log('📊 Active sessions found:', allSessions.length);
    
    // Build response
    const response = {
      success: true,
      authenticated: true,
      message: "User authenticated successfully",
      user: {
        // Basic info from auth middleware
        ...req.user,
        
        // Sessions
        sessions: allSessions,
        current_session_token: req.cookies?.token || null,
        active_sessions_count: allSessions.length,
        
        // Preferences
        preferences: preferences,
        
        // Session info
        session_info: {
          device_name: req.session?.device_name,
          device_type: req.session?.device_type,
          ip_address: req.session?.ip_address,
          login_time: req.session?.login_time,
          expires_at: req.session?.token_expires
        }
      }
    };
    
    console.log('✅ GETME response ready for user:', req.user.username);
    res.json(response);
    
  } catch (err) {
    console.error("\n❌ ERROR IN getMe:", err.message);
    console.error(err.stack);
    
    res.status(500).json({
      success: false,
      authenticated: false,
      error: "Failed to retrieve user data",
      message: "Please try again"
    });
  }
};

// ✅ LOGOUT user - Updated for new system
const logout = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(200).json({ success: true, message: "Already logged out" });
    }

    // Verify token to get user info
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // If token is invalid, just clear the cookie
      res.clearCookie("token");
      return res.json({ success: true, message: "Logged out successfully" });
    }

    const userId = decoded.id;

    // Invalidate the session in database
    await query(
      "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE session_token = ?",
      [token]
    );

    // Clear cookie with consistent options
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      ...(isProduction && { domain: process.env.COOKIE_DOMAIN || '.oliviuus.com' })
    });

    res.json({ success: true, message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout error:", error);
    // Always clear cookie even on error
    res.clearCookie("token");
    res.json({ success: true, message: "Logged out successfully" });
  }
};

// ✅ COMPLETE FIXED loginUser FUNCTION with guaranteed session saving
const loginUser = async (req, res) => {
  console.log('🔐 LOGIN ATTEMPT STARTED ===========================');
  
  const { identifier, password, device_name, device_type, user_agent, redirectUrl, guestMode = false } = req.body;

  console.log('📋 Login request body:', { 
    identifier: identifier ? identifier.substring(0, 3) + '...' : 'undefined',
    passwordLength: password ? password.length : 0,
    device_name: device_name || 'Unknown',
    device_type: device_type || 'desktop',
    redirectUrl: redirectUrl || '/',
    guestMode: guestMode
  });

  // Validate required fields
  if (!identifier || !password) {
    return res.status(400).json({ 
      success: false,
      error: "Identifier and password are required" 
    });
  }

  try {
    const ip_address = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown";
    console.log('🌐 Client IP:', ip_address);

    // 1️⃣ Determine identifier type
    const { queryCondition, queryValue, identifierType } = determineLoginIdentifier(identifier);
    
    // 2️⃣ Check user
    const rows = await query(
      `SELECT id, oliviuus_id, username, email, phone, password, role, is_active, 
              email_verified, phone_verified, profile_avatar_url, global_account_tier,
              first_name, last_name
       FROM users WHERE ${queryCondition}`,
      [queryValue]
    );

    if (!rows || rows.length === 0) {
      await handleFailedLoginAttempt(null, identifier, ip_address, device_name, device_type, 'invalid_identifier');
      return res.status(400).json({ 
        success: false,
        error: "Invalid identifier or password" 
      });
    }

    const user = rows[0];

    // 3️⃣ Check account status
    if (!user.is_active) {
      await handleFailedLoginAttempt(user.id, identifier, ip_address, device_name, device_type, 'account_disabled');
      return res.status(403).json({ 
        success: false,
        error: "Account is disabled. Please contact support." 
      });
    }

    // 4️⃣ Check email/phone verification
    if (identifierType === 'email' && !user.email_verified) {
      return res.status(403).json({ 
        success: false,
        error: "Email not verified. Please verify your email first.",
        requires_verification: true,
        identifier: user.email,
        identifier_type: 'email'
      });
    }

    if (identifierType === 'phone' && !user.phone_verified) {
      return res.status(403).json({ 
        success: false,
        error: "Phone not verified. Please verify your phone first.",
        requires_verification: true,
        identifier: user.phone,
        identifier_type: 'phone'
      });
    }

    // 5️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      await handleFailedLoginAttempt(user.id, identifier, ip_address, device_name, device_type, 'invalid_password');
      return res.status(400).json({ 
        success: false,
        error: "Invalid identifier or password"
      });
    }

    // 6️⃣ Generate JWT token - SIMPLIFIED
    console.log('🔐 Generating JWT token...');
    const tokenPayload = {
      id: user.id, 
      oliviuus_id: user.oliviuus_id,
      username: user.username,
      email: user.email,
      role: user.role,
      account_type: identifierType,
      guestMode: guestMode
    };
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    console.log('🔐 Token generated (first 50 chars):', token.substring(0, 50) + '...');
    console.log('🔐 Token full length:', token.length);

    // 7️⃣ **CRITICAL FIX: SAVE SESSION TO DATABASE FIRST**
    console.log('\n💾 SAVING SESSION TO DATABASE (FIRST) ===============');
    
    // Calculate token expiration
    const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Clean any existing sessions for this device
    await query(
      `UPDATE user_session 
       SET is_active = FALSE, logout_time = NOW() 
       WHERE user_id = ? AND device_type = ? AND ip_address = ? AND is_active = TRUE`,
      [user.id, device_type || 'desktop', ip_address]
    );

    // **SAVE SESSION TO DATABASE WITH THE EXACT TOKEN**
    let sessionId;
    try {
      const insertResult = await query(
        `INSERT INTO user_session 
         (user_id, session_token, device_name, device_type, ip_address, 
          user_agent, token_expires, is_guest_mode, login_time, last_activity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          user.id,
          token, // ← EXACT TOKEN that will be in cookie
          device_name || "Unknown",
          device_type || "desktop",
          ip_address,
          user_agent || "Unknown",
          tokenExpires,
          guestMode ? 1 : 0
        ]
      );
      
      sessionId = insertResult.insertId;
      console.log('✅ Session saved to database. Session ID:', sessionId);
      console.log('✅ Token stored in DB (first 50 chars):', token.substring(0, 50) + '...');
      
      // **VERIFY** the session was saved correctly
      const verifySession = await query(
        `SELECT id, session_token, user_id, token_expires 
         FROM user_session WHERE id = ?`,
        [sessionId]
      );
      
      if (verifySession.length > 0) {
        const savedSession = verifySession[0];
        console.log('✅ Session verification:', {
          sessionId: savedSession.id,
          userId: savedSession.user_id,
          tokenInDBLength: savedSession.session_token.length,
          tokenExpires: savedSession.token_expires,
          tokensMatch: savedSession.session_token === token ? '✅ YES' : '❌ NO'
        });
        
        if (savedSession.session_token !== token) {
          console.error('❌ CRITICAL ERROR: Token mismatch between cookie and database!');
          console.error('Cookie token (first 50):', token.substring(0, 50));
          console.error('DB token (first 50):', savedSession.session_token.substring(0, 50));
        }
      }
      
    } catch (dbError) {
      console.error('❌ Database error saving session:', dbError.message);
      console.error('SQL Error details:', dbError.sqlMessage || 'No SQL message');
      throw new Error('Failed to save session to database');
    }

    // 8️⃣ Set cookie - AFTER session is saved
    console.log('\n🍪 SETTING COOKIE (AFTER DB SAVE) ===============');
    
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = req.headers.host && req.headers.host.includes('localhost');
    
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction && !isLocalhost,
      path: '/',
      sameSite: isProduction && !isLocalhost ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    if (isProduction && !isLocalhost) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN || '.oliviuus.com';
    }

    console.log('🍪 Cookie options:', cookieOptions);
    
    // **SET THE COOKIE WITH THE EXACT SAME TOKEN**
    res.cookie("token", token, cookieOptions);
    console.log('✅ Cookie set with token (first 50 chars):', token.substring(0, 50) + '...');

    // 9️⃣ **VERIFY** cookie was set
    const setCookieHeader = res.getHeader('Set-Cookie');
    if (setCookieHeader) {
      console.log('✅ Set-Cookie header present in response');
    } else {
      console.warn('⚠️ Set-Cookie header not found in response');
    }

    // 🔟 Update user last login
    await query(
      "UPDATE users SET last_login_at = NOW(), last_active_at = NOW() WHERE id = ?",
      [user.id]
    );

    // 1️⃣1️⃣ Send success notification
    await handleSuccessfulLogin(user.id, identifier, ip_address, device_name, device_type, user_agent);

    // 1️⃣2️⃣ Return response with debugging info
    const finalRedirectUrl = redirectUrl || "/";

    const userResponse = {
      success: true,
      message: "Login successful",
      user: { 
        id: user.id, 
        oliviuus_id: user.oliviuus_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_avatar_url: user.profile_avatar_url,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email_verified: user.email_verified,
        phone_verified: user.phone_verified
      },
      session: {
        id: sessionId,
        saved_to_db: true,
        cookie_set: true,
        token_length: token.length,
        expires_in: "7 days"
      },
      debug: {
        token_in_cookie: true,
        session_in_db: true,
        cookie_name: 'token'
      },
      redirectUrl: finalRedirectUrl
    };

    console.log('\n✅ LOGIN COMPLETE ===========================');
    console.log('📤 Response sent for user:', user.username);

    return res.status(200).json(userResponse);

  } catch (err) {
    console.error("\n❌❌❌ ERROR IN loginUser ❌❌❌");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    res.status(500).json({ 
      success: false,
      error: "Something went wrong, please try again.",
      error_code: 'SERVER_ERROR'
    });
  }
};

// Helper function to determine identifier type for login
const determineLoginIdentifier = (identifier) => {
  // Clean the identifier
  const cleanIdentifier = identifier.trim().toLowerCase();

  // Check if it's an email
  if (cleanIdentifier.includes('@') && cleanIdentifier.includes('.')) {
    return {
      queryCondition: "email = ?",
      queryValue: cleanIdentifier,
      identifierType: 'email'
    };
  }

  // Check if it's a phone number (digits only, 9-15 digits)
  const phoneRegex = /^[0-9]{9,15}$/;
  const cleanPhone = cleanIdentifier.replace(/[\s\-\(\)\+]/g, '');

  if (phoneRegex.test(cleanPhone)) {
    return {
      queryCondition: "phone = ?",
      queryValue: cleanPhone,
      identifierType: 'phone'
    };
  }

  // Default: treat as username
  return {
    queryCondition: "username = ?",
    queryValue: cleanIdentifier,
    identifierType: 'username'
  };
};

// Enhanced failed login handler
const handleFailedLoginAttempt = async (userId, identifier, ip_address, device_name, device_type, reason) => {
  try {
    console.log('⚠️ Handling failed login attempt:', { userId, reason });

    // Log the failed attempt
    await query(
      `INSERT INTO security_logs 
       (user_id, action, ip_address, device_info, status, details) 
       VALUES (?, 'login_attempt', ?, ?, 'failed', ?)`,
      [
        userId,
        ip_address,
        JSON.stringify({
          device_name: device_name,
          device_type: device_type
        }),
        JSON.stringify({
          reason: reason,
          identifier_attempted: identifier,
          timestamp: new Date().toISOString()
        })
      ]
    );

    // Check for too many failed attempts
    if (userId) {
      const recentFailures = await query(
        `SELECT COUNT(*) as count FROM security_logs 
         WHERE user_id = ? AND action = 'login_attempt' AND status = 'failed'
         AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
        [userId]
      );

      if (recentFailures[0]?.count >= 5) {
        // Lock account for 15 minutes
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await query(
          `UPDATE users SET is_locked = TRUE, account_lock_until = ?
           WHERE id = ?`,
          [lockUntil, userId]
        );

        // Send notification to user
        await query(
          `INSERT INTO notifications 
           (user_id, type, title, message, icon, priority, metadata, reference_type, reference_id)
           VALUES (?, 'security_alert', '🔒 Account Locked', 
                  'Your account has been locked for 15 minutes due to too many failed login attempts. If this was not you, please reset your password.', 
                  'shield-alert', 'high', ?, 'user', ?)`,
          [
            userId,
            JSON.stringify({
              ip_address: ip_address,
              lock_reason: 'too_many_failed_attempts',
              lock_until: lockUntil.toISOString(),
              device_name: device_name,
              timestamp: new Date().toISOString()
            }),
            userId
          ]
        );
      }
    }

  } catch (error) {
    console.error('Error handling failed login attempt:', error);
  }
};

// Enhanced successful login handler
const handleSuccessfulLogin = async (userId, identifier, ip_address, device_name, device_type, user_agent) => {
  try {
    console.log('✅ Handling successful login for user:', userId);

    // Check if this device has logged in before
    const existingSession = await query(
      `SELECT id FROM user_session 
       WHERE user_id = ? AND ip_address = ? AND device_type = ?
       AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
       LIMIT 1`,
      [userId, ip_address, device_type]
    );

    const isNewDevice = !existingSession || existingSession.length === 0;

    if (isNewDevice) {
      // Send new device notification
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, priority, metadata, reference_type, reference_id, action_url)
         VALUES (?, 'new_device_login', '📱 New Login Location', 
                ?, 'devices', 'high', ?, 'user', ?, '/account/settings#sessions')`,
        [
          userId,
          `Your account was just accessed from a new ${device_type || 'device'} (${device_name || 'Unknown Device'}) at ${ip_address}. If this wasn't you, please secure your account immediately.`,
          JSON.stringify({
            ip_address: ip_address,
            device_name: device_name || 'Unknown',
            device_type: device_type || 'desktop',
            timestamp: new Date().toISOString(),
            is_new_device: true
          }),
          userId
        ]
      );
    } else {
      // Send regular login notification
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, priority, metadata, reference_type, reference_id)
         VALUES (?, 'login_success', '✅ Login Successful', 
                ?, 'check-circle', 'low', ?, 'user', ?)`,
        [
          userId,
          `You've successfully logged in from your ${device_name || 'device'} (${device_type || 'desktop'}).`,
          JSON.stringify({
            ip_address: ip_address,
            device_name: device_name || 'Unknown',
            device_type: device_type || 'desktop',
            timestamp: new Date().toISOString(),
            is_new_device: false
          }),
          userId
        ]
      );
    }

    // Log successful login
    await query(
      `INSERT INTO security_logs 
       (user_id, action, ip_address, device_info, status, details) 
       VALUES (?, 'login_attempt', ?, ?, 'success', ?)`,
      [
        userId,
        ip_address,
        JSON.stringify({
          device_name: device_name,
          device_type: device_type,
          is_new_device: isNewDevice
        }),
        JSON.stringify({
          identifier: identifier,
          new_device: isNewDevice,
          timestamp: new Date().toISOString(),
          user_agent: user_agent?.substring(0, 200)
        })
      ]
    );

  } catch (error) {
    console.error('Error handling successful login:', error);
  }
};

// Forgot password/identifier lookup
const lookupIdentifier = async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: "Identifier is required" });
  }

  try {
    const { queryCondition, queryValue, identifierType } = determineLoginIdentifier(identifier);

    const user = await query(
      `SELECT id, email, phone, username, email_verified, phone_verified
       FROM users WHERE ${queryCondition}`,
      [queryValue]
    );

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No account found with this identifier"
      });
    }

    const userData = user[0];

    // Return masked identifier for security
    let maskedIdentifier;
    switch (identifierType) {
      case 'email':
        maskedIdentifier = maskEmail(userData.email);
        break;
      case 'phone':
        maskedIdentifier = maskPhone(userData.phone);
        break;
      default:
        maskedIdentifier = userData.username;
    }

    return res.json({
      success: true,
      identifier_type: identifierType,
      masked_identifier: maskedIdentifier,
      has_email: !!userData.email,
      has_phone: !!userData.phone,
      email_verified: userData.email_verified,
      phone_verified: userData.phone_verified
    });

  } catch (err) {
    console.error("❌ Error in lookupIdentifier:", err);
    res.status(500).json({
      success: false,
      error: "Something went wrong, please try again."
    });
  }
};

// Helper: Mask email for security
const maskEmail = (email) => {
  if (!email) return '';
  const [name, domain] = email.split('@');
  const maskedName = name.length > 2
    ? name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
    : name;
  return `${maskedName}@${domain}`;
};

// Helper: Mask phone for security
const maskPhone = (phone) => {
  if (!phone) return '';
  if (phone.length <= 4) return phone;
  return '***' + phone.slice(-4);
};

// Google Sign-In authentication
const googleAuth = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Google token is required" });
  }

  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;

    // Check if user exists in your database
    const existingUser = await query(
      "SELECT id, oliviuus_id, role, is_active, profile_avatar_url FROM users WHERE email = ?",
      [email]
    );

    let userId, oliviuusId, userRole = "user";
    let isNewUser = false;

    if (existingUser.length > 0) {
      // Existing user
      userId = existingUser[0].id;
      oliviuusId = existingUser[0].oliviuus_id;
      userRole = existingUser[0].role;

      if (!existingUser[0].is_active) {
        return res.status(403).json({ error: "Account is disabled" });
      }
    } else {
      // New user - create account
      isNewUser = true;

      // Generate internal oliviuus_id
      oliviuusId = generateOliviuusId();

      // Generate avatar URL
      const avatarUrl = picture || `https://api.dicebear.com/7.x/shapes/svg?seed=${oliviuusId}`;

      // Insert new user
      const result = await query(
        `INSERT INTO users 
        (oliviuus_id, email, password, email_verified, is_active, role, 
         global_account_tier, profile_avatar_url, created_by, registration_source)
        VALUES (?, ?, 'google_oauth', ?, true, 'viewer', 'free', ?, 'google', 'google_oauth')`,
        [oliviuusId, email, email_verified || false, avatarUrl]
      );

      userId = result.insertId;

      // Set default language
      const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
      await query(
        `INSERT INTO user_preferences (user_id, language) VALUES (?, ?)`,
        [userId, language]
      );

      // Send welcome notifications
      await sendWelcomeNotifications(userId, language);
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: userId, role: userRole, oliviuus_id: oliviuusId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set HttpOnly cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Record session
    const ip_address = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown";
    const user_agent = req.headers["user-agent"] || "Unknown";

    await query(
      `INSERT INTO user_session 
      (user_id, session_token, device_name, device_type, ip_address, 
       user_agent, token_expires)
      VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [
        userId,
        jwtToken,
        "Google Sign-In",
        "web",
        ip_address,
        user_agent,
      ]
    );

    // Update last login time
    await query(
      "UPDATE users SET last_login_at = NOW(), last_active_at = NOW() WHERE id = ?",
      [userId]
    );

    // Send login notification
    await handleSuccessfulLogin(userId, email, ip_address, "Google Sign-In", "web", user_agent);

    return res.status(200).json({
      success: true,
      message: isNewUser ? "Account created and logged in successfully" : "Login successful",
      user: {
        id: userId,
        oliviuus_id: oliviuusId,
        email,
        role: userRole,
        profile_avatar_url: existingUser.length > 0 ? existingUser[0].profile_avatar_url : (picture || null),
        is_new_user: isNewUser
      }
    });

  } catch (error) {
    console.error("❌ Google auth error:", error);

    if (error.message.includes('Token used too late')) {
      return res.status(401).json({ error: "Google token has expired" });
    }

    res.status(401).json({
      success: false,
      error: "Google authentication failed"
    });
  }
};

// Update user's profile avatar
const updateProfileAvatar = async (req, res) => {
  const { profile_avatar_url } = req.body;
  const userId = req.user.id;

  if (!profile_avatar_url) {
    return res.status(400).json({ error: "Profile avatar URL is required" });
  }

  try {
    // Update avatar URL in users table
    await query(
      "UPDATE users SET profile_avatar_url = ?, updated_at = NOW() WHERE id = ?",
      [profile_avatar_url, userId]
    );

    // Return updated user info
    const updatedUserRows = await query(
      `SELECT id, oliviuus_id, username, email, role, profile_avatar_url, 
              email_verified, is_active, created_at, updated_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (updatedUserRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      message: "Profile avatar updated successfully",
      user: updatedUserRows[0],
    });
  } catch (err) {
    console.error("❌ Error in updateProfileAvatar:", err);
    return res.status(500).json({ error: "Failed to update profile avatar" });
  }
};

// ✅ Update user password
const updatePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both current and new passwords are required." });
  }

  try {
    // Get current hashed password
    const userRows = await query("SELECT password FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) return res.status(404).json({ error: "User not found." });

    const hashedPassword = userRows[0].password;

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect." });

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await query(
      "UPDATE users SET password = ?, last_password_change = NOW(), updated_at = NOW() WHERE id = ?",
      [newHashedPassword, userId]
    );

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("❌ Error in updatePassword:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};

// ✅ REQUEST PASSWORD RESET
const requestPasswordReset = async (req, res) => {
  const { identifier, language } = req.body;

  if (!identifier) return res.status(400).json({ error: "Email, username, or phone is required" });

  try {
    // Find user by email, username, or phone
    const users = await query(
      `SELECT id, email, username FROM users 
       WHERE email = ? OR username = ? OR phone = ? 
       LIMIT 1`,
      [identifier, identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "No account found with this identifier" });
    }

    const user = users[0];
    const userId = user.id;

    // Get user preferred language
    let userLang = "en";
    if (language) {
      userLang = language;
    } else {
      const prefs = await query(
        "SELECT language FROM user_preferences WHERE user_id = ?",
        [userId]
      );
      if (prefs.length > 0 && prefs[0].language) {
        userLang = prefs[0].language;
      }
    }

    // Generate reset token (JWT)
    const resetToken = jwt.sign(
      { id: userId, identifier },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Build reset link
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    // Save token in DB
    await query(
      `INSERT INTO password_resets (user_id, token, expires_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
       ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)`,
      [userId, resetToken]
    );

    // Send reset email
    if (user.email) {
      await sendPasswordResetEmail(user.email, resetLink, userLang);
    }

    return res.json({
      message: "Password reset link sent to your email",
      email_sent: !!user.email
    });
  } catch (err) {
    console.error("❌ Error in requestPasswordReset:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password in DB
    await query(
      "UPDATE users SET password = ?, last_password_change = NOW() WHERE id = ?",
      [hashedPassword, userId]
    );

    // Delete password reset tokens
    await query("DELETE FROM password_resets WHERE user_id = ?", [userId]);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(400).json({ error: "Invalid or expired reset link" });
  }
};

// Create user via admin
const createUser = async (req, res) => {
  const { email, role = "user", language } = req.body;
  const lang = language || "en";

  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // Check if user exists
    const existingUser = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Generate internal oliviuus_id
    const oliviuusId = generateOliviuusId();

    // Set default profile picture
    const defaultAvatar = `https://api.dicebear.com/7.x/shapes/svg?seed=${oliviuusId}`;

    // Create user with placeholder password
    const result = await query(
      `INSERT INTO users (oliviuus_id, email, password, email_verified, is_active, 
                          role, global_account_tier, profile_avatar_url, created_by, registration_source)
       VALUES (?, ?, '', true, true, ?, 'free', ?, 'admin', 'admin_created')`,
      [oliviuusId, email, role, defaultAvatar]
    );

    const userId = result.insertId;

    // Save language in user_preferences
    await query(
      `INSERT INTO user_preferences (user_id, language) VALUES (?, ?)`,
      [userId, lang]
    );

    // Generate JWT for password setup
    const resetToken = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    // Send account created email in background
    const sendAccountCreatedEmailBackground = async (email, resetLink, language) => {
      try {
        await sendAccountCreatedEmail(email, resetLink, language);
      } catch (emailErr) {
        console.error("⚠️ Failed to send account creation email:", emailErr);
      }
    };

    sendAccountCreatedEmailBackground(email, resetLink, lang);

    // Send role-based notifications
    await sendRoleBasedNotifications(userId, role, lang);

    // Return created user info
    res.status(201).json({
      message: "User created successfully. Account setup email sent.",
      user: {
        id: userId,
        oliviuus_id: oliviuusId,
        email,
        role,
        language: lang,
        profile_avatar_url: defaultAvatar
      },
    });
  } catch (err) {
    console.error("❌ Error in createUser:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};

// Helper function to send role-based notifications
const sendRoleBasedNotifications = async (userId, role, language) => {
  try {
    const currentTime = new Date();

    if (role === "admin") {
      // Admin-specific notifications
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'admin_welcome', '⚡ Admin Account Created', ?, 'shield', 'user', ?, 'high', ?, ?)`,
        [
          userId,
          `Your Oliviuus admin account has been created. You now have access to the admin dashboard with full system management capabilities.`,
          userId,
          JSON.stringify({
            timestamp: currentTime.toISOString(),
            language: language,
            role: 'admin',
            is_admin: true
          }),
          "/admin/dashboard"
        ]
      );
    } else {
      // Regular user notifications
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'welcome', '🎉 Welcome to Oliviuus!', ?, 'party', 'user', ?, 'normal', ?, ?)`,
        [
          userId,
          `Welcome to Oliviuus! Your account has been created. Please set your password to start watching.`,
          userId,
          JSON.stringify({
            timestamp: currentTime.toISOString(),
            language: language,
            is_welcome: true,
            created_by_admin: true
          }),
          "/reset-password"
        ]
      );
    }

  } catch (error) {
    // Don't throw error to avoid breaking user creation flow
  }
};

// Exporting all Controllers
module.exports = {
  checkIdentifier,
  verifyCode,
  resendVerification,
  completeRegistration,

  determineIdentifierType,
  createCustomAccount,
  addIdentifierToCustomAccount,
  getMe,
  logout,
  loginUser,
  lookupIdentifier,
  googleAuth,
  updateProfileAvatar,
  updatePassword,
  requestPasswordReset,
  resetPassword,
  createUser,

  // ... other exports ...
  checkUsernameAvailability: checkUsernameAvailabilityEnhanced,
  generateUsernameSuggestions: generateUsernameSuggestionsEnhanced,
  createCustomAccount: createCustomAccountEnhanced,
  validateUsernameMiddleware,

  // Utility functions for frontend integration
  validateUsernameEnhanced,
  calculateUsernameStrength,
  getUsernameStrengthCategory,
  generateSmartUsernameSuggestions,
  BLOCKED_USERNAMES,
  BLOCKED_PATTERNS
};