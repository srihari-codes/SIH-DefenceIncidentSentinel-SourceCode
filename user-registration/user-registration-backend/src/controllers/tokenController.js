const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const { User, RefreshToken, AuthCode } = require('../models');
const { setAccessToken, setRefreshToken } = require('../utils/cookies');

/**
 * Exchange authorization code for JWT tokens
 * POST /api/auth/exchange
 */
async function exchangeCode(req, res) {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        error: {
          message: 'Authorization code is required',
          code: 'MISSING_CODE'
        }
      });
    }
    
    // Validate and consume the code
    const authData = await AuthCode.validateAndConsume(code);
    
    if (!authData) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired authorization code',
          code: 'INVALID_AUTH_CODE'
        }
      });
    }
    
    // Verify user exists and is active
    const user = await User.findOne({ user_id: authData.user_id });
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        error: {
          message: 'User account is not active',
          code: 'ACCOUNT_INACTIVE'
        }
      });
    }
    
    // Generate JWT tokens (not in cookies for cross-domain)
    const jwt = require('jsonwebtoken');
    const config = require('../config/env');
    
    // Generate access token (15 minutes)
    const accessToken = jwt.sign(
      { uid: user.user_id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.tokens.accessExpiry }
    );
    
    // Generate refresh token (7 days)
    const refreshTokenId = uuidv4();
    const refreshToken = jwt.sign(
      { uid: user.user_id, role: user.role, tokenId: refreshTokenId, type: 'refresh' },
      config.jwtRefreshSecret,
      { expiresIn: config.tokens.refreshExpiry }
    );
    
    // Store refresh token hash in database
    const tokenHash = await bcrypt.hash(refreshTokenId, 10);
    await RefreshToken.create({
      token_id: refreshTokenId,
      user_id: user.user_id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    return res.status(200).json({
      message: 'Authorization successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
      token_type: 'Bearer',
      user: {
        user_id: user.user_id,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        identifier: user.identifier,
        mfa_method: user.mfa_method
      }
    });
    
  } catch (error) {
    console.error('Code exchange error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
}

/**
 * Validate authorization code (Internal service call)
 * Returns user data without generating session tokens
 */
async function validateCode(req, res) {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        error: { message: 'Code is required' }
      });
    }
    
    const authData = await AuthCode.validateAndConsume(code);
    
    if (!authData) {
      return res.status(401).json({
        error: { message: 'Invalid or expired code' }
      });
    }
    
    const user = await User.findOne({ user_id: authData.user_id });
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        error: { message: 'User not found or inactive' }
      });
    }
    
    return res.status(200).json({
      user_id: user.user_id,
      role: user.role,
      email: user.email,
      full_name: user.full_name
    });
    
  } catch (error) {
    console.error('Code validation error:', error);
    return res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
}

module.exports = {
  exchangeCode,
  validateCode
};
