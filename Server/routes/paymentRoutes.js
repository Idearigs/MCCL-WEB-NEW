const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const { authMiddleware } = require('../middleware/auth');

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

// Get all orders (admin only)
router.get('/orders', authMiddleware, stripeController.getAllOrders);

// Update order status (admin only)
router.patch('/order/:orderId/status', authMiddleware, stripeController.updateOrderStatus);

module.exports = router;
