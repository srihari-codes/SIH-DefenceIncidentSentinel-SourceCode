import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create reusable transporter
const createTransporter = () => {
  // For Gmail testing
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
  
  // For production SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Fallback to console logging if no email config (development)
  console.warn('⚠️  No email configuration found. Emails will be logged to console.');
  return null;
};

const transporter = createTransporter();

// Generate secure verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Email templates
const getVerificationEmailHTML = (verificationUrl, userName, purpose = 'registration') => {
  const purposeText = purpose === 'registration' ? 'Complete Your Registration' : 'Verify Your Login';
  const actionText = purpose === 'registration' ? 'complete your registration' : 'verify your login';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
          .code-box { background: white; border: 2px dashed #cbd5e1; padding: 20px; margin: 20px 0; text-align: center; font-family: monospace; font-size: 16px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Defence Incident Sentinel</h1>
            <p>${purposeText}</p>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>We received a request to ${actionText} for the Defence Incident Sentinel Portal. To proceed, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>

            <div class="code-box">
              <strong>Or copy this link to your browser:</strong><br>
              ${verificationUrl}
            </div>

            <div class="warning">
              <strong>⏰ Important:</strong> This verification link will expire in <strong>15 minutes</strong> for security purposes.
            </div>

            <p>If you did not request this ${purpose}, please ignore this email or contact the system administrator if you have concerns.</p>

            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Never share this verification link with anyone</li>
              <li>Only click links from official @gov.in or @mil.in emails</li>
              <li>Report suspicious activity to your security officer</li>
            </ul>

            <p>Thank you,<br><strong>Defence Cyber Security Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Defence Incident Sentinel Portal.</p>
            <p>Ministry of Defence | Government of India</p>
            <p>&copy; ${new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const getVerificationEmailText = (verificationUrl, userName, purpose = 'registration') => {
  const actionText = purpose === 'registration' ? 'complete your registration' : 'verify your login';
  
  return `
Defence Incident Sentinel - Email Verification

Hello ${userName},

We received a request to ${actionText} for the Defence Incident Sentinel Portal.

To verify your email address, please click the following link or copy it to your browser:

${verificationUrl}

⏰ IMPORTANT: This link will expire in 15 minutes.

If you did not request this ${purpose}, please ignore this email.

Security Tips:
- Never share this verification link with anyone
- Only click links from official @gov.in or @mil.in emails
- Report suspicious activity to your security officer

Thank you,
Defence Cyber Security Team

---
Ministry of Defence | Government of India
© ${new Date().getFullYear()} All rights reserved
  `;
};

// Send verification email
const sendVerificationEmail = async (email, userName, verificationToken, purpose = 'registration') => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.GMAIL_USER || '"Defence Portal" <noreply@defence.gov.in>',
      to: email,
      subject: purpose === 'registration' 
        ? '🔐 Verify Your Email - Defence Portal Registration'
        : '🔐 Verify Your Email - Defence Portal Login',
      text: getVerificationEmailText(verificationUrl, userName, purpose),
      html: getVerificationEmailHTML(verificationUrl, userName, purpose)
    };

    if (!transporter) {
      // Development mode - log to console
      console.log('\n📧 ===== EMAIL WOULD BE SENT =====');
      console.log('To:', email);
      console.log('Subject:', mailOptions.subject);
      console.log('Verification URL:', verificationUrl);
      console.log('Token:', verificationToken);
      console.log('==================================\n');
      return { success: true, message: 'Email logged to console (dev mode)' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Verification email sent successfully'
    };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email: ' + error.message);
  }
};

// Send TOTP setup completion email
const sendTotpSetupEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.GMAIL_USER || '"Defence Portal" <noreply@defence.gov.in>',
      to: email,
      subject: '✅ TOTP Authentication Setup Complete',
      text: `
Hello ${userName},

Your TOTP (Time-based One-Time Password) authentication has been successfully configured for your Defence Portal account.

From now on, you'll need to provide a code from your authenticator app along with your password when logging in.

If you did not set up TOTP authentication, please contact the system administrator immediately.

Thank you,
Defence Cyber Security Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>✅ TOTP Authentication Setup Complete</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Your TOTP (Time-based One-Time Password) authentication has been successfully configured for your Defence Portal account.</p>
          <p>From now on, you'll need to provide a code from your authenticator app along with your password when logging in.</p>
          <p style="color: #dc2626;"><strong>If you did not set up TOTP authentication, please contact the system administrator immediately.</strong></p>
          <p>Thank you,<br><strong>Defence Cyber Security Team</strong></p>
        </div>
      `
    };

    if (!transporter) {
      console.log('\n📧 ===== TOTP SETUP EMAIL =====');
      console.log('To:', email);
      console.log('Subject:', mailOptions.subject);
      console.log('==============================\n');
      return { success: true, message: 'Email logged to console (dev mode)' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ TOTP setup email sent:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending TOTP setup email:', error);
    // Don't throw - this is a non-critical notification
    return { success: false, error: error.message };
  }
};

export {
  generateVerificationToken,
  sendVerificationEmail,
  sendTotpSetupEmail
};
