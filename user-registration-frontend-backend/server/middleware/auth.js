import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verify JWT token and attach user to request
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database (optional but recommended for real-time data)
    const user = await User.findById(decoded.userId).select('-passwordHash -totpSecret');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.',
      });
    }

    if (!user.isActivated) {
      return res.status(403).json({
        success: false,
        message: 'Account not activated. Contact administrator.',
      });
    }

    // Attach user to request object
    req.user = {
      userId: user._id,
      email: user.officialEmail,
      role: user.role,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

/**
 * Check if user has required role(s)
 * Usage: requireRole('admin'), requireRole('admin', 'officer')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.',
    });
  }
  next();
};

/**
 * Optional auth - attach user if token exists, but don't block request
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash -totpSecret');
    
    if (user && user.isActivated) {
      req.user = {
        userId: user._id,
        email: user.officialEmail,
        role: user.role,
        fullName: user.fullName,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};
