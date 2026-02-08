const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const authCodeSchema = new mongoose.Schema({
  // Authorization code (short-lived)
  code: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    index: true
  },
  
  // User ID this code belongs to
  user_id: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  
  // User role for redirect mapping
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['personnel', 'family', 'veteran', 'cert', 'admin']
  },
  
  // Whether code has been used
  used: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Expiry timestamp (30 seconds)
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

// TTL index to auto-delete expired codes after 1 minute (cleanup buffer)
authCodeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 60 });

// Virtual for checking if code is expired
authCodeSchema.virtual('isExpired').get(function() {
  return new Date() > this.expires_at;
});

// Virtual for checking if code is valid
authCodeSchema.virtual('isValid').get(function() {
  return !this.used && new Date() <= this.expires_at;
});

// Static method to create new auth code
authCodeSchema.statics.createAuthCode = async function(userId, role, expirySeconds = 30) {
  const expiresAt = new Date(Date.now() + expirySeconds * 1000);
  
  const authCode = await this.create({
    user_id: userId,
    role: role,
    expires_at: expiresAt
  });
  
  return authCode.code;
};

// Static method to validate and consume code
authCodeSchema.statics.validateAndConsume = async function(code) {
  const authCode = await this.findOne({
    code: code,
    used: false,
    expires_at: { $gt: new Date() }
  });
  
  if (!authCode) {
    return null;
  }
  
  // Mark as used
  authCode.used = true;
  await authCode.save();
  
  return {
    user_id: authCode.user_id,
    role: authCode.role
  };
};

const AuthCode = mongoose.model('AuthCode', authCodeSchema);

module.exports = AuthCode;
