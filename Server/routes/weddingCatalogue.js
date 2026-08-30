const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/weddingCatalogueController');

// Public read-only Allied Gold wedding catalogue (migration 019).
router.get('/designs', ctrl.listDesigns);
router.get('/attributes', ctrl.getAttributes);
router.get('/price', ctrl.getPrice);
router.get('/designs/:id', ctrl.getDesign);

module.exports = router;
