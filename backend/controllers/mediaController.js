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
      is_primary,
      asset_title,
      asset_description,
      episode_title
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

    // Insert media asset with ALL fields
    const result = await query(
      `INSERT INTO media_assets (
        content_id, asset_type, file_name, file_path, file_size, mime_type,
        resolution, duration_seconds, bitrate, format, season_number,
        episode_number, asset_title, asset_description, episode_title,
        upload_status, is_primary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
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
        asset_title || file_name.replace(/\.[^/.]+$/, ""), // Use filename as default title
        asset_description || null,
        episode_title || null,
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
    console.error('Error uploading media asset:', error);
    
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
       ORDER BY asset_type, season_number, episode_number, created_at DESC`,
      [contentId]
    );

    // FIXED: Use consistent URL generation (same as uploadController)
    const assetsWithUrls = mediaAssets.map(asset => ({
      ...asset,
      url: asset.upload_status === 'completed' 
        ? `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${asset.file_path}`
        : null,
      // FIXED: Parse JSON fields safely
      subtitle_languages: asset.subtitle_languages 
        ? (() => {
            try {
              return JSON.parse(asset.subtitle_languages);
            } catch (e) {
              console.error('Error parsing subtitle_languages:', e);
              return [];
            }
          })()
        : []
    }));

    res.json({
      success: true,
      media_assets: assetsWithUrls
    });

  } catch (error) {
    console.error('Error getting media assets:', error);
    res.status(500).json({
      error: 'Failed to fetch media assets',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update media asset - FIXED: Added all fields from frontend
const updateMediaAsset = async (req, res) => {
  const { assetId } = req.params;

  try {
    const {
      asset_type,
      file_name,
      asset_title,
      asset_description,
      alt_text,
      caption,
      resolution,
      duration_seconds,
      bitrate,
      format,
      season_number,
      episode_number,
      episode_title,
      episode_description,
      is_primary,
      is_optimized,
      has_subtitles,
      subtitle_languages
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

    // FIXED: Update ALL fields from frontend
    await query(
      `UPDATE media_assets 
       SET 
         asset_type = COALESCE(?, asset_type),
         file_name = COALESCE(?, file_name),
         asset_title = ?,
         asset_description = ?,
         alt_text = ?,
         caption = ?,
         resolution = ?,
         duration_seconds = ?,
         bitrate = ?,
         format = ?,
         season_number = ?,
         episode_number = ?,
         episode_title = ?,
         episode_description = ?,
         is_primary = ?,
         is_optimized = ?,
         has_subtitles = ?,
         subtitle_languages = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        asset_type,
        file_name,
        asset_title,
        asset_description,
        alt_text,
        caption,
        resolution,
        duration_seconds ? parseInt(duration_seconds) : null,
        bitrate ? parseInt(bitrate) : null,
        format,
        season_number ? parseInt(season_number) : null,
        episode_number ? parseInt(episode_number) : null,
        episode_title,
        episode_description,
        is_primary || false,
        is_optimized || false,
        has_subtitles || false,
        subtitle_languages,
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
    console.error('Error updating media asset:', error);
    
    res.status(500).json({
      error: 'Failed to update media asset',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete media asset - Also delete from R2
const deleteMediaAsset = async (req, res) => {
  const { assetId } = req.params;

  try {
    // Check if asset exists and get file_path
    const assetExists = await query('SELECT id, file_path FROM media_assets WHERE id = ?', [assetId]);
    if (assetExists.length === 0) {
      return res.status(404).json({
        error: "Media asset not found"
      });
    }

    const asset = assetExists[0];

    // Start transaction
    await query('START TRANSACTION');

    // Delete from database
    await query('DELETE FROM media_assets WHERE id = ?', [assetId]);

    // Delete from R2 storage
    try {
      const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
      
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: asset.file_path
      });

      await s3Client.send(deleteCommand);
      console.log(`✅ File deleted from R2: ${asset.file_path}`);
    } catch (r2Error) {
      console.error('❌ Failed to delete from R2, but DB record was removed:', r2Error);
      // Continue anyway - we don't want to rollback if R2 delete fails
    }

    // Commit transaction
    await query('COMMIT');

    res.json({
      success: true,
      message: 'Media asset deleted successfully from both database and storage'
    });

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error deleting media asset:', error);
    
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
    console.error('Error setting primary media asset:', error);
    
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