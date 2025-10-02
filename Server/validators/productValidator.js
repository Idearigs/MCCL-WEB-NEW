const { body, validationResult } = require('express-validator');

const validateProduct = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters')
    .trim(),

  body('short_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Short description cannot exceed 500 characters')
    .trim(),

  body('base_price')
    .notEmpty()
    .withMessage('Base price is required')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('sale_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Sale price must be a positive number')
    .custom((value, { req }) => {
      if (value && parseFloat(value) >= parseFloat(req.body.base_price)) {
        throw new Error('Sale price must be less than base price');
      }
      return true;
    }),

  body('currency')
    .optional()
    .isIn(['GBP', 'USD', 'EUR'])
    .withMessage('Currency must be GBP, USD, or EUR'),

  body('category_id')
    .notEmpty()
    .withMessage('Category is required')
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),

  body('collection_id')
    .optional()
    .isUUID()
    .withMessage('Collection ID must be a valid UUID'),

  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),

  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),

  body('dimensions')
    .optional()
    .trim(),

  body('care_instructions')
    .optional()
    .trim(),

  body('warranty_info')
    .optional()
    .trim(),

  body('meta_title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Meta title cannot exceed 255 characters')
    .trim(),

  body('meta_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Meta description cannot exceed 500 characters')
    .trim(),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean'),

  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('Featured status must be a boolean'),

  body('in_stock')
    .optional()
    .isBoolean()
    .withMessage('Stock status must be a boolean'),

  // Images validation
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),

  body('images.*.url')
    .if(body('images').exists())
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Image URL must be valid'),

  body('images.*.alt_text')
    .optional()
    .trim(),

  // Variants validation
  body('variants')
    .optional()
    .isArray()
    .withMessage('Variants must be an array'),

  body('variants.*.variant_name')
    .if(body('variants').exists())
    .notEmpty()
    .withMessage('Variant name is required')
    .trim(),

  body('variants.*.price_adjustment')
    .if(body('variants').exists())
    .optional()
    .isFloat()
    .withMessage('Price adjustment must be a number'),

  body('variants.*.stock_quantity')
    .if(body('variants').exists())
    .optional()
    .isInt({ min: 0 })
    .withMessage('Variant stock quantity must be a non-negative integer'),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

const validateBulkUpdate = [
  body('productIds')
    .isArray({ min: 1 })
    .withMessage('Product IDs array is required and must contain at least one ID'),

  body('productIds.*')
    .isUUID()
    .withMessage('Each product ID must be a valid UUID'),

  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['activate', 'deactivate', 'feature', 'unfeature', 'set_category', 'set_collection'])
    .withMessage('Invalid action specified'),

  body('value')
    .if(body('action').isIn(['set_category', 'set_collection']))
    .notEmpty()
    .withMessage('Value is required for category/collection actions')
    .isUUID()
    .withMessage('Value must be a valid UUID'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateProduct,
  validateBulkUpdate
};