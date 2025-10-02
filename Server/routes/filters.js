const express = require('express');
const router = express.Router();

// Import the same controller functions but without auth middleware
const {
  getRingTypes,
  getGemstones,
  getMetals,
  getCollections
} = require('../controllers/adminCategoriesController');

// Public filter endpoints (no authentication required)
router.get('/ring-types', getRingTypes);
router.get('/gemstones', getGemstones);
router.get('/metals', getMetals);
router.get('/collections', getCollections);

module.exports = router;