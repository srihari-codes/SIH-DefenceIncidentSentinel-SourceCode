import validator from 'validator';

/**
 * Sanitize and validate registration input
 */
export const validateRegistration = (req, res, next) => {
  const { fullName, email, mobile, serviceId, role, password } = req.body;

  const errors = [];

  // Validate full name
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  // Validate email
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email address required');
  } else {
    // Sanitize email
    req.body.email = validator.normalizeEmail(email);
  }

  // Validate mobile (10-15 digits)
  const cleanMobile = mobile ? mobile.replace(/[^0-9]/g, '') : '';
  if (!cleanMobile || cleanMobile.length < 10 || cleanMobile.length > 15) {
    errors.push('Valid mobile number required (10-15 digits)');
  }

  // Validate service ID
  if (!serviceId || typeof serviceId !== 'string' || serviceId.trim().length < 3) {
    errors.push('Valid service/credential ID required');
  }

  // Validate role
  const validRoles = ['personnel', 'family', 'veteran', 'cert', 'admin'];
  if (!role || !validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }

  // Validate password strength
  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters');
  } else {
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Sanitize strings
  req.body.fullName = validator.escape(fullName.trim());
  req.body.serviceId = validator.escape(serviceId.trim());

  next();
};

/**
 * Validate login input
 */
export const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;

  const errors = [];

  if (!identifier || typeof identifier !== 'string' || identifier.trim().length < 3) {
    errors.push('Valid identifier (email or service ID) required');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validate MFA verification input
 */
export const validateMfaVerification = (req, res, next) => {
  const { code } = req.body;

  if (!code || !/^\d{6}$/.test(code)) {
    return res.status(400).json({
      success: false,
      message: 'Valid 6-digit code required',
    });
  }

  next();
};

/**
 * Sanitize general text input to prevent XSS
 */
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = validator.escape(obj[key].trim());
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body && typeof req.body === 'object') {
    sanitize(req.body);
  }

  next();
};
