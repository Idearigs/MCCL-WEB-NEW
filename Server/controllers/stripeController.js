const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;
const asyncHandler = require('../middleware/asyncHandler');
const { getModels } = require('../models');
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
      console.log(`Order confirmation email sent to ${customerEmail}`);
    } catch (emailError) {
      console.error(`Failed to send confirmation email: ${emailError.message}`);
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
    console.error('Error in getOrder:', error);
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
    console.error('Error in getAllOrders:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: error.message
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
      console.log(`Order status update email sent to ${order.customer_email}`);
    } catch (emailError) {
      console.error(`Failed to send status update email: ${emailError.message}`);
      // Don't fail the status update if email fails
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
    console.error('Error in updateOrderStatus:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
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
        console.error(`Failed to send status update email: ${emailError.message}`);
      }
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in updateOrderDetails:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
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
