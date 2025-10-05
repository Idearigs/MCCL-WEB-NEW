const express = require('express');
const router = express.Router();

// Import route modules
const productRoutes = require('./products');
const adminRoutes = require('./admin');
const filtersRoutes = require('./filters');
const watchRoutes = require('./watchRoutes');
const userRoutes = require('./users');
const favoritesRoutes = require('./favorites');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/products', productRoutes);
router.use('/admin', adminRoutes);
router.use('/filters', filtersRoutes);
router.use('/watches', watchRoutes);
router.use('/users', userRoutes);
router.use('/favorites', favoritesRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'McCulloch Jewellers API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      products: {
        'GET /products': 'Get all products with filtering and pagination',
        'GET /products/categories': 'Get all product categories',
        'GET /products/category/:categorySlug': 'Get products by category',
        'GET /products/:slug': 'Get single product by slug'
      }
    },
    documentation: {
      filters: {
        category: 'Filter by category slug (rings, earrings, necklaces, bracelets)',
        collection: 'Filter by collection slug',
        price_min: 'Minimum price filter (number)',
        price_max: 'Maximum price filter (number)',
        metal: 'Filter by metal type (platinum, gold, etc.)',
        gemstone: 'Filter by gemstone type (diamond, ruby, etc.)',
        featured: 'Filter featured products (true/false)',
        in_stock: 'Filter in-stock products (true/false)',
        sort: 'Sort by (name, price, created_at, featured, sort_order)',
        order: 'Sort order (asc, desc)'
      },
      pagination: {
        page: 'Page number (default: 1)',
        limit: 'Items per page (default: 12, max: 100)'
      }
    }
  });
});

module.exports = router;