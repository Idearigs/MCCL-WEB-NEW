const express = require('express');
const router = express.Router();
const {
  getRingTypes,
  getGemstones,
  getMetals,
  getCategories,
  getCollections,
  createRingType,
  createGemstone,
  createMetal
} = require('../controllers/adminRingCategoriesController');

// Ring types routes
router.get('/ring-types', getRingTypes);
router.post('/ring-types', createRingType);

// Gemstones routes
router.get('/gemstones', getGemstones);
router.post('/gemstones', createGemstone);

// Metals routes
router.get('/metals', getMetals);
router.post('/metals', createMetal);

// Categories routes
router.get('/categories', getCategories);

// Collections routes
router.get('/collections', getCollections);

module.exports = router;