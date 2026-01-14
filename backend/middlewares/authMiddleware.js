const jwt = require("jsonwebtoken");
const { query } = require("../config/dbConfig");

const authMiddleware = async (req, res, next) => {
  try {
    console.log('\n🔐 AUTH MIDDLEWARE DEBUG ===========================');
    console.log('📋 Path:', req.path);
    console.log('🍪 Cookies:', req.cookies);
    console.log('📋 Cookie header:', req.headers.cookie);
    console.log('🌐 Origin:', req.headers.origin);
    
    const token = req.cookies?.token;
    
    if (!token) {
      console.log('❌ ERROR: No token found in cookies');
      console.log('❌ Full request headers:', {
        origin: req.headers.origin,
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'accept': req.headers['accept']
      });
      
      return res.status(401).json({ 
        success: false,
        error: "No token provided",
        debug: {
          cookies: req.cookies,
          cookieHeader: req.headers.cookie,
          hasCookieHeader: !!req.headers.cookie
        }
      });
    }

    console.log('🔑 Token found:', token.substring(0, 20) + '...');
    
    // SIMPLIFY: Just verify token, no database query
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified:', decoded);
    
    // Set basic user
    req.user = {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username,
      oliviuus_id: decoded.oliviuus_id,
      guestMode: decoded.guestMode || false
    };
    
    console.log('👤 req.user set:', req.user);
    next();
    
  } catch (err) {
    console.error("\n❌ AUTH MIDDLEWARE ERROR:", err.message);
    console.error("Error stack:", err.stack);
    
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired"
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Authentication failed"
    });
  }
};

module.exports = authMiddleware;