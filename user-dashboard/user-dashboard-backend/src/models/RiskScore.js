const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const riskScoreSchema = new mongoose.Schema({
  score_id: {
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
  
  score: {
    type: Number,
    required: true
  },
  
  risk_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  
  scoring_model: {
    type: String // e.g., "RiskNet-v2"
  }
  
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false // Schema only specifies created_at
  }
});

module.exports = mongoose.model('RiskScore', riskScoreSchema, 'risk_scores');
