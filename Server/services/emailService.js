const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // Use Gmail App Password, not regular password
  }
});

/**
 * Send order confirmation email
 */
const sendOrderConfirmationEmail = async (orderData) => {
  try {
    const {
      customerEmail,
      customerName,
      orderNumber,
      totalAmount,
      currency = 'GBP',
      items = [],
      shippingAddress,
      createdAt
    } = orderData;

    // Format date
    const orderDate = new Date(createdAt).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Parse shipping address if it's a string
    let address = shippingAddress;
    if (typeof shippingAddress === 'string') {
      address = JSON.parse(shippingAddress);
    }

    // Build items HTML
    const itemsHTML = items
      .map(item => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; text-align: left;">${item.product_name}</td>
          <td style="padding: 12px 0; text-align: center;">x${item.quantity}</td>
          <td style="padding: 12px 0; text-align: right;">£${parseFloat(item.unit_price).toFixed(2)}</td>
          <td style="padding: 12px 0; text-align: right;">£${parseFloat(item.total_price).toFixed(2)}</td>
        </tr>
      `)
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #d4af37; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 300; letter-spacing: 2px; color: #111827; }
            .order-number { font-size: 32px; font-weight: 300; color: #d4af37; margin-top: 10px; }
            .content { color: #374151; line-height: 1.6; font-size: 14px; }
            .section { margin: 30px 0; }
            .section-title { font-size: 16px; font-weight: 500; color: #111827; margin-bottom: 15px; }
            .items-table { width: 100%; margin: 20px 0; }
            .items-table th { text-align: left; padding: 12px 0; border-bottom: 2px solid #d4af37; font-weight: 500; }
            .summary { margin-top: 20px; text-align: right; }
            .summary-row { padding: 8px 0; }
            .total { font-size: 18px; font-weight: 500; color: #d4af37; border-top: 2px solid #d4af37; padding-top: 12px; margin-top: 12px; }
            .button { display: inline-block; background-color: #d4af37; color: #111827; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: 500; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
            .badge { display: inline-block; background-color: #10b981; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">McCulloch</div>
              <div class="order-number">${orderNumber}</div>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Order Confirmation</p>
            </div>

            <div class="content">
              <div class="section">
                <p>Dear ${customerName},</p>
                <p>Thank you for your purchase! Your payment has been successfully received and processed.</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
              </div>

              <div class="section">
                <div class="section-title">Order Items</div>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style="text-align: center;">Qty</th>
                      <th style="text-align: right;">Unit Price</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                  </tbody>
                </table>
                <div class="summary">
                  <div class="summary-row">Subtotal: £${(totalAmount * 0.8).toFixed(2)}</div>
                  <div class="summary-row">Tax (20%): £${(totalAmount * 0.2).toFixed(2)}</div>
                  <div class="summary-row total">Total: £${parseFloat(totalAmount).toFixed(2)}</div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Shipping Address</div>
                <p>${address.street || ''}<br>
                   ${address.city || ''}, ${address.postalCode || ''}<br>
                   ${address.country || 'United Kingdom'}</p>
              </div>

              <div class="section">
                <div class="section-title">What's Next?</div>
                <p>Your order is now being prepared for shipment. You will receive a tracking number via email as soon as your package ships.</p>
                <p>Track your order status:</p>
                <a href="${process.env.FRONTEND_URL}/orders" class="button">View Order Status</a>
              </div>

              <div class="section">
                <p style="color: #6b7280; font-size: 13px;">
                  <strong>Payment Status:</strong> <span class="badge">Paid</span>
                </p>
              </div>
            </div>

            <div class="footer">
              <p>&copy; 2025 McCulloch Jewelry. All rights reserved.</p>
              <p>Questions? Contact us at support@mcculloch.com or call +44 (0) 123 456 7890</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `McCulloch Jewelry <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: `Order Confirmation - ${orderNumber}`,
      html: htmlContent,
      replyTo: process.env.SUPPORT_EMAIL || 'support@mcculloch.com'
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Order confirmation email sent to ${customerEmail}`, { orderId: orderData.id, orderNumber });
    return result;
  } catch (error) {
    logger.error(`Failed to send order confirmation email: ${error.message}`, {
      email: orderData.customerEmail,
      orderNumber: orderData.orderNumber,
      error: error.stack
    });
    throw error;
  }
};

/**
 * Send order status update email
 */
const sendOrderStatusUpdateEmail = async (orderData, newStatus) => {
  try {
    const {
      customerEmail,
      customerName,
      orderNumber,
      trackingNumber = null
    } = orderData;

    const statusMessages = {
      processing: {
        title: 'Order is Being Processed',
        message: 'Your order is currently being prepared and packaged for shipment.'
      },
      shipped: {
        title: 'Order Shipped',
        message: `Your order has been shipped! ${trackingNumber ? `You can track your package using tracking number: <strong>${trackingNumber}</strong>` : 'You will receive tracking information shortly.'}`
      },
      delivered: {
        title: 'Order Delivered',
        message: 'Your order has been delivered successfully. Thank you for shopping with McCulloch!'
      },
      cancelled: {
        title: 'Order Cancelled',
        message: 'Your order has been cancelled. If you have any questions, please contact our support team.'
      }
    };

    const statusInfo = statusMessages[newStatus] || {
      title: 'Order Status Updated',
      message: `Your order status has been updated to: ${newStatus}`
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 300; letter-spacing: 2px; color: #111827; }
            .status-badge {
              display: inline-block;
              padding: 12px 24px;
              border-radius: 4px;
              margin-top: 15px;
              font-weight: 500;
              text-transform: capitalize;
            }
            .status-processing { background-color: #fef3c7; color: #92400e; }
            .status-shipped { background-color: #dbeafe; color: #0c4a6e; }
            .status-delivered { background-color: #dcfce7; color: #166534; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
            .content { color: #374151; line-height: 1.6; font-size: 14px; margin-top: 30px; }
            .section { margin: 20px 0; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">McCulloch</div>
              <p style="color: #6b7280; margin: 10px 0;">Order ${orderNumber}</p>
            </div>

            <div class="content">
              <p>Dear ${customerName},</p>

              <div class="section">
                <h2 style="font-size: 20px; color: #111827; margin: 0 0 10px 0;">${statusInfo.title}</h2>
                <div class="status-badge status-${newStatus}">
                  ${newStatus.replace(/_/g, ' ')}
                </div>
              </div>

              <div class="section">
                <p>${statusInfo.message}</p>
              </div>

              <div class="section">
                <p>
                  <strong>Order Number:</strong> ${orderNumber}<br>
                  <strong>Status:</strong> ${newStatus.replace(/_/g, ' ').charAt(0).toUpperCase() + newStatus.replace(/_/g, ' ').slice(1)}
                </p>
              </div>

              <div class="section">
                <p><a href="${process.env.FRONTEND_URL}/orders" style="color: #d4af37; text-decoration: none; font-weight: 500;">View Full Order Details →</a></p>
              </div>

              <div class="section">
                <p style="color: #6b7280; font-size: 13px;">If you have any questions about this order, please contact our support team at support@mcculloch.com</p>
              </div>
            </div>

            <div class="footer">
              <p>&copy; 2025 McCulloch Jewelry. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `McCulloch Jewelry <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: `${statusInfo.title} - Order ${orderNumber}`,
      html: htmlContent,
      replyTo: process.env.SUPPORT_EMAIL || 'support@mcculloch.com'
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Order status update email sent to ${customerEmail}`, {
      orderId: orderData.id,
      orderNumber,
      newStatus
    });
    return result;
  } catch (error) {
    logger.error(`Failed to send order status update email: ${error.message}`, {
      email: orderData.customerEmail,
      orderNumber: orderData.orderNumber,
      newStatus,
      error: error.stack
    });
    throw error;
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail
};
