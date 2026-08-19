const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;
const asyncHandler = require('../middleware/asyncHandler');
const { getModels } = require('../models');
const { logger } = require('../config/database');
const { Sequelize } = require('sequelize');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../services/emailService');
const { generateOrderNumber } = require('../utils/orderUtils');

/**
 * Create a payment intent for the cart
 * POST /api/v1/payments/create-intent
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      success: false,
      message: 'Payment service is not configured'
    });
  }

  const { amount, currency = 'gbp', description, cartItems, customerId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid amount'
    });
  }

  // ── SECURITY: never trust the client-sent amount blindly ──────────────────
  // Recompute an authoritative price floor from the database and reject any
  // amount that falls implausibly below it. This closes the "pay £1 for a
  // £10,000 ring" tampering vector. We use a floor (not an exact match) because
  // ring/diamond prices are configured (metal, carat, stone) and computed by the
  // pricing engine, so the exact figure legitimately varies above the base price.
  try {
    const { Product, ProductVariant } = getModels();
    let serverFloor = 0;
    for (const item of (cartItems || [])) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      let unit = null;
      if (item.variant_id && ProductVariant) {
        const v = await ProductVariant.findByPk(item.variant_id, { attributes: ['price'] });
        if (v && v.price != null) unit = parseFloat(v.price);
      }
      if ((unit == null || isNaN(unit)) && item.product_id && Product) {
        const p = await Product.findByPk(item.product_id, { attributes: ['base_price', 'sale_price'] });
        if (p) unit = parseFloat(p.sale_price || p.base_price);
      }
      if (unit != null && !isNaN(unit) && unit > 0) serverFloor += unit * qty;
    }
    // Allow legitimate downward configuration variance (e.g. a cheaper metal) but
    // reject anything below half the sum of base prices — no real order is that low.
    const FLOOR_RATIO = 0.5;
    if (serverFloor > 0 && amount < serverFloor * FLOOR_RATIO) {
      logger.warn(`Payment amount rejected: client £${amount} is below server floor £${serverFloor.toFixed(2)} (cart ${JSON.stringify((cartItems || []).map(i => i.product_id))})`);
      return res.status(400).json({
        success: false,
        message: 'Order total could not be verified. Please refresh your bag and try again.'
      });
    }
  } catch (validationError) {
    // A validation lookup failure must not silently allow an unvalidated charge.
    logger.error('Payment amount validation error:', validationError.message);
    return res.status(400).json({
      success: false,
      message: 'Unable to verify order total. Please try again.'
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
  if (!stripe) {
    return res.status(503).json({
      success: false,
      message: 'Payment service is not configured'
    });
  }

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

    // SECURITY / idempotency: one PaymentIntent = one order. If an order already
    // exists for this intent, return it instead of creating a duplicate. This also
    // stops a succeeded intent id from being replayed to mint extra orders.
    const existingOrder = await Order.findOne({ where: { stripe_payment_id: paymentIntentId } });
    if (existingOrder) {
      logger.info(`Idempotent confirm: order ${existingOrder.order_number} already exists for intent ${paymentIntentId}`);
      return res.json({
        success: true,
        data: {
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
          totalAmount: existingOrder.total_amount,
          status: existingOrder.status,
          paymentStatus: existingOrder.payment_status,
          alreadyProcessed: true
        }
      });
    }

    // Generate professional order number based on product type
    // Format: JWL-YYYYMMDD-XXXXX (jewelry), WTC-YYYYMMDD-XXXXX (watches), MXD-YYYYMMDD-XXXXX (mixed)
    const orderNumber = generateOrderNumber(cartItems);

    // Create order in database
    const order = await Order.create({
      order_number: orderNumber,
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
    const createdItems = [];
    for (const item of cartItems) {

      if (!OrderItem) {
        throw new Error('OrderItem model is undefined');
      }

      // Build attributes object with all product customizations
      const attributes = {};
      if (item.selectedOptions) {
        Object.assign(attributes, item.selectedOptions);
      }
      // Also store individual fields for backwards compatibility
      if (item.metal) attributes.metal = item.metal;
      if (item.size) attributes.size = item.size;
      if (item.brand) attributes.brand = item.brand;
      if (item.variant_name) attributes.variant_name = item.variant_name;

      const orderItem = await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        product_variant_id: item.variant_id,
        product_name: item.name || 'Product',
        product_type: item.type || null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        attributes: Object.keys(attributes).length > 0 ? attributes : null
      });

      createdItems.push(orderItem);
      logger.info(`Order item created: ${orderItem.id}`);

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

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail({
        id: order.id,
        customerEmail,
        customerName,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        currency: order.currency,
        items: createdItems,
        shippingAddress: order.shipping_address,
        createdAt: order.createdAt
      });
      logger.info(`Order confirmation email sent: ${order.order_number}`);
    } catch (emailError) {
      logger.error(`Failed to send confirmation email: ${emailError.message}`);
      // Don't fail the order creation if email fails
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
    logger.error('Error in confirmPayment:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment'
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
    const { Order, OrderItem } = getModels();

    // Get order with items + first product image via subquery (no association needed)
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: [
            'id', 'product_id', 'product_name', 'product_type',
            'quantity', 'unit_price', 'total_price', 'attributes',
            [
              Sequelize.literal(`(
                CASE
                  WHEN "items".product_type = 'watch' THEN (
                    SELECT image_url FROM watch_images
                    WHERE watch_id = "items".product_id
                    ORDER BY is_primary DESC, sort_order ASC
                    LIMIT 1
                  )
                  ELSE (
                    SELECT image_url FROM product_images
                    WHERE product_id = "items".product_id
                    ORDER BY is_primary DESC, sort_order ASC
                    LIMIT 1
                  )
                END
              )`),
              'image_url'
            ]
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
    logger.error('Error in getOrder:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order'
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
    logger.error('Webhook signature verification failed');
    return res.status(400).send('Webhook Error: invalid signature');
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
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error:', { message: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Payment intent succeeded - update order
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  logger.info(`Payment succeeded: ${paymentIntent.id}`);

  try {
    const { Order } = getModels();
    const order = await Order.findOne({ where: { stripe_payment_id: paymentIntent.id } });
    if (order) {
      await order.update({ payment_status: 'paid' });
      logger.info(`Order payment confirmed: ${order.id}`);
    }
  } catch (error) {
    logger.error('Error in handlePaymentIntentSucceeded:', { message: error.message });
  }
}

/**
 * Payment intent failed
 */
async function handlePaymentIntentFailed(paymentIntent) {
  logger.warn(`Payment failed: ${paymentIntent.id}`);

  try {
    const { Order } = getModels();
    const order = await Order.findOne({ where: { stripe_payment_id: paymentIntent.id } });
    if (order) await order.update({ payment_status: 'failed' });
  } catch (error) {
    logger.error('Error in handlePaymentIntentFailed:', { message: error.message });
  }
}

/**
 * Payment intent canceled
 */
async function handlePaymentIntentCanceled(paymentIntent) {
  logger.info(`Payment canceled: ${paymentIntent.id}`);

  try {
    const { Order } = getModels();
    const order = await Order.findOne({ where: { stripe_payment_id: paymentIntent.id } });
    if (order) await order.update({ payment_status: 'canceled' });
  } catch (error) {
    logger.error('Error in handlePaymentIntentCanceled:', { message: error.message });
  }
}

/**
 * Payment intent processing
 */
async function handlePaymentIntentProcessing(paymentIntent) {
  logger.info(`Payment processing: ${paymentIntent.id}`);

  try {
    const { Order } = getModels();
    const order = await Order.findOne({ where: { stripe_payment_id: paymentIntent.id } });
    if (order) await order.update({ payment_status: 'processing' });
  } catch (error) {
    logger.error('Error in handlePaymentIntentProcessing:', { message: error.message });
  }
}

/**
 * Payment intent requires action (3D Secure)
 */
async function handlePaymentIntentRequiresAction(paymentIntent) {
  logger.info(`Payment requires action (3DS): ${paymentIntent.id}`);

  try {
    const { Order } = getModels();
    const order = await Order.findOne({ where: { stripe_payment_id: paymentIntent.id } });
    if (order) await order.update({ payment_status: 'requires_action' });
  } catch (error) {
    logger.error('Error in handlePaymentIntentRequiresAction:', { message: error.message });
  }
}

/**
 * Get all orders with optional filtering (admin)
 * GET /api/v1/payments/orders
 */
const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const { Order, OrderItem } = getModels();

    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'product_id', 'product_name', 'product_type', 'quantity', 'unit_price', 'total_price'],
          required: false // Use LEFT JOIN instead of INNER JOIN
        }
      ],
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'order_number',
        'customer_name',
        'customer_email',
        'status',
        'payment_status',
        'payment_method',
        'total_amount',
        'currency',
        'shipping_address',
        'notes',
        'createdAt',
        'updatedAt'
      ],
      subQuery: false, // Prevent subquery issues with includes
      raw: false
    });

    res.json({
      success: true,
      data: {
        orders: orders || []
      }
    });
  } catch (error) {
    logger.error('Error in getAllOrders:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders'
    });
  }
});

/**
 * Update order status (admin)
 * PATCH /api/v1/payments/order/:orderId/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
    });
  }

  try {
    const { Order } = getModels();

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    await order.update({ status });

    // Send status update email
    try {
      await sendOrderStatusUpdateEmail({
        id: order.id,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        trackingNumber: order.tracking_number
      }, status);
      logger.info(`Order status update email sent: ${order.order_number}`);
    } catch (emailError) {
      logger.error(`Failed to send status update email: ${emailError.message}`);
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        message: 'Order status updated successfully'
      }
    });
  } catch (error) {
    logger.error('Error in updateOrderStatus:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

/**
 * Update order details (status, tracking, notes)
 * PATCH /api/v1/payments/order/:orderId
 */
const updateOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, tracking_number, notes } = req.body;

  try {
    const { Order } = getModels();

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const updates = {};
    if (status !== undefined) {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
      }
      updates.status = status;
      if (status === 'shipped' && !order.shipped_at) {
        updates.shipped_at = new Date();
      }
      if (status === 'delivered' && !order.delivered_at) {
        updates.delivered_at = new Date();
      }
    }
    if (tracking_number !== undefined) updates.tracking_number = tracking_number;
    if (notes !== undefined) updates.notes = notes;

    await order.update(updates);

    // Send status update email if status changed
    if (status && status !== order.status) {
      try {
        await sendOrderStatusUpdateEmail({
          id: order.id,
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          orderNumber: order.order_number,
          trackingNumber: updates.tracking_number || order.tracking_number
        }, status);
      } catch (emailError) {
        logger.error(`Failed to send status update email: ${emailError.message}`);
      }
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Error in updateOrderDetails:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to update order'
    });
  }
});

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getOrder,
  handleWebhook,
  getAllOrders,
  updateOrderStatus,
  updateOrderDetails
};
