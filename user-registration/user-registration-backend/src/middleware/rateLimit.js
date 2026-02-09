const rateLimit = require('express-rate-limit');

// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: {
    error: {
      message: 'Too many login attempts. Please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Rate limiter for OTP requests
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 OTP request per minute
  message: {
    error: {
      message: 'Please wait before requesting another OTP.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for registration
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registration attempts per hour
  message: {
    error: {
      message: 'Too many registration attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  loginLimiter,
  otpLimiter,
  registrationLimiter
};
