const { query } = require("../config/dbConfig");

// Upload media asset
const uploadMediaAsset = async (req, res) => {
  const userId = req.user.id;
  const { contentId } = req.params;

  try {
    const {
      asset_type,
      file_name,
      file_path,
      file_size,
      mime_type,
      resolution,
      duration_seconds,
      bitrate,
      format,
      season_number,
      episode_number,
      is_primary
    } = req.body;

    // Validate required fields
    if (!asset_type || !file_name || !file_path || !file_size || !mime_type) {
      return res.status(400).json({
        error: "Missing required fields: asset_type, file_name, file_path, file_size, mime_type"
      });
    }

    // Validate content exists
    const contentExists = await query('SELECT id FROM contents WHERE id = ?', [contentId]);
    if (contentExists.length === 0) {
      return res.status(404).json({
        error: "Content not found"
      });
    }

    // Start transaction
    await query('START TRANSACTION');

    // If this is set as primary, unset other primary assets of the same type
    if (is_primary) {
      await query(
        'UPDATE media_assets SET is_primary = FALSE WHERE content_id = ? AND asset_type = ?',
        [contentId, asset_type]
      );
    }

    // Insert media asset
    const result = await query(
      `INSERT INTO media_assets (
        content_id, asset_type, file_name, file_path, file_size, mime_type,
        resolution, duration_seconds, bitrate, format, season_number,
        episode_number, upload_status, is_primary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
      [
        contentId,
        asset_type,
        file_name,
        file_path,
        file_size,
        mime_type,
        resolution || null,
        duration_seconds || null,
        bitrate || null,
        format || null,
        season_number || null,
        episode_number || null,
        is_primary || false
      ]
    );

    // Commit transaction
    await query('COMMIT');

    // Fetch the created media asset
    const mediaAsset = await query('SELECT * FROM media_assets WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Media asset uploaded successfully',
      media_asset: mediaAsset[0]
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    
    res.status(500).json({
      error: 'Failed to upload media asset',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get media assets for content
const getMediaAssets = async (req, res) => {
  const { contentId } = req.params;

  try {
    const mediaAssets = await query(
      `SELECT * FROM media_assets 
       WHERE content_id = ? 
       ORDER BY asset_type, created_at DESC`,
      [contentId]
    );

    // Generate URLs for completed uploads
    const assetsWithUrls = mediaAssets.map(asset => ({
      ...asset,
      url: asset.upload_status === 'completed' 
        ? `https://pub-${process.env.R2_PUBLIC_URL_ID}.r2.dev/${asset.file_path}`
        : null
    }));

    res.json({
      success: true,
      media_assets: assetsWithUrls
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch media assets',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update media asset
const updateMediaAsset = async (req, res) => {
  const { assetId } = req.params;

  try {
    const {
      asset_type,
      file_name,
      is_primary,
      alt_text,
      caption
    } = req.body;

    // Start transaction
    await query('START TRANSACTION');

    // Get current asset to check content_id
    const currentAsset = await query('SELECT content_id, asset_type FROM media_assets WHERE id = ?', [assetId]);
    if (currentAsset.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({
        error: "Media asset not found"
      });
    }

    // If setting as primary, unset other primary assets of the same type
    if (is_primary) {
      await query(
        'UPDATE media_assets SET is_primary = FALSE WHERE content_id = ? AND asset_type = ? AND id != ?',
        [currentAsset[0].content_id, asset_type || currentAsset[0].asset_type, assetId]
      );
    }

    // Update media asset
    await query(
      `UPDATE media_assets 
       SET asset_type = ?, file_name = ?, is_primary = ?, alt_text = ?, caption = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        asset_type,
        file_name,
        is_primary || false,
        alt_text,
        caption,
        assetId
      ]
    );

    // Commit transaction
    await query('COMMIT');

    // Fetch updated asset
    const updatedAsset = await query('SELECT * FROM media_assets WHERE id = ?', [assetId]);

    res.json({
      success: true,
      message: 'Media asset updated successfully',
      media_asset: updatedAsset[0]
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    
    res.status(500).json({
      error: 'Failed to update media asset',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete media asset
const deleteMediaAsset = async (req, res) => {
  const { assetId } = req.params;

  try {
    // Check if asset exists
    const assetExists = await query('SELECT id FROM media_assets WHERE id = ?', [assetId]);
    if (assetExists.length === 0) {
      return res.status(404).json({
        error: "Media asset not found"
      });
    }

    // Delete media asset
    await query('DELETE FROM media_assets WHERE id = ?', [assetId]);

    res.json({
      success: true,
      message: 'Media asset deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete media asset',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Set primary media asset
const setPrimaryMediaAsset = async (req, res) => {
  const { assetId } = req.params;

  try {
    // Get current asset to check content_id and asset_type
    const currentAsset = await query('SELECT content_id, asset_type FROM media_assets WHERE id = ?', [assetId]);
    if (currentAsset.length === 0) {
      return res.status(404).json({
        error: "Media asset not found"
      });
    }

    // Start transaction
    await query('START TRANSACTION');

    // Unset all primary assets of the same type
    await query(
      'UPDATE media_assets SET is_primary = FALSE WHERE content_id = ? AND asset_type = ?',
      [currentAsset[0].content_id, currentAsset[0].asset_type]
    );

    // Set this asset as primary
    await query(
      'UPDATE media_assets SET is_primary = TRUE, updated_at = NOW() WHERE id = ?',
      [assetId]
    );

    // Commit transaction
    await query('COMMIT');

    res.json({
      success: true,
      message: 'Media asset set as primary successfully'
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    
    res.status(500).json({
      error: 'Failed to set primary media asset',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  uploadMediaAsset,
  getMediaAssets,
  updateMediaAsset,
  deleteMediaAsset,
  setPrimaryMediaAsset
};