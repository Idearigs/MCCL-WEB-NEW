const express = require('express');
const router = express.Router();

// Import the same controller functions but without auth middleware
const {
  getRingTypes,
  getGemstones,
  getMetals,
  getCollections
} = require('../controllers/adminCategoriesController');

const {
  getEarringTypes,
  getNecklaceTypes,
  getBraceletTypes
} = require('../controllers/adminJewelryCategoriesController');

// Public filter endpoints (no authentication required)
router.get('/ring-types', getRingTypes);
router.get('/gemstones', getGemstones);
router.get('/metals', getMetals);
router.get('/collections', getCollections);

// Jewelry category endpoints (public)
router.get('/earring-types', getEarringTypes);
router.get('/necklace-types', getNecklaceTypes);
router.get('/bracelet-types', getBraceletTypes);

module.exports = router;