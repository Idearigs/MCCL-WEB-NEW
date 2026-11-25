// Google reviews for the "Words from Our Clients" module, from the shop's verified Google
// Business Profile via Places API (New) Place Details. Google returns the rating, the review
// count and up to five reviews (its own selection, not the full history); they are passed on
// unchanged — never rewritten, filtered or reordered — with each author's name and link.
//
// Off until GOOGLE_PLACES_API_KEY (a restricted key in the business's own Cloud project) and
// GOOGLE_PLACE_ID are set. While off, or if Google can't be reached, it answers
// { available: false } and the site shows plain links to the Google listing instead.
// Held in memory for a few hours so page views don't each call Google; nothing is stored.
const express = require('express');
const { logger } = require('../config/database');

const router = express.Router();
const KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const PLACE = process.env.GOOGLE_PLACE_ID || '';
const TTL = 6 * 60 * 60 * 1000;
const FIELDS = 'rating,userRatingCount,reviews,googleMapsUri,googleMapsLinks';

let cache = { at: 0, body: null };
let failedAt = 0; // after a failed call, wait 5 minutes before asking Google again

async function fetchPlace() {
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE)}?languageCode=en`, {
    headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': FIELDS },
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) throw new Error(`Places API ${r.status}`);
  const p = await r.json();
  const links = p.googleMapsLinks || {};
  return {
    available: true,
    rating: typeof p.rating === 'number' ? p.rating : null,
    count: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
    mapsUrl: p.googleMapsUri || null,
    reviewsUrl: links.reviewsUri || p.googleMapsUri || null,
    writeReviewUrl: links.writeAReviewUri || null,
    reviews: (p.reviews || []).map((v) => ({
      rating: v.rating ?? null,
      text: v.originalText?.text ?? v.text?.text ?? '',
      author: v.authorAttribution?.displayName || 'Google user',
      authorUrl: v.authorAttribution?.uri || null,
      authorPhoto: v.authorAttribution?.photoUri || null,
      when: v.relativePublishTimeDescription || null,
      published: v.publishTime || null,
      url: v.googleMapsUri || null,
    })),
    attribution: 'Google',
  };
}

router.get('/', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=1800');
  if (!KEY || !PLACE) return res.json({ available: false });
  if (cache.body && Date.now() - cache.at < TTL) return res.json(cache.body);
  const stale = () => (cache.body && Date.now() - cache.at < 4 * TTL ? cache.body : { available: false });
  if (Date.now() - failedAt < 5 * 60 * 1000) return res.json(stale());
  try {
    cache = { at: Date.now(), body: await fetchPlace() };
    return res.json(cache.body);
  } catch (e) {
    failedAt = Date.now();
    logger.warn(`[google-reviews] ${e.message}`);
    // Keep showing the last good copy for a while rather than dropping to links only.
    return res.json(stale());
  }
});

module.exports = router;
