const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const { adminAuth, requireAdmin } = require('../middleware/adminAuth');
const { paymentRateLimit } = require('../middleware/security');

/**
 * Payment Routes
 * Base path: /api/v1/payments
 */

// Create payment intent (rate-limited against card-testing abuse)
router.post('/create-intent', paymentRateLimit, stripeController.createPaymentIntent);

// Confirm payment and create order (rate-limited)
router.post('/confirm', paymentRateLimit, stripeController.confirmPayment);

// Get order details (ADMIN only — returns customer PII. The customer confirmation
// page uses the /confirm response, not this endpoint; the only callers are the
// admin panel and staff chat tool, both of which send an admin token.)
router.get('/order/:orderId', adminAuth, requireAdmin, stripeController.getOrder);

// Get all orders (ADMIN only)
router.get('/orders', adminAuth, requireAdmin, stripeController.getAllOrders);

// Update order status (ADMIN only)
router.patch('/order/:orderId/status', adminAuth, requireAdmin, stripeController.updateOrderStatus);

// Update order details - status, tracking, notes (ADMIN only)
router.patch('/order/:orderId', adminAuth, requireAdmin, stripeController.updateOrderDetails);

module.exports = router;
