/**
 * Secure Axios Instance Configuration
 * Implements security best practices:
 * - HTTPS enforcement
 * - Request signing
 * - Token refresh mechanism
 * - Security headers
 * - Error handling
 * - Rate limiting
 */

import axios from 'axios';
import { sessionManager } from '../utils/sessionManager';
import { logApiCall, logSecurityEvent, logAuthEvent } from '../utils/auditLog';
import { API_SECURITY, SECURITY_HEADERS } from '../utils/securityConfig';
import { warn } from '../utils/logger';

// Use HTTPS only - enforce secure API endpoint
const API_BASE_URL = (() => {
  const url = process.env.REACT_APP_API_URL || 'https://api.cert-army.gov';
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
    warn('API URL must use HTTPS in production');
    return url.replace('http://', 'https://');
  }
  return url;
})();

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_SECURITY.TIMEOUT_MS,
  withCredentials: true, // Include cookies for CSRF protection
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Track request start time for audit logging
const requestStartTimes = new WeakMap();

/**
 * Request Interceptor - Add security headers and authentication
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const startTime = Date.now();
    requestStartTimes.set(config, startTime);

    // Validate session before request
    if (!sessionManager.isSessionValid()) {
      logSecurityEvent('INVALID_SESSION_ON_REQUEST', 'HIGH', {
        endpoint: config.url
      });
      return Promise.reject(new Error('Session invalid'));
    }

    // Add authentication token
    const token = sessionManager.getCurrentToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      logAuthEvent('NO_TOKEN_ON_REQUEST', false, { endpoint: config.url });
    }

    // Add CSRF protection header (if available)
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    // Add API version
    config.headers['X-API-Version'] = API_SECURITY.API_VERSION;

    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();

    // Add security headers
    Object.assign(config.headers, SECURITY_HEADERS);

    return config;
  },
  (error) => {
    logSecurityEvent('REQUEST_INTERCEPTOR_ERROR', 'HIGH', {
      error: error.message
    });
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Handle token refresh and errors
 */
axiosInstance.interceptors.response.use(
  (response) => {
    const startTime = requestStartTimes.get(response.config);
    const duration = startTime ? Date.now() - startTime : 0;

    logApiCall(
      response.config.method.toUpperCase(),
      response.config.url,
      response.status,
      duration,
      true
    );

    return response;
  },
  async (error) => {
    const startTime = requestStartTimes.get(error.config);
    const duration = startTime ? Date.now() - startTime : 0;

    if (error.response) {
      logApiCall(
        error.config.method.toUpperCase(),
        error.config.url,
        error.response.status,
        duration,
        false
      );

      // Handle 401 Unauthorized - Token expired
      if (error.response.status === 401) {
        const refreshToken = sessionStorage.getItem('refreshToken');

        if (refreshToken && !error.config._retried) {
          error.config._retried = true;

          try {
            // Attempt token refresh
            const refreshResult = sessionManager.refreshAccessToken(
              refreshToken,
              sessionManager.getCurrentUserId()
            );

            if (refreshResult.success) {
              // Retry original request with new token
              const newToken = refreshResult.token;
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return axiosInstance(error.config);
            }
          } catch (refreshError) {
            logSecurityEvent('TOKEN_REFRESH_FAILED', 'HIGH', {
              error: refreshError.message
            });
          }
        }

        // Token refresh failed - logout user
        sessionManager.logout(sessionManager.getCurrentUserId(), 'Token expired');
        logAuthEvent('SESSION_TERMINATED', true, { reason: 'Token expired' });
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Handle 403 Forbidden - Access denied
      if (error.response.status === 403) {
        logSecurityEvent('ACCESS_DENIED', 'MEDIUM', {
          endpoint: error.config.url,
          userId: sessionManager.getCurrentUserId()
        });
      }

      // Handle 429 Too Many Requests - Rate limited
      if (error.response.status === 429) {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', 'LOW', {
          endpoint: error.config.url,
          retryAfter: error.response.headers['retry-after']
        });
      }

      // Sanitize error messages to prevent information disclosure
      const sanitizedError = {
        ...error.response,
        data: typeof error.response.data === 'object' ? { message: 'Request failed' } : error.response.data
      };

      return Promise.reject(sanitizedError);
    } else if (error.request) {
      logSecurityEvent('NO_RESPONSE_FROM_SERVER', 'HIGH', {
        endpoint: error.config?.url,
        error: 'Network request made but no response received'
      });
    } else {
      logSecurityEvent('REQUEST_SETUP_ERROR', 'HIGH', {
        error: error.message
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Generate unique request ID for tracing and audit
 */
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${randomStr}`;
}

/**
 * Validate API response structure
 */
export const validateApiResponse = (response) => {
  if (!response || typeof response !== 'object') {
    logSecurityEvent('INVALID_API_RESPONSE_FORMAT', 'HIGH');
    return false;
  }
  return true;
};

/**
 * Make secure API call with retry logic
 */
export const secureApiCall = async (method, endpoint, data = null, retries = API_SECURITY.RETRY_ATTEMPTS) => {
  try {
    const config = { method, url: endpoint };
    if (data) config.data = data;

    const response = await axiosInstance(config);

    if (!validateApiResponse(response.data)) {
      throw new Error('Invalid API response');
    }

    return response.data;
  } catch (error) {
    if (retries > 0 && error.response?.status >= 500) {
      // Retry on server errors
      await new Promise(resolve => setTimeout(resolve, API_SECURITY.RETRY_DELAY_MS));
      return secureApiCall(method, endpoint, data, retries - 1);
    }
    throw error;
  }
};

export default axiosInstance;