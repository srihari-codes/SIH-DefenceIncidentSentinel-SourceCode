const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const complaintSchema = new mongoose.Schema({
  complaint_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true,
    index: true
  },
  
  submitted_by: {
    type: String, // UUID of user
    required: true,
    index: true
  },
  
  category: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  incident_timestamp: {
    type: Date,
    required: true
  },
  
  status: {
    type: String,
    enum: ['submitted', 'analysing', 'investigating', 'closed'],
    default: 'submitted',
    required: true
  },
  
  risk_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: null
  },
  
  tracking_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  }
  
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Complaint', complaintSchema, 'complaints');
