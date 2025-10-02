const express = require('express');
const router = express.Router();
const {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getCollectionsByBrand,
  createCollection,
  getFeaturedCollections,
  getCollectionBySlug,
  getAllWatches,
  getWatchBySlug,
  createWatch,
  updateWatch,
  deleteWatch,
  updateWatchSpecifications,
  addWatchImage,
  deleteWatchImage
} = require('../controllers/watchController');

// Brand routes
router.get('/brands', getAllBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// Collection routes
router.get('/featured-collections', getFeaturedCollections);
router.get('/collections/:slug', getCollectionBySlug);
router.get('/brands/:brandId/collections', getCollectionsByBrand);
router.post('/collections', createCollection);

// Watch routes
router.get('/watches', getAllWatches);
router.get('/watches/:slug', getWatchBySlug);
router.post('/watches', createWatch);
router.put('/watches/:id', updateWatch);
router.delete('/watches/:id', deleteWatch);

// Watch specifications routes
router.put('/watches/:watchId/specifications', updateWatchSpecifications);

// Watch image routes
router.post('/watches/:watchId/images', addWatchImage);
router.delete('/images/:imageId', deleteWatchImage);

module.exports = router;