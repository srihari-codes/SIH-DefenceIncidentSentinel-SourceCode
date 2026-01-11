/**
 * Security Configuration & Constants
 * Centralized security settings for the entire application
 * Implements CIA triad principles:
 * - Confidentiality: Encryption, access control, data minimization
 * - Integrity: Validation, checksums, audit logging
 * - Availability: Rate limiting, error handling, monitoring
 */

// ==================== ENCRYPTION & HASHING ====================

/**
 * Security headers configuration
 * Protects against common web vulnerabilities
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff', // Prevent MIME sniffing
  'X-Frame-Options': 'DENY', // Prevent clickjacking
  'X-XSS-Protection': '1; mode=block', // Enable XSS protection
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload', // HTTPS enforcement
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin', // Control referrer info
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// ==================== SESSION & AUTH ====================

export const SESSION_CONFIG = {
  TOKEN_EXPIRATION_MINUTES: 30, // Access token validity
  REFRESH_TOKEN_EXPIRATION_DAYS: 7, // Refresh token validity
  SESSION_TIMEOUT_MINUTES: 15, // Inactivity timeout
  MAX_LOGIN_ATTEMPTS: 5, // Brute force protection
  LOGIN_ATTEMPT_LOCKOUT_MINUTES: 15, // Lockout duration
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_EXPIRATION_DAYS: 90,
  REQUIRE_MFA: true,
  SECURE_COOKIE_FLAGS: {
    httpOnly: true, // Prevent JS access
    secure: true, // HTTPS only
    sameSite: 'Strict', // CSRF protection
    maxAge: 30 * 60 * 1000 // 30 minutes
  }
};

// ==================== RATE LIMITING ====================

export const RATE_LIMITING = {
  LOGIN_REQUESTS_PER_MINUTE: 5,
  API_REQUESTS_PER_MINUTE: 60,
  FILE_UPLOAD_REQUESTS_PER_MINUTE: 10,
  PASSWORD_RESET_PER_HOUR: 3,
  COMPLAINT_SUBMISSION_PER_HOUR: 20,
  CONTACT_FORM_PER_HOUR: 5
};

// ==================== FILE UPLOAD ====================

export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_UPLOAD: 5,
  MAX_TOTAL_SIZE_BYTES: 250 * 1024 * 1024, // 250MB per complaint
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'video/mp4',
    'video/avi',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ],
  DANGEROUS_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar', '.zip',
    '.rar', '.7z', '.sh', '.bash', '.com', '.msi', '.dll', '.so',
    '.dylib', '.app'
  ],
  SCAN_BEFORE_STORAGE: true,
  QUARANTINE_SUSPICIOUS: true,
  ENCRYPTION_AT_REST: true
};

// ==================== DATA PRIVACY ====================

export const DATA_PRIVACY = {
  // Fields that should never be logged
  SENSITIVE_FIELDS: [
    'password', 'token', 'secret', 'apiKey', 'privateKey',
    'ssn', 'bankAccount', 'creditCard', 'pin', 'otp'
  ],
  
  // Retention policy
  LOG_RETENTION_DAYS: 90,
  COMPLAINT_RETENTION_DAYS: 365,
  SESSION_RETENTION_DAYS: 30,
  
  // Anonymization settings
  ANONYMIZE_AFTER_DAYS: 180,
  HASH_PII_IN_LOGS: true,
  MIN_DATA_COLLECTION: true // Only collect what's necessary
};

// ==================== AUDIT LOGGING ====================

export const AUDIT_CONFIG = {
  LOG_ALL_AUTH: true,
  LOG_ALL_DATA_ACCESS: true,
  LOG_ALL_MODIFICATIONS: true,
  LOG_FAILED_VALIDATIONS: true,
  LOG_SECURITY_EVENTS: true,
  LOG_FILE_UPLOADS: true,
  INCLUDE_IP_ADDRESSES: true,
  INCLUDE_USER_AGENTS: true,
  ENCRYPTION_ENABLED: true,
  TAMPER_DETECTION: true
};

// ==================== CRYPTOGRAPHY ====================

export const CRYPTO_CONFIG = {
  // For AES encryption
  ALGORITHM: 'AES-256-GCM',
  KEY_LENGTH: 32, // 256 bits
  IV_LENGTH: 16, // 128 bits (initialization vector)
  AUTH_TAG_LENGTH: 16, // 128 bits
  
  // For hashing
  HASH_ALGORITHM: 'sha256',
  PBKDF2_ITERATIONS: 310000, // OWASP recommendation
  
  // For token generation
  TOKEN_LENGTH: 32, // bytes
  TOKEN_ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
};

// ==================== VALIDATION RULES ====================

export const VALIDATION_RULES = {
  COMPLAINT_ID_PATTERN: /^#?COM-\d{6,8}$/,
  RANK_PATTERN: /^[A-Za-z\s]+$/,
  DEPARTMENT_PATTERN: /^[A-Za-z0-9\s\-&]+$/,
  LOCATION_PATTERN: /^[A-Za-z0-9\s,-]+$/,
  PHONE_PATTERN: /^\+?[0-9]{7,15}$/,
  
  // Field length limits
  NAME_MIN: 3,
  NAME_MAX: 100,
  EMAIL_MAX: 254,
  PHONE_MAX: 20,
  RANK_MAX: 50,
  DEPARTMENT_MAX: 100,
  LOCATION_MAX: 100,
  DESCRIPTION_MIN: 20,
  DESCRIPTION_MAX: 5000
};

// ==================== API SECURITY ====================

export const API_SECURITY = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  
  // CORS
  ALLOWED_ORIGINS: [
    'https://cyber-complaint.cert-army.gov',
    'https://www.cyber-complaint.cert-army.gov'
  ],
  
  // API versioning
  API_VERSION: 'v1',
  REQUIRE_API_KEY: true,
  API_KEY_HEADER: 'X-API-Key',
  
  // Request signing
  SIGN_REQUESTS: true,
  SIGNATURE_ALGORITHM: 'HMAC-SHA256'
};

// ==================== COMPLIANCE ====================

export const COMPLIANCE = {
  // GDPR
  GDPR_COMPLIANT: true,
  REQUIRE_CONSENT: true,
  CONSENT_RETENTION_DAYS: 1095, // 3 years
  
  // Data Protection
  DATA_CLASSIFICATION_ENABLED: true,
  ENCRYPTION_ENABLED: true,
  MINIMAL_DATA_COLLECTION: true,
  
  // Audit & Logging
  COMPREHENSIVE_LOGGING: true,
  INCIDENT_RESPONSE_PLAN: true,
  
  // User Rights
  RIGHT_TO_ACCESS: true,
  RIGHT_TO_DELETION: true,
  RIGHT_TO_PORTABILITY: true,
  RIGHT_TO_RECTIFICATION: true
};

// ==================== ERROR HANDLING ====================

export const ERROR_HANDLING = {
  GENERIC_ERROR_MESSAGES: true, // Never leak sensitive info
  LOG_ERRORS_SECURELY: true,
  DONT_EXPOSE_STACK_TRACES: true,
  SANITIZE_ERROR_OUTPUT: true,
  INCLUDE_ERROR_CODES: true,
  INCLUDE_USER_ID_IN_LOGS: true,
  DONT_LOG_SENSITIVE_DATA: true
};

// ==================== MONITORING & ALERTS ====================

export const MONITORING = {
  MONITOR_LOGIN_ATTEMPTS: true,
  MONITOR_FAILED_VALIDATIONS: true,
  MONITOR_FILE_UPLOADS: true,
  MONITOR_DATA_ACCESS: true,
  MONITOR_PRIVILEGE_ESCALATION: true,
  
  ALERT_ON_SUSPICIOUS_ACTIVITY: true,
  ALERT_ON_MULTIPLE_FAILED_LOGINS: true,
  ALERT_ON_UNUSUAL_FILE_UPLOADS: true,
  ALERT_ON_BULK_DATA_DOWNLOAD: true,
  
  THRESHOLD_FAILED_LOGINS: 5,
  THRESHOLD_UNUSUAL_TIME_ACCESS: true,
  THRESHOLD_UNUSUAL_LOCATION_ACCESS: true
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get sanitized configuration (remove sensitive values)
 * For logging/debugging without exposing secrets
 */
export const getSanitizedConfig = () => {
  const sanitized = { ...API_SECURITY };
  delete sanitized.API_KEY;
  delete sanitized.SECRET;
  return sanitized;
};

/**
 * Check if a value is a sensitive field
 */
export const isSensitiveField = (fieldName) => {
  return DATA_PRIVACY.SENSITIVE_FIELDS.some(
    field => fieldName.toLowerCase().includes(field)
  );
};

/**
 * Check if file type is dangerous
 */
export const isDangerousFile = (filename) => {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return FILE_UPLOAD_CONFIG.DANGEROUS_EXTENSIONS.includes(ext);
};

/**
 * Get required headers for API requests
 */
export const getRequiredHeaders = (token) => {
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Authorization': `Bearer ${token}`,
    ...SECURITY_HEADERS
  };
};

export default {
  SECURITY_HEADERS,
  SESSION_CONFIG,
  RATE_LIMITING,
  FILE_UPLOAD_CONFIG,
  DATA_PRIVACY,
  AUDIT_CONFIG,
  CRYPTO_CONFIG,
  VALIDATION_RULES,
  API_SECURITY,
  COMPLIANCE,
  ERROR_HANDLING,
  MONITORING,
  getSanitizedConfig,
  isSensitiveField,
  isDangerousFile,
  getRequiredHeaders
};
