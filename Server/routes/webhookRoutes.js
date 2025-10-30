const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

/**
 * Webhook Routes
 * Base path: /api/v1/webhooks
 */

// Stripe webhook - uses raw body for signature verification
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  stripeController.handleWebhook
);

module.exports = router;
