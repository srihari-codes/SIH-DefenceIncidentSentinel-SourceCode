const argon2 = require('argon2');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');

const { User, OTPSession } = require('../models');
const config = require('../config/env');
const { encrypt, decrypt, generateOTP, generateBackupCodes } = require('../utils/encryption');
const {
  setRegistrationChallenge,
  getRegistrationChallenge,
  clearRegistrationChallenge
} = require('../utils/cookies');
const {
  validateEmailForRole,
  validateIdentifierForRole,
  validatePassword,
  validateMfaMethodForRole,
  normalizeEmail,
  normalizeIdentifier,
  normalizeMobile,
  isValidRole,
  isValidEmailFormat
} = require('../utils/validation');
const { sendVerificationOTP, sendActivationOTP } = require('../utils/email');

/**
 * Step 1a: Send Email Verification
 * Step 1b: Submit Identity
 * POST /api/auth/register/identity
 */
async function identityStep(req, res) {
  try {
    const { email, action, full_name, mobile, email_verification_code } = req.body;
    
    // Step 1a: Send verification code
    if (action === 'send_verification') {
      if (!email) {
        return res.status(400).json({
          error: {
            message: 'Email is required',
            code: 'MISSING_FIELDS'
          }
        });
      }
      
      const normalizedEmail = normalizeEmail(email);
      
      // Validate email format
      if (!isValidEmailFormat(normalizedEmail)) {
        return res.status(400).json({
          error: {
            message: 'Invalid email format',
            code: 'INVALID_EMAIL'
          }
        });
      }
      
      // Check if email already exists
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          error: {
            message: 'Email already registered',
            code: 'EMAIL_EXISTS'
          }
        });
      }
      
      // Generate and send OTP
      const otp = generateOTP();
      const hashedOtp = await bcrypt.hash(otp, 10);
      
      await OTPSession.createOTP(normalizedEmail, hashedOtp, 'email_verification', 5);
      await sendVerificationOTP(normalizedEmail, otp);
      
      return res.status(200).json({
        message: 'Verification code sent to your email',
        expiresIn: 300
      });
    }
    
    // Step 1b: Verify OTP and create registration challenge
    if (!email || !full_name || !mobile || !email_verification_code) {
      return res.status(400).json({
        error: {
          message: 'Email, full name, mobile, and verification code are required',
          code: 'MISSING_FIELDS'
        }
      });
    }
    
    const normalizedEmail = normalizeEmail(email);
    const normalizedMobile = normalizeMobile(mobile);
    
    // Validate mobile format (10-15 digits)
    if (!/^\+?\d{10,15}$/.test(normalizedMobile)) {
      return res.status(400).json({
        error: {
          message: 'Invalid mobile number format',
          code: 'INVALID_MOBILE'
        }
      });
    }
    
    // Verify OTP
    const otpSession = await OTPSession.findLatestValid(normalizedEmail, 'email_verification');
    if (!otpSession) {
      return res.status(400).json({
        error: {
          message: 'OTP expired or invalid. Please request a new code.',
          code: 'OTP_EXPIRED'
        }
      });
    }
    
    const isValidOtp = await bcrypt.compare(email_verification_code, otpSession.otp_code);
    if (!isValidOtp) {
      return res.status(400).json({
        error: {
          message: 'Invalid verification code',
          code: 'INVALID_OTP'
        }
      });
    }
    
    // Delete used OTP
    await OTPSession.deleteForEmailAndPurpose(normalizedEmail, 'email_verification');
    
    // Create registration challenge cookie
    setRegistrationChallenge(res, {
      stage: 'IDENTITY',
      email: normalizedEmail,
      full_name: full_name.trim(),
      mobile: normalizedMobile,
      email_verified: true
    });
    
    return res.status(200).json({
      nextStep: 'SERVICE',
      message: 'Email verified successfully'
    });
    
  } catch (error) {
    console.error('Registration identity step error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
}

/**
 * Step 2: Service Details
 * POST /api/auth/register/service
 */
async function serviceStep(req, res) {
  try {
    const { role, identifier } = req.body;
    
    // Verify challenge cookie
    const challenge = getRegistrationChallenge(req);
    if (!challenge || challenge.stage !== 'IDENTITY') {
      return res.status(403).json({
        error: {
          message: 'Invalid registration state. Please start over.',
          code: 'INVALID_AUTH_STATE'
        }
      });
    }
    
    // Get client IP address
    const clientIp = req.ip || 
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress;
    
    // Check IP whitelist for admin and CERT roles
    if (role === 'admin' && config.ipWhitelist.admin.length > 0) {
      if (!config.ipWhitelist.admin.includes(clientIp)) {
        return res.status(403).json({
          error: {
            message: 'Admin registration is only allowed from authorized IP addresses.',
            code: 'IP_NOT_AUTHORIZED',
            details: { clientIp }
          }
        });
      }
    }
    
    if (role === 'cert' && config.ipWhitelist.cert.length > 0) {
      if (!config.ipWhitelist.cert.includes(clientIp)) {
        return res.status(403).json({
          error: {
            message: 'CERT registration is only allowed from authorized IP addresses.',
            code: 'IP_NOT_AUTHORIZED',
            details: { clientIp }
          }
        });
      }
    }
    
    // Validate required fields
    if (!role || !identifier) {
      return res.status(400).json({
        error: {
          message: 'Role and identifier are required',
          code: 'MISSING_FIELDS'
        }
      });
    }
    
    // Validate role
    if (!isValidRole(role)) {
      return res.status(400).json({
        error: {
          message: 'Invalid role',
          code: 'INVALID_ROLE'
        }
      });
    }
    
    // Normalize identifier
    const normalizedIdentifier = normalizeIdentifier(identifier);
    
    // Validate identifier for role
    const identifierValidation = validateIdentifierForRole(normalizedIdentifier, role);
    if (!identifierValidation.valid) {
      return res.status(400).json({
        error: {
          message: identifierValidation.error,
          code: 'INVALID_IDENTIFIER'
        }
      });
    }
    
    // Validate email for role (already verified, but check domain restrictions)
    const emailValidation = validateEmailForRole(challenge.email, role);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: {
          message: emailValidation.error,
          code: 'INVALID_EMAIL_DOMAIN'
        }
      });
    }
    
    // Check if identifier already exists for this role
    const existingUser = await User.findOne({
      identifier: normalizedIdentifier,
      role: role
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: {
          message: 'Identifier already in use for this role',
          code: 'IDENTIFIER_EXISTS'
        }
      });
    }
    
    // Update challenge cookie
    setRegistrationChallenge(res, {
      ...challenge,
      stage: 'SERVICE',
      role: role,
      identifier: normalizedIdentifier
    });
    
    // Include warning for family role with non-defence email
    const response = { nextStep: 'SECURITY' };
    if (emailValidation.warning) {
      response.warning = emailValidation.warning;
    }
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Registration service step error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
}

/**
 * Step 3: Security Setup
 * POST /api/auth/register/security
 */
async function securityStep(req, res) {
  try {
    const { password, mfa_method, terms_accepted } = req.body;
    
    // Verify challenge cookie
    const challenge = getRegistrationChallenge(req);
    if (!challenge || challenge.stage !== 'SERVICE') {
      return res.status(403).json({
        error: {
          message: 'Invalid registration state. Please start over.',
          code: 'INVALID_AUTH_STATE'
        }
      });
    }
    
    // Validate required fields
    if (!password || !mfa_method || terms_accepted !== true) {
      return res.status(400).json({
        error: {
          message: 'Password, MFA method, and terms acceptance are required',
          code: 'MISSING_FIELDS'
        }
      });
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: {
          message: passwordValidation.error,
          code: 'INVALID_PASSWORD'
        }
      });
    }
    
    // Validate MFA method for role
    const mfaValidation = validateMfaMethodForRole(mfa_method, challenge.role);
    if (!mfaValidation.valid) {
      return res.status(400).json({
        error: {
          message: mfaValidation.error,
          code: 'INVALID_MFA_METHOD'
        }
      });
    }
    
    // Hash password with Argon2id
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: config.security.argon2.memoryCost,
      timeCost: config.security.argon2.timeCost,
      parallelism: config.security.argon2.parallelism
    });
    
    // Update challenge cookie
    setRegistrationChallenge(res, {
      ...challenge,
      stage: 'SECURITY',
      mfa_method: mfa_method,
      password_hash: passwordHash
    });
    
    return res.status(200).json({
      nextStep: 'ACTIVATE'
    });
    
  } catch (error) {
    console.error('Registration security step error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
}

/**
 * Step 4: Activation
 * POST /api/auth/register/activate
 */
async function activateStep(req, res) {
  try {
    const { action, totp_verification_code, email_otp_code } = req.body;
    
    // Verify challenge cookie
    const challenge = getRegistrationChallenge(req);
    if (!challenge || challenge.stage !== 'SECURITY') {
      return res.status(403).json({
        error: {
          message: 'Invalid registration state. Please start over.',
          code: 'INVALID_AUTH_STATE'
        }
      });
    }
    
    // Handle TOTP setup
    if (challenge.mfa_method === 'TOTP') {
      // Generate TOTP secret and QR code
      if (action === 'generate_totp') {
        const secret = speakeasy.generateSecret({
          name: `Defence Incident Sentinel (${challenge.email})`,
          issuer: 'Defence Incident Sentinel'
        });
        
        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);
        
        // Generate backup codes
        const backupCodes = generateBackupCodes(10);
        const hashedBackupCodes = await Promise.all(
          backupCodes.map(code => bcrypt.hash(code, 10))
        );
        
        // Store in challenge (encrypted)
        setRegistrationChallenge(res, {
          ...challenge,
          totp_secret: encrypt(secret.base32),
          backup_codes: hashedBackupCodes
        });
        
        return res.status(200).json({
          qr_code: qrCode,
          manual_entry_key: secret.base32,
          backup_codes: backupCodes
        });
      }
      
      // Verify TOTP code and complete registration
      if (totp_verification_code) {
        if (!challenge.totp_secret) {
          return res.status(400).json({
            error: {
              message: 'Please generate TOTP first',
              code: 'TOTP_NOT_GENERATED'
            }
          });
        }
        
        const decryptedSecret = decrypt(challenge.totp_secret);
        const isValidTotp = speakeasy.totp.verify({
          secret: decryptedSecret,
          encoding: 'base32',
          token: totp_verification_code,
          window: 1
        });
        
        if (!isValidTotp) {
          return res.status(400).json({
            error: {
              message: 'Invalid TOTP code',
              code: 'INVALID_TOTP'
            }
          });
        }
        
        // Create user in database
        const user = await User.create({
          full_name: challenge.full_name,
          email: challenge.email,
          mobile: challenge.mobile,
          identifier: challenge.identifier,
          role: challenge.role,
          password_hash: challenge.password_hash,
          mfa_method: challenge.mfa_method.toLowerCase(),
          totp_secret: challenge.totp_secret,
          backup_codes: challenge.backup_codes,
          is_verified: true,
          email_verified_at: new Date()
        });
        
        // Clear registration challenge
        clearRegistrationChallenge(res);
        
        // Generate short-lived authorization code
        const AuthCode = require('../models/AuthCode');
        const authCode = await AuthCode.createAuthCode(user.user_id, user.role, 30);
        
        // Get redirect URL based on role
        const redirectUrl = config.dashboards[user.role] || config.dashboards.personnel;
        
        return res.status(200).json({
          message: 'Registration complete! Redirecting to dashboard...',
          redirect_url: `${redirectUrl}/callback?code=${authCode}`,
          code: authCode,
          expires_in: 30
        });
      }
    }
    
    // Handle EMAIL OTP activation
    if (challenge.mfa_method === 'EMAIL') {
      // Send activation OTP
      if (action === 'send_otp') {
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        
        await OTPSession.createOTP(challenge.email, hashedOtp, 'registration', 5);
        await sendActivationOTP(challenge.email, otp);
        
        return res.status(200).json({
          message: 'Activation OTP sent to your email',
          expiresIn: 300
        });
      }
      
      // Verify OTP and complete registration
      if (email_otp_code) {
        const otpSession = await OTPSession.findLatestValid(challenge.email, 'registration');
        if (!otpSession) {
          return res.status(400).json({
            error: {
              message: 'OTP expired. Request a new code.',
              code: 'OTP_EXPIRED'
            }
          });
        }
        
        const isValidOtp = await bcrypt.compare(email_otp_code, otpSession.otp_code);
        if (!isValidOtp) {
          return res.status(400).json({
            error: {
              message: 'Invalid OTP code',
              code: 'INVALID_OTP'
            }
          });
        }
        
        // Delete used OTP
        await OTPSession.deleteForEmailAndPurpose(challenge.email, 'registration');
        
        // Create user in database
        const user = await User.create({
          full_name: challenge.full_name,
          email: challenge.email,
          mobile: challenge.mobile,
          identifier: challenge.identifier,
          role: challenge.role,
          password_hash: challenge.password_hash,
          mfa_method: challenge.mfa_method.toLowerCase(),
          is_verified: true,
          email_verified_at: new Date()
        });
        
        // Clear registration challenge
        clearRegistrationChallenge(res);
        
        // Generate short-lived authorization code
        const AuthCode = require('../models/AuthCode');
        const authCode = await AuthCode.createAuthCode(user.user_id, user.role, 30);
        
        // Get redirect URL based on role
        const redirectUrl = config.dashboards[user.role] || config.dashboards.personnel;
        
        return res.status(200).json({
          message: 'Registration complete! Redirecting to dashboard...',
          redirect_url: `${redirectUrl}/callback?code=${authCode}`,
          code: authCode,
          expires_in: 30
        });
      }
    }
    
    return res.status(400).json({
      error: {
        message: 'Invalid action or missing verification code',
        code: 'INVALID_REQUEST'
      }
    });
    
  } catch (error) {
    console.error('Registration activate step error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          message: 'Email or identifier already exists',
          code: 'DUPLICATE_ERROR'
        }
      });
    }
    
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
}

module.exports = {
  identityStep,
  serviceStep,
  securityStep,
  activateStep
};
