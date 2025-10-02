const { validationResult } = require('express-validator');
const Joi = require('joi');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  next();
};

const joiValidation = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

const commonSchemas = {
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  phoneNumber: Joi.string().pattern(new RegExp('^[+]?[1-9]\\d{1,14}$')).optional(),
  mongoId: Joi.string().pattern(new RegExp('^[0-9a-fA-F]{24}$')).required(),
  uuid: Joi.string().uuid().required()
};

const validatePagination = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  req.pagination = { page, limit, offset };
  next();
};

const sanitizeQuery = (allowedFields) => {
  return (req, res, next) => {
    if (allowedFields) {
      const sanitized = {};
      allowedFields.forEach(field => {
        if (req.query[field] !== undefined) {
          sanitized[field] = req.query[field];
        }
      });
      req.sanitizedQuery = sanitized;
    } else {
      req.sanitizedQuery = req.query;
    }
    next();
  };
};

module.exports = {
  handleValidationErrors,
  joiValidation,
  commonSchemas,
  validatePagination,
  sanitizeQuery
};