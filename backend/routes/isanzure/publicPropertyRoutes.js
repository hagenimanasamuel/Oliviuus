// routes/public/properties.js
const express = require('express');
const router = express.Router();
const publicPropertyController = require('../../controllers/isanzure/publicPropertyController');

router.get('/', publicPropertyController.getPublicProperties); 
router.get('/simple', publicPropertyController.getSimpleProperties); 
router.get('/by-province', publicPropertyController.getPropertiesByProvince); 
router.get('/by-district', publicPropertyController.getPropertiesByDistrict); 
router.get('/by-location', publicPropertyController.getPropertiesByLocation);
router.get('/more', publicPropertyController.getMoreProperties); 
router.get('/popular-locations', publicPropertyController.getPopularLocations); 

router.get('/:propertyUid', publicPropertyController.getPropertyByUid);
router.get('/:propertyUid/images', publicPropertyController.getPropertyImages);
router.get('/:propertyUid/amenities', publicPropertyController.getPropertyAmenities);
router.get('/:propertyUid/rooms', publicPropertyController.getPropertyRooms);
router.get('/:propertyUid/equipment', publicPropertyController.getPropertyEquipment);
router.get('/:propertyUid/nearby', publicPropertyController.getPropertyNearbyAttractions);
router.get('/landlord/:landlordId', publicPropertyController.getLandlordInfo);
router.get('/host/:hostUid', publicPropertyController.getHostProfile);
router.get('/landlord/:landlordId/properties', publicPropertyController.getLandlordProperties);

// SSO user profile endpoint
router.get('/sso-user/:userId', publicPropertyController.getSsoUserProfile);

// Optional endpoints (return empty but don't crash)
router.get('/by-sector', publicPropertyController.getPropertiesBySector); 
router.get('/nearby', publicPropertyController.getPropertiesNearby); // GET nearby
router.get('/search', publicPropertyController.searchProperties); 
router.get('/statistics', publicPropertyController.getPropertyStatistics); 

module.exports = router;