// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const {
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
  initializeDatabase, 
  query
} = require('./config/dbConfig');
const { initializeSubscriptionMonitor } = require('./controllers/subscriptionMonitorController');
const createAdminSeed = require('./seeds/seedAdmin');
const authRoutes = require('./routes/authRoutes');
const emailVerificationRoutes = require('./routes/emailVerificationRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const userRoutes = require('./routes/userRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const userSubscriptionRoutes = require('./routes/userSubscriptionRoutes');
const contactRoutes = require('./routes/contactRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const upgradeRoutes = require('./routes/upgradeRoutes');
const newPlanRoutes = require('./routes/newPlanRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const contentRoutes = require('./routes/contentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const genreRoutes = require('./routes/genreRoutes');
const imageProxyRoutes = require('./routes/imageProxyRoutes');
const peopleRoutes = require('./routes/peopleRoutes');
const overviewRoutes = require('./routes/overviewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const viewerRoutes = require('./routes/viewerRoutes');
const searchRoutes = require('./routes/searchRoutes');
const userPreferencesRoutes = require('./routes/viewerRoutes');
const watchRoutes = require('./routes/watchRoutes');
const kidProfileRoutes = require("./routes/kidProfileRoutes");
const kidSessionRoutes = require("./routes/kidSessionRoutes");
const kidRoutes = require('./routes/kidRoutes');
const profileSelectionRoutes = require("./routes/profileSelectionRoutes");
const familyRoutes = require("./routes/familyRoutes");
const trendingRoutes = require('./routes/trendingRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const securityRoutes = require('./routes/viewerSecurity');
const gameRoutes = require('./routes/gameRoutes');
const kidInsightsRoutes = require('./routes/kidInsightsRoutes');
const { kidsActivityLogger } = require("./middlewares/kidsActivityLogger");
const kidsSecurityRoutes = require("./routes/kidsSecurityRoutes");

const cookieParser = require("cookie-parser");

const app = express();

// Parse JSON
app.use(express.json());

// use cookie parser 
app.use(cookieParser());

// Enhanced CORS headers configuration
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  "https://oliviuus.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE', 'PATCH'],
  
  // Enhanced allowedHeaders for production use
  allowedHeaders: [
    // Essential headers
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    
    // Cache control (you already had these)
    'Cache-Control',
    'Pragma',
    
    // Additional standard headers for better compatibility
    'Accept',
    'Accept-Language',
    'Accept-Encoding',
    
    // Security headers
    'X-CSRF-Token',
    'X-XSRF-Token',
    
    // Custom application headers
    'X-Client-Version',
    'X-API-Key',
    'X-Request-ID',
    
    // File upload headers
    'Content-Disposition',
    'Content-Length',
    
    // Real-time/WebSocket headers
    'Upgrade',
    'Connection',
    'Sec-WebSocket-Key',
    'Sec-WebSocket-Version',
    
    // Conditional requests
    'If-Modified-Since',
    'If-None-Match',
    'If-Match',
    'If-Unmodified-Since',
    
    // Range requests
    'Range',
    
    // CORS headers themselves
    'Origin',
    
    // Analytics/telemetry
    'User-Agent',
    'Referer',
    'DNT', // Do Not Track
  ],
  
  // Enhanced exposedHeaders for production use
  exposedHeaders: [
    // You already had these
    'Set-Cookie',
    'Date',
    'ETag',
    
    // Additional headers clients should be able to access
    'Content-Length',
    'Content-Type',
    'Content-Disposition',
    
    // Cache information
    'Last-Modified',
    'Cache-Control',
    'Expires',
    
    // Rate limiting information
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    
    // Application-specific headers
    'X-Request-ID',
    'X-Response-Time',
    'X-Powered-By',
    
    // Pagination headers
    'Link',
    'X-Total-Count',
    'X-Total-Pages',
    'X-Current-Page',
    'X-Per-Page',
    
    // Security headers
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
  ]
}));

app.use((req, res, next) => {
  // Skip activity logging for security endpoints to avoid circular logging
  if (req.path.startsWith('/api/kids/security-logs') ||
    req.path.startsWith('/api/kids/activity-summary') ||
    req.path.startsWith('/api/kids/dashboard-stats') ||
    req.path.startsWith('/api/kids/export-logs')) {
    return next();
  }
  next();
});

// kids activity logger middleware
app.use(kidsActivityLogger);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/email-verification', emailVerificationRoutes);
app.use('/api/user', preferencesRoutes);
app.use("/api/user/sessions", sessionRoutes);
app.use("/api/user/", userRoutes);
app.use('/api/user', userPreferencesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/user-subscriptions', userSubscriptionRoutes);
app.use('/api/admin/subscriptions', subscriptionRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/new-plan', newPlanRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/images', imageProxyRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/viewer', viewerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/watch', watchRoutes);
app.use("/api/kids", kidProfileRoutes);
app.use("/api/kids", kidSessionRoutes);
app.use('/api/kid', kidRoutes);
app.use("/api/profile", profileSelectionRoutes);
app.use("/api/family", familyRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/parent/kid-insights', kidInsightsRoutes);
app.use("/api/kids", kidsSecurityRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("🔧 Initializing database...");
    
    // Step 1: Initialize database tables
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error("❌ Failed to initialize database. Server cannot start.");
      process.exit(1);
    }
    
    // Step 2: Create admin seed (AFTER tables are created)
    console.log("👑 Creating admin user...");
    try {
      await createAdminSeed();
      console.log("✅ Admin user created/verified");
    } catch (seedError) {
      console.error("⚠️ Warning: Could not create admin seed:", seedError.message);
      // Don't fail the server if admin seed fails - it might already exist
    }
    
    // Step 3: Start subscription monitor
    console.log("🚀 Starting subscription monitor...");
    initializeSubscriptionMonitor();
    
    // Step 4: Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("✅ Database initialized successfully!");
      console.log("✅ Subscription monitor started");
    });
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
