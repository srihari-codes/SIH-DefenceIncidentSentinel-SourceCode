import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 120,
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        const cleaned = v.replace(/[^0-9]/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
      },
      message: 'Mobile number must be 10-15 digits'
    },
  },
  officialEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
  },
  role: {
    type: String,
    required: true,
    enum: ['personnel', 'family', 'veteran', 'cert', 'admin'],
  },
  credentialId: {
    type: String,
    required: true,
    trim: true,
  },
  authMethod: {
    type: String,
    required: true,
    enum: ['authenticator', 'email'],
  },
  passwordHash: {
    type: String,
    required: true,
    match: /^\$2[aby]\$[0-9]{2}\$[./0-9A-Za-z]{53}$/,
  },
  totpSecret: {
    type: String,
    default: null,
  },
  backupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false,
    },
  }],
  isActivated: {
    type: Boolean,
    required: true,
    default: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
  },
  emailVerificationExpiry: {
    type: Date,
    default: null,
  },
  lastVerificationEmailSent: {
    type: Date,
    default: null,
  },
  activation: {
    activationOtpHash: {
      type: String,
      default: null,
    },
    lastOtpSentAt: {
      type: Date,
      default: null,
    },
    lastOtpVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  strict: true,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
});

// Index for faster queries
userSchema.index({ officialEmail: 1 });
userSchema.index({ credentialId: 1 });
userSchema.index({ emailVerificationToken: 1 });

// TTL index for auto-cleanup of expired tokens
userSchema.index({ emailVerificationExpiry: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.model('User', userSchema);
export default User;
