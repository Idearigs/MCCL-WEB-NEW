const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { adminAuth } = require('../middleware/adminAuth');

// Public routes
router.get('/', promotionController.getPromotions);
router.get('/:id', promotionController.getPromotionById);

// Admin routes
router.post('/', adminAuth, promotionController.createPromotion);
router.put('/:id', adminAuth, promotionController.updatePromotion);
router.delete('/:id', adminAuth, promotionController.deletePromotion);

module.exports = router;
