const express = require('express');
const router = express.Router();
const adminProductController = require('../controllers/adminProductController');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { validateProduct } = require('../validators/productValidator');
const { uploadMultiple } = require('../middleware/upload');

// Middleware to authenticate all admin product routes
router.use(authenticateAdmin);

// Get all products with pagination and filters
router.get('/', adminProductController.getProducts);

// Get product options for dropdowns
router.get('/options', adminProductController.getProductOptions);

// Get single product by ID
router.get('/:id', adminProductController.getProductById);

// Create new product (JSON payload)
router.post('/', validateProduct, adminProductController.createProduct);

// Create new product with file uploads
router.post('/with-media', uploadMultiple('media', 10), adminProductController.createProductWithMedia);

// Update product
router.put('/:id', adminProductController.updateProduct);

// Update product with file uploads
router.put('/:id/with-media', uploadMultiple('media', 10), adminProductController.updateProductWithMedia);

// Delete product
router.delete('/:id', adminProductController.deleteProduct);

// Toggle product status (active/inactive)
router.patch('/:id/toggle-status', adminProductController.toggleProductStatus);

// Toggle featured status
router.patch('/:id/toggle-featured', adminProductController.toggleFeaturedStatus);

// Bulk update products
router.patch('/bulk/update', adminProductController.bulkUpdateProducts);

module.exports = router;