/**
 * Secure File Upload & Validation Module
 * Implements comprehensive file security:
 * - Type validation
 * - Size limits
 * - MIME type verification
 * - Dangerous file detection
 * - Virus scanning hooks
 * - Audit logging
 */

import { FILE_UPLOAD_CONFIG, VALIDATION_RULES } from './securityConfig';
import { logFileUpload, logSecurityEvent } from './auditLog';

/**
 * Validate single file
 * @param {File} file - File to validate
 * @returns {object} { valid, errors, warnings }
 */
export const validateFile = (file) => {
  const errors = [];
  const warnings = [];

  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      errors: ['Invalid file object'],
      warnings: []
    };
  }

  // Check file name
  if (!validateFileName(file.name)) {
    errors.push('Invalid file name. Contains illegal characters or path traversal attempt.');
  }

  // Check file extension
  if (isDangerousExtension(file.name)) {
    errors.push(`File extension .${getFileExtension(file.name)} is not allowed.`);
  }

  // Check file size
  if (file.size === 0) {
    errors.push('File is empty.');
  }

  if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
    const maxMB = (FILE_UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(1);
    errors.push(`File exceeds maximum size of ${maxMB}MB. Current: ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
  }

  // Check MIME type
  if (!isAllowedMimeType(file.type)) {
    warnings.push(`File type ${file.type} is not in approved list. File will be scanned before storage.`);
  }

  // Warn about suspicious MIME-extension mismatch
  if (!verifyMimeTypeConsistency(file.name, file.type)) {
    warnings.push('File extension and MIME type mismatch detected. File will be quarantined for scanning.');
  }

  // Additional checks for common dangerous patterns
  if (file.name.toLowerCase().includes('script') || 
      file.name.toLowerCase().includes('exec') ||
      file.name.toLowerCase().includes('cmd')) {
    warnings.push('File name contains suspicious keywords.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate file name
 * @param {string} filename - File name to validate
 * @returns {boolean} True if valid
 */
function validateFileName(filename) {
  if (typeof filename !== 'string' || !filename) return false;

  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // Prevent special characters
  const dangerousChars = /[<>:|?*]/g;
  if (dangerousChars.test(filename)) {
    return false;
  }

  // Check length
  if (filename.length === 0 || filename.length > 255) {
    return false;
  }

  return true;
}

/**
 * Check if file extension is dangerous
 * @param {string} filename - File name
 * @returns {boolean} True if dangerous
 */
function isDangerousExtension(filename) {
  const ext = '.' + getFileExtension(filename).toLowerCase();
  return FILE_UPLOAD_CONFIG.DANGEROUS_EXTENSIONS.includes(ext);
}

/**
 * Get file extension
 * @param {string} filename - File name
 * @returns {string} Extension without dot
 */
function getFileExtension(filename) {
  if (!filename || !filename.includes('.')) return '';
  return filename.substring(filename.lastIndexOf('.') + 1);
}

/**
 * Check if MIME type is allowed
 * @param {string} mimeType - MIME type
 * @returns {boolean} True if allowed
 */
function isAllowedMimeType(mimeType) {
  if (!mimeType) return false;
  return FILE_UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(mimeType);
}

/**
 * Verify MIME type matches file extension
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 * @returns {boolean} True if consistent
 */
function verifyMimeTypeConsistency(filename, mimeType) {
  const ext = getFileExtension(filename).toLowerCase();
  
  const mimeMap = {
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'webp': ['image/webp'],
    'pdf': ['application/pdf'],
    'doc': ['application/msword'],
    'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'xls': ['application/vnd.ms-excel'],
    'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'txt': ['text/plain'],
    'mp4': ['video/mp4'],
    'avi': ['video/avi'],
    'zip': ['application/zip'],
    'rar': ['application/x-rar-compressed'],
    '7z': ['application/x-7z-compressed']
  };

  const expectedTypes = mimeMap[ext] || [];
  return expectedTypes.includes(mimeType) || expectedTypes.length === 0;
}

/**
 * Validate multiple files (batch upload)
 * @param {FileList|File[]} files - Files to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
export const validateFiles = (files, options = {}) => {
  const {
    maxFiles = FILE_UPLOAD_CONFIG.MAX_FILES_PER_UPLOAD,
    maxTotalSize = FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE_BYTES
  } = options;

  const results = {
    valid: true,
    validFiles: [],
    invalidFiles: [],
    totalErrors: [],
    totalSize: 0
  };

  if (!files || files.length === 0) {
    results.totalErrors.push('No files provided');
    results.valid = false;
    return results;
  }

  // Check file count
  if (files.length > maxFiles) {
    results.totalErrors.push(`Maximum ${maxFiles} files allowed. Received ${files.length}.`);
    results.valid = false;
  }

  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const validation = validateFile(file);

    if (validation.valid) {
      results.validFiles.push(file);
      totalSize += file.size;

      logFileUpload(file.name, file.size, file.type, true);
    } else {
      results.invalidFiles.push({
        file: file.name,
        errors: validation.errors,
        warnings: validation.warnings
      });
      results.valid = false;

      logFileUpload(file.name, file.size, file.type, false, {
        errors: validation.errors.join('; ')
      });
    }
  }

  // Check total size
  if (totalSize > maxTotalSize) {
    const maxMB = (maxTotalSize / (1024 * 1024)).toFixed(1);
    const actualMB = (totalSize / (1024 * 1024)).toFixed(2);
    results.totalErrors.push(`Total file size (${actualMB}MB) exceeds limit of ${maxMB}MB.`);
    results.valid = false;
  }

  results.totalSize = totalSize;

  return results;
};

/**
 * Check if file should be scanned before storage
 * @param {File} file - File to check
 * @returns {boolean} True if scanning needed
 */
export const needsVirusScan = (file) => {
  if (!FILE_UPLOAD_CONFIG.SCAN_BEFORE_STORAGE) return false;

  // Always scan for dangerous extensions
  if (isDangerousExtension(file.name)) return true;

  // Scan if MIME type not in whitelist
  if (!isAllowedMimeType(file.type)) return true;

  // Scan if MIME-extension mismatch
  if (!verifyMimeTypeConsistency(file.name, file.type)) return true;

  // Scan larger files
  if (file.size > 10 * 1024 * 1024) return true; // Files > 10MB

  return false;
};

/**
 * Quarantine suspicious file
 * @param {File} file - File to quarantine
 * @param {string} reason - Reason for quarantine
 * @returns {object} Quarantine info
 */
export const quarantineFile = (file, reason) => {
  const quarantineInfo = {
    filename: file.name,
    originalSize: file.size,
    mimeType: file.type,
    quarantineTime: new Date().toISOString(),
    quarantineReason: reason,
    status: 'QUARANTINED',
    requiresApproval: true,
    scanNeeded: true
  };

  logSecurityEvent('FILE_QUARANTINED', 'MEDIUM', {
    filename: file.name,
    reason,
    size: file.size
  });

  return quarantineInfo;
};

/**
 * Create safe file for upload
 * Returns FormData with validated file
 * @param {File} file - File to upload
 * @param {string} fieldName - Form field name
 * @returns {FormData} Form data for upload
 */
export const createSafeFileFormData = (file, fieldName = 'file') => {
  const validation = validateFile(file);

  if (!validation.valid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
  }

  const formData = new FormData();
  
  // Only add safe file data
  formData.append(fieldName, file);
  formData.append('filename', file.name);
  formData.append('filesize', file.size);
  formData.append('filetype', file.type);
  formData.append('uploadtime', new Date().toISOString());

  // Add validation result
  if (validation.warnings.length > 0) {
    formData.append('warnings', JSON.stringify(validation.warnings));
  }

  logFileUpload(file.name, file.size, file.type, true, {
    uploadMethod: 'safe_form_data'
  });

  return formData;
};

/**
 * Sanitize file name for storage
 * @param {string} filename - Original filename
 * @returns {string} Safe filename
 */
export const sanitizeFileName = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return `file_${Date.now()}`;
  }

  // Remove path
  let safe = filename.substring(filename.lastIndexOf('\\') + 1);
  safe = safe.substring(safe.lastIndexOf('/') + 1);

  // Remove special characters
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Remove multiple dots (except for extension)
  safe = safe.replace(/\.\.+/g, '.');

  // Limit length
  if (safe.length > 200) {
    const ext = '.' + getFileExtension(safe);
    safe = safe.substring(0, 200 - ext.length) + ext;
  }

  // Add timestamp to ensure uniqueness
  const ext = getFileExtension(safe);
  const name = safe.substring(0, safe.lastIndexOf('.'));
  const timestamp = Date.now().toString(36);

  return `${name}_${timestamp}.${ext}`;
};

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file icon based on type
 * @param {string} filename - File name
 * @returns {string} Icon emoji or name
 */
export const getFileIcon = (filename) => {
  const ext = getFileExtension(filename).toLowerCase();

  const iconMap = {
    'pdf': '📄',
    'doc': '📝', 'docx': '📝',
    'xls': '📊', 'xlsx': '📊',
    'txt': '📃',
    'zip': '📦', 'rar': '📦', '7z': '📦',
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
    'mp4': '🎬', 'avi': '🎬',
    'default': '📎'
  };

  return iconMap[ext] || iconMap['default'];
};

export default {
  validateFile,
  validateFiles,
  needsVirusScan,
  quarantineFile,
  createSafeFileFormData,
  sanitizeFileName,
  formatFileSize,
  getFileIcon
};
