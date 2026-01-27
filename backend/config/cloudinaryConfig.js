// backend/config/cloudinaryConfig.js
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload Buffer directly to Cloudinary
const uploadBufferToCloudinary = (buffer, folder = 'isanzure/properties', fileName = '') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
      ],
      public_id: fileName ? fileName.split('.')[0] : undefined,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            original_filename: fileName,
          });
        }
      }
    );

    // Create a readable stream from buffer and pipe to Cloudinary
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Function to upload multiple buffers
const uploadMultipleBuffersToCloudinary = async (files, folder = 'isanzure/properties') => {
  try {
    const uploadPromises = files.map(file => 
      uploadBufferToCloudinary(file.buffer, folder, file.originalname)
    );
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    throw new Error('Failed to upload multiple images');
  }
};

// Function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
  uploadMultipleBuffersToCloudinary,
  deleteFromCloudinary,
};