const express = require('express');
const router = express.Router();

const {
  getAllProducts,
  getProductBySlug,
  getAllCategories,
  getProductsByCategory
} = require('../controllers/productController');

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

// GET /api/v1/products/category/:categorySlug - Get products by category
router.get('/category/:categorySlug',
  validatePagination,
  sanitizeQuery(['price_min', 'price_max', 'metal', 'gemstone', 'featured', 'in_stock', 'sort', 'order']),
  getProductsByCategory
);

// GET /api/v1/products/:slug - Get single product by slug
router.get('/:slug', getProductBySlug);

module.exports = router;