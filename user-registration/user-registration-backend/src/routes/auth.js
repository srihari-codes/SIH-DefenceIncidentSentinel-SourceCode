const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const loginController = require('../controllers/loginController');
const registerController = require('../controllers/registerController');
const tokenController = require('../controllers/tokenController');
const { loginLimiter, registrationLimiter, otpLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');
const { 
  clearAuthCookies, 
  getRefreshToken, 
  setAccessToken 
} = require('../utils/cookies');
const { User, RefreshToken } = require('../models');

// =====================
// LOGIN ROUTES
// =====================

// Step 1: Identity verification
router.post('/login/identity', loginLimiter, loginController.identityStep);

// Step 2: Password verification
router.post('/login/password', loginLimiter, loginController.passwordStep);

// Step 3: MFA verification (returns auth code)
router.post('/login/mfa', loginController.mfaStep);

// =====================
// REGISTRATION ROUTES
// =====================

// Step 1: Identity (email verification)
router.post('/register/identity', registrationLimiter, registerController.identityStep);

// Step 2: Service details
router.post('/register/service', registerController.serviceStep);

// Step 3: Security setup
router.post('/register/security', registerController.securityStep);

// Step 4: Activation (returns auth code)
router.post('/register/activate', registerController.activateStep);

// =====================
// TOKEN MANAGEMENT
// =====================

// Exchange authorization code for JWT tokens
router.post('/exchange', tokenController.exchangeCode);

// Validate authorization code (Internal service call)
router.post('/validate-code', tokenController.validateCode);

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const tokenPayload = getRefreshToken(req);
    
    if (!tokenPayload || !tokenPayload.tokenId) {
      return res.status(401).json({
        error: {
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        }
      });
    }
    
    // Find the refresh token in database
    const storedToken = await RefreshToken.findValidToken(tokenPayload.tokenId);
    
    if (!storedToken || storedToken.user_id !== tokenPayload.uid) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        }
      });
    }
    
    // Verify user still exists and is active
    const user = await User.findOne({ user_id: tokenPayload.uid });
    
    if (!user || !user.is_active) {
      await storedToken.updateOne({ revoked: true });
      return res.status(401).json({
        error: {
          message: 'User account is not active',
          code: 'ACCOUNT_INACTIVE'
        }
      });
    }
    
    // Issue new access token
    setAccessToken(res, {
      uid: user.user_id,
      role: user.role
    });
    
    return res.status(200).json({
      message: 'Token refreshed successfully'
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Revoke all refresh tokens for this user
    await RefreshToken.revokeAllForUser(req.user.user_id);
    
    // Clear all auth cookies
    clearAuthCookies(res);
    
    return res.status(200).json({
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// Get current user (protected route example)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id });
    
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }
    
    return res.status(200).json({
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        identifier: user.identifier,
        mfa_method: user.mfa_method,
        is_verified: user.is_verified,
        last_login: user.last_login,
        created_at: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

module.exports = router;
