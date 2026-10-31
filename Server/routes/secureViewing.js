const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/secureViewingController');
const { createRateLimit } = require('../middleware/security');

// Guests in the showroom share the shop Wi-Fi (one IP), so the submit limit is generous;
// the PIN login is strict to stop guessing.
const submitLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const pinLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 6 });

// Public (guest)
router.get('/id-types', (req, res) => res.json({ success: true, data: ctrl.ID_TYPES }));
router.post('/', submitLimit, ctrl.uploadIdPhotos, ctrl.submitRequest);
router.get('/status/:code', ctrl.getStatus);

// Owner panel (PIN)
router.post('/admin/login', pinLimit, ctrl.login);
router.get('/admin/requests', ctrl.requirePanelToken, ctrl.listRequests);
router.get('/admin/requests/:id/photo/:side', ctrl.requirePanelToken, ctrl.getPhoto);
router.post('/admin/requests/:id/approve', ctrl.requirePanelToken, ctrl.approve);
router.post('/admin/requests/:id/decline', ctrl.requirePanelToken, ctrl.decline);
router.post('/admin/requests/:id/approve-today', ctrl.requirePanelToken, ctrl.approveToday);

module.exports = router;
