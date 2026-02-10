const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  // V3.0 Schema Fields
  user_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    index: true,
    required: true
  },

  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [255, 'Full name cannot exceed 255 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  mobile: {
    type: String,
    required: [false, 'Mobile number is optional'], // Changed to optional based on common patterns, but schema says String. Let's keep it safe.
    trim: true
  },

  identifier: {
    type: String,
    required: [true, 'Role-specific ID is required'],
    trim: true,
    uppercase: true
  },

  backup_codes: {
    type: [String],
    default: []
  },

  lockout_until: {
    type: Date,
    default: null
  },

  email_verified_at: {
    type: Date,
    default: null
  },

  last_login: {
    type: Date,
    default: null
  },

  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['personnel', 'family', 'veteran', 'cert', 'admin'],
      message: 'Role must be one of: personnel, family, veteran, cert, admin'
    },
    index: true
  },

  password_hash: {
    type: String,
    required: [true, 'Password hash is required']
  },

  mfa_method: {
    type: String,
    enum: {
      values: ['totp', 'email'],
      message: 'MFA method must be totp or email'
    },
    default: 'email'
  },

  totp_secret: {
    type: String,
    default: null
  },

  is_active: {
    type: Boolean,
    default: true
  },

  is_verified: {
    type: Boolean,
    default: false
  },

  failed_attempts: {
    type: Number,
    default: 0,
    min: 0
  }

}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Compound index for identifier + role (unique per role)
userSchema.index({ identifier: 1, role: 1 }, { unique: true });

// Index for lockout queries
userSchema.index({ lockout_until: 1 }, { sparse: true });

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  if (!this.lockout_until) return false;
  return new Date() < this.lockout_until;
});

// Method to check if account is locked and get remaining time
userSchema.methods.getLockoutStatus = function() {
  if (!this.lockout_until) {
    return { locked: false };
  }

  const now = new Date();
  if (now >= this.lockout_until) {
    return { locked: false };
  }

  const remainingMs = this.lockout_until.getTime() - now.getTime();
  const remainingMinutes = Math.ceil(remainingMs / 60000);

  return {
    locked: true,
    lockout_until: this.lockout_until,
    remaining_minutes: remainingMinutes
  };
};

// Method to increment failed attempts and potentially lock account
userSchema.methods.incrementFailedAttempts = async function(maxAttempts = 5, lockoutDurationMs = 300000) { // Default 5 attempts, 5 min lockout
  this.failed_attempts += 1;

  if (this.failed_attempts >= maxAttempts) {
    this.lockout_until = new Date(Date.now() + lockoutDurationMs);
  }

  await this.save();
  return this.failed_attempts;
};

// Method to reset failed attempts on successful login
userSchema.methods.resetFailedAttempts = async function() {
  this.failed_attempts = 0;
  this.lockout_until = null;
  this.last_login = new Date();
  await this.save();
};

// Don't return sensitive fields in JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.totp_secret;
  delete obj.backup_codes;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
