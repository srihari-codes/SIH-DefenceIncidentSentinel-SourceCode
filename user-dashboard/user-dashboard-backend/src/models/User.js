const mongoose = require('mongoose');

// Shared schema definition to ensure consistency
// Ideally this would be a shared package, but duplicating for now to keep independent
const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true, index: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  mobile: { type: String },
  identifier: { type: String, required: true, uppercase: true },
  backup_codes: { type: [String], default: [] },
  lockout_until: { type: Date, default: null },
  email_verified_at: { type: Date, default: null },
  last_login: { type: Date, default: null },
  role: { 
    type: String, 
    enum: ['personnel', 'family', 'veteran', 'cert', 'admin'], 
    required: true,
    index: true 
  },
  password_hash: { type: String, required: true },
  mfa_method: { type: String, enum: ['totp', 'email'], default: 'email' },
  totp_secret: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false },
  failed_attempts: { type: Number, default: 0 },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('User', userSchema);
