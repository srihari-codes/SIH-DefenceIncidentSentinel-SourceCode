const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user_id:            { type: String, required: true, unique: true },
  email_enabled:      { type: Boolean, default: true },
  sms_enabled:        { type: Boolean, default: false },
  complaint_updates:  { type: Boolean, default: true },
  system_alerts:      { type: Boolean, default: true },
  created_at:         { type: Date, default: Date.now },
  updated_at:         { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSettings', userSettingsSchema, 'user_settings');
