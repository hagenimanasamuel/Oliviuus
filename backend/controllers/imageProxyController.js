const { query } = require("../config/dbConfig");

const proxyImage = async (req, res) => {
  const { contentId, assetType } = req.params;

  try {
    console.log('🔄 Proxying image request:', { contentId, assetType });

    // Get the media asset from database
    const assets = await query(
      `SELECT file_path, asset_type, upload_status 
       FROM media_assets 
       WHERE content_id = ? AND asset_type = ? AND upload_status = 'completed' 
       ORDER BY is_primary DESC, created_at DESC 
       LIMIT 1`,
      [contentId, assetType]
    );

    if (assets.length === 0) {
      console.log('❌ No image found in database for:', { contentId, assetType });
      return res.status(404).json({ 
        success: false,
        error: 'Image not found in database'
      });
    }

    const asset = assets[0];
    const imageUrl = `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/oliviuus-media/${asset.file_path}`;

    console.log('🔗 Fetching from R2:', imageUrl);

    // Fetch the image from R2
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`R2 responded with ${response.status}: ${response.statusText}`);
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Set headers and send image
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins temporarily

    res.send(Buffer.from(imageBuffer));
    console.log('✅ Image proxied successfully');

  } catch (error) {
    console.error('❌ Error proxying image:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load image from storage',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  proxyImage
};