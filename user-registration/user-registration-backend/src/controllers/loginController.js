const argon2 = require('argon2');
const speakeasy = require('speakeasy');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const { User, OTPSession, RefreshToken } = require('../models');
const config = require('../config/env');
const { encrypt, decrypt, generateOTP } = require('../utils/encryption');
const {
  setLoginChallenge,
  getLoginChallenge,
  clearLoginChallenge,
  setAccessToken,
  setRefreshToken
} = require('../utils/cookies');
const {
  validateEmailForRole,
  validateIdentifierForRole,
  normalizeEmail,
  normalizeIdentifier,
  isValidRole
} = require('../utils/validation');
const { sendLoginOTP } = require('../utils/email');

/**
 * Step 1: Identity Verification
 * POST /api/auth/login/identity
 */
async function identityStep(req, res) {
  try {
    const { role, identifier, email } = req.body;
    
    // Validate required fields
    if (!role || !identifier || !email) {
      return res.status(400).json({
        error: {
          message: 'Role, identifier, and email are required',
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
    
    // Normalize inputs
    const normalizedEmail = normalizeEmail(email);
    const normalizedIdentifier = normalizeIdentifier(identifier);
    
    // LENIENT MODE FOR PRESENTATION: Only check basic email format
    // Validate email for role
    // const emailValidation = validateEmailForRole(normalizedEmail, role);
    // if (!emailValidation.valid) {
    //   return res.status(400).json({
    //     error: {
    //       message: emailValidation.error,
    //       code: 'INVALID_EMAIL_DOMAIN'
    //     }
    //   });
    // }
    
    // LENIENT MODE FOR PRESENTATION: Skip identifier pattern validation
    // Validate identifier for role
    // const identifierValidation = validateIdentifierForRole(normalizedIdentifier, role);
    // if (!identifierValidation.valid) {
    //   return res.status(400).json({
    //     error: {
    //       message: identifierValidation.error,
    //       code: 'INVALID_IDENTIFIER'
    //     }
    //   });
    // }
    
    // Find user in database
    const user = await User.findOne({
      // email: normalizedEmail, // LENIENT MODE: Don't strictly match email, just role and identifier
      role: role,
      identifier: normalizedIdentifier
    });
    
    if (!user) {
      // Use generic message to prevent user enumeration
      return res.status(401).json({
        error: {
          message: 'Invalid credentials.',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }
    
    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        error: {
          message: 'Account is deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED'
        }
      });
    }
    
    // Check account lockout
    const lockoutStatus = user.getLockoutStatus();
    if (lockoutStatus.locked) {
      return res.status(403).json({
        error: {
          message: `Account locked until ${lockoutStatus.lockout_until.toISOString()}`,
          code: 'ACCOUNT_LOCKED'
        }
      });
    }
    
    // Create login challenge cookie
    setLoginChallenge(res, {
      uid: user.user_id,
      role: user.role,
      stage: 'IDENTITY'
    });
    
    return res.status(200).json({
      nextStep: 'PASSWORD',
      message: 'Identity verified. Proceed to password.'
    });
    
  } catch (error) {
    console.error('Login identity step error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
}

/**
 * Step 2: Password Verification
 * POST /api/auth/login/password
 */
async function passwordStep(req, res) {
  try {
    const { password } = req.body;
    
    // Validate required fields
    if (!password) {
      return res.status(400).json({
        error: {
          message: 'Password is required',
          code: 'MISSING_FIELDS'
        }
      });
    }
    
    // Verify challenge cookie
    const challenge = getLoginChallenge(req);
    if (!challenge || challenge.stage !== 'IDENTITY') {
      return res.status(403).json({
        error: {
          message: 'Invalid authentication state. Please start over.',
          code: 'INVALID_AUTH_STATE'
        }
      });
    }
    
    // Find user
    const user = await User.findOne({ user_id: challenge.uid });
    if (!user) {
      clearLoginChallenge(res);
      return res.status(401).json({
        error: {
          message: 'Invalid credentials.',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }
    
    // Check lockout again (in case it was set during this session)
    const lockoutStatus = user.getLockoutStatus();
    if (lockoutStatus.locked) {
      clearLoginChallenge(res);
      return res.status(403).json({
        error: {
          message: `Account locked for ${lockoutStatus.remaining_minutes} minutes due to multiple failed attempts.`,
          code: 'ACCOUNT_LOCKED'
        }
      });
    }
    
    // Verify password with Argon2
    let isPasswordValid = false;
    try {
      isPasswordValid = await argon2.verify(user.password_hash, password);
    } catch (error) {
      console.error('Password verification error:', error);
      isPasswordValid = false;
    }
    
    if (!isPasswordValid) {
      // Increment failed attempts
      const newFailedAttempts = await user.incrementFailedAttempts(
        config.security.maxLoginAttempts,
        config.security.lockoutDuration
      );
      
      const attemptsRemaining = config.security.maxLoginAttempts - newFailedAttempts;
      
      if (attemptsRemaining <= 0) {
        clearLoginChallenge(res);
        return res.status(403).json({
          error: {
            message: 'Account locked for 60 minutes due to multiple failed attempts.',
            code: 'ACCOUNT_LOCKED'
          }
        });
      }
      
      return res.status(401).json({
        error: {
          message: `Invalid password. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`,
          code: 'INVALID_PASSWORD'
        }
      });
    }
    
    // Update challenge cookie to PASSWORD stage
    setLoginChallenge(res, {
      uid: user.user_id,
      role: user.role,
      stage: 'PASSWORD',
      mfaMethod: user.mfa_method
    });
    
    return res.status(200).json({
      nextStep: 'MFA',
      mfaRequired: true,
      allowedMethods: [user.mfa_method]
    });
    
  } catch (error) {
    console.error('Login password step error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
}

/**
 * Step 3: MFA Verification
 * POST /api/auth/login/mfa
 */
async function mfaStep(req, res) {
  try {
    const { method, code, action } = req.body;
    
    // Verify challenge cookie
    const challenge = getLoginChallenge(req);
    if (!challenge || challenge.stage !== 'PASSWORD') {
      return res.status(403).json({
        error: {
          message: 'Invalid authentication state. Please start over.',
          code: 'INVALID_AUTH_STATE'
        }
      });
    }
    
    // Find user
    const user = await User.findOne({ user_id: challenge.uid });
    if (!user) {
      clearLoginChallenge(res);
      return res.status(401).json({
        error: {
          message: 'Invalid credentials.',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }
    
    // Handle EMAIL OTP - Send action
    if (method === 'EMAIL' && action === 'send_otp') {
      // LENIENT MODE: Allow Email OTP for everyone (even TOTP users) for presentation
      // if (user.mfa_method !== 'EMAIL') {
      //   return res.status(400).json({
      //     error: {
      //       message: 'Email OTP is not enabled for this account',
      //       code: 'INVALID_MFA_METHOD'
      //     }
      //   });
      // }
      
      // Generate and send OTP
      const otp = generateOTP();
      const hashedOtp = await bcrypt.hash(otp, 10);
      
      await OTPSession.createOTP(user.email, hashedOtp, 'login_mfa', 5);
      await sendLoginOTP(user.email, otp);
      
      return res.status(200).json({
        message: 'OTP sent to your email',
        expiresIn: 300
      });
    }
    
    // Verify code is provided for verification
    if (!code) {
      return res.status(400).json({
        error: {
          message: 'Verification code is required',
          code: 'MISSING_FIELDS'
        }
      });
    }
    
    let isCodeValid = false;
    
    // Handle TOTP verification
    // LENIENT MODE: Prioritize requested method over challenge default
    if (method === 'TOTP' || (!method && challenge.mfaMethod === 'TOTP')) {
      if (!user.totp_secret) {
        return res.status(400).json({
          error: {
            message: 'TOTP is not set up for this account',
            code: 'TOTP_NOT_CONFIGURED'
          }
        });
      }
      
      try {
        const decryptedSecret = decrypt(user.totp_secret);
        isCodeValid = speakeasy.totp.verify({
          secret: decryptedSecret,
          encoding: 'base32',
          token: code,
          window: 1 // Allow 30s clock skew
        });
      } catch (error) {
        console.error('TOTP verification error:', error);
        isCodeValid = false;
      }
    }
    // Handle EMAIL OTP verification
    else if (method === 'EMAIL' || (!method && challenge.mfaMethod === 'EMAIL')) {
      const otpSession = await OTPSession.findLatestValid(user.email, 'login_mfa');
      
      if (!otpSession) {
        return res.status(400).json({
          error: {
            message: 'OTP expired. Request a new code.',
            code: 'OTP_EXPIRED'
          }
        });
      }
      
      try {
        isCodeValid = await bcrypt.compare(code, otpSession.otp_code);
      } catch (error) {
        console.error('OTP verification error:', error);
        isCodeValid = false;
      }
      
      // Delete used OTP
      if (isCodeValid) {
        await OTPSession.deleteForEmailAndPurpose(user.email, 'login_mfa');
      }
    }
    
    if (!isCodeValid) {
      return res.status(401).json({
        error: {
          message: 'Invalid verification code',
          code: 'INVALID_TOTP'
        }
      });
    }
    
    // MFA verified successfully - reset failed attempts
    await user.resetFailedAttempts();
    
    // Generate short-lived authorization code (30 seconds)
    const AuthCode = require('../models/AuthCode');
    const authCode = await AuthCode.createAuthCode(user.user_id, user.role, 30);
    
    // Get redirect URL based on role
    const redirectUrl = config.dashboards[user.role] || config.dashboards.personnel;
    
    // Clear login challenge
    clearLoginChallenge(res);
    
    return res.status(200).json({
      message: 'Authentication successful',
      redirect_url: `${redirectUrl}/callback?code=${authCode}`,
      code: authCode,
      expires_in: 30
    });
    
  } catch (error) {
    console.error('Login MFA step error:', error);
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
  passwordStep,
  mfaStep
};
