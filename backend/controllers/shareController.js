// controllers/shareController.js
const { query } = require("../config/dbConfig");

// Track content share
const trackContentShare = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;
    const { 
      platform = 'direct', 
      method = 'share_modal',
      share_url = null 
    } = req.body;

    // Verify content exists and is accessible
    const content = await query(`
      SELECT id FROM contents 
      WHERE id = ? 
        AND status = 'published' 
        AND visibility = 'public'
    `, [contentId]);

    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Insert share record
    const shareResult = await query(`
      INSERT INTO content_shares 
      (content_id, user_id, platform, method, share_url, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [contentId, userId, platform, method, share_url]);

    // Update content share count
    await query(`
      UPDATE contents 
      SET share_count = COALESCE(share_count, 0) + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [contentId]);

    res.json({
      success: true,
      message: 'Share tracked successfully',
      data: {
        share_id: shareResult.insertId,
        content_id: contentId,
        platform: platform
      }
    });

  } catch (error) {
    console.error('Error tracking content share:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to track share'
    });
  }
};

// Get content share statistics
const getContentShareStats = async (req, res) => {
  try {
    const { contentId } = req.params;

    const stats = await query(`
      SELECT 
        COUNT(*) as total_shares,
        COUNT(DISTINCT user_id) as unique_sharers,
        platform,
        COUNT(*) as platform_shares
      FROM content_shares 
      WHERE content_id = ?
      GROUP BY platform
      ORDER BY platform_shares DESC
    `, [contentId]);

    const totalShares = stats.reduce((sum, item) => sum + item.total_shares, 0);

    res.json({
      success: true,
      data: {
        total_shares: totalShares,
        unique_sharers: stats[0]?.unique_sharers || 0,
        platform_breakdown: stats
      }
    });

  } catch (error) {
    console.error('Error fetching share statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch share statistics'
    });
  }
};

module.exports = {
  trackContentShare,
  getContentShareStats
};