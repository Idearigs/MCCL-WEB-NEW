const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminWeddingRingsController');
const { adminAuth } = require('../middleware/adminAuth');

router.use(adminAuth);

router.get('/stats',                       ctrl.getStats);
router.get('/sub-types',                   ctrl.getSubTypes);
router.get('/',                            ctrl.getDesigns);
router.get('/:id/variants',                ctrl.getVariants);
router.patch('/variants/bulk',             ctrl.bulkUpdateVariants);
router.patch('/variants/:variantId',       ctrl.updateVariant);
router.patch('/:id/toggle-status',         ctrl.toggleDesignStatus);

module.exports = router;
