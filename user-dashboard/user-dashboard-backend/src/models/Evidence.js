const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const evidenceSchema = new mongoose.Schema({
  evidence_id: {
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
  
  originalFileName: {
    type: String,
    required: true
  },
  
  mimeType: {
    type: String,
    required: true
  },
  
  fileSizeBytes: {
    type: Number,
    required: true
  },
  
  sha256: {
    type: String,
    required: true
  },
  
  storageProvider: {
    type: String,
    default: 'supabase',
    required: true
  },
  
  bucketName: {
    type: String,
    default: 'evidence', // e.g., evidence-quarantine
    required: true
  },
  
  storagePath: {
    type: String,
    required: true
  },
  
  uploadStatus: {
    type: String,
    enum: ['pending', 'uploaded', 'failed'],
    default: 'pending'
  },
  
  uploadedBy: {
    type: String, // UUID of user
    required: true
  },
  
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Evidence', evidenceSchema, 'evidences');
