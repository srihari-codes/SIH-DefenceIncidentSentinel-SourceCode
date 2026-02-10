/**
 * Role-specific validation rules
 */

// Email domain patterns by role
const EMAIL_PATTERNS = {
  personnel: {
    pattern: null,
    required: false
  },
  family: {
    pattern: null, 
    required: false
  },
  veteran: {
    pattern: null,
    required: false
  },
  cert: {
    pattern: null,
    required: false
  },
  admin: {
    pattern: null,
    required: false
  }
};

// Identifier patterns by role
const IDENTIFIER_PATTERNS = {
  personnel: /^[A-Z0-9-]{6,15}$/,    // e.g., IC-123456
  family: /^[A-Z0-9-]{6,20}$/,       // e.g., DEP-2024-5678
  veteran: /^[A-Z0-9-]{6,20}$/,      // e.g., PPO-2020-9876
  cert: /^[A-Z0-9-]{5,15}$/,         // e.g., CERT-2024-101
  admin: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ // Any email as identifier
};

// MFA methods enforced by role
const ENFORCED_MFA = {
  personnel: 'TOTP',
  family: 'EMAIL',
  veteran: 'EMAIL',
  cert: 'TOTP',
  admin: 'TOTP'
};

// Valid roles
const VALID_ROLES = ['personnel', 'family', 'veteran', 'cert', 'admin'];

// Valid MFA methods
const VALID_MFA_METHODS = ['TOTP', 'EMAIL'];

// Password pattern: 12+ chars, 1 uppercase, 1 number, 1 special char
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}$/;

/**
 * Validate email format
 */
function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate email for a specific role
 * @returns {{ valid: boolean, error?: string, warning?: string }}
 */
function validateEmailForRole(email, role) {
  if (!isValidEmailFormat(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  const rules = EMAIL_PATTERNS[role];
  if (!rules) {
    return { valid: false, error: 'Invalid role' };
  }
  
  if (rules.required && rules.pattern) {
    if (!rules.pattern.test(email)) {
      return { valid: false, error: rules.errorMessage };
    }
  }
  
  // Check for warning (family role with non-defence email)
  if (rules.warningMessage && rules.pattern && !rules.pattern.test(email)) {
    return { valid: true, warning: rules.warningMessage };
  }
  
  return { valid: true };
}

/**
 * Validate identifier for a specific role
 * @returns {{ valid: boolean, error?: string }}
 */
function validateIdentifierForRole(identifier, role) {
  // LENIENT MODE FOR PRESENTATION: Accept any non-empty identifier
  if (!identifier || identifier.trim().length === 0) {
    return { valid: false, error: 'Identifier is required' };
  }
  
  // Skip pattern validation for presentation
  return { valid: true };
  
  // ORIGINAL STRICT VALIDATION (commented out for presentation)
  // const pattern = IDENTIFIER_PATTERNS[role];
  // if (!pattern) {
  //   return { valid: false, error: 'Invalid role' };
  // }
  // 
  // // Normalize identifier (uppercase, trim)
  // const normalizedIdentifier = identifier.toUpperCase().trim();
  // 
  // if (!pattern.test(normalizedIdentifier)) {
  //   return { 
  //     valid: false, 
  //     error: `Invalid identifier format for ${role}` 
  //   };
  // }
  // 
  // return { valid: true };
}

/**
 * Validate password meets requirements
 * @returns {{ valid: boolean, error?: string }}
 */
function validatePassword(password) {
  if (!password || password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters' };
  }
  
  if (!PASSWORD_PATTERN.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate MFA method for a specific role
 * @returns {{ valid: boolean, error?: string }}
 */
function validateMfaMethodForRole(mfaMethod, role) {
  const enforced = ENFORCED_MFA[role];
  
  if (!VALID_MFA_METHODS.includes(mfaMethod)) {
    return { valid: false, error: 'Invalid MFA method. Must be TOTP or EMAIL' };
  }
  
  if (enforced && mfaMethod !== enforced) {
    return { 
      valid: false, 
      error: `${enforced} is required for ${role} role` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate role is valid
 */
function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

/**
 * Normalize email (lowercase, trim)
 */
function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

/**
 * Normalize identifier (uppercase, trim)
 */
function normalizeIdentifier(identifier) {
  return identifier.toUpperCase().trim();
}

/**
 * Normalize mobile number (remove non-digits except leading +)
 */
function normalizeMobile(mobile) {
  // Keep leading + if present, remove other non-digits
  const hasPlus = mobile.startsWith('+');
  const digits = mobile.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

module.exports = {
  EMAIL_PATTERNS,
  IDENTIFIER_PATTERNS,
  ENFORCED_MFA,
  VALID_ROLES,
  VALID_MFA_METHODS,
  PASSWORD_PATTERN,
  isValidEmailFormat,
  validateEmailForRole,
  validateIdentifierForRole,
  validatePassword,
  validateMfaMethodForRole,
  isValidRole,
  normalizeEmail,
  normalizeIdentifier,
  normalizeMobile
};
