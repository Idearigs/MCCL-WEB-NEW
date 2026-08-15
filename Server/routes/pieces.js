const express = require('express');
const router = express.Router();
const c = require('../controllers/pieceController');
const { authMiddleware: auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

// User: the pieces made for them.
router.get('/mine', auth, c.getMyPieces);

// Admin: full management.
router.get('/', adminAuth, c.getAllPieces);
router.post('/', adminAuth, c.createPiece);
router.put('/:id', adminAuth, c.updatePiece);
router.delete('/:id', adminAuth, c.deletePiece);

module.exports = router;
