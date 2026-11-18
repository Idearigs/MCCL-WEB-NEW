const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./pool');
const { sendWelcomeEmail } = require('../services/emailService');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        const existingUser = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [profile.emails[0].value.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
          const user = existingUser.rows[0];
          // Google has proven this person controls the address. If the existing account
          // never proved it (a password sign-up that was not verified), someone else may
          // have registered it: remove that password and its sessions before linking.
          if (!user.email_verified && profile.emails[0].verified !== false) {
            await pool.query(
              `UPDATE users SET email_verified = TRUE, password_hash = 'GOOGLE_OAUTH',
                 verification_token = NULL, verification_token_expires = NULL WHERE id = $1`,
              [user.id]
            );
            await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [user.id]);
            user.email_verified = true;
            user.password_hash = 'GOOGLE_OAUTH';
          }
          return done(null, user);
        }

        // Create new user
        const newUser = await pool.query(
          `INSERT INTO users (
            email,
            first_name,
            last_name,
            email_verified,
            avatar_url,
            password_hash
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [
            profile.emails[0].value.toLowerCase(),
            profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
            profile.name?.familyName || profile.displayName?.split(' ')[1] || '',
            true, // Google emails are pre-verified
            profile.photos?.[0]?.value || null,
            'GOOGLE_OAUTH' // No password for OAuth users
          ]
        );

        // First Google sign-in → luxury welcome email (non-blocking)
        const created = newUser.rows[0];
        sendWelcomeEmail(created.email, created.first_name).catch(emailError => {
          console.error('Failed to send welcome email:', emailError.message);
        });

        return done(null, created);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, user.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
