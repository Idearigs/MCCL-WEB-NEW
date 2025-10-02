const { logger } = require('../config/database');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error(`Error ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: err.stack,
    body: req.body,
    user: req.user?.id
  });

  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = { message, statusCode: 400 };
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value';
    error = { message, statusCode: 400 };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    error = { message, statusCode: 400 };
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value';
    error = { message, statusCode: 400 };
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFound = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  logger.warn(`404 - ${message}`);

  res.status(404).json({
    success: false,
    message
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};