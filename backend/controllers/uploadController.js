const { query } = require("../config/dbConfig");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Generate file path utility
const generateFilePath = (contentType, contentId, fileType, options = {}) => {
  const timestamp = Date.now();
  const { seasonNumber, episodeNumber, language, quality } = options;
  
  const basePaths = {
    thumbnail: `thumbnails/${contentId}/thumbnail-${timestamp}.jpg`,
    poster: `posters/${contentId}/poster-${timestamp}.jpg`,
    mainVideo: `videos/${contentType}s/${contentId}/main-${timestamp}.mp4`,
    trailer: `videos/${contentType}s/${contentId}/trailer-${timestamp}.mp4`,
    episodeVideo: `episodes/${contentId}/season_${seasonNumber}/episode_${episodeNumber}-${timestamp}.mp4`,
    episodeThumbnail: `episodes/${contentId}/season_${seasonNumber}/episode_${episodeNumber}-thumbnail-${timestamp}.jpg`,
    episodeTrailer: `episodes/${contentId}/season_${seasonNumber}/episode_${episodeNumber}-trailer-${timestamp}.mp4`,
    subtitle: `subtitles/${contentId}/${language}-${timestamp}.vtt`,
    screenshot: `videos/${contentType}s/${contentId}/screenshots/screenshot-${timestamp}.jpg`,
    behindScenes: `videos/${contentType}s/${contentId}/behind_scenes-${timestamp}.mp4`,
    teaser: `videos/${contentType}s/${contentId}/teaser-${timestamp}.mp4`,
    keyArt: `keyart/${contentId}/keyart-${timestamp}.jpg`,
    seasonPosters: `seasons/${contentId}/season_${seasonNumber}-poster-${timestamp}.jpg`,
    bloopers: `bloopers/${contentId}/blooper-${timestamp}.mp4`
  };
  
  return basePaths[fileType] || `files/${contentId}/${fileType}-${timestamp}`;
};

// Validate file type and size
const validateFileType = (fileType, fileName) => {
  const allowedTypes = {
    thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
    poster: ['image/jpeg', 'image/png', 'image/webp'],
    mainVideo: ['video/mp4', 'video/mov', 'video/avi'],
    trailer: ['video/mp4', 'video/mov'],
    episodeVideo: ['video/mp4', 'video/mov'],
    episodeThumbnail: ['image/jpeg', 'image/png', 'image/webp'],
    episodeTrailer: ['video/mp4', 'video/mov'],
    subtitle: ['text/vtt', 'application/x-subrip'],
    screenshot: ['image/jpeg', 'image/png'],
    behindScenes: ['video/mp4', 'video/mov'],
    teaser: ['video/mp4', 'video/mov'],
    keyArt: ['image/jpeg', 'image/png', 'image/webp'],
    seasonPosters: ['image/jpeg', 'image/png', 'image/webp'],
    bloopers: ['video/mp4', 'video/mov']
  };
  
  const extension = fileName.split('.').pop().toLowerCase();
  const validExtensions = {
    image: ['jpg', 'jpeg', 'png', 'webp'],
    video: ['mp4', 'mov', 'avi'],
    subtitle: ['vtt', 'srt']
  };
  
  const fileTypeCategory = fileType.includes('thumbnail') || fileType.includes('poster') || fileType.includes('screenshot') || fileType.includes('keyArt') || fileType.includes('seasonPosters') ? 'image' : 
                          fileType === 'subtitle' ? 'subtitle' : 'video';
  
  return validExtensions[fileTypeCategory].includes(extension);
};

const validateFileSize = (fileType, fileSize) => {
  const maxSizes = {
    thumbnail: 5 * 1024 * 1024, // 5MB
    poster: 10 * 1024 * 1024, // 10MB
    mainVideo: 4 * 1024 * 1024 * 1024, // 4GB
    trailer: 500 * 1024 * 1024, // 500MB
    episodeVideo: 2 * 1024 * 1024 * 1024, // 2GB
    episodeThumbnail: 5 * 1024 * 1024, // 5MB
    episodeTrailer: 200 * 1024 * 1024, // 200MB
    subtitle: 1 * 1024 * 1024, // 1MB
    screenshot: 5 * 1024 * 1024, // 5MB
    behindScenes: 500 * 1024 * 1024, // 500MB
    teaser: 200 * 1024 * 1024, // 200MB
    keyArt: 8 * 1024 * 1024, // 8MB
    seasonPosters: 10 * 1024 * 1024, // 10MB
    bloopers: 300 * 1024 * 1024 // 300MB
  };
  
  return fileSize <= (maxSizes[fileType] || 10 * 1024 * 1024);
};

const getMimeType = (fileType, fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    vtt: 'text/vtt',
    srt: 'application/x-subrip'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

// Generate pre-signed upload URL 
const generateUploadUrl = async (req, res) => {
  // console.log('🔍 Received upload request:', req.body);
  const { 
    contentType, 
    contentId, 
    assetType: fileType, 
    fileName, 
    fileSize, 
    seasonNumber, 
    episodeNumber, 
    language,
    metadata // Accept metadata from frontend
  } = req.body;
  const userId = req.user.id;

  if (!contentType || !contentId || !fileType || !fileName || !fileSize) {
    return res.status(400).json({ 
      error: "Missing required fields: contentType, contentId, fileType, fileName, fileSize" 
    });
  }

  try {
    // Validate file type and size
    if (!validateFileType(fileType, fileName)) {
      return res.status(400).json({ 
        error: `Invalid file type for ${fileType}. Allowed types: ${fileType.includes('image') ? 'JPEG, PNG, WebP' : fileType.includes('video') ? 'MP4, MOV, AVI' : 'VTT, SRT'}` 
      });
    }
    
    if (!validateFileSize(fileType, fileSize)) {
      const maxSizes = {
        thumbnail: '5MB',
        poster: '10MB', 
        mainVideo: '4GB',
        trailer: '500MB',
        episodeVideo: '2GB',
        episodeThumbnail: '5MB',
        episodeTrailer: '200MB',
        subtitle: '1MB',
        screenshot: '5MB',
        behindScenes: '500MB',
        teaser: '200MB',
        keyArt: '8MB',
        seasonPosters: '10MB',
        bloopers: '300MB'
      };
      return res.status(400).json({ 
        error: `File too large for ${fileType}. Maximum size: ${maxSizes[fileType] || '10MB'}` 
      });
    }

    // Generate file path
    const key = generateFilePath(contentType, contentId, fileType, {
      seasonNumber,
      episodeNumber,
      language
    });

    // Generate pre-signed URL with metadata
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: getMimeType(fileType, fileName),
      Metadata: {
        uploadedBy: userId.toString(),
        contentType: contentType,
        fileType: fileType,
        originalName: fileName,
        // Include metadata in S3 metadata
        assetTitle: metadata?.title || '',
        assetDescription: metadata?.description || '',
        episodeTitle: metadata?.episodeTitle || '',
        seasonNumber: seasonNumber?.toString() || '',
        episodeNumber: episodeNumber?.toString() || ''
      }
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 4 * 3600 // 4 hours
    });

    // Insert media asset with metadata
    await query(
      `INSERT INTO media_assets (
        content_id, asset_type, file_name, file_path, file_size, mime_type,
        asset_title, asset_description, season_number, episode_number,
        episode_title, upload_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        contentId, 
        fileType, 
        fileName, 
        key, 
        fileSize,
        getMimeType(fileType, fileName),
        metadata?.title || null,
        metadata?.description || null,
        seasonNumber || null,
        episodeNumber || null,
        metadata?.episodeTitle || null
      ]
    );

    res.json({
      success: true,
      uploadUrl,
      key,
      expiresAt: Date.now() + (4 * 3600000), // 4 hours in milliseconds
      message: "Upload URL generated successfully"
    });

  } catch (error) {
    console.error("❌ Error generating upload URL:", error);
    res.status(500).json({ 
      error: "Failed to generate upload URL",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Confirm upload completion 
const confirmUpload = async (req, res) => {
  const { key, contentId, assetType, metadata } = req.body;
  const userId = req.user.id;

  if (!key || !contentId || !assetType) {
    return res.status(400).json({ 
      error: "Missing required fields: key, contentId, assetType" 
    });
  }

  try {
    // Update media asset record with metadata
    await query(
      `UPDATE media_assets 
       SET upload_status = 'completed', 
           asset_title = ?, 
           asset_description = ?,
           episode_title = ?,
           alt_text = ?,
           caption = ?,
           updated_at = NOW() 
       WHERE file_path = ? AND content_id = ? AND asset_type = ?`,
      [
        metadata?.asset_title || null,
        metadata?.asset_description || null,
        metadata?.episode_title || null,
        metadata?.asset_title || null, // Use title as alt_text for SEO
        metadata?.asset_description || null, // Use description as caption
        key, 
        contentId, 
        assetType
      ]
    );

    // If this is a primary asset (thumbnail, poster, main video), mark others as not primary
    if (['thumbnail', 'poster', 'mainVideo'].includes(assetType)) {
      await query(
        `UPDATE media_assets 
         SET is_primary = FALSE 
         WHERE content_id = ? AND asset_type = ? AND file_path != ?`,
        [contentId, assetType, key]
      );

      // Set this one as primary
      await query(
        `UPDATE media_assets 
         SET is_primary = TRUE 
         WHERE file_path = ? AND content_id = ? AND asset_type = ?`,
        [key, contentId, assetType]
      );
    }

    res.json({
      success: true,
      message: "Upload confirmed successfully",
      key,
      assetType
    });

  } catch (error) {
    console.error("❌ Error confirming upload:", error);
    res.status(500).json({ 
      error: "Failed to confirm upload",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get content media assets 
const getContentMedia = async (req, res) => {
  const { contentId } = req.params;

  if (!contentId) {
    return res.status(400).json({ error: "Content ID is required" });
  }

  try {
    const mediaAssets = await query(
      `SELECT id, asset_type, file_name, file_path, file_size, upload_status, 
              is_primary, asset_title, asset_description, season_number, episode_number,
              episode_title, created_at, updated_at
       FROM media_assets 
       WHERE content_id = ? 
       ORDER BY asset_type, season_number, episode_number, created_at DESC`,
      [contentId]
    );

    // FIXED: Generate correct public URLs without hardcoded bucket path
    const assetsWithUrls = mediaAssets.map(asset => ({
      ...asset,
      url: asset.upload_status === 'completed' 
        ? `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${asset.file_path}`
        : null
    }));

    console.log('🔗 Generated media URLs:', assetsWithUrls);

    res.json({
      success: true,
      assets: assetsWithUrls
    });

  } catch (error) {
    console.error("❌ Error fetching media assets:", error);
    res.status(500).json({ 
      error: "Failed to fetch media assets",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete media asset
const deleteMediaAsset = async (req, res) => {
  const { assetId } = req.params;
  const userId = req.user.id;

  if (!assetId) {
    return res.status(400).json({ error: "Asset ID is required" });
  }

  try {
    // Get asset details
    const assets = await query(
      `SELECT file_path, content_id, asset_type FROM media_assets WHERE id = ?`,
      [assetId]
    );

    if (assets.length === 0) {
      return res.status(404).json({ error: "Media asset not found" });
    }

    const asset = assets[0];

    // Delete from R2
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: asset.file_path
    });

    await s3Client.send(deleteCommand);

    // Delete from database
    await query(
      `DELETE FROM media_assets WHERE id = ?`,
      [assetId]
    );

    res.json({
      success: true,
      message: "Media asset deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting media asset:", error);
    res.status(500).json({ 
      error: "Failed to delete media asset",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Set primary asset
const setPrimaryAsset = async (req, res) => {
  const { assetId } = req.params;
  const userId = req.user.id;

  if (!assetId) {
    return res.status(400).json({ error: "Asset ID is required" });
  }

  try {
    // Get asset details
    const assets = await query(
      `SELECT content_id, asset_type FROM media_assets WHERE id = ?`,
      [assetId]
    );

    if (assets.length === 0) {
      return res.status(404).json({ error: "Media asset not found" });
    }

    const { content_id, asset_type } = assets[0];

    // Set all assets of this type to not primary
    await query(
      `UPDATE media_assets 
       SET is_primary = FALSE 
       WHERE content_id = ? AND asset_type = ?`,
      [content_id, asset_type]
    );

    // Set this asset as primary
    await query(
      `UPDATE media_assets 
       SET is_primary = TRUE 
       WHERE id = ?`,
      [assetId]
    );

    res.json({
      success: true,
      message: "Asset set as primary successfully"
    });

  } catch (error) {
    console.error("❌ Error setting primary asset:", error);
    res.status(500).json({ 
      error: "Failed to set primary asset",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  generateUploadUrl,
  confirmUpload,
  getContentMedia,
  deleteMediaAsset,
  setPrimaryAsset
};