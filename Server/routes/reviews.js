const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { adminAuth } = require('../middleware/adminAuth');

// Public routes
router.get('/', reviewController.getPublicReviews);      // published reviews (storefront)
router.post('/', reviewController.submitReview);         // visitor submission → pending

// Admin routes (declared before '/:id' so 'all' isn't captured as an id)
router.get('/all', adminAuth, reviewController.getAllReviews);
router.post('/admin', adminAuth, reviewController.createReview);
router.put('/:id', adminAuth, reviewController.updateReview);
router.delete('/:id', adminAuth, reviewController.deleteReview);

module.exports = router;
