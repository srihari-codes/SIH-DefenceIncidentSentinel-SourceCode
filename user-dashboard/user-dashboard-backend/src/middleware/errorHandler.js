const { ERROR_CODES } = require('../constants');

/**
 * Global error handler middleware.
 * All errors flow through here for consistent JSON responses.
 */
const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const status = err.status || ERROR_CODES.SERVER_ERROR.status;
  const errorCode = err.errorCode || ERROR_CODES.SERVER_ERROR.code;

  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    error_code: errorCode
  });
};

/**
 * Helper to create an error with status + error_code.
 */
const createError = (message, status, errorCode) => {
  const err = new Error(message);
  err.status = status;
  err.errorCode = errorCode;
  return err;
};

module.exports = { errorHandler, createError };
