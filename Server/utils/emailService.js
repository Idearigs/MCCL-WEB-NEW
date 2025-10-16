const nodemailer = require('nodemailer');

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create reusable transporter
const createTransporter = () => {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.warn('Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    return null;
  }

  return nodemailer.createTransport(EMAIL_CONFIG);
};

// Send verification email
const sendVerificationEmail = async (email, verificationToken, firstName) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"McCulloch Jewellers" <${EMAIL_CONFIG.auth.user}>`,
    to: email,
    subject: 'Verify Your Email - McCulloch Jewellers',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .brand {
              font-size: 24px;
              font-weight: 300;
              letter-spacing: 0.3em;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .tagline {
              font-size: 12px;
              letter-spacing: 0.2em;
              color: #6b7280;
            }
            .content {
              padding: 40px 20px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 300;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .message {
              font-size: 14px;
              font-weight: 300;
              color: #4b5563;
              line-height: 1.8;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(to right, #d97706, #b45309);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 300;
              font-size: 14px;
              letter-spacing: 0.5px;
              margin: 20px 0;
            }
            .button:hover {
              background: linear-gradient(to right, #b45309, #92400e);
            }
            .footer {
              text-align: center;
              padding: 30px 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              font-weight: 300;
            }
            .alternative-link {
              margin-top: 20px;
              padding: 15px;
              background: #f9fafb;
              border-radius: 6px;
              font-size: 12px;
              color: #6b7280;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">MCCULLOCH</div>
            <div class="tagline">1798</div>
          </div>

          <div class="content">
            <div class="greeting">Hello ${firstName || 'there'},</div>

            <div class="message">
              Thank you for creating an account with McCulloch Jewellers. We're delighted to have you join our exclusive community.
              <br><br>
              To complete your registration and access all features, please verify your email address by clicking the button below:
            </div>

            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>

            <div class="message">
              This verification link will expire in 24 hours for security purposes.
            </div>

            <div class="alternative-link">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #d97706;">${verificationUrl}</a>
            </div>

            <div class="message" style="margin-top: 30px;">
              If you didn't create this account, you can safely ignore this email.
            </div>
          </div>

          <div class="footer">
            <p>McCulloch Jewellers - Crafting Excellence Since 1798</p>
            <p style="margin-top: 10px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}" style="color: #6b7280; text-decoration: none;">Visit Our Website</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Hello ${firstName || 'there'},

Thank you for creating an account with McCulloch Jewellers. We're delighted to have you join our exclusive community.

To complete your registration and access all features, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours for security purposes.

If you didn't create this account, you can safely ignore this email.

McCulloch Jewellers - Crafting Excellence Since 1798
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, firstName) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: `"McCulloch Jewellers" <${EMAIL_CONFIG.auth.user}>`,
    to: email,
    subject: 'Welcome to McCulloch Jewellers',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .brand {
              font-size: 24px;
              font-weight: 300;
              letter-spacing: 0.3em;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .tagline {
              font-size: 12px;
              letter-spacing: 0.2em;
              color: #6b7280;
            }
            .content {
              padding: 40px 20px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 300;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .message {
              font-size: 14px;
              font-weight: 300;
              color: #4b5563;
              line-height: 1.8;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(to right, #d97706, #b45309);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 300;
              font-size: 14px;
              letter-spacing: 0.5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 30px 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              font-weight: 300;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">MCCULLOCH</div>
            <div class="tagline">1798</div>
          </div>

          <div class="content">
            <div class="greeting">Welcome, ${firstName}!</div>

            <div class="message">
              Your email has been verified successfully. You now have full access to your McCulloch Jewellers account.
              <br><br>
              Explore our exquisite collection of timepieces, jewelry, and luxury accessories crafted with precision and passion.
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/products" class="button">Explore Collection</a>
            </div>

            <div class="message" style="margin-top: 30px;">
              If you have any questions, our customer service team is here to help.
            </div>
          </div>

          <div class="footer">
            <p>McCulloch Jewellers - Crafting Excellence Since 1798</p>
            <p style="margin-top: 10px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}" style="color: #6b7280; text-decoration: none;">Visit Our Website</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome, ${firstName}!

Your email has been verified successfully. You now have full access to your McCulloch Jewellers account.

Explore our exquisite collection of timepieces, jewelry, and luxury accessories crafted with precision and passion.

If you have any questions, our customer service team is here to help.

McCulloch Jewellers - Crafting Excellence Since 1798
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"McCulloch Jewellers" <${EMAIL_CONFIG.auth.user}>`,
    to: email,
    subject: 'Password Reset Request - McCulloch Jewellers',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .brand {
              font-size: 24px;
              font-weight: 300;
              letter-spacing: 0.3em;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .tagline {
              font-size: 12px;
              letter-spacing: 0.2em;
              color: #6b7280;
            }
            .content {
              padding: 40px 20px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 300;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .message {
              font-size: 14px;
              font-weight: 300;
              color: #4b5563;
              line-height: 1.8;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(to right, #d97706, #b45309);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 300;
              font-size: 14px;
              letter-spacing: 0.5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 30px 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              font-weight: 300;
            }
            .alternative-link {
              margin-top: 20px;
              padding: 15px;
              background: #f9fafb;
              border-radius: 6px;
              font-size: 12px;
              color: #6b7280;
              word-break: break-all;
            }
            .warning {
              padding: 15px;
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              margin: 20px 0;
              font-size: 13px;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">MCCULLOCH</div>
            <div class="tagline">1798</div>
          </div>

          <div class="content">
            <div class="greeting">Hello ${firstName || 'there'},</div>

            <div class="message">
              We received a request to reset your password for your McCulloch Jewellers account.
              <br><br>
              Click the button below to create a new password:
            </div>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <div class="warning">
              <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security.
            </div>

            <div class="alternative-link">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #d97706;">${resetUrl}</a>
            </div>

            <div class="message" style="margin-top: 30px;">
              If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>

          <div class="footer">
            <p>McCulloch Jewellers - Crafting Excellence Since 1798</p>
          </div>
        </body>
      </html>
    `,
    text: `
Hello ${firstName || 'there'},

We received a request to reset your password for your McCulloch Jewellers account.

Click the link below to create a new password:

${resetUrl}

This password reset link will expire in 1 hour for your security.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

McCulloch Jewellers - Crafting Excellence Since 1798
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
