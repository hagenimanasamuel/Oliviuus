// backend/routes/propertyRoutes.js - UPDATED
const express = require('express');
const router = express.Router();
const propertyController = require('../../controllers/isanzure/propertyController');
const { uploadMultipleImages } = require('../../middlewares/isanzure/uploadMiddleware');

// Public routes
router.get('/', propertyController.getAllProperties);
router.get('/amenities', propertyController.getAmenities);
router.get('/search', propertyController.searchProperties);
router.get('/:propertyUid', propertyController.getCompletePropertyByUid); // Updated

// Property creation with image upload
router.post(
  '/',
  uploadMultipleImages,
  propertyController.createProperty
);

// Property management routes
router.get('/landlord/:landlordId', propertyController.getPropertiesByLandlord);
router.get('/stats/:landlordId', propertyController.getPropertyStats);

// Property update with optional image upload
router.put(
  '/:propertyUid',
  uploadMultipleImages,
  propertyController.updateProperty
);

// Property deletion
router.delete('/:propertyUid', propertyController.deleteProperty);

// Image management routes
router.delete('/:propertyUid/images/:imageId', propertyController.deletePropertyImage);
router.put('/:propertyUid/images/:imageId/cover', propertyController.setPropertyCoverImage);

// NEW ROUTES
router.post('/bulk-update-status', propertyController.bulkUpdatePropertyStatus);
router.get('/:propertyUid/history', propertyController.getPropertyEditHistory);
router.post('/:propertyUid/duplicate', propertyController.duplicateProperty);

// Export routes
module.exports = router;