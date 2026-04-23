const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/pool');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
}

// Short-lived auth codes for OAuth callback exchange (60-second TTL)
const pendingAuthCodes = new Map();

const cleanExpiredCodes = () => {
  const now = Date.now();
  for (const [code, data] of pendingAuthCodes) {
    if (data.expiresAt < now) pendingAuthCodes.delete(code);
  }
};

/**
 * @route   GET /api/v1/auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Google OAuth callback — redirects with a short-lived code,
 *          not with tokens in the URL. Frontend exchanges the code via
 *          GET /api/v1/auth/exchange?code=<code>
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8080'}?error=auth_failed`
  }),
  async (req, res) => {
    try {
      const user = req.user;

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
      const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, refreshToken, refreshExpires, req.headers['user-agent'], req.ip]
      );

      // Issue a short-lived one-time code instead of embedding tokens in the URL.
      // Tokens in URLs appear in server access logs, browser history, and referrer headers.
      const authCode = crypto.randomBytes(32).toString('hex');
      cleanExpiredCodes();
      pendingAuthCodes.set(authCode, {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 60_000 // 60-second window
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      res.redirect(`${frontendUrl}/auth/callback?code=${authCode}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      res.redirect(`${frontendUrl}?error=auth_error`);
    }
  }
);

/**
 * @route   GET /api/v1/auth/exchange
 * @desc    Exchange a one-time auth code (from OAuth callback) for access + refresh tokens.
 *          The code is consumed on first use and expires after 60 seconds.
 * @access  Public
 */
router.get('/exchange', (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Auth code is required' });
  }

  cleanExpiredCodes();
  const data = pendingAuthCodes.get(code);

  if (!data || data.expiresAt < Date.now()) {
    pendingAuthCodes.delete(code);
    return res.status(401).json({ success: false, message: 'Invalid or expired auth code' });
  }

  pendingAuthCodes.delete(code);

  res.json({
    success: true,
    data: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    }
  });
});

module.exports = router;
