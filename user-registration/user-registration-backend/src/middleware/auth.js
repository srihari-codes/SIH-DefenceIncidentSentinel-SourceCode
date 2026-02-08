const { getAccessToken, getRefreshToken } = require('../utils/cookies');
const { User, RefreshToken } = require('../models');

/**
 * Authentication middleware - requires valid access token
 */
async function requireAuth(req, res, next) {
  try {
    const tokenPayload = getAccessToken(req);
    
    if (!tokenPayload) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        }
      });
    }
    
    // Verify user exists and is active
    const user = await User.findOne({ user_id: tokenPayload.uid });
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired session',
          code: 'INVALID_SESSION'
        }
      });
    }
    
    // Attach user to request
    req.user = {
      user_id: user.user_id,
      role: user.role,
      email: user.email,
      full_name: user.full_name
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
}

/**
 * Role-based authorization middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        }
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN'
        }
      });
    }
    
    next();
  };
}

/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const tokenPayload = getAccessToken(req);
    
    if (tokenPayload) {
      const user = await User.findOne({ user_id: tokenPayload.uid });
      
      if (user && user.is_active) {
        req.user = {
          user_id: user.user_id,
          role: user.role,
          email: user.email,
          full_name: user.full_name
        };
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
}

module.exports = {
  requireAuth,
  requireRole,
  optionalAuth
};
