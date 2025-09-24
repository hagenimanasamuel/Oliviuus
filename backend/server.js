// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createUsersTable, createEmailVerificationsTable, createUserPreferencesTable, createUserSessionTable, createSubscriptionsTables } = require('./config/dbConfig');
const createAdminSeed = require('./seeds/seedAdmin');
const authRoutes = require('./routes/authRoutes');
const emailVerificationRoutes = require('./routes/emailVerificationRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');
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
  methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'],
  credentials: true,
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/email-verification', emailVerificationRoutes);
app.use('/api/user', preferencesRoutes);
app.use("/api/user/sessions", sessionRoutes);
app.use("/api/user/", userRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// Create tables if not exist
Promise.all([createUsersTable(), createEmailVerificationsTable(), createUserPreferencesTable(), createUserSessionTable(), createSubscriptionsTables()])
.then(async () => {
    console.log("✅ Tables checked/created");
    await createAdminSeed();
  })
  .catch(err => console.error("❌ Error creating tables:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
