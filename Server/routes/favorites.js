const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware: auth } = require('../middleware/auth');

/**
 * @route   GET /api/v1/favorites
 * @desc    Get all user favorites
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        uf.id as favorite_id,
        uf.notes,
        uf.created_at as favorited_at,
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.compare_at_price,
        p.category,
        p.in_stock,
        p.sku,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'url', pm.url,
            'alt', pm.alt_text,
            'is_primary', pm.is_primary
          ) ORDER BY pm.is_primary DESC, pm.sort_order)
          FROM product_media pm
          WHERE pm.product_id = p.id),
          '[]'::json
        ) as images
      FROM user_favorites uf
      JOIN products p ON uf.product_id = p.id
      WHERE uf.user_id = $1
      ORDER BY uf.created_at DESC`,
      [req.user.userId]
    );

    const favorites = result.rows.map(row => ({
      favoriteId: row.favorite_id,
      notes: row.notes,
      favoritedAt: row.favorited_at,
      product: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        price: parseFloat(row.price),
        compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
        category: row.category,
        inStock: row.in_stock,
        sku: row.sku,
        images: row.images || [],
        image: row.images && row.images[0] ? row.images[0].url : null
      }
    }));

    res.json({
      success: true,
      data: favorites,
      count: favorites.length
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites'
    });
  }
});

/**
 * @route   POST /api/v1/favorites
 * @desc    Add product to favorites
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { productId, notes } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists
    const productCheck = await pool.query(
      'SELECT id, name FROM products WHERE id = $1',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if already in favorites
    const existingFavorite = await pool.query(
      'SELECT id FROM user_favorites WHERE user_id = $1 AND product_id = $2',
      [req.user.userId, productId]
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Product is already in your favorites'
      });
    }

    // Add to favorites
    const result = await pool.query(
      `INSERT INTO user_favorites (user_id, product_id, notes)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [req.user.userId, productId, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      data: {
        favoriteId: result.rows[0].id,
        productId: productId,
        productName: productCheck.rows[0].name,
        createdAt: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites'
    });
  }
});

/**
 * @route   DELETE /api/v1/favorites/:productId
 * @desc    Remove product from favorites
 * @access  Private
 */
router.delete('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      'DELETE FROM user_favorites WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [req.user.userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in favorites'
      });
    }

    res.json({
      success: true,
      message: 'Removed from favorites'
    });

  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites'
    });
  }
});

/**
 * @route   PUT /api/v1/favorites/:productId
 * @desc    Update favorite notes
 * @access  Private
 */
router.put('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { notes } = req.body;

    const result = await pool.query(
      `UPDATE user_favorites
       SET notes = $1
       WHERE user_id = $2 AND product_id = $3
       RETURNING id`,
      [notes, req.user.userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in favorites'
      });
    }

    res.json({
      success: true,
      message: 'Favorite updated'
    });

  } catch (error) {
    console.error('Update favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update favorite'
    });
  }
});

/**
 * @route   GET /api/v1/favorites/check/:productId
 * @desc    Check if product is in favorites
 * @access  Private
 */
router.get('/check/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      'SELECT id FROM user_favorites WHERE user_id = $1 AND product_id = $2',
      [req.user.userId, productId]
    );

    res.json({
      success: true,
      data: {
        isFavorite: result.rows.length > 0
      }
    });

  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status'
    });
  }
});

/**
 * @route   POST /api/v1/favorites/toggle/:productId
 * @desc    Toggle product favorite status (add if not exists, remove if exists)
 * @access  Private
 */
router.post('/toggle/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if already in favorites
    const existing = await pool.query(
      'SELECT id FROM user_favorites WHERE user_id = $1 AND product_id = $2',
      [req.user.userId, productId]
    );

    if (existing.rows.length > 0) {
      // Remove from favorites
      await pool.query(
        'DELETE FROM user_favorites WHERE user_id = $1 AND product_id = $2',
        [req.user.userId, productId]
      );

      return res.json({
        success: true,
        message: 'Removed from favorites',
        data: {
          isFavorite: false
        }
      });
    } else {
      // Add to favorites
      await pool.query(
        'INSERT INTO user_favorites (user_id, product_id) VALUES ($1, $2)',
        [req.user.userId, productId]
      );

      return res.json({
        success: true,
        message: 'Added to favorites',
        data: {
          isFavorite: true
        }
      });
    }

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle favorite'
    });
  }
});

module.exports = router;
