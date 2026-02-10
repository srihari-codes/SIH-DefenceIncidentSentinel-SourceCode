const { COMPLAINT_CATEGORIES, ERROR_CODES } = require('../constants');

/**
 * Validate complaint submission payload.
 */
const validateComplaint = (req, res, next) => {
  const { category, description, incident_timestamp } = req.body;
  const errors = [];

  if (!category || !COMPLAINT_CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${COMPLAINT_CATEGORIES.join(', ')}`);
  }

  if (!description || typeof description !== 'string') {
    errors.push('description is required');
  } else if (description.length < 20 || description.length > 500) {
    errors.push('description must be between 20 and 500 characters');
  }

  if (!incident_timestamp) {
    errors.push('incident_timestamp is required');
  } else if (isNaN(Date.parse(incident_timestamp))) {
    errors.push('incident_timestamp must be a valid ISO 8601 date');
  }

  // Validate evidences if present
  const evidences = req.body.evidences;
  if (evidences) {
    if (!Array.isArray(evidences)) {
      errors.push('evidences must be an array');
    } else if (evidences.length > 10) {
      errors.push('Maximum 10 evidence files allowed');
    } else {
      let totalSize = 0;
      for (let i = 0; i < evidences.length; i++) {
        const ev = evidences[i];
        if (!ev.file_name || !ev.file_data || !ev.mime_type) {
          errors.push(`evidence[${i}] must have file_name, file_data, and mime_type`);
        }
        if (ev.file_data) {
          totalSize += Buffer.byteLength(ev.file_data, 'base64');
        }
      }
      if (totalSize > 50 * 1024 * 1024) {
        errors.push('Total evidence size must not exceed 50MB');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(ERROR_CODES.VALIDATION_ERROR.status).json({
      success: false,
      message: errors.join('; '),
      error_code: ERROR_CODES.VALIDATION_ERROR.code
    });
  }

  next();
};

/**
 * Validate profile update payload.
 */
const validateProfileUpdate = (req, res, next) => {
  const { full_name, mobile } = req.body;
  const errors = [];

  if (full_name !== undefined && (typeof full_name !== 'string' || full_name.trim().length === 0)) {
    errors.push('full_name must be a non-empty string');
  }

  if (mobile !== undefined && (typeof mobile !== 'string' || mobile.trim().length === 0)) {
    errors.push('mobile must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(ERROR_CODES.VALIDATION_ERROR.status).json({
      success: false,
      message: errors.join('; '),
      error_code: ERROR_CODES.VALIDATION_ERROR.code
    });
  }

  next();
};

/**
 * Validate notification settings payload.
 */
const validateNotificationSettings = (req, res, next) => {
  const { email_enabled, sms_enabled, complaint_updates, system_alerts } = req.body;
  const errors = [];

  const boolFields = { email_enabled, sms_enabled, complaint_updates, system_alerts };
  for (const [key, value] of Object.entries(boolFields)) {
    if (value !== undefined && typeof value !== 'boolean') {
      errors.push(`${key} must be a boolean`);
    }
  }

  if (errors.length > 0) {
    return res.status(ERROR_CODES.VALIDATION_ERROR.status).json({
      success: false,
      message: errors.join('; '),
      error_code: ERROR_CODES.VALIDATION_ERROR.code
    });
  }

  next();
};

module.exports = { validateComplaint, validateProfileUpdate, validateNotificationSettings };
