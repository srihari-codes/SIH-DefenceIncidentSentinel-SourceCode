const crypto = require('crypto');
const config = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted string in format: iv:authTag:encrypted
 */
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(config.encryptionKey, 'hex');
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt text using AES-256-GCM
 * @param {string} encryptedData - Encrypted string in format: iv:authTag:encrypted
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedData) {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(config.encryptionKey, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a random OTP code
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - OTP code
 */
function generateOTP(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

/**
 * Generate backup codes
 * @param {number} count - Number of codes to generate (default: 10)
 * @returns {string[]} - Array of backup codes
 */
function generateBackupCodes(count = 10) {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
}

module.exports = {
  encrypt,
  decrypt,
  generateOTP,
  generateBackupCodes
};
