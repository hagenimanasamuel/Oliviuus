// backend/middleware/uploadMiddleware.js
const multer = require('multer');

// Use memory storage - files stored as Buffer in memory
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WebP images are allowed.'));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10, // Max 10 files
  },
  fileFilter: fileFilter,
});

// Single image upload middleware
const uploadSingleImage = upload.single('image');

// Multiple images upload middleware
const uploadMultipleImages = upload.array('images', 10); // Max 10 images

// Field-based upload middleware (for different image fields)
const uploadPropertyImages = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'propertyImages', maxCount: 9 }
]);

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadPropertyImages,
  upload,
};