const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const fileAnalysisSchema = new mongoose.Schema({
  analysis_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true,
    index: true
  },
  
  evidence_id: {
    type: String, // UUID of evidence
    required: true,
    index: true
  },
  
  identified_mimeType: {
    type: String
  },
  
  static_result: {
    type: String // YARA / ClamAV
  },
  
  sandbox_summary: {
    type: String // Behaviour
  },
  
  verdict: {
    type: String,
    enum: ['clean', 'suspicious', 'malicious'],
    required: true
  },
  
  model_version: {
    type: String // e.g., "v1.0.2"
  }
  
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false // Schema only specifies created_at
  }
});

module.exports = mongoose.model('FileAnalysis', fileAnalysisSchema, 'file_analysis_reports');
