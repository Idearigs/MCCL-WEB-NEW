const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');

// Apply authentication middleware to all category routes
router.use(adminAuth);

const {
  // Categories
  getCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,

  // Ring Types
  getRingTypes,
  getRingTypeById,
  createRingType,
  updateRingType,
  deleteRingType,

  // Gemstones
  getGemstones,
  getGemstoneById,
  createGemstone,
  updateGemstone,
  deleteGemstone,

  // Stone Shapes
  getStoneShapes,
  getStoneShapeById,
  createStoneShape,
  updateStoneShape,
  deleteStoneShape,

  // Stone Types
  getStoneTypes,
  getStoneTypeById,
  createStoneType,
  updateStoneType,
  deleteStoneType,

  // Metals
  getMetals,
  getMetalById,
  createMetal,
  updateMetal,
  deleteMetal,

  // Collections
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,

  // Seeding
  seedHierarchical,
  syncSchemaEndpoint
} = require('../controllers/adminCategoriesController');

// Specific routes first (order matters!)

// Categories routes
router.get('/', getCategories);
router.post('/', createCategory);
router.get('/by-slug/:slug', getCategoryBySlug);

// Ring types routes
router.get('/ring-types', getRingTypes);
router.get('/ring-types/:id', getRingTypeById);
router.post('/ring-types', createRingType);
router.put('/ring-types/:id', updateRingType);
router.delete('/ring-types/:id', deleteRingType);

// Gemstones routes
router.get('/gemstones', getGemstones);
router.get('/gemstones/:id', getGemstoneById);
router.post('/gemstones', createGemstone);
router.put('/gemstones/:id', updateGemstone);
router.delete('/gemstones/:id', deleteGemstone);

// Stone Shapes routes
router.get('/stone-shapes', getStoneShapes);
router.get('/stone-shapes/:id', getStoneShapeById);
router.post('/stone-shapes', createStoneShape);
router.put('/stone-shapes/:id', updateStoneShape);
router.delete('/stone-shapes/:id', deleteStoneShape);

// Stone Types routes
router.get('/stone-types', getStoneTypes);
router.get('/stone-types/:id', getStoneTypeById);
router.post('/stone-types', createStoneType);
router.put('/stone-types/:id', updateStoneType);
router.delete('/stone-types/:id', deleteStoneType);

// Metals routes
router.get('/metals', getMetals);
router.get('/metals/:id', getMetalById);
router.post('/metals', createMetal);
router.put('/metals/:id', updateMetal);
router.delete('/metals/:id', deleteMetal);

// Collections routes
router.get('/collections', getCollections);
router.get('/collections/:id', getCollectionById);
router.post('/collections', createCollection);
router.put('/collections/:id', updateCollection);
router.delete('/collections/:id', deleteCollection);

// Seeding and schema routes
router.post('/seed-hierarchical', seedHierarchical);
router.post('/sync-schema', syncSchemaEndpoint);

// Generic category routes (must come after all other specific routes)
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);


module.exports = router;