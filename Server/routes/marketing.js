const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/marketingController');
const { adminAuth } = require('../middleware/adminAuth');

// Public routes
router.get('/', marketingController.getMarketingContent);
router.get('/:id', marketingController.getMarketingContentById);

// Admin routes (protected)
router.post('/', adminAuth, marketingController.createMarketingContent);
router.put('/:id', adminAuth, marketingController.updateMarketingContent);
router.delete('/:id', adminAuth, marketingController.deleteMarketingContent);

module.exports = router;
