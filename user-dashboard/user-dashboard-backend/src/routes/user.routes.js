const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { validateProfileUpdate, validateNotificationSettings } = require('../middleware/validate');
const { ERROR_CODES } = require('../constants');
const { logAudit } = require('../utils/auditLogger');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');

const router = express.Router();

// ──────────────────────────────────────────────
// GET /api/user/profile
// ──────────────────────────────────────────────
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const user = await User.findOne({ user_id: userId }).lean();

    if (!user) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        success: false,
        message: 'User not found',
        error_code: ERROR_CODES.NOT_FOUND.code
      });
    }

    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        identifier: user.identifier,
        role: user.role,
        mobile: user.mobile || null
      }
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// PUT /api/user/profile
// Only full_name and mobile are editable
// ──────────────────────────────────────────────
router.put('/profile', requireAuth, validateProfileUpdate, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { full_name, mobile } = req.body;

    const updateFields = { updated_at: new Date() };
    if (full_name !== undefined) updateFields.full_name = full_name.trim();
    if (mobile !== undefined) updateFields.mobile = mobile.trim();

    const result = await User.updateOne(
      { user_id: userId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        success: false,
        message: 'User not found',
        error_code: ERROR_CODES.NOT_FOUND.code
      });
    }

    // Audit log
    await logAudit(userId, 'profile.update', 'user', userId);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /api/user/notification-settings
// ──────────────────────────────────────────────
router.get('/notification-settings', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;

    let settings = await UserSettings.findOne({ user_id: userId }).lean();

    // Return defaults if no settings stored yet
    if (!settings) {
      settings = {
        email_enabled: true,
        sms_enabled: false,
        complaint_updates: true,
        system_alerts: true
      };
    }

    res.json({
      success: true,
      data: {
        email_enabled: settings.email_enabled,
        sms_enabled: settings.sms_enabled,
        complaint_updates: settings.complaint_updates,
        system_alerts: settings.system_alerts
      }
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// PUT /api/user/notification-settings
// Upsert notification preferences
// ──────────────────────────────────────────────
router.put('/notification-settings', requireAuth, validateNotificationSettings, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { email_enabled, sms_enabled, complaint_updates, system_alerts } = req.body;

    const updateFields = { updated_at: new Date() };
    if (email_enabled !== undefined) updateFields.email_enabled = email_enabled;
    if (sms_enabled !== undefined) updateFields.sms_enabled = sms_enabled;
    if (complaint_updates !== undefined) updateFields.complaint_updates = complaint_updates;
    if (system_alerts !== undefined) updateFields.system_alerts = system_alerts;

    await UserSettings.updateOne(
      { user_id: userId },
      {
        $set: updateFields,
        $setOnInsert: { user_id: userId, created_at: new Date() }
      },
      { upsert: true }
    );

    // Audit log
    await logAudit(userId, 'notification_settings.update', 'user_settings', userId);

    res.json({
      success: true,
      message: 'Notification settings updated'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
