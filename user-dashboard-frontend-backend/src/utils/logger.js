/**
 * Secure Logger Module
 * Replaces console.log with secure, sanitized logging
 * Prevents sensitive data exposure and information disclosure
 * Never logs sensitive fields (passwords, tokens, etc.)
 */

import { isSensitiveField } from './securityConfig';
import { logError } from './auditLog';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3
};

let currentLogLevel = LOG_LEVELS.INFO;

/**
 * Sanitize object for logging
 * Removes sensitive data
 */
const sanitizeForLogging = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data.length > 200 ? data.substring(0, 200) + '...' : data;
  }

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeForLogging(item));
    }

    const sanitized = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (isSensitiveField(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitizeForLogging(data[key]);
        }
      }
    }
    return sanitized;
  }

  return data;
};

/**
 * Internal logging function
 */
const log = (level, levelName, message, data = null) => {
  if (level < currentLogLevel) {
    return; // Skip if below current log level
  }



  const timestamp = new Date().toISOString();
  const sanitized = data ? sanitizeForLogging(data) : null;

  const logMessage = sanitized 
    ? `[${timestamp}] ${levelName}: ${message} ${JSON.stringify(sanitized)}`
    : `[${timestamp}] ${levelName}: ${message}`;

  switch (level) {
    case LOG_LEVELS.DEBUG:
      if (typeof console !== 'undefined' && console.debug) {
        console.debug(logMessage);
      }
      break;
    case LOG_LEVELS.INFO:
      if (typeof console !== 'undefined' && console.info) {
        console.info(logMessage);
      }
      break;
    case LOG_LEVELS.WARNING:
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(logMessage);
      }
      break;
    case LOG_LEVELS.ERROR:
      if (typeof console !== 'undefined' && console.error) {
        console.error(logMessage);
      }
      // Also log to audit trail
      logError('LOGGED_ERROR', message, null, sanitized);
      break;
  }
};

/**
 * Debug logging (filtered out in production)
 */
export const debug = (message, data = null) => {
  log(LOG_LEVELS.DEBUG, 'DEBUG', message, data);
};

/**
 * Info logging
 */
export const info = (message, data = null) => {
  log(LOG_LEVELS.INFO, 'INFO', message, data);
};

/**
 * Warning logging
 */
export const warn = (message, data = null) => {
  log(LOG_LEVELS.WARNING, 'WARNING', message, data);
};

/**
 * Error logging (always logged)
 */
export const error = (message, errorObj = null) => {
  const errorMessage = errorObj?.message || String(errorObj) || '';
  const stack = errorObj?.stack || '';
  log(LOG_LEVELS.ERROR, 'ERROR', message, { error: errorMessage });
  
  // Always send to audit trail
  logError('LOGGED_ERROR', message, stack);
};

/**
 * Set log level (DEBUG, INFO, WARNING, ERROR)
 */
export const setLogLevel = (level) => {
  if (typeof level === 'string') {
    currentLogLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
  } else if (typeof level === 'number') {
    currentLogLevel = level;
  }
};

/**
 * Get current log level
 */
export const getLogLevel = () => {
  return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === currentLogLevel);
};

/**
 * Trace function execution (for debugging)
 */
export const trace = (functionName, startTime = null) => {
  const elapsed = startTime ? Date.now() - startTime : 0;
  debug(`Function: ${functionName}`, { elapsedMs: elapsed });
};

/**
 * Assert condition and log if false
 */
export const assert = (condition, message, data = null) => {
  if (!condition) {
    error(message, data);
  }
};

/**
 * Create group for related logs (in browser console)
 */
export const group = (label) => {
  if (typeof console !== 'undefined' && console.group) {
    console.group(label);
  }
};

/**
 * End log group
 */
export const groupEnd = () => {
  if (typeof console !== 'undefined' && console.groupEnd) {
    console.groupEnd();
  }
};

/**
 * Format large objects for logging
 */
export const formatForLogging = (obj, depth = 2) => {
  return JSON.stringify(sanitizeForLogging(obj), null, depth > 0 ? 2 : 0);
};

export default {
  debug,
  info,
  warn,
  error,
  trace,
  assert,
  group,
  groupEnd,
  setLogLevel,
  getLogLevel,
  formatForLogging
};
