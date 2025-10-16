const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const crypto = require('crypto');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m'; // Access token expires in 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Refresh token expires in 7 days

/**
 * @route   POST /api/v1/users/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, newsletterSubscribed } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Email format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification token (for email verification feature)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const result = await pool.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name,
        newsletter_subscribed, verification_token, verification_token_expires
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, email_verified, created_at`,
      [
        email.toLowerCase(),
        passwordHash,
        firstName || null,
        lastName || null,
        newsletterSubscribed !== undefined ? newsletterSubscribed : true,
        verificationToken,
        verificationExpires
      ]
    );

    const user = result.rows[0];

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    // Store refresh token in database
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, refreshToken, refreshExpires, req.headers['user-agent'], req.ip]
    );

    // TEMPORARY: Auto-verify emails until SMTP is configured
    // Remove this block when email service is ready
    await pool.query(
      'UPDATE users SET email_verified = TRUE WHERE id = $1',
      [user.id]
    );
    user.email_verified = true;

    // Send verification email (disabled until SMTP configured)
    // try {
    //   await sendVerificationEmail(user.email, verificationToken, user.first_name);
    //   console.log(`Verification email sent to ${user.email}`);
    // } catch (emailError) {
    //   console.error('Failed to send verification email:', emailError);
    // }

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified,
          fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
          createdAt: user.created_at
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.'
    });
  }
});

/**
 * @route   POST /api/v1/users/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name,
              email_verified, is_active, avatar_url
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await pool.query(
      `UPDATE users
       SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1
       WHERE id = $1`,
      [user.id]
    );

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshTokenExpiry = rememberMe ? '30d' : '7d';
    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: refreshTokenExpiry }
    );

    // Store refresh token
    const refreshExpires = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
    );
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, refreshToken, refreshExpires, req.headers['user-agent'], req.ip]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified,
          avatarUrl: user.avatar_url,
          fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

/**
 * @route   POST /api/v1/users/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Check if refresh token exists and is not revoked
    const tokenResult = await pool.query(
      `SELECT user_id, expires_at, revoked
       FROM refresh_tokens
       WHERE token = $1`,
      [refreshToken]
    );

    if (tokenResult.rows.length === 0 || tokenResult.rows[0].revoked) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const tokenData = tokenResult.rows[0];

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired'
      });
    }

    // Get user data
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
});

/**
 * @route   POST /api/v1/users/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Private
 */
router.post('/logout', auth, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the refresh token
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1',
        [refreshToken]
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, avatar_url,
              date_of_birth, gender, newsletter_subscribed, sms_notifications,
              email_verified, created_at, last_login_at
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        newsletterSubscribed: user.newsletter_subscribed,
        smsNotifications: user.sms_notifications,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      newsletterSubscribed,
      smsNotifications
    } = req.body;

    const result = await pool.query(
      `UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        date_of_birth = COALESCE($4, date_of_birth),
        gender = COALESCE($5, gender),
        newsletter_subscribed = COALESCE($6, newsletter_subscribed),
        sms_notifications = COALESCE($7, sms_notifications)
       WHERE id = $8
       RETURNING id, email, first_name, last_name, phone, date_of_birth, gender`,
      [firstName, lastName, phone, dateOfBirth, gender, newsletterSubscribed, smsNotifications, req.user.userId]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        gender: user.gender
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route   POST /api/v1/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.userId]
    );

    const user = result.rows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.userId]
    );

    // Revoke all refresh tokens (log out from all devices)
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

/**
 * @route   GET /api/v1/users/verify-email/:token
 * @desc    Verify user email with token
 * @access  Public
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this verification token
    const result = await pool.query(
      `SELECT id, email, first_name, email_verified, verification_token_expires
       FROM users
       WHERE verification_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    const user = result.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified',
        data: { alreadyVerified: true }
      });
    }

    // Check if token expired
    if (new Date() > new Date(user.verification_token_expires)) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new one.',
        data: { expired: true }
      });
    }

    // Verify the email
    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.first_name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        verified: true,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email'
    });
  }
});

/**
 * @route   POST /api/v1/users/resend-verification
 * @desc    Resend verification email
 * @access  Private
 */
router.post('/resend-verification', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user details
    const result = await pool.query(
      'SELECT id, email, first_name, email_verified FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await pool.query(
      `UPDATE users
       SET verification_token = $1, verification_token_expires = $2
       WHERE id = $3`,
      [verificationToken, verificationExpires, userId]
    );

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.first_name);

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
});

/**
 * @route   GET /api/v1/users/admin/all
 * @desc    Get all users with their details (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/all', adminAuth, async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.avatar_url,
        u.email_verified,
        u.password_hash,
        u.created_at,
        u.last_login_at,
        u.newsletter_subscribed,
        CASE
          WHEN u.password_hash = 'GOOGLE_OAUTH' THEN 'google'
          ELSE 'email'
        END as registration_method,
        COUNT(DISTINCT f.id) as favorites_count
       FROM users u
       LEFT JOIN user_favorites f ON u.id = f.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A',
      phone: user.phone,
      avatarUrl: user.avatar_url,
      emailVerified: user.email_verified,
      registrationMethod: user.registration_method,
      favoritesCount: parseInt(user.favorites_count) || 0,
      newsletterSubscribed: user.newsletter_subscribed,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at
    }));

    res.json({
      success: true,
      data: {
        users,
        totalCount: users.length
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

/**
 * @route   GET /api/v1/users/admin/:userId
 * @desc    Get detailed user info including favorites (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details
    const userResult = await pool.query(
      `SELECT
        id, email, first_name, last_name, phone, avatar_url,
        date_of_birth, gender, newsletter_subscribed, sms_notifications,
        email_verified, created_at, last_login_at, password_hash
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get user's favorites with product details
    const favoritesResult = await pool.query(
      `SELECT
        f.id as favorite_id,
        f.product_id,
        f.created_at as favorited_at,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        p.sale_price,
        (SELECT pi.image_url FROM product_images pi
         WHERE pi.product_id = p.id AND pi.is_primary = true
         LIMIT 1) as product_image
       FROM user_favorites f
       LEFT JOIN products p ON f.product_id = p.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    // TODO: Get user's orders when order system is implemented
    // For now, return empty array
    const orders = [];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A',
          phone: user.phone,
          avatarUrl: user.avatar_url,
          dateOfBirth: user.date_of_birth,
          gender: user.gender,
          newsletterSubscribed: user.newsletter_subscribed,
          smsNotifications: user.sms_notifications,
          emailVerified: user.email_verified,
          registrationMethod: user.password_hash === 'GOOGLE_OAUTH' ? 'google' : 'email',
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at
        },
        favorites: favoritesResult.rows.map(fav => ({
          id: fav.favorite_id,
          productId: fav.product_id,
          productName: fav.product_name,
          productSlug: fav.product_slug,
          productImage: fav.product_image,
          basePrice: fav.base_price,
          salePrice: fav.sale_price,
          favoritedAt: fav.favorited_at
        })),
        orders: orders,
        stats: {
          favoritesCount: favoritesResult.rows.length,
          ordersCount: orders.length,
          totalSpent: 0 // TODO: Calculate from orders when implemented
        }
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
});

module.exports = router;
