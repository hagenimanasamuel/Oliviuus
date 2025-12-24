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

// CORS
const clientOrigin = process.env.CLIENT_ORIGIN;
app.use(cors({
  origin: clientOrigin,
  methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE', 'PATCH'],
  credentials: true,
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

// Create tables if not exist
// Create tables if not exist
Promise.all([
  // Layer 1: Foundation tables
  createUsersTable(),
  createEmailVerificationsTable(),
  createRolesTable(),
  createContactInfoTable(),
  
  // Layer 2: Direct user dependencies
  createUserPreferencesTable(),
  createPasswordResetsTable(),
  createContactsTable(),
  createRoleFeaturesTable(),
  createNotificationsTable(),
  createSecurityLogsTable(),
  createFeedbackTable(), // Moved up - only depends on users
  
  // Layer 3: Contact responses
  createContactResponsesTable(),
  
  // Layer 4: Subscriptions ecosystem
  createSubscriptionsTables(), // This creates multiple tables internally
  
  // Layer 5: Content foundation
  createContentTables(), // This creates genres, categories, contents, etc.
  createPeopleTables(), // This creates people and related tables
  
  // Layer 6: Content relationships (run after contentTables)
  // Note: contentTables already creates these internally, so no separate call needed
  
  // Layer 7: Kids foundation
  createKidsTables(), // This creates kids_profiles and related tables
  
  // Layer 8: Games ecosystem
  createGameTables(), // This creates games and related tables
  
  // Layer 9: Family ecosystem
  createFamilyMembersTable(),
  createFamilyPinSecurityTable(),
  
  // Layer 10: Watch tracking (must be after contentTables)
  createWatchTrackingTables(),
  createUserPreferencesTables(), // watchlist and likes
  createShareTables(),
  
  // Layer 11: user_session (LAST because it references kids_profiles)
  createUserSessionTable()
])
.then(async () => {
  console.log("✅ All tables checked/created");
  await createAdminSeed();

  // 🚀 Initialize subscription monitor AFTER tables are ready
  initializeSubscriptionMonitor();
  console.log("✅ Subscription monitor started");
})
.catch(err => console.error("❌ Error creating tables:", err));

// Running url port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
