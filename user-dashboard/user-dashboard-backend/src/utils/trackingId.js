const crypto = require('crypto');

/**
 * Generate a public-facing tracking ID.
 * Format: TRK-XXXXXX (uppercase alphanumeric)
 */
const generateTrackingId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRK-';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
};

module.exports = { generateTrackingId };
