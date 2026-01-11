import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Evidence {
  evidence_id: string;
}

export interface Playbook {
  user?: Record<string, any> | null;
  cert?: Record<string, any> | null;
}

export interface ComplaintDocument extends Document {
  submittedBy: Types.ObjectId;
  name: string;
  designation: string;
  department: string;
  location: string;
  complaintType: string;
  incidentDate: string;
  incidentTime: string;
  description: string;
  suspectedSource?: string | null;
  evidences?: Evidence[];
  status?: 'Pending' | 'In Review' | 'Resolved' | 'Rejected';
  assignedOfficer?: Types.ObjectId | null;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical' | null;
  trackingId: string;
  lastUpdated?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  playbook?: Playbook | null;
}

const EvidenceSchema = new Schema<Evidence>(
  {
    evidence_id: { type: String, required: true }
  },
  { _id: false }
);

const PlaybookSchema = new Schema(
  {
    user: { type: Schema.Types.Mixed, default: null },
    cert: { type: Schema.Types.Mixed, default: null }
  },
  { _id: false }
);

const collectionName = process.env.MONGODB_MASTER_TABLE || 'complaints_master_table';

const ComplaintSchema = new Schema<ComplaintDocument>(
  {
    submittedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    location: { type: String, required: true },
    complaintType: { type: String, required: true },
    incidentDate: { type: String, required: true },
    incidentTime: { type: String, required: true },
    description: { type: String, required: true },
    suspectedSource: { type: String, default: null },
    evidences: { type: [EvidenceSchema], default: [] },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Resolved', 'Rejected'],
      default: 'Pending'
    },
    assignedOfficer: { type: Schema.Types.ObjectId, default: null, ref: 'User' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: null
    },
    trackingId: { type: String, required: true, unique: true },
    lastUpdated: { type: Date, default: null },
    playbook: { type: PlaybookSchema, default: null }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: collectionName,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const ComplaintModel =
  (mongoose.models && (mongoose.models as any).Complaint) ||
  mongoose.model<ComplaintDocument>('Complaint', ComplaintSchema);

export default ComplaintModel;
