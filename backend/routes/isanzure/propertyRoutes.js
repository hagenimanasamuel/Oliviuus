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

// Bulk update property status
router.post('/bulk-update-status', propertyController.bulkUpdatePropertyStatus);

// Get property edit history
router.get('/:propertyUid/history', propertyController.getPropertyEditHistory);

// Duplicate property
router.post('/:propertyUid/duplicate', propertyController.duplicateProperty);

// Update single property status
router.patch('/:propertyUid/status', propertyController.updatePropertyStatus);

// Export properties
router.get('/export', async (req, res) => {
  try {
    const { landlordId, format = 'csv' } = req.query;
    
    const properties = await isanzureQuery(`
      SELECT 
        p.property_uid, p.title, p.description, p.property_type,
        p.address, p.province, p.district, p.sector,
        p.area, p.max_guests, p.total_rooms,
        p.status, p.created_at, p.published_at,
        pp.monthly_price, pp.weekly_price, pp.daily_price,
        (SELECT COUNT(*) FROM property_images WHERE property_id = p.id) as image_count,
        (SELECT COUNT(*) FROM property_views WHERE property_id = p.id) as view_count
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.landlord_id = ?
      ORDER BY p.created_at DESC
    `, [landlordId]);

    if (format === 'csv') {
      // Generate CSV
      const csv = convertToCSV(properties);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=properties.csv');
      res.send(csv);
    } else {
      // Generate PDF (simplified - you'd use a PDF library)
      res.status(200).json({
        success: true,
        data: properties
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export properties'
    });
  }
});



// Export routes
module.exports = router;