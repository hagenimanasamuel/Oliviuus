const express = require('express');
const router = express.Router();
const searchController = require('../../controllers/isanzure/searchController');

// Advanced search with all filters (main endpoint)
router.get('/advanced', searchController.advancedSearch);

// Intelligent search for suggestions
router.get('/intelligent', searchController.intelligentSearch);

// Get popular searches and recommendations
router.get('/popular', searchController.getPopularSearches);

// Get autocomplete suggestions
router.get('/autocomplete', searchController.getAutocomplete);

// Get search filters
router.get('/filters', searchController.getSearchFilters);

// Get search insights and analytics
router.get('/insights', searchController.getSearchInsights);

module.exports = router;