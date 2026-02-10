const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const caseAssignmentSchema = new mongoose.Schema({
  assignment_id: {
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
  
  analyst_id: {
    type: String, // FK -> users
    required: true,
    index: true
  },
  
  assigned_at: {
    type: Date,
    default: Date.now
  },
  
  status: {
    type: String,
    enum: ['open', 'in_progress', 'closed'],
    default: 'open'
  }
  
// Note: Schema doesn't specify created/updated_at explicitly beyond assigned_at, but Mongoose usually adds _id.
// We'll stick to strict schema: assigned_at effectively acts as created_at.
}, { _id: false }); // We use assignment_id as PK, so we can disable auto _id if we want, OR keep it but ignore it. 
// Mongoose requires an _id for subdocuments usually, but as a top level model it will create field _id: ObjectId.
// Since we have assignment_id: UUID, we can let Mongoose keep its _id or not. 
// Schema says "assignment_id UUID Primary key". Let's suppress default _id if possible or just ignore it.
// Actually, safer to keep default _id and just use assignment_id as our logical key like in other models.

module.exports = mongoose.model('CaseAssignment', caseAssignmentSchema, 'case_assignments');
