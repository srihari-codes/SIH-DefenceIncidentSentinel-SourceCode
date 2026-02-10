const nodemailer = require('nodemailer');
const config = require('../config/env');

// In development, we use a mock transport that logs to console
const isDevelopment = config.nodeEnv === 'development';

// Create transporter based on configuration and environment
let transporter;

// Check if SMTP configuration is provided (even in development)
const hasSmtpConfig = config.smtp.user && config.smtp.password && config.smtp.host;

if (isDevelopment && process.env.USE_REAL_EMAIL !== 'true') {
  // Development (Default): Log emails to console
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('\n========== EMAIL (Development Mode) ==========');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body:\n${mailOptions.text || mailOptions.html}`);
      console.log('==============================================\n');
      
      // If SMTP config is present, also suggest switching to it
      if (hasSmtpConfig) {
        console.log('TIP: To send real emails in development, set USE_REAL_EMAIL=true in your .env\n');
      }
      
      return { messageId: 'dev-message-id' };
    }
  };
} else {
  // Production or explicitly enabled development SMTP
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password
    }
  });
}

// Mandatory SMTP Debug Test
if (transporter.verify) {
  transporter.verify()
    .then(() => console.log("SMTP authentication successful"))
    .catch((err) => {
      console.error("\n!!!!!!!!!! SMTP VERIFICATION FAILED !!!!!!!!!!");
      console.error("The credentials in your .env are likely incorrect.");
      console.error("Error:", err.message);
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n");
    });
}

/**
 * Send email verification OTP
 */
async function sendVerificationOTP(email, otp) {
  const mailOptions = {
    from: `"Defence Incident Sentinel" <noreply@gov.in>`,
    to: email,
    subject: 'Defence Incident Sentinel - Email Verification',
    text: `Your verification code is: ${otp}\n\nThis code is valid for 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f0f4f8; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2d3748;">
          ${otp}
        </div>
        <p style="color: #718096; margin-top: 20px;">This code is valid for 5 minutes.</p>
        <p style="color: #718096;">If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #a0aec0; font-size: 12px;">Defence Incident Sentinel - Secure Authentication System</p>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.info(`[EmailService] Verification OTP successfully dispatched to ${email}. ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`[EmailService] Delivery FAILURE to ${email} (Verification OTP):`, error);
    throw error;
  }
}

/**
 * Send login MFA OTP
 */
async function sendLoginOTP(email, otp) {
  const mailOptions = {
    from: `"Defence Incident Sentinel" <noreply@gov.in>`,
    to: email,
    subject: 'Defence Incident Sentinel - Login OTP',
    text: `Your login OTP is: ${otp}\n\nThis code is valid for 5 minutes.\n\nIf you did not attempt to login, please change your password immediately.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Login Verification</h2>
        <p>Your login OTP is:</p>
        <div style="background-color: #f0f4f8; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2d3748;">
          ${otp}
        </div>
        <p style="color: #718096; margin-top: 20px;">This code is valid for 5 minutes.</p>
        <p style="color: #e53e3e;">If you did not attempt to login, please change your password immediately.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #a0aec0; font-size: 12px;">Defence Incident Sentinel - Secure Authentication System</p>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.info(`[EmailService] Login OTP successfully dispatched to ${email}. ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`[EmailService] Delivery FAILURE to ${email} (Login OTP):`, error);
    throw error;
  }
}

/**
 * Send activation OTP for registration
 */
async function sendActivationOTP(email, otp) {
  const mailOptions = {
    from: `"Defence Incident Sentinel" <noreply@gov.in>`,
    to: email,
    subject: 'Defence Incident Sentinel - Activation OTP',
    text: `Your activation OTP is: ${otp}\n\nThis code is valid for 5 minutes.\n\nComplete your registration to access the Defence Incident Sentinel.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Complete Your Registration</h2>
        <p>Your activation OTP is:</p>
        <div style="background-color: #f0f4f8; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2d3748;">
          ${otp}
        </div>
        <p style="color: #718096; margin-top: 20px;">This code is valid for 5 minutes.</p>
        <p style="color: #38a169;">Complete your registration to access the Defence Incident Sentinel.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #a0aec0; font-size: 12px;">Defence Incident Sentinel - Secure Authentication System</p>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.info(`[EmailService] Activation OTP successfully dispatched to ${email}. ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`[EmailService] Delivery FAILURE to ${email} (Activation OTP):`, error);
    throw error;
  }
}

module.exports = {
  sendVerificationOTP,
  sendLoginOTP,
  sendActivationOTP
};
