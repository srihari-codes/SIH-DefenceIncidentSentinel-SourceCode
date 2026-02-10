const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const playbookSchema = new mongoose.Schema({
  playbook_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true,
    index: true
  },
  
  complaint_id: {
    type: String, // UUID of complaint
    required: true,
    index: true
  },
  
  steps: {
    type: mongoose.Schema.Types.Mixed, // JSON
    required: true
  },
  
  approved_by: {
    type: String, // UUID of user (nullable)
    default: null
  },
  
  version: {
    type: Number,
    default: 1
  }
  
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false // Schema only specifies created_at
  }
});

module.exports = mongoose.model('Playbook', playbookSchema, 'playbooks');
