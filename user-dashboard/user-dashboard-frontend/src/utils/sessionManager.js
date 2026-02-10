/**
 * Session Management & Security
 * Implements secure session handling with token validation,
 * timeout management, and session hijacking prevention
 */

import { logAuthEvent, logSecurityEvent } from './auditLog';
import { SESSION_CONFIG } from './securityConfig';

class SessionManager {
  constructor() {
    this.tokens = new Map(); // In-memory token store
    this.sessions = new Map(); // Active sessions
    this.initializeSessionId();
    this.startInactivityTimer();
  }

  /**
   * Initialize or retrieve session ID
   */
  initializeSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    
    this.currentSessionId = sessionId;
    return sessionId;
  }

  /**
   * Generate cryptographically secure session ID
   */
  generateSessionId() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate secure token
   */
  generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create access token
   */
  createAccessToken(userId, userData = {}) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.TOKEN_EXPIRATION_MINUTES * 60 * 1000);
    
    const tokenData = {
      token,
      userId,
      userData,
      createdAt: new Date(),
      expiresAt,
      lastActivity: new Date(),
      sessionId: this.currentSessionId,
      ipAddress: this.getClientInfo().ipAddress,
      userAgent: this.getClientInfo().userAgent,
      isValid: true
    };
    
    this.tokens.set(token, tokenData);
    this.storeSecurely('token', token);
    
    logAuthEvent('TOKEN_CREATED', true, { userId });
    
    return { token, expiresAt };
  }

  /**
   * Create refresh token
   */
  createRefreshToken(userId) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
    
    const tokenData = {
      token,
      userId,
      type: 'refresh',
      createdAt: new Date(),
      expiresAt,
      sessionId: this.currentSessionId,
      isValid: true
    };
    
    this.tokens.set(token, tokenData);
    this.storeSecurely('refreshToken', token);
    
    return { token, expiresAt };
  }

  /**
   * Validate token
   */
  validateToken(token) {
    if (!token) {
      logSecurityEvent('INVALID_TOKEN_ATTEMPT', 'MEDIUM', { reason: 'No token provided' });
      return { valid: false, error: 'No token provided' };
    }

    const tokenData = this.tokens.get(token);

    if (!tokenData) {
      logSecurityEvent('TOKEN_NOT_FOUND', 'MEDIUM', { reason: 'Token not in store' });
      return { valid: false, error: 'Invalid token' };
    }

    if (!tokenData.isValid) {
      logSecurityEvent('INVALID_TOKEN_ATTEMPT', 'MEDIUM', { reason: 'Token marked invalid' });
      return { valid: false, error: 'Token has been revoked' };
    }

    if (new Date() > tokenData.expiresAt) {
      tokenData.isValid = false;
      logSecurityEvent('TOKEN_EXPIRED', 'LOW', { userId: tokenData.userId });
      return { valid: false, error: 'Token expired' };
    }

    // Verify session consistency
    const currentSessionId = sessionStorage.getItem('sessionId');
    if (tokenData.sessionId !== currentSessionId) {
      logSecurityEvent('SESSION_MISMATCH', 'HIGH', { 
        expectedSession: tokenData.sessionId,
        currentSession: currentSessionId 
      });
      return { valid: false, error: 'Session mismatch' };
    }

    // Update last activity
    tokenData.lastActivity = new Date();

    return {
      valid: true,
      userId: tokenData.userId,
      userData: tokenData.userData,
      expiresAt: tokenData.expiresAt
    };
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken, userId) {
    const tokenData = this.tokens.get(refreshToken);

    if (!tokenData || !tokenData.isValid || tokenData.type !== 'refresh') {
      logSecurityEvent('INVALID_REFRESH_TOKEN', 'HIGH', { userId });
      return { success: false, error: 'Invalid refresh token' };
    }

    if (new Date() > tokenData.expiresAt) {
      tokenData.isValid = false;
      logAuthEvent('REFRESH_TOKEN_EXPIRED', false, { userId });
      return { success: false, error: 'Refresh token expired' };
    }

    // Create new access token
    const newTokens = this.createAccessToken(userId, tokenData.userData);
    logAuthEvent('TOKEN_REFRESHED', true, { userId });

    return { success: true, ...newTokens };
  }

  /**
   * Revoke token
   */
  revokeToken(token, reason = 'User initiated') {
    const tokenData = this.tokens.get(token);
    
    if (tokenData) {
      tokenData.isValid = false;
      logAuthEvent('TOKEN_REVOKED', true, { 
        userId: tokenData.userId, 
        reason 
      });
    }
  }

  /**
   * Logout - revoke all tokens for user
   */
  logout(userId, reason = 'User initiated') {
    let revokedCount = 0;
    
    for (const [token, data] of this.tokens) {
      if (data.userId === userId) {
        this.revokeToken(token, reason);
        revokedCount++;
      }
    }

    this.clearSessionStorage();
    logAuthEvent('LOGOUT', true, { userId, tokensRevoked: revokedCount });
  }

  /**
   * Start inactivity timeout
   */
  startInactivityTimer() {
    const timeout = SESSION_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000;
    
    const resetTimer = () => {
      clearTimeout(this.inactivityTimer);
      
      this.inactivityTimer = setTimeout(() => {
        const userId = this.getCurrentUserId();
        this.logout(userId, 'Session timeout due to inactivity');
        window.location.href = '/login';
      }, timeout);
    };

    // Reset on user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();
  }

  /**
   * Store token securely
   */
  storeSecurely(key, value) {
    try {
      // Use sessionStorage (cleared on browser close) instead of localStorage
      sessionStorage.setItem(key, value);
    } catch (error) {
      logSecurityEvent('STORAGE_ERROR', 'HIGH', { 
        reason: error.message,
        key 
      });
    }
  }

  /**
   * Clear session storage
   */
  clearSessionStorage() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token'); // Clear old localStorage tokens too
    localStorage.removeItem('user');
  }

  /**
   * Get current token
   */
  getCurrentToken() {
    return sessionStorage.getItem('token');
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      return user.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Get client information for validation
   */
  getClientInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      ipAddress: 'CLIENT_SIDE' // Must come from backend
    };
  }

  /**
   * Check if session is valid
   */
  isSessionValid() {
    const token = this.getCurrentToken();
    if (!token) return false;
    
    const validation = this.validateToken(token);
    return validation.valid;
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    const token = this.getCurrentToken();
    if (!token) return null;

    const tokenData = this.tokens.get(token);
    if (!tokenData) return null;

    return {
      sessionId: this.currentSessionId,
      userId: tokenData.userId,
      createdAt: tokenData.createdAt,
      expiresAt: tokenData.expiresAt,
      lastActivity: tokenData.lastActivity,
      remainingMinutes: Math.floor((tokenData.expiresAt - new Date()) / 60000)
    };
  }

  /**
   * Detect potential session hijacking
   */
  validateSessionConsistency() {
    const token = this.getCurrentToken();
    if (!token) return false;

    const tokenData = this.tokens.get(token);
    if (!tokenData) return false;

    const currentInfo = this.getClientInfo();
    
    // Check if user agent changed significantly
    if (tokenData.userAgent !== currentInfo.userAgent) {
      logSecurityEvent('USER_AGENT_CHANGED', 'MEDIUM', {
        userId: tokenData.userId,
        oldAgent: tokenData.userAgent.substring(0, 50),
        newAgent: currentInfo.userAgent.substring(0, 50)
      });
      return false;
    }

    return true;
  }

  /**
   * Get token expiration time in seconds
   */
  getTokenExpirationTime() {
    const token = this.getCurrentToken();
    if (!token) return 0;

    const tokenData = this.tokens.get(token);
    if (!tokenData) return 0;

    const now = new Date();
    const remaining = (tokenData.expiresAt - now) / 1000;
    return Math.max(0, remaining);
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

// Export for testing
export default sessionManager;
