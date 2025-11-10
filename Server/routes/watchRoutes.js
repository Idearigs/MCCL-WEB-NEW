const express = require('express');
const router = express.Router();
const { uploadSingle } = require('../middleware/upload');
const {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getCollectionsByBrand,
  createCollection,
  updateCollection,
  deleteCollection,
  getFeaturedCollections,
  getCollectionBySlug,
  getAllWatches,
  getWatchBySlug,
  getWatchById,
  createWatch,
  updateWatch,
  deleteWatch,
  updateWatchSpecifications,
  addWatchImage,
  deleteWatchImage,
  addWatchVideo,
  deleteWatchVideo,
  getWatchVideos,
  updateWatchVideo
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
router.put('/collections/:id', updateCollection);
router.delete('/collections/:id', deleteCollection);

// Watch routes
router.get('/', getAllWatches);
router.get('/watches', getAllWatches); // Admin endpoint for getting all watches (matches frontend /admin/watches/watches)
router.get('/admin/:id', getWatchById);
// Admin endpoints for watches CRUD
router.put('/watches/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', updateWatch); // Admin update by UUID
router.delete('/watches/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', deleteWatch); // Admin delete by UUID
// UUID pattern for IDs (Frontend calls /watches/:productId with UUID) - case insensitive
router.get('/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', getWatchById);
// Slug pattern for slugs (fallback)
router.get('/:slug', getWatchBySlug);
router.post('/', createWatch);
router.put('/:id', updateWatch);
router.delete('/:id', deleteWatch);

// Watch specifications routes
router.put('/:watchId/specifications', updateWatchSpecifications);

// Watch image routes
router.post('/:watchId/images', uploadSingle('image_url'), addWatchImage);
router.post('/watches/:watchId/images', uploadSingle('image_url'), addWatchImage); // Admin endpoint for image upload
router.delete('/images/:imageId', deleteWatchImage);

// Watch video routes
router.post('/:watchId/videos', uploadSingle('video_url'), addWatchVideo);
router.post('/watches/:watchId/videos', uploadSingle('video_url'), addWatchVideo); // Admin endpoint for video upload
router.get('/:watchId/videos', getWatchVideos);
router.get('/watches/:watchId/videos', getWatchVideos); // Admin endpoint for getting videos
router.put('/videos/:videoId', updateWatchVideo);
router.delete('/videos/:videoId', deleteWatchVideo);

module.exports = router;