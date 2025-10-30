const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const asyncHandler = require('../middleware/asyncHandler');
const { getModels } = require('../models');

/**
 * Create a payment intent for the cart
 * POST /api/v1/payments/create-intent
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, currency = 'gbp', description, cartItems, customerId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid amount'
    });
  }

  try {
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description: description || 'McCulloch Jewelry Purchase',
      metadata: {
        customerId: customerId || 'guest',
        cartItems: JSON.stringify(cartItems || [])
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

/**
 * Confirm payment and create order
 * POST /api/v1/payments/confirm
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, customerEmail, customerName, shippingAddress, cartItems } = req.body;

  if (!paymentIntentId || !cartItems || cartItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  try {
    const { Order, OrderItem, Product, ProductVariant } = getModels();

    // Get the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not confirmed',
        status: paymentIntent.status
      });
    }

    // Create order in database
    const order = await Order.create({
      order_number: `ORD-${Date.now()}`,
      customer_name: customerName || 'Guest',
      customer_email: customerEmail,
      status: 'pending',
      payment_status: 'paid',
      payment_method: 'stripe',
      stripe_payment_id: paymentIntentId,
      total_amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      shipping_address: JSON.stringify(shippingAddress),
      notes: 'Order created from Stripe payment'
    });

    // Create order items
    for (const item of cartItems) {
      console.log('Creating order item:', {
        order_id: order.id,
        product_id: item.product_id,
        product_variant_id: item.variant_id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      });

      if (!OrderItem) {
        throw new Error('OrderItem model is undefined');
      }

      const orderItem = await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        product_variant_id: item.variant_id,
        product_name: item.name || 'Product',
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      });

      console.log('Order item created:', orderItem.id);

      // Update inventory if applicable
      if (item.variant_id) {
        const variant = await ProductVariant.findByPk(item.variant_id);
        if (variant) {
          await variant.update({
            stock_quantity: variant.stock_quantity - item.quantity
          });
        }
      } else if (item.product_id) {
        const product = await Product.findByPk(item.product_id);
        if (product) {
          await product.update({
            stock_quantity: product.stock_quantity - item.quantity
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        status: order.status,
        paymentStatus: order.payment_status
      }
    });
  } catch (error) {
    console.error('Error in confirmPayment:', error.message);
    console.error('Error stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

/**
 * Get order details
 * GET /api/v1/payments/order/:orderId
 */
const getOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  try {
    const { Order, OrderItem, Product } = getModels();

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'price']
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
      error: error.message
    });
  }
});

/**
 * Handle Stripe webhook events
 * POST /api/v1/webhooks/stripe
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event.data.object);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Payment intent succeeded - update order
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('✅ Payment succeeded:', paymentIntent.id);

  try {
    const { Order } = getModels();

    // Update order payment status if it exists
    const order = await Order.findOne({
      where: { stripe_payment_id: paymentIntent.id }
    });

    if (order) {
      await order.update({ payment_status: 'paid' });
      console.log('Order updated:', order.id);
    }
  } catch (error) {
    console.error('Error in handlePaymentIntentSucceeded:', error);
  }
}

/**
 * Payment intent failed
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);

  try {
    const { Order } = getModels();

    const order = await Order.findOne({
      where: { stripe_payment_id: paymentIntent.id }
    });

    if (order) {
      await order.update({ payment_status: 'failed' });
    }
  } catch (error) {
    console.error('Error in handlePaymentIntentFailed:', error);
  }
}

/**
 * Payment intent canceled
 */
async function handlePaymentIntentCanceled(paymentIntent) {
  console.log('⚠️ Payment canceled:', paymentIntent.id);

  try {
    const { Order } = getModels();

    const order = await Order.findOne({
      where: { stripe_payment_id: paymentIntent.id }
    });

    if (order) {
      await order.update({ payment_status: 'canceled' });
    }
  } catch (error) {
    console.error('Error in handlePaymentIntentCanceled:', error);
  }
}

/**
 * Payment intent processing
 */
async function handlePaymentIntentProcessing(paymentIntent) {
  console.log('🔄 Payment processing:', paymentIntent.id);

  try {
    const { Order } = getModels();

    const order = await Order.findOne({
      where: { stripe_payment_id: paymentIntent.id }
    });

    if (order) {
      await order.update({ payment_status: 'processing' });
    }
  } catch (error) {
    console.error('Error in handlePaymentIntentProcessing:', error);
  }
}

/**
 * Payment intent requires action (3D Secure)
 */
async function handlePaymentIntentRequiresAction(paymentIntent) {
  console.log('⚠️ Payment requires action (3D Secure):', paymentIntent.id);

  try {
    const { Order } = getModels();

    const order = await Order.findOne({
      where: { stripe_payment_id: paymentIntent.id }
    });

    if (order) {
      await order.update({ payment_status: 'requires_action' });
    }
  } catch (error) {
    console.error('Error in handlePaymentIntentRequiresAction:', error);
  }
}

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getOrder,
  handleWebhook
};
