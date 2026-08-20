const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const { authMiddleware } = require('../middleware/auth');
const { paymentRateLimit } = require('../middleware/security');

/**
 * Payment Routes
 * Base path: /api/v1/payments
 */

// Create payment intent (rate-limited against card-testing abuse)
router.post('/create-intent', paymentRateLimit, stripeController.createPaymentIntent);

// Confirm payment and create order (rate-limited)
router.post('/confirm', paymentRateLimit, stripeController.confirmPayment);

// Get order details (auth required — returns customer PII; the confirmation page
// itself uses the confirm response, not this endpoint)
router.get('/order/:orderId', authMiddleware, stripeController.getOrder);

// Get all orders (admin only)
router.get('/orders', authMiddleware, stripeController.getAllOrders);

// Update order status (admin only)
router.patch('/order/:orderId/status', authMiddleware, stripeController.updateOrderStatus);

// Update order details - status, tracking, notes (admin only)
router.patch('/order/:orderId', authMiddleware, stripeController.updateOrderDetails);

module.exports = router;
