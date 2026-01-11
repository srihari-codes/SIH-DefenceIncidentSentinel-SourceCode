import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { registerLimiter, loginLimiter } from '../middleware/rateLimiter.js';
import { validateRegistration, validateLogin } from '../middleware/validator.js';
import { securityLogger } from '../middleware/logger.js';
import { generateVerificationToken, sendVerificationEmail, sendTotpSetupEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register', registerLimiter, validateRegistration, async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobile,
      serviceId,
      role,
      password,
      mfaMethod,
      totpSecret,
      backupCodes,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !mobile || !serviceId || !role || !password || !mfaMethod) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ officialEmail: email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare backup codes if provided
    const formattedBackupCodes = backupCodes?.map(code => ({
      code,
      used: false,
    })) || [];

    // Create new user
    const user = new User({
      fullName,
      officialEmail: email,
      mobileNumber: mobile,
      credentialId: serviceId,
      role,
      passwordHash: hashedPassword,
      authMethod: mfaMethod === 'totp' ? 'authenticator' : 'email',
      totpSecret: mfaMethod === 'totp' ? totpSecret : null,
      backupCodes: formattedBackupCodes,
      isActivated: false, // Changed to false - requires email verification
      emailVerified: false, // New field
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await user.save();

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiryMinutes = parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || '15');
    const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = expiryDate;
    user.lastVerificationEmailSent = new Date();
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, fullName, verificationToken, 'registration');
      
      // Send TOTP setup confirmation if applicable
      if (mfaMethod === 'totp') {
        await sendTotpSetupEmail(email, fullName);
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Log security event
    securityLogger('user_registered', {
      userId: user._id,
      email: user.officialEmail,
      role: user.role,
      authMethod: user.authMethod,
      emailVerified: false,
    });

    // Don't generate JWT yet - requires email verification first
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      requiresEmailVerification: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.officialEmail,
        role: user.role,
        mfaMethod: user.authMethod,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Find user by email or credential ID
    const user = await User.findOne({
      $or: [
        { officialEmail: identifier.toLowerCase() },
        { credentialId: identifier.toUpperCase() }
      ],
      role: role,
    });

    if (!user) {
      securityLogger('login_failed', {
        identifier,
        role,
        reason: 'user_not_found',
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      securityLogger('login_failed', {
        userId: user._id,
        email: user.officialEmail,
        reason: 'invalid_password',
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is activated
    if (!user.isActivated) {
      return res.status(403).json({
        success: false,
        message: 'Account not activated. Contact administrator.',
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please check your email for verification link.',
        requiresEmailVerification: true,
        email: user.officialEmail,
      });
    }

    securityLogger('login_success', {
      userId: user._id,
      email: user.officialEmail,
      role: user.role,
    });

    // Return user data (MFA verification happens on frontend)
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.officialEmail,
        role: user.role,
        mfaEnabled: true,
        mfaMethod: user.authMethod,
        totpSecret: user.authMethod === 'authenticator' ? user.totpSecret : undefined,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
});

/**
 * Verify MFA and complete login
 * POST /api/auth/verify-mfa
 */
router.post('/verify-mfa', async (req, res) => {
  try {
    const { userId, code, method } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      message: 'MFA verified',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during MFA verification',
    });
  }
});

/**
 * Send email verification link
 * POST /api/auth/send-verification
 */
router.post('/send-verification', registerLimiter, async (req, res) => {
  try {
    const { email, purpose = 'registration' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user
    const user = await User.findOne({ officialEmail: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already verified
    if (user.emailVerified && purpose === 'registration') {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Rate limiting - max 3 emails per 15 minutes
    if (user.lastVerificationEmailSent) {
      const timeSinceLastEmail = Date.now() - user.lastVerificationEmailSent.getTime();
      const RATE_LIMIT = 5 * 60 * 1000; // 5 minutes
      
      if (timeSinceLastEmail < RATE_LIMIT) {
        const waitTime = Math.ceil((RATE_LIMIT - timeSinceLastEmail) / 1000 / 60);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} minute(s) before requesting another verification email`,
        });
      }
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiryMinutes = parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || '15');
    const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save token to user
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = expiryDate;
    user.lastVerificationEmailSent = new Date();
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, user.fullName, verificationToken, purpose);

    securityLogger('email_verification_sent', {
      userId: user._id,
      email: user.officialEmail,
      purpose,
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      expiresIn: expiryMinutes,
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message,
    });
  }
});

/**
 * Verify email with token
 * GET /api/auth/verify-email/:token
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    securityLogger('email_verified', {
      userId: user._id,
      email: user.officialEmail,
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.officialEmail,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message,
    });
  }
});

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
router.post('/resend-verification', registerLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user
    const user = await User.findOne({ officialEmail: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Rate limiting
    if (user.lastVerificationEmailSent) {
      const timeSinceLastEmail = Date.now() - user.lastVerificationEmailSent.getTime();
      const RATE_LIMIT = 2 * 60 * 1000; // 2 minutes
      
      if (timeSinceLastEmail < RATE_LIMIT) {
        const waitTime = Math.ceil((RATE_LIMIT - timeSinceLastEmail) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before resending`,
        });
      }
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const expiryMinutes = parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || '15');
    const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = expiryDate;
    user.lastVerificationEmailSent = new Date();
    await user.save();

    // Send email
    await sendVerificationEmail(email, user.fullName, verificationToken, 'registration');

    res.json({
      success: true,
      message: 'Verification email resent successfully',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
    });
  }
});

export default router;
