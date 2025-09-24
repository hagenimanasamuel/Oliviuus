const { query } = require("../config/dbConfig"); // your MySQL query function

// ✅ Get user preferences
const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const prefRows = await query(
      `SELECT language, notifications, genres, subtitles
       FROM user_preferences
       WHERE user_id = ?`,
      [userId]
    );

    if (prefRows.length === 0) {
      return res.json({
        language: "rw",
        notifications: true,
        genres: [],
        autoSubtitles: true,
      });
    }

    const prefs = prefRows[0];

    res.json({
      language: prefs.language || "rw",
      notifications:
        prefs.notifications !== undefined ? !!prefs.notifications : true,
      genres: prefs.genres ? JSON.parse(prefs.genres) : [],
      autoSubtitles:
        prefs.subtitles !== undefined ? !!prefs.subtitles : true,
    });
  } catch (err) {
    console.error("❌ Error in getPreferences:", err);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
};

// ✅ Update user preferences
const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language, genres, notifications, autoSubtitles } = req.body;

    // Convert genres array to JSON string for storage
    const genresStr = Array.isArray(genres) ? JSON.stringify(genres) : "[]";

    // Check if user already has preferences
    const existing = await query(
      `SELECT id FROM user_preferences WHERE user_id = ?`,
      [userId]
    );

    if (existing.length > 0) {
      // Update existing preferences
      await query(
        `UPDATE user_preferences
         SET language = ?, genres = ?, notifications = ?, subtitles = ?
         WHERE user_id = ?`,
        [
          language,
          genresStr,
          notifications ? 1 : 0,
          autoSubtitles ? 1 : 0,
          userId,
        ]
      );
    } else {
      // Insert new preferences
      await query(
        `INSERT INTO user_preferences (user_id, language, genres, notifications, subtitles)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          language,
          genresStr,
          notifications ? 1 : 0,
          autoSubtitles ? 1 : 0,
        ]
      );
    }

    res.json({ message: "Preferences updated successfully!" });
  } catch (err) {
    console.error("❌ Error in updatePreferences:", err);
    res.status(500).json({ error: "Failed to update preferences." });
  }
};

module.exports = { getPreferences, updatePreferences };
