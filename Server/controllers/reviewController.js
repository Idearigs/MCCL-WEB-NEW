const { getModels } = require('../models');

const getModelInstance = () => getModels();

const ALLOWED_STATUS = ['pending', 'published', 'hidden'];
const clampRating = (r) => {
  const n = parseInt(r, 10);
  if (Number.isNaN(n)) return 5;
  return Math.min(5, Math.max(1, n));
};

// Fields safe to expose to the public storefront (no email, source or status).
const PUBLIC_ATTRS = ['id', 'author_name', 'location', 'category', 'rating', 'body', 'sort_order', 'created_at'];

// ── Public ──────────────────────────────────────────────────────────────────

// GET /reviews  — published reviews for the storefront.
// ?featured=true limits to homepage picks; ?limit caps the count.
exports.getPublicReviews = async (req, res) => {
  try {
    const { Review } = getModelInstance();
    const { featured, limit } = req.query;

    const where = { status: 'published' };
    if (featured === 'true') where.is_featured = true;

    const reviews = await Review.findAll({
      where,
      attributes: PUBLIC_ATTRS,
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      limit: limit ? Math.min(parseInt(limit, 10) || 12, 50) : undefined
    });

    return res.json({ success: true, data: { reviews, count: reviews.length } });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
};

// POST /reviews — visitor submission. Always lands as source=visitor, status=pending.
exports.submitReview = async (req, res) => {
  try {
    const { Review } = getModelInstance();
    const { author_name, location, category, rating, body, email } = req.body;

    if (!author_name || !author_name.trim()) {
      return res.status(400).json({ success: false, message: 'Your name is required' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Please write a few words about your experience' });
    }

    const review = await Review.create({
      author_name: author_name.trim().slice(0, 120),
      location: location ? location.trim().slice(0, 120) : null,
      category: category ? category.trim().slice(0, 60) : null,
      rating: clampRating(rating),
      body: body.trim().slice(0, 2000),
      email: email ? email.trim().slice(0, 255) : null,
      source: 'visitor',
      status: 'pending',
      is_featured: false
    });

    // Only echo back the id — nothing that could leak other submissions.
    return res.status(201).json({
      success: true,
      message: 'Thank you — your review has been submitted for approval.',
      data: { id: review.id }
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit review', error: error.message });
  }
};

// ── Admin ───────────────────────────────────────────────────────────────────

// GET /reviews/all — every review, all statuses/sources (admin panel).
exports.getAllReviews = async (req, res) => {
  try {
    const { Review } = getModelInstance();
    const { status, source } = req.query;

    const where = {};
    if (status && ALLOWED_STATUS.includes(status)) where.status = status;
    if (source && ['admin', 'visitor'].includes(source)) where.source = source;

    const reviews = await Review.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    return res.json({ success: true, data: { reviews, count: reviews.length } });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
};

// POST /reviews/admin — staff-created review (published by default).
exports.createReview = async (req, res) => {
  try {
    const { Review } = getModelInstance();
    const { author_name, location, category, rating, body, status, is_featured, sort_order } = req.body;

    if (!author_name || !author_name.trim()) {
      return res.status(400).json({ success: false, message: 'Author name is required' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Review text is required' });
    }

    const review = await Review.create({
      author_name: author_name.trim().slice(0, 120),
      location: location ? location.trim().slice(0, 120) : null,
      category: category ? category.trim().slice(0, 60) : null,
      rating: clampRating(rating),
      body: body.trim(),
      source: 'admin',
      status: ALLOWED_STATUS.includes(status) ? status : 'published',
      is_featured: is_featured === true || is_featured === 'true',
      sort_order: sort_order ? parseInt(sort_order, 10) || 0 : 0
    });

    return res.status(201).json({ success: true, data: { review }, message: 'Review created successfully' });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ success: false, message: 'Failed to create review', error: error.message });
  }
};

// PUT /reviews/:id — edit / approve / hide / feature / reorder.
exports.updateReview = async (req, res) => {
  try {
    const { Review } = getModelInstance();
    const { id } = req.params;

    const review = await Review.findByPk(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const b = req.body;
    const updates = {};
    if (b.author_name !== undefined) updates.author_name = String(b.author_name).trim().slice(0, 120);
    if (b.location !== undefined) updates.location = b.location ? String(b.location).trim().slice(0, 120) : null;
    if (b.category !== undefined) updates.category = b.category ? String(b.category).trim().slice(0, 60) : null;
    if (b.rating !== undefined) updates.rating = clampRating(b.rating);
    if (b.body !== undefined) updates.body = String(b.body).trim();
    if (b.status !== undefined && ALLOWED_STATUS.includes(b.status)) updates.status = b.status;
    if (b.is_featured !== undefined) updates.is_featured = b.is_featured === true || b.is_featured === 'true';
    if (b.sort_order !== undefined) updates.sort_order = parseInt(b.sort_order, 10) || 0;

    await review.update(updates);

    return res.json({ success: true, data: { review }, message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ success: false, message: 'Failed to update review', error: error.message });
  }
};

// DELETE /reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const { Review } = getModelInstance();
    const { id } = req.params;

    const review = await Review.findByPk(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    await review.destroy();
    return res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
  }
};
