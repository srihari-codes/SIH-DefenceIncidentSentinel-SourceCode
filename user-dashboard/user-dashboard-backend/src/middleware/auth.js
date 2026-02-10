const jwt = require('jsonwebtoken');
const { ERROR_CODES } = require('../constants');

/**
 * Middleware: Extract and verify JWT from HttpOnly cookie.
 * Sets req.user = { uid, role, iat, exp }
 */
const requireAuth = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(ERROR_CODES.UNAUTHORIZED.status).json({
      success: false,
      message: 'Authentication required',
      error_code: ERROR_CODES.UNAUTHORIZED.code
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(ERROR_CODES.UNAUTHORIZED.status).json({
      success: false,
      message: 'Invalid or expired token',
      error_code: ERROR_CODES.UNAUTHORIZED.code
    });
  }
};

module.exports = { requireAuth };
