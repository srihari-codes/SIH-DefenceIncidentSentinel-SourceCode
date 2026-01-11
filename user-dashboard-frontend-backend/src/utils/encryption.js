/**
 * Encryption & Data Protection Utilities
 * Implements AES-256-GCM encryption for sensitive data at rest
 * Provides hashing for passwords and sensitive values
 */

import { CRYPTO_CONFIG } from './securityConfig';

/**
 * Encrypt sensitive data using Web Crypto API
 * @param {string} plaintext - Data to encrypt
 * @param {string} key - Encryption key (base64)
 * @returns {Promise<string>} Encrypted data (base64)
 */
export const encryptData = async (plaintext, key) => {
  try {
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.IV_LENGTH));

    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      base64ToBuffer(key),
      {
        name: 'AES-GCM',
        length: CRYPTO_CONFIG.KEY_LENGTH * 8
      },
      false,
      ['encrypt']
    );

    // Encode plaintext
    const encoded = new TextEncoder().encode(plaintext);

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: CRYPTO_CONFIG.AUTH_TAG_LENGTH * 8
      },
      cryptoKey,
      encoded
    );

    // Combine IV + ciphertext and encode to base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return bufferToBase64(combined);
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt data encrypted with encryptData
 * @param {string} encrypted - Encrypted data (base64)
 * @param {string} key - Decryption key (base64)
 * @returns {Promise<string>} Decrypted plaintext
 */
export const decryptData = async (encrypted, key) => {
  try {
    // Decode base64
    const combined = base64ToBuffer(encrypted);

    // Extract IV and ciphertext
    const iv = combined.slice(0, CRYPTO_CONFIG.IV_LENGTH);
    const ciphertext = combined.slice(CRYPTO_CONFIG.IV_LENGTH);

    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      base64ToBuffer(key),
      {
        name: 'AES-GCM',
        length: CRYPTO_CONFIG.KEY_LENGTH * 8
      },
      false,
      ['decrypt']
    );

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: CRYPTO_CONFIG.AUTH_TAG_LENGTH * 8
      },
      cryptoKey,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {Promise<string>} Hash (hex string)
 */
export const hashData = async (data) => {
  try {
    const encoded = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return bufferToHex(hashBuffer);
  } catch (error) {
    throw new Error(`Hashing failed: ${error.message}`);
  }
};

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} Random token (hex)
 */
export const generateSecureToken = (length = CRYPTO_CONFIG.TOKEN_LENGTH) => {
  const buffer = crypto.getRandomValues(new Uint8Array(length));
  return bufferToHex(buffer);
};

/**
 * Generate encryption key
 * @returns {Promise<string>} Base64-encoded encryption key
 */
export const generateEncryptionKey = async () => {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: CRYPTO_CONFIG.KEY_LENGTH * 8
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(new Uint8Array(exported));
};

/**
 * Hash password using PBKDF2 (slower for security)
 * Only for initial password hashing - actual validation should be on backend
 * @param {string} password - Password to hash
 * @param {string} salt - Salt (base64)
 * @returns {Promise<string>} Hashed password (base64)
 */
export const hashPassword = async (password, salt) => {
  try {
    const passwordBuffer = new TextEncoder().encode(password);
    const saltBuffer = base64ToBuffer(salt);

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, ['deriveKey']),
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const exported = await crypto.subtle.exportKey('raw', derivedKey);
    return bufferToBase64(new Uint8Array(exported));
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Generate random salt
 * @returns {string} Salt (base64)
 */
export const generateSalt = () => {
  const buffer = crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(buffer);
};

/**
 * Compute HMAC for data integrity verification
 * @param {string} data - Data to sign
 * @param {string} key - Key (base64)
 * @returns {Promise<string>} HMAC (hex)
 */
export const computeHmac = async (data, key) => {
  try {
    const keyBuffer = base64ToBuffer(key);
    const dataBuffer = new TextEncoder().encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
    return bufferToHex(new Uint8Array(signature));
  } catch (error) {
    throw new Error(`HMAC computation failed: ${error.message}`);
  }
};

/**
 * Verify HMAC
 * @param {string} data - Original data
 * @param {string} hmac - HMAC to verify (hex)
 * @param {string} key - Key (base64)
 * @returns {Promise<boolean>} True if valid
 */
export const verifyHmac = async (data, hmac, key) => {
  try {
    const computed = await computeHmac(data, key);
    // Use constant-time comparison to prevent timing attacks
    return constantTimeEquals(computed, hmac);
  } catch {
    return false;
  }
};

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if equal
 */
const constantTimeEquals = (a, b) => {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

/**
 * Safely erase sensitive data from memory
 * @param {string|array} data - Data to erase
 */
export const secureClear = (data) => {
  if (typeof data === 'string') {
    // Strings are immutable in JS, but we can at least help garbage collection
    return null;
  } else if (Array.isArray(data) || data instanceof Uint8Array) {
    // Zero out array
    for (let i = 0; i < data.length; i++) {
      data[i] = 0;
    }
  } else if (typeof data === 'object' && data !== null) {
    // Zero out object properties
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (Array.isArray(data[key])) {
          for (let i = 0; i < data[key].length; i++) {
            data[key][i] = 0;
          }
        }
        data[key] = null;
      }
    }
  }
};

/**
 * Helper: Convert buffer to base64
 */
const bufferToBase64 = (buffer) => {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
};

/**
 * Helper: Convert base64 to buffer
 */
const base64ToBuffer = (base64) => {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
};

/**
 * Helper: Convert buffer to hex
 */
const bufferToHex = (buffer) => {
  let hex = '';
  for (let i = 0; i < buffer.length; i++) {
    hex += buffer[i].toString(16).padStart(2, '0');
  }
  return hex;
};

export default {
  encryptData,
  decryptData,
  hashData,
  generateSecureToken,
  generateEncryptionKey,
  hashPassword,
  generateSalt,
  computeHmac,
  verifyHmac,
  secureClear
};
