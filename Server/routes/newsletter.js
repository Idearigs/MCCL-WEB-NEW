// Footer "New pieces and private viewings" sign-up. There is no mailing-list service, so each
// sign-up is emailed to the shop (CONTACT_EMAIL). Before this the form sent nothing at all.
const express = require('express');
const { createRateLimit } = require('../middleware/security');
const { sendNewsletterSignupEmail } = require('../services/emailService');
const { logger } = require('../config/database');

const router = express.Router();
const limit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

router.post('/', limit, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().slice(0, 200) : '';
  if (!EMAIL_RE.test(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  try {
    await sendNewsletterSignupEmail({ email });
    return res.json({ success: true });
  } catch (err) {
    logger.error(`Newsletter sign-up email failed: ${err.message}`);
    return res.status(502).json({ success: false, message: 'We could not save your sign-up just now.' });
  }
});

module.exports = router;
