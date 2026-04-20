const express = require('express');
const router = express.Router();
const adminProductController = require('../controllers/adminProductController');
const { adminAuth } = require('../middleware/adminAuth');
const { validateProduct } = require('../validators/productValidator');
const { uploadMultiple, uploadMultipleFields } = require('../middleware/upload');

// Middleware to authenticate all admin product routes
router.use(adminAuth);

// Get all products with pagination and filters
router.get('/', adminProductController.getProducts);

// Get product options for dropdowns
router.get('/options', adminProductController.getProductOptions);

// Get single product by ID
router.get('/:id', adminProductController.getProductById);

// Create new product (JSON payload)
router.post('/', validateProduct, adminProductController.createProduct);

// Create new product with file uploads (supports both general and metal-specific media)
router.post('/with-media', uploadMultipleFields(50), adminProductController.createProductWithMedia);

// Update product
router.put('/:id', adminProductController.updateProduct);

// Update product with file uploads (supports both general and metal-specific media)
router.put('/:id/with-media', uploadMultipleFields(50), adminProductController.updateProductWithMedia);

// Delete product
router.delete('/:id', adminProductController.deleteProduct);

// Toggle product status (active/inactive)
router.patch('/:id/toggle-status', adminProductController.toggleProductStatus);

// Toggle featured status
router.patch('/:id/toggle-featured', adminProductController.toggleFeaturedStatus);

// Bulk update products
router.patch('/bulk/update', adminProductController.bulkUpdateProducts);

// Bulk price adjustment by percentage
router.post('/bulk/price-adjust', adminProductController.bulkPriceAdjust);

module.exports = router;