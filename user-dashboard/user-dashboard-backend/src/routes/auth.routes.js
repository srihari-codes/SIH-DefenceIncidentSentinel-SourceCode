const express = require('express');
const jwt = require('jsonwebtoken');
const { COOKIE_OPTIONS, ERROR_CODES } = require('../constants');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// ──────────────────────────────────────────────
// POST /api/auth/exchange
// Exchange authorization code for session cookie
// ──────────────────────────────────────────────
router.post('/exchange', async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(ERROR_CODES.VALIDATION_ERROR.status).json({
        success: false,
        message: 'Authorization code is required',
        error_code: ERROR_CODES.VALIDATION_ERROR.code
      });
    }

    // Validate code with Auth Service
    const authServiceUrl = process.env.AUTH_SERVICE_URL;
    
    if (!authServiceUrl) {
        throw new Error('AUTH_SERVICE_URL is not defined');
    }

    const response = await fetch(`${authServiceUrl}/api/auth/validate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Auth Exchange Error] Validate code failed. Status: ${response.status}, Response: ${errorText}`);
      return res.status(ERROR_CODES.UNAUTHORIZED.status).json({
        success: false,
        message: 'Invalid or expired authorization code',
        error_code: ERROR_CODES.UNAUTHORIZED.code
      });
    }

    const userData = await response.json();

    // Generate JWT access token
    const accessToken = jwt.sign(
      { uid: userData.user_id, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HttpOnly cookie
    res.cookie('access_token', accessToken, COOKIE_OPTIONS);

    // Audit log
    await logAudit(userData.user_id, 'auth.exchange', 'user', userData.user_id);

    res.json({ success: true });
  } catch (err) {
    console.error('[Auth Exchange Error] Exception:', err);
    next(err);
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/logout
// Clear session cookies
// ──────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
