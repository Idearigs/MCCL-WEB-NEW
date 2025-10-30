const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

/**
 * Payment Routes
 * Base path: /api/v1/payments
 */

// Create payment intent
router.post('/create-intent', stripeController.createPaymentIntent);

// Confirm payment and create order
router.post('/confirm', stripeController.confirmPayment);

// Get order details
router.get('/order/:orderId', stripeController.getOrder);

module.exports = router;
