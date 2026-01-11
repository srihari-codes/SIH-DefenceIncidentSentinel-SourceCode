/**
 * Audit Logging Utilities
 * Implements comprehensive audit trail for compliance and security
 * Logs all sensitive operations with timestamps, user info, and details
 */

import { isSensitiveField } from './securityConfig';

// Store logs (in production, send to secure backend)
let auditLogs = [];

// Configuration
const MAX_LOGS_IN_MEMORY = 1000;
const LOG_LEVELS = {
  CRITICAL: 'CRITICAL',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Sanitize sensitive data in log entries
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 */
const sanitizeDataForLogging = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  const sanitizeRecursive = (obj) => {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (isSensitiveField(key)) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeRecursive(obj[key]);
        }
      }
    }
  };

  sanitizeRecursive(sanitized);
  return sanitized;
};

/**
 * Create an audit log entry
 * @param {string} eventType - Type of event
 * @param {string} level - Log level
 * @param {object} details - Event details
 * @returns {object} Log entry
 */
const createLogEntry = (eventType, level, details) => {
  return {
    timestamp: new Date().toISOString(),
    eventType,
    level,
    userId: getUserId(),
    sessionId: getSessionId(),
    ipAddress: getIpAddress(),
    userAgent: navigator.userAgent,
    details: sanitizeDataForLogging(details),
    severity: getLevelSeverity(level)
  };
};

/**
 * Get current user ID from session
 */
const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
};

/**
 * Get session ID from session storage
 */
const getSessionId = () => {
  return sessionStorage.getItem('sessionId') || 'UNKNOWN';
};

/**
 * Get client IP address (frontend limitation - ask backend)
 */
const getIpAddress = () => {
  return 'CLIENT_SIDE'; // Backend should provide real IP
};

/**
 * Get severity number for sorting
 */
const getLevelSeverity = (level) => {
  const severity = {
    CRITICAL: 5,
    ERROR: 4,
    WARNING: 3,
    INFO: 2,
    DEBUG: 1
  };
  return severity[level] || 0;
};

/**
 * Log authentication event
 */
export const logAuthEvent = (eventName, success, details = {}) => {
  const entry = createLogEntry(
    `AUTH_${eventName.toUpperCase()}`,
    success ? LOG_LEVELS.INFO : LOG_LEVELS.WARNING,
    {
      success,
      ...details
    }
  );
  addLog(entry);
};

/**
 * Log login attempt
 */
export const logLoginAttempt = (email, success, reason = '') => {
  logAuthEvent('LOGIN', success, {
    email: sanitizeEmail(email),
    reason: reason || (success ? 'Success' : 'Failed')
  });
};

/**
 * Log logout event
 */
export const logLogout = (reason = 'User initiated') => {
  logAuthEvent('LOGOUT', true, { reason });
};

/**
 * Log password change
 */
export const logPasswordChange = (success, details = {}) => {
  logAuthEvent('PASSWORD_CHANGE', success, details);
};

/**
 * Log data access
 */
export const logDataAccess = (dataType, accessType, resourceId, allowed = true) => {
  const entry = createLogEntry(
    `DATA_ACCESS_${accessType.toUpperCase()}`,
    allowed ? LOG_LEVELS.INFO : LOG_LEVELS.WARNING,
    {
      dataType,
      accessType,
      resourceId,
      allowed
    }
  );
  addLog(entry);
};

/**
 * Log complaint submission
 */
export const logComplaintSubmission = (complaintId, userId, complaintType) => {
  const entry = createLogEntry(
    'COMPLAINT_SUBMITTED',
    LOG_LEVELS.INFO,
    {
      complaintId,
      userId,
      complaintType,
      timestamp: new Date().toISOString()
    }
  );
  addLog(entry);
};

/**
 * Log file upload
 */
export const logFileUpload = (fileName, fileSize, fileType, success, details = {}) => {
  const entry = createLogEntry(
    'FILE_UPLOADED',
    success ? LOG_LEVELS.INFO : LOG_LEVELS.WARNING,
    {
      fileName: sanitizeFileName(fileName),
      fileSize,
      fileType,
      success,
      ...details
    }
  );
  addLog(entry);
};

/**
 * Log validation failure
 */
export const logValidationFailure = (fieldName, reason, userInput = null) => {
  const entry = createLogEntry(
    'VALIDATION_FAILED',
    LOG_LEVELS.WARNING,
    {
      fieldName,
      reason,
      userInputLength: userInput ? String(userInput).length : 0,
      timestamp: new Date().toISOString()
    }
  );
  addLog(entry);
};

/**
 * Log security event
 */
export const logSecurityEvent = (eventName, severity, details = {}) => {
  const levelMap = {
    CRITICAL: LOG_LEVELS.CRITICAL,
    HIGH: LOG_LEVELS.ERROR,
    MEDIUM: LOG_LEVELS.WARNING,
    LOW: LOG_LEVELS.INFO
  };

  const entry = createLogEntry(
    `SECURITY_${eventName.toUpperCase()}`,
    levelMap[severity] || LOG_LEVELS.WARNING,
    {
      severity,
      ...details
    }
  );
  addLog(entry);
};

/**
 * Log suspicious activity
 */
export const logSuspiciousActivity = (activity, threshold, details = {}) => {
  logSecurityEvent('SUSPICIOUS_ACTIVITY', 'HIGH', {
    activity,
    threshold,
    ...details
  });
};

/**
 * Log error
 */
export const logError = (errorName, message, stack = '', context = {}) => {
  const entry = createLogEntry(
    `ERROR_${errorName.toUpperCase()}`,
    LOG_LEVELS.ERROR,
    {
      message,
      stackTrace: stack ? stack.substring(0, 500) : '', // Limit stack trace
      context: sanitizeDataForLogging(context)
    }
  );
  addLog(entry);
};

/**
 * Log API call
 */
export const logApiCall = (method, endpoint, statusCode, duration, success) => {
  const entry = createLogEntry(
    'API_CALL',
    success ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARNING,
    {
      method,
      endpoint,
      statusCode,
      duration: `${duration}ms`,
      success
    }
  );
  addLog(entry);
};

/**
 * Log privilege escalation attempt
 */
export const logPrivilegeEscalation = (attemptedPrivilege, allowed, details = {}) => {
  logSecurityEvent(
    'PRIVILEGE_ESCALATION_ATTEMPT',
    allowed ? 'MEDIUM' : 'HIGH',
    {
      attemptedPrivilege,
      allowed,
      ...details
    }
  );
};

/**
 * Add log entry to collection
 */
const addLog = (entry) => {
  auditLogs.push(entry);

  // Keep in memory limit
  if (auditLogs.length > MAX_LOGS_IN_MEMORY) {
    auditLogs = auditLogs.slice(-MAX_LOGS_IN_MEMORY);
  }

  // Send critical logs to backend immediately
  if (entry.severity >= LOG_LEVELS.ERROR || entry.severity >= 4) {
    sendLogToBackend(entry);
  }
};

/**
 * Send log to backend (implement actual endpoint)
 */
const sendLogToBackend = async (entry) => {
  try {
    // Implementation would call backend API
    // await axios.post('/api/audit-logs', entry);
  } catch (error) {
    // Silently fail to avoid logging loops
  }
};

/**
 * Get all logs
 */
export const getAllLogs = () => {
  return [...auditLogs];
};

/**
 * Get logs by type
 */
export const getLogsByType = (eventType) => {
  return auditLogs.filter(log => log.eventType === eventType);
};

/**
 * Get logs by level
 */
export const getLogsByLevel = (level) => {
  return auditLogs.filter(log => log.level === level);
};

/**
 * Get logs in date range
 */
export const getLogsByDateRange = (startDate, endDate) => {
  return auditLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });
};

/**
 * Export logs as JSON
 */
export const exportLogs = (filters = {}) => {
  let filtered = [...auditLogs];

  if (filters.level) {
    filtered = filtered.filter(log => log.level === filters.level);
  }

  if (filters.eventType) {
    filtered = filtered.filter(log => log.eventType === filters.eventType);
  }

  if (filters.userId) {
    filtered = filtered.filter(log => log.userId === filters.userId);
  }

  return JSON.stringify(filtered, null, 2);
};

/**
 * Clear all logs (admin only)
 */
export const clearLogs = (password) => {
  // In production, verify admin password/token
  if (password === 'ADMIN_SECRET_KEY') {
    auditLogs = [];
    return true;
  }
  return false;
};

/**
 * Sanitize email for logging (show only partial)
 */
const sanitizeEmail = (email) => {
  if (!email || !email.includes('@')) return '[INVALID_EMAIL]';
  const [name, domain] = email.split('@');
  const masked = name.substring(0, 2) + '***' + name.substring(name.length - 1);
  return `${masked}@${domain}`;
};

/**
 * Sanitize file name for logging
 */
const sanitizeFileName = (fileName) => {
  if (!fileName) return '[UNKNOWN_FILE]';
  // Keep extension only
  const ext = fileName.substring(fileName.lastIndexOf('.'));
  return `[FILE]${ext}`;
};

/**
 * Get audit summary
 */
export const getAuditSummary = () => {
  const now = new Date();
  const hour = new Date(now.getTime() - 60 * 60 * 1000);
  const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const logsLastHour = auditLogs.filter(log => new Date(log.timestamp) > hour);
  const logsLastDay = auditLogs.filter(log => new Date(log.timestamp) > day);

  const eventTypes = {};
  auditLogs.forEach(log => {
    eventTypes[log.eventType] = (eventTypes[log.eventType] || 0) + 1;
  });

  return {
    totalLogs: auditLogs.length,
    logsLastHour: logsLastHour.length,
    logsLastDay: logsLastDay.length,
    criticalCount: auditLogs.filter(log => log.severity >= 5).length,
    errorCount: auditLogs.filter(log => log.severity >= 4).length,
    eventTypeBreakdown: eventTypes
  };
};

export default {
  logAuthEvent,
  logLoginAttempt,
  logLogout,
  logPasswordChange,
  logDataAccess,
  logComplaintSubmission,
  logFileUpload,
  logValidationFailure,
  logSecurityEvent,
  logSuspiciousActivity,
  logError,
  logApiCall,
  logPrivilegeEscalation,
  getAllLogs,
  getLogsByType,
  getLogsByLevel,
  getLogsByDateRange,
  exportLogs,
  clearLogs,
  getAuditSummary
};
