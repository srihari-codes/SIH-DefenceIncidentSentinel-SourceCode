const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  // Primary identification
  user_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    index: true
  },
  
  // Identity fields
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
    trim: true
  },
  
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  
  // Role-specific identifier (service number, PPO, CERT ID, etc.)
  identifier: {
    type: String,
    required: [true, 'Identifier is required'],
    uppercase: true,
    trim: true
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
  
  // Authentication
  password_hash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  
  mfa_method: {
    type: String,
    required: [true, 'MFA method is required'],
    enum: {
      values: ['TOTP', 'EMAIL'],
      message: 'MFA method must be TOTP or EMAIL'
    }
  },
  
  // TOTP secret (encrypted) - only for TOTP users
  totp_secret: {
    type: String,
    default: null
  },
  
  // Backup codes (encrypted array) - for TOTP users
  backup_codes: {
    type: [String],
    default: []
  },
  
  // Account status
  is_active: {
    type: Boolean,
    default: true
  },
  
  is_verified: {
    type: Boolean,
    default: false
  },
  
  email_verified_at: {
    type: Date,
    default: null
  },
  
  // Security & lockout
  failed_attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  
  lockout_until: {
    type: Date,
    default: null
  },
  
  last_login: {
    type: Date,
    default: null
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
userSchema.methods.incrementFailedAttempts = async function(maxAttempts = 3, lockoutDurationMs = 3600000) {
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
