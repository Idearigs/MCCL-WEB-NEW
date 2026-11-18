const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ringPricingController');
const { adminAuth } = require('../middleware/adminAuth');

// Public: current metal prices (read-only market data).
router.get('/metal-prices',              ctrl.getMetalPrices);

// Staff only. These write the price overrides that the storefront shows and that
// checkout uses as its price floor, or start catalogue-wide recalculation jobs.
router.post('/metal-prices/refresh',     adminAuth, ctrl.refreshMetalPrices);
router.post('/refresh-all-prices',       adminAuth, ctrl.refreshAllProductPrices);
router.post('/recalculate-all',          adminAuth, ctrl.recalculateAll);
router.post('/preview',                  adminAuth, ctrl.previewPrice);

// Per-product ring spec endpoints (staff only)
router.get('/:productId/specs',      adminAuth, ctrl.getRingSpecs);
router.put('/:productId/specs',      adminAuth, ctrl.saveRingSpecs);
router.post('/:productId/calculate', adminAuth, ctrl.calculatePrice);

module.exports = router;
