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
router.get('/admin/:id', getWatchById);
router.get('/:slug', getWatchBySlug);
router.post('/', createWatch);
router.put('/:id', updateWatch);
router.delete('/:id', deleteWatch);

// Watch specifications routes
router.put('/:watchId/specifications', updateWatchSpecifications);

// Watch image routes
router.post('/:watchId/images', uploadSingle('image_url'), addWatchImage);
router.delete('/images/:imageId', deleteWatchImage);

// Watch video routes
router.post('/:watchId/videos', uploadSingle('video_url'), addWatchVideo);
router.get('/:watchId/videos', getWatchVideos);
router.put('/videos/:videoId', updateWatchVideo);
router.delete('/videos/:videoId', deleteWatchVideo);

module.exports = router;