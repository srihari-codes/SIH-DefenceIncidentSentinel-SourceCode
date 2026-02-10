/**
 * Authentication API Module
 * Implements secure authentication with:
 * - Input validation and sanitization
 * - Rate limiting
 * - Session management
 * - Audit logging
 * - Password security validation
 */

import { axiosInstance } from './axios';
import { sessionManager } from '../utils/sessionManager';
import { validateEmail, validatePassword, sanitizeHtml } from '../utils/validation';
import { logAuthEvent, logLoginAttempt } from '../utils/auditLog';
import { RATE_LIMITING, SESSION_CONFIG } from '../utils/securityConfig';

// Track login attempts for rate limiting
const loginAttempts = new Map();

/**
 * Register new user with full validation
 * @param {object} userData - { email, password, name, rank, department }
 * @returns {Promise<object>} Registration response with tokens
 */
export const register = async (userData) => {
  try {
    // Validate inputs
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid user data');
    }

    const { email, password, name, rank, department } = userData;

    // Validate email
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isStrong) {
      throw new Error(`Password too weak: ${passwordValidation.feedback.join(', ')}`);
    }

    // Validate other fields
    if (!name || name.length < 3 || name.length > 100) {
      throw new Error('Name must be between 3 and 100 characters');
    }

    // Sanitize inputs to prevent XSS
    const sanitizedData = {
      email: email.toLowerCase().trim(),
      password, // Never sanitize passwords
      name: sanitizeHtml(name),
      rank: rank ? sanitizeHtml(rank) : '',
      department: department ? sanitizeHtml(department) : ''
    };

    logAuthEvent('REGISTRATION_ATTEMPT', true, { email: email.substring(0, 3) });

    const response = await axiosInstance.post('/api/register/', sanitizedData);

    if (!response.data || !response.data.token) {
      throw new Error('Invalid server response');
    }

    // Store tokens securely in sessionStorage
    sessionStorage.setItem('token', response.data.token);
    if (response.data.refreshToken) {
      sessionStorage.setItem('refreshToken', response.data.refreshToken);
    }
    if (response.data.user) {
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
    }

    logAuthEvent('REGISTRATION_SUCCESS', true, { email: email.substring(0, 3) });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
    logAuthEvent('REGISTRATION_FAILED', false, { 
      error: errorMessage.substring(0, 100) 
    });
    throw new Error(errorMessage);
  }
};

/**
 * Login user with rate limiting and brute force protection
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} Login response with tokens
 */
export const login = async (credentials) => {
  try {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('Invalid credentials');
    }

    const { email, password } = credentials;

    // Validate email format
    if (!validateEmail(email)) {
      logLoginAttempt(email, false, 'Invalid email format');
      throw new Error('Invalid email format');
    }

    // Implement rate limiting - prevent brute force attacks
    if (isRateLimited(email)) {
      const remainingTime = getRateLimitRemainingTime(email);
      logAuthEvent('LOGIN_RATE_LIMITED', false, {
        email: email.substring(0, 3),
        remainingSeconds: remainingTime
      });
      throw new Error(`Too many login attempts. Try again in ${Math.ceil(remainingTime / 60)} minutes.`);
    }

    // Increment attempt counter
    incrementLoginAttempt(email);

    // Password shouldn't be sanitized, but check it exists
    if (!password || typeof password !== 'string' || password.length === 0) {
      logLoginAttempt(email, false, 'Empty password');
      throw new Error('Password is required');
    }

    const response = await axiosInstance.post('/api/login/', {
      email: email.toLowerCase().trim(),
      password // Send raw password for server to validate
    });

    if (!response.data || !response.data.token) {
      throw new Error('Invalid server response');
    }

    // Clear rate limit on successful login
    clearRateLimit(email);

    // Store session securely
    const { token, refreshToken, user } = response.data;
    
    // Use session manager for secure storage
    sessionManager.createAccessToken(user.id, user);
    
    // Store in sessionStorage with secure flags
    sessionStorage.setItem('token', token);
    if (refreshToken) {
      sessionStorage.setItem('refreshToken', refreshToken);
    }
    sessionStorage.setItem('user', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      rank: user.rank,
      department: user.department
    }));

    logLoginAttempt(email, true);

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    logLoginAttempt(credentials.email, false, errorMessage.substring(0, 100));
    throw new Error(errorMessage);
  }
};

/**
 * Logout user and revoke tokens
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    const userId = sessionManager.getCurrentUserId();
    
    // Attempt to revoke token on backend
    try {
      await axiosInstance.post('/api/logout');
    } catch (error) {
      // Even if backend fails, logout locally
    }

    // Revoke token in session manager
    sessionManager.logout(userId, 'User initiated logout');

    // Clear all stored data
    sessionStorage.clear();
    localStorage.removeItem('preferences');

    logAuthEvent('LOGOUT', true, { userId });
  } catch (error) {
    logAuthEvent('LOGOUT_ERROR', false, { error: error.message });
    // Always clear session even on error
    sessionStorage.clear();
    throw error;
  }
};

/**
 * Refresh access token
 * @returns {Promise<object>} New token data
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = sessionStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axiosInstance.post('/api/refresh-token', {
      refreshToken
    });

    if (!response.data || !response.data.token) {
      throw new Error('Invalid token response');
    }

    // Update stored token
    sessionStorage.setItem('token', response.data.token);

    return response.data;
  } catch (error) {
    logAuthEvent('TOKEN_REFRESH_FAILED', false, { error: error.message });
    throw error;
  }
};

/**
 * Change password with validation
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Change password response
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isStrong) {
      throw new Error(`New password too weak: ${passwordValidation.feedback.join(', ')}`);
    }

    // Ensure passwords are different
    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }

    const response = await axiosInstance.post('/api/change-password', {
      currentPassword,
      newPassword
    });

    logAuthEvent('PASSWORD_CHANGED', true, { userId: sessionManager.getCurrentUserId() });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    logAuthEvent('PASSWORD_CHANGE_FAILED', false, { error: errorMessage.substring(0, 100) });
    throw new Error(errorMessage);
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<object>} Reset request response
 */
export const requestPasswordReset = async (email) => {
  try {
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Rate limit password reset attempts
    const resetRateLimit = 'password_reset_' + email;
    if (isRateLimited(resetRateLimit, RATE_LIMITING.PASSWORD_RESET_PER_HOUR, 3600)) {
      throw new Error('Too many password reset requests. Try again in 1 hour.');
    }

    incrementLoginAttempt(resetRateLimit);

    const response = await axiosInstance.post('/api/request-password-reset', {
      email: email.toLowerCase().trim()
    });

    logAuthEvent('PASSWORD_RESET_REQUESTED', true, { email: email.substring(0, 3) });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Reset response
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isStrong) {
      throw new Error(`Password too weak: ${passwordValidation.feedback.join(', ')}`);
    }

    const response = await axiosInstance.post('/api/reset-password', {
      token,
      newPassword
    });

    logAuthEvent('PASSWORD_RESET_COMPLETED', true);

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    logAuthEvent('PASSWORD_RESET_FAILED', false, { error: errorMessage.substring(0, 100) });
    throw new Error(errorMessage);
  }
};

/**
 * Verify MFA token
 * @param {string} token - MFA token
 * @returns {Promise<object>} Verification response
 */
export const verifyMFA = async (token) => {
  try {
    if (!token || !/^\d{6}$/.test(token)) {
      throw new Error('Invalid MFA token format');
    }

    const response = await axiosInstance.post('/api/verify-mfa', { token });

    logAuthEvent('MFA_VERIFIED', true);

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    logAuthEvent('MFA_VERIFICATION_FAILED', false, { error: errorMessage });
    throw new Error(errorMessage);
  }
};

/**
 * Check rate limiting
 */
function isRateLimited(identifier, limit = RATE_LIMITING.LOGIN_REQUESTS_PER_MINUTE, windowSeconds = 60) {
  const key = `ratelimit_${identifier}`;
  const now = Date.now();
  
  if (!loginAttempts.has(key)) {
    loginAttempts.set(key, []);
  }

  const attempts = loginAttempts.get(key);
  
  // Remove old attempts outside the window
  const validAttempts = attempts.filter(timestamp => now - timestamp < windowSeconds * 1000);
  loginAttempts.set(key, validAttempts);

  return validAttempts.length >= limit;
}

/**
 * Get remaining rate limit time in seconds
 */
function getRateLimitRemainingTime(identifier) {
  const key = `ratelimit_${identifier}`;
  const attempts = loginAttempts.get(key) || [];
  
  if (attempts.length === 0) return 0;

  const oldestAttempt = Math.min(...attempts);
  const elapsed = Date.now() - oldestAttempt;
  const remaining = Math.max(0, (RATE_LIMITING.LOGIN_REQUESTS_PER_MINUTE * 60 * 1000) - elapsed);

  return Math.ceil(remaining / 1000);
}

/**
 * Increment login attempt counter
 */
function incrementLoginAttempt(identifier) {
  const key = `ratelimit_${identifier}`;
  if (!loginAttempts.has(key)) {
    loginAttempts.set(key, []);
  }
  loginAttempts.get(key).push(Date.now());
}

/**
 * Clear rate limit for identifier
 */
function clearRateLimit(identifier) {
  const key = `ratelimit_${identifier}`;
  loginAttempts.delete(key);
}

export default {
  register,
  login,
  logout,
  refreshAccessToken,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyMFA
};