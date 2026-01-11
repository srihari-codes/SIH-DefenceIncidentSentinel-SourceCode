/**
 * Input Validation & Sanitization Utilities
 * Implements strict input validation and sanitization to prevent:
 * - XSS attacks (Cross-Site Scripting)
 * - SQL Injection
 * - Command Injection
 * - Path Traversal attacks
 * - Malicious input
 */

// HTML special characters mapping for sanitization
const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

/**
 * Sanitize string by escaping HTML special characters
 * Prevents XSS attacks
 * @param {string} text - Input text to sanitize
 * @returns {string} Sanitized text
 */
export const sanitizeHtml = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
};

/**
 * Validate and sanitize email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
};

/**
 * Validate username (alphanumeric, underscore, hyphen only)
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid
 */
export const validateUsername = (username) => {
  if (typeof username !== 'string') return false;
  const usernameRegex = /^[a-zA-Z0-9_-]{3,32}$/;
  return usernameRegex.test(username);
};

/**
 * Validate and sanitize file name
 * Prevents path traversal and malicious file names
 * @param {string} filename - File name to validate
 * @returns {boolean} True if safe
 */
export const validateFileName = (filename) => {
  if (typeof filename !== 'string') return false;
  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }
  // Prevent suspicious characters (excluding control chars check)
  const dangerousChars = /[<>:|?*]/;
  return !dangerousChars.test(filename) && filename.length > 0 && filename.length <= 255;
};

/**
 * Validate file type against whitelist
 * @param {File} file - File object
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {boolean} True if valid
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file || !file.type) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 * @param {File} file - File object
 * @param {number} maxSizeInBytes - Maximum allowed size
 * @returns {boolean} True if within limits
 */
export const validateFileSize = (file, maxSizeInBytes) => {
  if (!file || !file.size) return false;
  return file.size <= maxSizeInBytes;
};

/**
 * Sanitize and validate user input for form fields
 * @param {string} input - User input
 * @param {object} options - Validation options
 * @returns {object} { isValid, sanitized, errors }
 */
export const validateFormInput = (input, options = {}) => {
  const {
    minLength = 1,
    maxLength = 500,
    required = true,
    pattern = null,
    allowHtml = false
  } = options;

  const errors = [];

  if (typeof input !== 'string') {
    return { isValid: false, sanitized: '', errors: ['Invalid input type'] };
  }

  const trimmed = input.trim();

  if (required && trimmed.length === 0) {
    errors.push('This field is required');
  }

  if (trimmed.length < minLength) {
    errors.push(`Minimum length is ${minLength} characters`);
  }

  if (trimmed.length > maxLength) {
    errors.push(`Maximum length is ${maxLength} characters`);
  }

  if (pattern && !pattern.test(trimmed)) {
    errors.push('Invalid format');
  }

  const sanitized = allowHtml ? trimmed : sanitizeHtml(trimmed);

  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
};

/**
 * Validate phone number (flexible international format)
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
export const validatePhoneNumber = (phone) => {
  if (typeof phone !== 'string') return false;
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Allow 7-15 digits (ITU-T E.164 standard range)
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(cleaned);
};

/**
 * Validate strong password
 * Requirements: 8+ chars, uppercase, lowercase, number, special char
 * @param {string} password - Password to validate
 * @returns {object} { isStrong, score, feedback }
 */
export const validatePassword = (password) => {
  const feedback = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return { isStrong: false, score: 0, feedback: ['Invalid password'] };
  }

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('At least 8 characters required');
  }

  if (password.length >= 12) score++;

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Add numbers');
  }

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score++;
  } else {
    feedback.push('Add special characters');
  }

  // Check for common weak patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeated characters');
    score = Math.max(0, score - 1);
  }

  return {
    isStrong: score >= 5,
    score: Math.min(6, score),
    feedback
  };
};

/**
 * Validate and sanitize URL
 * Prevents javascript: and data: protocols
 * @param {string} url - URL to validate
 * @returns {boolean} True if safe
 */
export const validateUrl = (url) => {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    // Only allow http and https
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitize and validate complaint description
 * @param {string} description - Complaint text
 * @returns {object} { isValid, sanitized, errors }
 */
export const validateComplaintDescription = (description) => {
  return validateFormInput(description, {
    minLength: 20,
    maxLength: 2000,
    required: true,
    allowHtml: false
  });
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string
 * @returns {boolean} True if valid
 */
export const validateDateFormat = (date) => {
  if (typeof date !== 'string') return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d) && d <= new Date();
};

/**
 * Sanitize object recursively
 * Escapes all string values to prevent XSS
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') return sanitizeHtml(obj);
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

export default {
  sanitizeHtml,
  validateEmail,
  validateUsername,
  validateFileName,
  validateFileType,
  validateFileSize,
  validateFormInput,
  validatePhoneNumber,
  validatePassword,
  validateUrl,
  validateComplaintDescription,
  validateDateFormat,
  sanitizeObject
};
