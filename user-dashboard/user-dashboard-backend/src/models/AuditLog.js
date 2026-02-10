const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const auditLogSchema = new mongoose.Schema({
  log_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true,
    index: true
  },
  
  actor_id: {
    type: String, // user_id or system_id
    required: true,
    index: true
  },
  
  action: {
    type: String, // e.g., "LOGIN", "CREATE_COMPLAINT"
    required: true
  },
  
  entity: {
    type: String, // e.g., "User", "Complaint"
    required: true
  },
  
  entity_id: {
    type: String,
    required: true
  },
  
  prev_hash: {
    type: String,
    default: null
  },
  
  curr_hash: {
    type: String,
    required: true
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema, 'audit_logs');
