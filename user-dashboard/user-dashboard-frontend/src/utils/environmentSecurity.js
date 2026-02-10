/**
 * Environment & Initialization Security Module
 * Ensures secure application startup and runtime configuration
 */

import { warn, error as logError } from './logger';

/**
 * Validate environment variables
 */
export const validateEnvironment = () => {
  const errors = [];
  const warnings = [];

  // Check for required environment variables
  const api = import.meta.env.VITE_API_URL;

  if (!api) {
    errors.push('VITE_API_URL is required');
  }

  if (errors.length > 0) {
    logError('Environment Validation Failed', {
      errors: errors.join(', ')
    });
    return { valid: false, errors, warnings };
  }

  return { valid: true, errors, warnings };
};

/**
 * Initialize security headers for the application
 */
export const initializeSecurityHeaders = () => {
  // Add meta tags for security
  const metaTags = [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { httpEquiv: 'Content-Security-Policy', content: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" },
    { httpEquiv: 'X-UA-Compatible', content: 'IE=edge' },
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { name: 'format-detection', content: 'telephone=no' }
  ];

  metaTags.forEach(tag => {
    const meta = document.createElement('meta');
    Object.keys(tag).forEach(key => {
      meta.setAttribute(key, tag[key]);
    });
    document.head.appendChild(meta);
  });
};

/**
 * Prevent clickjacking
 */
export const preventClickjacking = () => {
  if (window.self !== window.top) {
    window.top.location = window.self.location;
  }
};

/**
 * Disable autocomplete on sensitive fields
 */
export const disableSensitiveAutocomplete = () => {
  const sensitiveInputs = document.querySelectorAll(
    'input[type="password"], input[name*="password"], input[name*="token"], input[name*="secret"]'
  );

  sensitiveInputs.forEach(input => {
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
  });
};

/**
 * Enable strict CSP headers via meta tag
 */
export const enableStrictCSP = () => {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  // Determine allowed connection sources (support local development APIs)
  const connectSources = new Set(["'self'", 'https:']);

  try {
    const apiUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL)
      : null;

    if (apiUrl) {
      connectSources.add(apiUrl.origin);
    }
  } catch (err) {
    warn('Unable to parse VITE_API_URL for CSP', { message: err?.message });
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    connectSources.add('http://localhost:3000');
    connectSources.add('http://127.0.0.1:3000');
  }

  // Note: frame-ancestors can only be set via HTTP headers, not meta tags
  meta.content = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    `connect-src ${Array.from(connectSources).join(' ')}`,
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');

  document.head.appendChild(meta);
};

/**
 * Initialize secure session storage
 */
export const initializeSecureStorage = () => {
  // Clear any old storage data on startup
  const keysToPreserve = ['preferences', 'theme'];
  const sessionData = {};

  keysToPreserve.forEach(key => {
    const value = sessionStorage.getItem(key);
    if (value) sessionData[key] = value;
  });

  sessionStorage.clear();
  localStorage.clear();

  keysToPreserve.forEach(key => {
    if (sessionData[key]) {
      sessionStorage.setItem(key, sessionData[key]);
    }
  });
};

/**
 * Disable dangerous browser features
 */
export const disableDangerousFeatures = () => {
  // Disable inline event handlers
  document.addEventListener('click', (e) => {
    if (e.target.getAttribute && e.target.getAttribute('onclick')) {
      e.preventDefault();
      warn('Inline onclick handlers are disabled for security');
    }
  });

  // Prevent unintended form submissions
  document.addEventListener('submit', (e) => {
    if (!e.target.method) {
      e.target.method = 'POST';
    }
    if (!e.target.action) {
      e.preventDefault();
      warn('Form submission blocked: no action specified');
    }
  });
};

/**
 * Monitor for XSS attempts
 */
export const monitorXSSAttempts = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for suspicious attributes
            const suspiciousAttrs = ['onclick', 'onerror', 'onload', 'onmouseover'];
            suspiciousAttrs.forEach(attr => {
              if (node.hasAttribute && node.hasAttribute(attr)) {
                warn(`Suspicious attribute detected: ${attr}`);
                node.removeAttribute(attr);
              }
            });

            // Check for script tags
            if (node.tagName === 'SCRIPT' && !node.src) {
              warn('Inline script detected and removed');
              node.parentNode.removeChild(node);
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['onclick', 'onerror', 'onload', 'onmouseover']
  });
};

/**
 * Initialize all security features
 */
export const initializeSecurityFeatures = () => {
  try {
    // Validate environment first
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      logError('Security initialization failed', envValidation.errors);
      return false;
    }

    // Apply security measures
    initializeSecurityHeaders();
    initializeSecureStorage();
    enableStrictCSP();
    preventClickjacking();
    disableDangerousFeatures();
    disableSensitiveAutocomplete();
    monitorXSSAttempts();

    return true;
  } catch (err) {
    logError('Security initialization error', err);
    return false;
  }
};

/**
 * Check browser security capabilities
 */
export const checkBrowserCapabilities = () => {
  const capabilities = {
    crypto: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    localStorage: typeof localStorage !== 'undefined',
    https: window.location.protocol === 'https:',
    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null
  };

  if (!capabilities.crypto) {
    warn('Web Crypto API not available - encryption features limited');
  }

  return capabilities;
};

export default {
  validateEnvironment,
  initializeSecurityHeaders,
  preventClickjacking,
  disableSensitiveAutocomplete,
  enableStrictCSP,
  initializeSecureStorage,
  disableDangerousFeatures,
  monitorXSSAttempts,
  initializeSecurityFeatures,
  checkBrowserCapabilities
};
