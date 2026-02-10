const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const aiClassificationSchema = new mongoose.Schema({
  classification_id: {
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
  
  predicted_category: {
    type: String,
    required: true
  },
  
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1 // Assuming 0-1 for probability/confidence
  },
  
  explanation_ref: {
    type: String // SHAP output reference or path
  }
  
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false // Schema only specifies created_at
  }
});

module.exports = mongoose.model('AiClassification', aiClassificationSchema, 'ai_classifications');
