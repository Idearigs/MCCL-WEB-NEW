const nodemailer = require('nodemailer');
const { logger } = require('../config/database');

const FROM_ADDRESS = process.env.EMAIL_FROM || 'noreply@buymediamonds.co.uk';
const FROM_NAME    = process.env.EMAIL_FROM_NAME || 'McCulloch Jewellery';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@buymediamonds.co.uk';
const FRONTEND_URL  = process.env.FRONTEND_URL  || 'https://buymediamonds.co.uk';

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtpout.secureserver.net',
    port:   parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false', // true for port 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // GoDaddy sometimes needs this
    },
  });
}

const emailHeader = `
  <div style="text-align:center; padding: 32px 0 24px; border-bottom: 2px solid #C9A96E;">
    <div style="font-size:26px; font-weight:300; letter-spacing:4px; color:#1a1a1a; text-transform:uppercase;">McCulloch</div>
    <div style="font-size:11px; letter-spacing:2px; color:#9a8a70; margin-top:4px; text-transform:uppercase;">Fine Jewellery</div>
  </div>`;

const emailFooter = `
  <div style="text-align:center; margin-top:40px; padding-top:24px; border-top:1px solid #e5e7eb; color:#9ca3af; font-size:12px; line-height:1.8;">
    <p style="margin:0 0 4px;">&copy; ${new Date().getFullYear()} McCulloch Jewellery. All rights reserved.</p>
    <p style="margin:0 0 4px;"><a href="${FRONTEND_URL}" style="color:#C9A96E; text-decoration:none;">buymediamonds.co.uk</a></p>
    <p style="margin:0;">Questions? Email us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#C9A96E; text-decoration:none;">${SUPPORT_EMAIL}</a></p>
  </div>`;

/**
 * Send order confirmation email to customer
 */
const sendOrderConfirmationEmail = async (orderData) => {
  const {
    customerEmail,
    customerName,
    orderNumber,
    totalAmount,
    currency = 'GBP',
    items = [],
    shippingAddress,
    createdAt,
  } = orderData;

  const orderDate = new Date(createdAt).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  let address = shippingAddress;
  if (typeof shippingAddress === 'string') {
    try { address = JSON.parse(shippingAddress); } catch { address = {}; }
  }

  const addressLines = [
    address?.street || address?.line1 || '',
    address?.street2 || address?.line2 || '',
    address?.city || '',
    address?.county || address?.state || '',
    address?.postalCode || address?.postal_code || '',
    address?.country || 'United Kingdom',
  ].filter(Boolean).join('<br>');

  const itemsHTML = items.map(item => {
    const attrs = item.attributes ? Object.entries(item.attributes)
      .filter(([k]) => !['variant_name'].includes(k))
      .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
      .join(' · ') : '';
    return `
      <tr>
        <td style="padding:14px 0; border-bottom:1px solid #f0e8da; vertical-align:top;">
          <div style="font-weight:500; color:#1a1a1a;">${item.product_name}</div>
          ${attrs ? `<div style="font-size:12px; color:#9a8a70; margin-top:3px;">${attrs}</div>` : ''}
        </td>
        <td style="padding:14px 8px; border-bottom:1px solid #f0e8da; text-align:center; color:#4b5563; vertical-align:top;">×${item.quantity}</td>
        <td style="padding:14px 0; border-bottom:1px solid #f0e8da; text-align:right; font-weight:500; color:#1a1a1a; vertical-align:top;">
          £${parseFloat(item.total_price).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>`;
  }).join('');

  const totalFormatted = parseFloat(totalAmount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order Confirmation – ${orderNumber}</title></head>
<body style="margin:0; padding:0; background:#f9f6f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1; padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="padding:0 40px 40px;">

          ${emailHeader}

          <div style="margin-top:32px; color:#374151; font-size:15px; line-height:1.7;">

            <p style="margin:0 0 8px;">Dear <strong>${customerName}</strong>,</p>
            <p style="margin:0 0 24px; color:#6b7280;">Thank you for your order. We've received your payment and are preparing your jewellery with care.</p>

            <div style="background:#fdf8f2; border:1px solid #e8d5b7; border-radius:6px; padding:20px; margin-bottom:28px;">
              <div style="font-size:12px; letter-spacing:2px; color:#9a8a70; text-transform:uppercase; margin-bottom:6px;">Order Reference</div>
              <div style="font-size:22px; font-weight:300; letter-spacing:2px; color:#C9A96E;">${orderNumber}</div>
              <div style="font-size:13px; color:#9ca3af; margin-top:4px;">${orderDate}</div>
            </div>

            <div style="margin-bottom:28px;">
              <div style="font-size:13px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#1a1a1a; margin-bottom:16px;">Your Items</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="text-align:left; font-size:12px; color:#9ca3af; font-weight:400; padding-bottom:10px; border-bottom:2px solid #C9A96E;">Product</th>
                    <th style="text-align:center; font-size:12px; color:#9ca3af; font-weight:400; padding-bottom:10px; border-bottom:2px solid #C9A96E; width:50px;">Qty</th>
                    <th style="text-align:right; font-size:12px; color:#9ca3af; font-weight:400; padding-bottom:10px; border-bottom:2px solid #C9A96E; width:100px;">Amount</th>
                  </tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td style="text-align:right; padding:14px 0 0; font-size:18px; font-weight:500; color:#C9A96E; border-top:2px solid #C9A96E;">
                    Total: £${totalFormatted}
                  </td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom:28px;">
              <div style="font-size:13px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#1a1a1a; margin-bottom:12px;">Shipping To</div>
              <div style="color:#4b5563; line-height:1.8;">${addressLines}</div>
            </div>

            <div style="background:#f0faf4; border-left:3px solid #10b981; padding:16px 20px; border-radius:4px; margin-bottom:28px;">
              <div style="font-weight:500; color:#166534; margin-bottom:4px;">Payment Confirmed</div>
              <div style="font-size:13px; color:#6b7280;">Your payment of <strong>£${totalFormatted}</strong> has been successfully received.</div>
            </div>

            <div style="margin-bottom:28px;">
              <div style="font-size:13px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#1a1a1a; margin-bottom:12px;">What Happens Next?</div>
              <ol style="padding-left:20px; color:#4b5563; font-size:14px; line-height:2; margin:0;">
                <li>Our team will prepare and inspect your jewellery</li>
                <li>Your order will be securely packaged</li>
                <li>You'll receive a shipping confirmation with tracking details</li>
              </ol>
            </div>

            <div style="text-align:center; margin-top:32px;">
              <a href="${FRONTEND_URL}" style="display:inline-block; background:#C9A96E; color:#ffffff; padding:14px 36px; text-decoration:none; border-radius:4px; font-size:14px; letter-spacing:1px; text-transform:uppercase;">Continue Shopping</a>
            </div>

          </div>

          ${emailFooter}

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transporter = createTransporter();
  const result = await transporter.sendMail({
    from:    `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    to:      customerEmail,
    subject: `Order Confirmed – ${orderNumber} | McCulloch Jewellery`,
    html,
    replyTo: SUPPORT_EMAIL,
  });

  logger.info(`Order confirmation email sent to ${customerEmail} (${orderNumber})`);
  return result;
};

/**
 * Send order status update email to customer
 */
const sendOrderStatusUpdateEmail = async (orderData, newStatus) => {
  const {
    customerEmail,
    customerName,
    orderNumber,
    trackingNumber = null,
  } = orderData;

  const statusConfig = {
    processing: {
      subject: `Your Order is Being Prepared – ${orderNumber}`,
      title:   'We\'re Preparing Your Order',
      colour:  '#f59e0b',
      bg:      '#fef3c7',
      message: 'Our team is carefully preparing and inspecting your jewellery. We\'ll be in touch as soon as it ships.',
    },
    shipped: {
      subject: `Your Order Has Shipped – ${orderNumber}`,
      title:   'Your Order is On Its Way',
      colour:  '#3b82f6',
      bg:      '#dbeafe',
      message: trackingNumber
        ? `Your jewellery has been dispatched. Track your parcel using tracking number: <strong>${trackingNumber}</strong>.`
        : 'Your jewellery has been dispatched. You\'ll receive tracking details shortly.',
    },
    delivered: {
      subject: `Order Delivered – ${orderNumber}`,
      title:   'Your Order Has Been Delivered',
      colour:  '#10b981',
      bg:      '#dcfce7',
      message: 'Your order has been delivered. We hope you love your new jewellery! If you have any questions, please don\'t hesitate to contact us.',
    },
    cancelled: {
      subject: `Order Cancelled – ${orderNumber}`,
      title:   'Your Order Has Been Cancelled',
      colour:  '#ef4444',
      bg:      '#fee2e2',
      message: 'Your order has been cancelled. If you believe this is a mistake or have any questions, please contact our team and we\'ll be happy to help.',
    },
  };

  const cfg = statusConfig[newStatus] || {
    subject: `Order Update – ${orderNumber}`,
    title:   'Order Status Updated',
    colour:  '#6b7280',
    bg:      '#f3f4f6',
    message: `Your order status has been updated to: ${newStatus}.`,
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cfg.subject}</title></head>
<body style="margin:0; padding:0; background:#f9f6f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1; padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="padding:0 40px 40px;">

          ${emailHeader}

          <div style="margin-top:32px; color:#374151; font-size:15px; line-height:1.7;">

            <p style="margin:0 0 8px;">Dear <strong>${customerName}</strong>,</p>

            <div style="background:${cfg.bg}; border-left:4px solid ${cfg.colour}; border-radius:4px; padding:20px 24px; margin:24px 0;">
              <div style="font-size:17px; font-weight:600; color:#1a1a1a; margin-bottom:8px;">${cfg.title}</div>
              <p style="margin:0; color:#4b5563; font-size:14px; line-height:1.7;">${cfg.message}</p>
            </div>

            <div style="background:#fdf8f2; border:1px solid #e8d5b7; border-radius:6px; padding:16px 20px; margin-bottom:28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px; color:#9a8a70; text-transform:uppercase; letter-spacing:1px;">Order</td>
                  <td style="text-align:right; font-size:15px; font-weight:500; color:#C9A96E;">${orderNumber}</td>
                </tr>
                ${trackingNumber ? `<tr>
                  <td style="font-size:12px; color:#9a8a70; text-transform:uppercase; letter-spacing:1px; padding-top:8px;">Tracking</td>
                  <td style="text-align:right; font-size:14px; font-weight:500; color:#1a1a1a; padding-top:8px;">${trackingNumber}</td>
                </tr>` : ''}
              </table>
            </div>

            <p style="color:#6b7280; font-size:13px;">If you have any questions, please contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#C9A96E;">${SUPPORT_EMAIL}</a>.</p>

          </div>

          ${emailFooter}

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transporter = createTransporter();
  const result = await transporter.sendMail({
    from:    `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    to:      customerEmail,
    subject: cfg.subject,
    html,
    replyTo: SUPPORT_EMAIL,
  });

  logger.info(`Order status email (${newStatus}) sent to ${customerEmail} (${orderNumber})`);
  return result;
};

module.exports = { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail };
