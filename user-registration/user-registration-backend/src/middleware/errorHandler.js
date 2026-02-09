/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: {
        message: messages.join(', '),
        code: 'VALIDATION_ERROR'
      }
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: {
        message: `${field} already exists`,
        code: 'DUPLICATE_ERROR'
      }
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      }
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      }
    });
  }
  
  // Default server error
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    }
  });
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res) {
  return res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND'
    }
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
