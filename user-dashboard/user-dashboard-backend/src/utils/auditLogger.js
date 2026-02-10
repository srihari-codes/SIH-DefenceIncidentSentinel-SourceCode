const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const AuditLog = require('../models/AuditLog');

// In-memory last hash for chaining (per server restart).
// In production, fetch the latest from DB on startup.
let lastHash = '0'.repeat(64);

/**
 * Create an audit log entry with hash chaining.
 *
 * @param {string} actorId  - user_id or 'system'
 * @param {string} action   - e.g. 'complaint.submit', 'profile.update'
 * @param {string} entity   - e.g. 'complaint', 'user'
 * @param {string} entityId - the ID of the entity acted upon
 */
const logAudit = async (actorId, action, entity, entityId) => {
  try {
    const prevHash = lastHash;
    const data = `${prevHash}|${actorId}|${action}|${entity}|${entityId}|${Date.now()}`;
    const currHash = crypto.createHash('sha256').update(data).digest('hex');

    await AuditLog.create({
      log_id: uuidv4(),
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      prev_hash: prevHash,
      curr_hash: currHash,
      timestamp: new Date()
    });

    lastHash = currHash;
  } catch (err) {
    console.error('[AUDIT] Failed to write audit log:', err.message);
  }
};

module.exports = { logAudit };
