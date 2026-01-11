import mongoose, { Document, Schema } from 'mongoose';

export interface AimlRecordDocument extends Document {
  risk_score: number;
  risk_category: 'Low' | 'Medium' | 'High' | 'Critical';
  attack_type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  should_alert_user: boolean;
  summary: string[];
  description?: string | null;
  complaint_id?: string;
  complaintId?: string;
  tracking_id?: string;
  trackingId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const collectionName = process.env.MONGODB_AIML_TABLE || 'aiml_microservice_table';

const AimlRecordSchema = new Schema<AimlRecordDocument>(
  {
    risk_score: { type: Number, required: true, min: 0, max: 100 },
    risk_category: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    attack_type: { type: String, required: true, trim: true },
    priority: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    should_alert_user: { type: Boolean, required: true },
    summary: {
      type: [String],
      required: true,
      default: []
    }
  },
  {
    collection: collectionName,
    strict: false
  }
);

const AimlRecordModel =
  (mongoose.models && (mongoose.models as any).AimlRecord) ||
  mongoose.model<AimlRecordDocument>('AimlRecord', AimlRecordSchema);

export default AimlRecordModel;
