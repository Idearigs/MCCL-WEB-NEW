const express = require('express');
const router = express.Router();

const {
  getAllProducts,
  getProductBySlug,
  getAllCategories,
  getProductsByCategory,
  getNavigationData,
  getNivodaPrice
} = require('../controllers/productController');

const nivodaService = require('../services/nivodaService');

const { joiValidation, validatePagination, sanitizeQuery } = require('../middleware/validation');
const { productQuerySchema } = require('../validators/productValidators');
const { apiRateLimit } = require('../middleware/security');

// Apply rate limiting to all product routes
router.use(apiRateLimit);

// GET /api/v1/products - Get all products with filtering
router.get('/',
  validatePagination,
  sanitizeQuery(['category', 'collection', 'price_min', 'price_max', 'metal', 'gemstone', 'featured', 'in_stock', 'sort', 'order']),
  getAllProducts
);

// GET /api/v1/products/categories - Get all categories
router.get('/categories', getAllCategories);

// GET /api/v1/products/navigation - Get navigation data (ring types, gemstones, metals, collections)
router.get('/navigation', getNavigationData);

// GET /api/v1/products/category/:categorySlug - Get products by category
router.get('/category/:categorySlug',
  validatePagination,
  sanitizeQuery(['price_min', 'price_max', 'metal', 'gemstone', 'featured', 'in_stock', 'sort', 'order']),
  getProductsByCategory
);

// POST /api/v1/products/:productId/nivoda-price - Get dynamic Nivoda price for product
router.post('/:productId/nivoda-price', getNivodaPrice);

// GET /api/v1/products/nivoda/search - Search diamonds from Nivoda API
router.get('/nivoda/search', async (req, res) => {
  try {
    const filters = {
      labgrown: req.query.labgrown === 'true',
      color: req.query.color ? req.query.color.split(',') : [],
      clarity: req.query.clarity ? req.query.clarity.split(',') : [],
      cut: req.query.cut ? req.query.cut.split(',') : [],
      minCarat: parseFloat(req.query.minCarat) || 0.5,
      maxCarat: parseFloat(req.query.maxCarat) || 10,
      minPrice: parseInt(req.query.minPrice) || 0,
      maxPrice: parseInt(req.query.maxPrice) || 500000,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await nivodaService.searchDiamonds(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Nivoda search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search diamonds',
      details: error.response?.data || null
    });
  }
});

// GET /api/v1/products/:slug - Get single product by slug
router.get('/:slug', getProductBySlug);

module.exports = router;