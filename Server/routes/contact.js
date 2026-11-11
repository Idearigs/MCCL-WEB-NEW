// Contact-page enquiries: emailed to the shop, with the customer's address as reply-to.
// Nothing is stored; if the email can't be sent the customer is told, so no enquiry is
// silently lost.
const express = require('express');
const { createRateLimit } = require('../middleware/security');
const { sendContactEnquiryEmail } = require('../services/emailService');
const { logger } = require('../config/database');

const router = express.Router();
const limit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

const SUBJECTS = { bespoke: 'Bespoke', order: 'An order', repairs: 'Repairs', valuations: 'Valuations', watches: 'Watches', other: 'Something else' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

router.post('/', limit, async (req, res) => {
  const b = req.body || {};
  // Hidden field real visitors never fill in; bots usually do. Pretend it worked.
  if (str(b.website, 200)) return res.json({ success: true });

  const enquiry = {
    name: str(b.name, 120),
    email: str(b.email, 200),
    phone: str(b.phone, 40),
    subject: SUBJECTS[b.subject] || SUBJECTS.other,
    message: str(b.message, 5000),
    newsletter: b.newsletter === true,
  };
  const errors = [];
  if (!enquiry.name) errors.push('Please enter your name.');
  if (!EMAIL_RE.test(enquiry.email)) errors.push('Please enter a valid email address.');
  if (!enquiry.message) errors.push('Please enter a message.');
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

  try {
    await sendContactEnquiryEmail(enquiry);
    return res.json({ success: true });
  } catch (err) {
    logger.error(`Contact enquiry email failed: ${err.message}`);
    return res.status(502).json({ success: false, message: 'We could not send your enquiry just now.' });
  }
});

module.exports = router;
