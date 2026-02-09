const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const refreshTokenSchema = new mongoose.Schema({
  // Primary key
  token_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    index: true
  },
  
  // Foreign key to users
  user_id: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Hashed refresh token
  token_hash: {
    type: String,
    required: [true, 'Token hash is required']
  },
  
  // Expiry timestamp
  expires_at: {
    type: Date,
    required: [true, 'Expiry is required'],
    index: true
  },
  
  // Revocation status
  revoked: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false // We don't need updated_at for tokens
  }
});

// Compound index for user lookups
refreshTokenSchema.index({ user_id: 1, revoked: 1 });

// Virtual for checking if token is expired
refreshTokenSchema.virtual('isExpired').get(function() {
  return new Date() > this.expires_at;
});

// Virtual for checking if token is valid
refreshTokenSchema.virtual('isValid').get(function() {
  return !this.revoked && new Date() <= this.expires_at;
});

// Static method to revoke all tokens for a user
refreshTokenSchema.statics.revokeAllForUser = async function(userId) {
  return this.updateMany(
    { user_id: userId, revoked: false },
    { revoked: true }
  );
};

// Static method to clean up expired tokens
refreshTokenSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({ expires_at: { $lt: new Date() } });
};

// Static method to find valid token
refreshTokenSchema.statics.findValidToken = async function(tokenId) {
  return this.findOne({
    token_id: tokenId,
    revoked: false,
    expires_at: { $gt: new Date() }
  });
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
