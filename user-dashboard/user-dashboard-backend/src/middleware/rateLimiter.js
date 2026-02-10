const rateLimit = require('express-rate-limit');
const { RATE_LIMITS, ERROR_CODES } = require('../constants');

/**
 * Rate limiter for complaint submission: 10 requests per hour per user.
 */
const complaintLimiter = rateLimit({
  windowMs: RATE_LIMITS.COMPLAINT_SUBMIT.windowMs,
  max: RATE_LIMITS.COMPLAINT_SUBMIT.max,
  keyGenerator: (req) => req.user?.uid || req.ip,
  handler: (_req, res) => {
    res.status(ERROR_CODES.RATE_LIMIT_EXCEEDED.status).json({
      success: false,
      message: 'Too many complaints submitted. Please try again later.',
      error_code: ERROR_CODES.RATE_LIMIT_EXCEEDED.code
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for chatbot: 50 requests per hour per user.
 */
const chatLimiter = rateLimit({
  windowMs: RATE_LIMITS.CHAT.windowMs,
  max: RATE_LIMITS.CHAT.max,
  keyGenerator: (req) => req.user?.uid || req.ip,
  handler: (_req, res) => {
    res.status(ERROR_CODES.RATE_LIMIT_EXCEEDED.status).json({
      success: false,
      message: 'Chat rate limit exceeded. Please try again later.',
      error_code: ERROR_CODES.RATE_LIMIT_EXCEEDED.code
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { complaintLimiter, chatLimiter };
