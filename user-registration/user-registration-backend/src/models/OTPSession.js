const mongoose = require('mongoose');

const otpSessionSchema = new mongoose.Schema({
  // Target email
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Hashed OTP code
  otp_code: {
    type: String,
    required: [true, 'OTP code is required']
  },
  
  // Purpose of OTP
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    enum: {
      values: ['registration', 'login_mfa', 'email_verification'],
      message: 'Purpose must be one of: registration, login_mfa, email_verification'
    },
    index: true
  },
  
  // Expiry timestamp
  expires_at: {
    type: Date,
    required: [true, 'Expiry is required']
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false
  }
});

// Compound index for email + purpose lookups
otpSessionSchema.index({ email: 1, purpose: 1 });

// TTL index to auto-delete expired OTPs after 1 hour (cleanup buffer)
otpSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 3600 });

// Virtual for checking if OTP is expired
otpSessionSchema.virtual('isExpired').get(function() {
  return new Date() > this.expires_at;
});

// Static method to find latest valid OTP for email + purpose
otpSessionSchema.statics.findLatestValid = async function(email, purpose) {
  return this.findOne({
    email: email.toLowerCase(),
    purpose,
    expires_at: { $gt: new Date() }
  }).sort({ created_at: -1 });
};

// Static method to delete all OTPs for email + purpose
otpSessionSchema.statics.deleteForEmailAndPurpose = async function(email, purpose) {
  return this.deleteMany({
    email: email.toLowerCase(),
    purpose
  });
};

// Static method to create new OTP session
otpSessionSchema.statics.createOTP = async function(email, hashedOtp, purpose, expiryMinutes = 5) {
  // Delete any existing OTPs for this email + purpose first
  await this.deleteForEmailAndPurpose(email, purpose);
  
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  return this.create({
    email: email.toLowerCase(),
    otp_code: hashedOtp,
    purpose,
    expires_at: expiresAt
  });
};

const OTPSession = mongoose.model('OTPSession', otpSessionSchema);

module.exports = OTPSession;
