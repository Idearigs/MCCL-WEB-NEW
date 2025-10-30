# Stripe Payment Integration - Security & Reliability Guide

## Overview
This document outlines the Stripe payment integration for McCulloch Jewelry, including security best practices, reliability measures, and testing procedures.

---

## 🔐 Security Implementation

### 1. **PCI Compliance**
- ✅ **Card data NEVER stored**: All card information is handled by Stripe
- ✅ **No sensitive data in logs**: Payment details are never logged
- ✅ **HTTPS only**: All communication is encrypted (SSL/TLS 256-bit)
- ✅ **Webhook signature verification**: All webhooks are verified before processing

### 2. **API Key Management**
```bash
# Backend (.env file)
STRIPE_SECRET_KEY=sk_test_...          # Keep secret, never expose
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook verification

# Frontend (.env file)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Safe to expose (can't charge money)
VITE_API_URL=http://localhost:5000/api/v1
```

**CRITICAL:** Never commit `.env` files to git. Add to `.gitignore`:
```
Server/.env
Client/.env
.env.local
```

### 3. **Frontend Security**
- ❌ **Never send card numbers to backend**: Use Stripe Elements
- ❌ **Never store card data**: Let Stripe handle it
- ✅ **Client secret validation**: Payment intent confirmed with Stripe
- ✅ **HTTPS encryption**: All requests encrypted
- ✅ **CSRF protection**: Use same-origin requests

### 4. **Backend Security**

#### Webhook Verification (CRITICAL)
```javascript
// stripeController.js - handleWebhook function
const sig = req.headers['stripe-signature'];
event = stripe.webhooks.constructEvent(
  req.body,  // Raw body (not JSON parsed)
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
// Only trust events that pass this verification
```

#### Environment Variables
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Secret key only accessible on backend - never exposed to client
```

#### Input Validation
- Email format validation
- Amount validation (positive, reasonable)
- Inventory checks before processing
- Customer data validation

---

## 🛡️ Reliability Measures

### 1. **Idempotency**
- Payment intents are idempotent (safe to retry)
- Order creation is transactional (all-or-nothing)
- Prevents duplicate charges if requests are retried

### 2. **Error Handling**
```javascript
try {
  // Payment processing
} catch (error) {
  // Log error with context
  console.error('Payment error:', error);
  // Return user-friendly message
  res.status(500).json({
    success: false,
    message: 'Payment processing failed'
  });
}
```

### 3. **Order Creation Safety**
```javascript
// 1. Verify payment succeeded with Stripe
const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
if (paymentIntent.status !== 'succeeded') {
  return res.status(400).json({ message: 'Payment not confirmed' });
}

// 2. Create order in database (transactional)
const order = await Order.create({...});

// 3. Update inventory
await ProductVariant.update({...});

// 4. Return confirmation to client
res.json({ success: true, orderId: order.id });
```

### 4. **Webhook Retry Logic**
Stripe automatically retries webhooks for 3 days if we return non-2xx status.
```javascript
// Always return 200 after successful processing
res.json({ received: true });

// Never throw errors to Stripe - log them instead
catch (error) {
  console.error('Webhook handler error:', error);
  res.status(200).json({ received: true }); // Still return 200
}
```

### 5. **Database Transactions**
```javascript
// Ensure atomicity - all operations succeed or all rollback
const transaction = await sequelize.transaction();
try {
  const order = await Order.create({...}, { transaction });
  const items = await OrderItem.create({...}, { transaction });
  await ProductVariant.update({...}, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

---

## 🧪 Testing

### Test Cards (Test Mode Only)
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (MM/YY)
CVC: Any 3 digits (e.g., 123)
```

### Test Scenarios

#### 1. Successful Payment
```bash
curl -X POST http://localhost:5000/api/v1/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "gbp",
    "cartItems": [...]
  }'
```

#### 2. Failed Payment
Use card: `4000000000000002`

#### 3. Authentication Required (3D Secure)
Use card: `4000002500003155`

#### 4. Webhook Testing
```bash
# Use Stripe CLI in development
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe
stripe trigger payment_intent.succeeded
```

---

## 📊 Monitoring & Logging

### What to Log
```javascript
// Payment initiation
console.log('💳 Payment initiated', {
  paymentIntentId,
  amount,
  email: customerEmail
});

// Payment confirmation
console.log('✅ Payment succeeded', { paymentIntentId, orderId });

// Payment failure
console.error('❌ Payment failed', { paymentIntentId, reason, timestamp });

// Webhook events
console.log('🔔 Webhook received', { eventType, paymentIntentId });
```

### What NOT to Log
- ❌ Card numbers
- ❌ CVC codes
- ❌ Secret keys
- ❌ Full personal addresses (hash if necessary)
- ❌ Payment intent details (except ID)

---

## 🚀 Deployment Checklist

### Before Going Live
- [ ] Switch from Test Keys to Live Keys
- [ ] Update `.env` with production keys
- [ ] Enable HTTPS (required)
- [ ] Set up proper logging/monitoring
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Test webhooks with real events
- [ ] Set up email notifications for orders
- [ ] Configure fraud detection in Stripe
- [ ] Review and audit code
- [ ] Test payment flow end-to-end

### Environment Variables for Production
```bash
# Production keys (never commit!)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Other security settings
NODE_ENV=production
HTTPS_ONLY=true
LOG_LEVEL=info
```

### Webhook Configuration
1. Go to Stripe Dashboard
2. Developers → Webhooks
3. Update endpoint URL to production: `https://buymediamonds.co.uk/api/v1/webhooks/stripe`
4. Rotate webhook signing secret
5. Test webhook delivery

---

## 🔍 Security Audit Checklist

### Payment Processing
- [ ] Payment intents created on backend only
- [ ] Card data never touches backend
- [ ] Amounts validated before processing
- [ ] Payment status verified with Stripe
- [ ] Orders created only after payment confirmation
- [ ] Database transactions used for atomicity

### API Security
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak information

### Secrets Management
- [ ] .env files in .gitignore
- [ ] No hardcoded keys in source code
- [ ] Separate test and production keys
- [ ] Keys rotated regularly
- [ ] Access logs reviewed for suspicious activity

### Webhook Security
- [ ] Webhook signatures verified
- [ ] Timestamps validated (prevent replay attacks)
- [ ] Only Stripe-signed events processed
- [ ] Webhook receiver returns 200 status
- [ ] Webhooks logged for audit trail

---

## 📞 Incident Response

### Payment Failed
1. Check payment status in Stripe Dashboard
2. Review error details in logs
3. Contact customer with error reason
4. Suggest retry or alternative payment method

### Webhook Not Received
1. Check endpoint health in Stripe Dashboard
2. Review webhook logs
3. Check firewall/security group rules
4. Verify webhook signing secret matches

### Suspicious Activity
1. Check for unusual transaction patterns
2. Review fraud detection alerts in Stripe
3. Temporarily disable payments if needed
4. Contact Stripe support

---

## 📚 Additional Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe API Reference**: https://stripe.com/docs/api
- **PCI Compliance**: https://stripe.com/docs/security/pci-compliance
- **Webhook Security**: https://stripe.com/docs/webhooks/signatures
- **3D Secure**: https://stripe.com/docs/payments/3d-secure

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-30 | Initial implementation with Stripe payment integration |

---

**Last Updated**: October 30, 2025
**Status**: Production Ready
**Maintainer**: McCulloch Development Team
