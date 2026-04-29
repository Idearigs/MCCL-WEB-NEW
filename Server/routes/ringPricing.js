const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ringPricingController');

// Metal price endpoints (no auth needed for now — data is public)
router.get('/metal-prices',              ctrl.getMetalPrices);
router.post('/metal-prices/refresh',     ctrl.refreshMetalPrices);
router.post('/refresh-all-prices',       ctrl.refreshAllProductPrices);
router.post('/preview',                  ctrl.previewPrice);

// Per-product ring spec endpoints
router.get('/:productId/specs',     ctrl.getRingSpecs);
router.put('/:productId/specs',     ctrl.saveRingSpecs);
router.post('/:productId/calculate', ctrl.calculatePrice);

module.exports = router;
