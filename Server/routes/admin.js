const express = require('express');
const router = express.Router();

const {
  adminLogin,
  adminLogout,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  getDashboardStats
} = require('../controllers/adminController');

const adminProductController = require('../controllers/adminProductController');
const adminCategoriesRoutes = require('./adminCategories');
const adminJewelryCategoriesRoutes = require('./adminJewelryCategories');
const uploadRoutes = require('./upload');
const watchRoutes = require('./watchRoutes');
const { validateProduct, validateBulkUpdate } = require('../validators/productValidator');
const { uploadMultiple } = require('../middleware/upload');

const { adminAuth, requireAdmin, requireSuperAdmin } = require('../middleware/adminAuth');
const { joiValidation } = require('../middleware/validation');
const { authRateLimit } = require('../middleware/security');

// Validation schemas
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const updateProfileSchema = Joi.object({
  first_name: Joi.string().min(1).max(100),
  last_name: Joi.string().min(1).max(100),
  avatar: Joi.string().uri().allow(null, '')
}).min(1);

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    })
});

// Public routes (no auth required)
router.post('/login', authRateLimit, joiValidation(loginSchema), adminLogin);

// Protected routes (require authentication)
router.use(adminAuth);

router.post('/logout', adminLogout);
router.get('/profile', getAdminProfile);
router.put('/profile', joiValidation(updateProfileSchema), updateAdminProfile);
router.put('/change-password', joiValidation(changePasswordSchema), changePassword);
router.get('/dashboard/stats', getDashboardStats);

// Admin Product Management Routes
router.get('/products', adminProductController.getProducts);
router.get('/products/options', adminProductController.getProductOptions);
router.get('/products/:id', adminProductController.getProductById);
router.post('/products', validateProduct, adminProductController.createProduct);
router.post('/products/with-media', uploadMultiple('media', 10), adminProductController.createProductWithMedia);
router.put('/products/:id', adminProductController.updateProduct);
router.delete('/products/:id', adminProductController.deleteProduct);
router.patch('/products/:id/toggle-status', adminProductController.toggleProductStatus);
router.patch('/products/:id/toggle-featured', adminProductController.toggleFeaturedStatus);
router.patch('/products/bulk/update', validateBulkUpdate, adminProductController.bulkUpdateProducts);

// Category Management Routes
router.use('/categories', adminCategoriesRoutes);

// Jewelry Category Management Routes (New hierarchical system)
router.use('/jewelry-categories', adminJewelryCategoriesRoutes);

// Watch Management Routes
router.use('/watches', watchRoutes);

// Upload Routes
router.use('/upload', uploadRoutes);

module.exports = router;