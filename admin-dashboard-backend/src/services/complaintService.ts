import { Types } from 'mongoose';

import ComplaintModel, { ComplaintDocument } from '../models/complaintModel';
import AimlRecordModel, { AimlRecordDocument } from '../models/aimlModel';
import FileScannerModel, { FileScannerDocument } from '../models/fileScannerModel';
import { fetchEvidenceFiles } from './evidenceService';

export interface ComplaintStats {
  totalCases: number;
  pending: number;
  solved: number;
  active: number;
}

export type AttackTypeCounts = Record<string, number>;

export interface CaseSummary {
  caseId: string;
  attackType: string;
  status: ComplaintDocument['status'];
  priority: ComplaintDocument['priority'];
  assignedAnalyst: string | null;
}

export interface CaseActivity {
  id: string;
  source: 'complaint' | 'aiml' | 'fileScanner';
  message: string;
  timestamp: string;
  relativeTime: string;
  context?: string;
}

export interface CaseTimelineEntry {
  label: string;
  timestamp: string;
  relativeTime: string;
  details?: string;
}

export interface UserInfoSummary {
  submittedBy: string;
  name: string;
  designation: string;
  department: string;
  location: string;
  incidentDate: string;
  incidentTime: string;
  suspectedSource: string | null;
  playbook: ComplaintDocument['playbook'];
  trackingId: string;
}

export interface ComplaintCaseDetails {
  attackType: string | null;
  assignedAnalyst: string | null;
  description: string | null;
  evidences: string[];
  userInfo: UserInfoSummary;
  timeline: CaseTimelineEntry[];
  summary: string[];
  aimlDescription: string | null;
}

interface ComplaintStatsAggregate {
  totalCases: number;
  pending: number;
  solved: number;
  active: number;
}

type TimestampCarrier = {
  updatedAt?: Date | null;
  createdAt?: Date | null;
  lastUpdated?: Date | null;
  _id: Types.ObjectId;
};

interface AttackTypeCountAggregate {
  _id: string | null;
  count: number;
}

const defaultStats: ComplaintStats = {
  totalCases: 0,
  pending: 0,
  solved: 0,
  active: 0
};

const MAX_ACTIVITY_ITEMS = 4;
const FETCH_WINDOW_PER_COLLECTION = MAX_ACTIVITY_ITEMS * 2;

const createHttpError = (status: number, message: string) => {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
};

export const getComplaintStats = async (): Promise<ComplaintStats> => {
  const [result] = (await ComplaintModel.aggregate([
    {
      $group: {
        _id: null,
        totalCases: { $sum: 1 },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0]
          }
        },
        solved: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0]
          }
        },
        active: {
          $sum: {
            // Active dashboard count = Pending + In Review records.
            $cond: [{ $in: ['$status', ['Pending', 'In Review']] }, 1, 0]
          }
        }
      }
    }
  ])) as ComplaintStatsAggregate[];

  return {
    totalCases: result?.totalCases ?? defaultStats.totalCases,
    pending: result?.pending ?? defaultStats.pending,
    solved: result?.solved ?? defaultStats.solved,
    active: result?.active ?? defaultStats.active
  };
};

export const getAttackTypeCounts = async (): Promise<AttackTypeCounts> => {
  const results = (await AimlRecordModel.aggregate([
    {
      $group: {
        _id: '$attack_type',
        count: { $sum: 1 }
      }
    }
  ])) as AttackTypeCountAggregate[];

  return results.reduce<AttackTypeCounts>((acc, { _id, count }) => {
    if (typeof _id === 'string' && _id.trim().length > 0) {
      acc[_id] = count;
    }
    return acc;
  }, {});
};

export const getCaseSummaries = async (): Promise<CaseSummary[]> => {
  const complaints: ComplaintDocument[] = await ComplaintModel.find({})
    .select('trackingId complaintType status priority assignedOfficer')
    .sort({ createdAt: -1, updatedAt: -1 })
    .exec();

  return complaints.map((complaint) => ({
    caseId: complaint.trackingId ?? complaint._id.toString(),
    attackType: complaint.complaintType,
    status: complaint.status ?? 'Pending',
    priority: complaint.priority ?? null,
    assignedAnalyst: complaint.assignedOfficer
      ? (complaint.assignedOfficer as Types.ObjectId).toString()
      : null
  }));
};

export const getComplaintCaseDetails = async (
  complaintId: string
): Promise<ComplaintCaseDetails> => {
  if (!Types.ObjectId.isValid(complaintId)) {
    throw createHttpError(400, 'Invalid complaint_id provided');
  }

  const complaint = await ComplaintModel.findById(complaintId).exec();
  if (!complaint) {
    throw createHttpError(404, 'Complaint not found');
  }

  const [evidenceFiles, aimlRecord] = await Promise.all([
    fetchEvidenceFiles(complaintId),
    findAimlRecordForComplaint(complaint, complaintId)
  ]);

  return {
    attackType: complaint.complaintType ?? aimlRecord?.attack_type ?? null,
    assignedAnalyst: complaint.assignedOfficer
      ? (complaint.assignedOfficer as Types.ObjectId).toString()
      : null,
    description: complaint.description ?? null,
    evidences: evidenceFiles,
    userInfo: buildUserInfo(complaint),
    timeline: buildCaseTimeline(complaint, aimlRecord),
    summary: aimlRecord?.summary ?? [],
    aimlDescription: resolveAimlDescription(aimlRecord)
  };
};

const resolveTimestamp = (doc: TimestampCarrier): Date => {
  if (doc.updatedAt) {
    return new Date(doc.updatedAt);
  }

  if (doc.lastUpdated) {
    return new Date(doc.lastUpdated);
  }

  if (doc.createdAt) {
    return new Date(doc.createdAt);
  }

  if (doc._id instanceof Types.ObjectId) {
    return doc._id.getTimestamp();
  }

  return new Date();
};

const formatRelativeTime = (date: Date): string => {
  const diffMs = Date.now() - date.getTime();

  if (diffMs < 0) {
    return 'just now';
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 5) {
    return 'just now';
  }
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

const formatContext = (parts: Array<string | undefined>): string | undefined => {
  const filtered = parts.filter(Boolean) as string[];
  return filtered.length ? filtered.join(' • ') : undefined;
};

const buildUserInfo = (complaint: ComplaintDocument): UserInfoSummary => {
  const submittedBy =
    complaint.submittedBy && typeof complaint.submittedBy === 'object'
      ? (complaint.submittedBy as Types.ObjectId).toString()
      : String(complaint.submittedBy ?? '');

  return {
    submittedBy,
    name: complaint.name,
    designation: complaint.designation,
    department: complaint.department,
    location: complaint.location,
    incidentDate: complaint.incidentDate,
    incidentTime: complaint.incidentTime,
    suspectedSource: complaint.suspectedSource ?? null,
    playbook: complaint.playbook ?? null,
    trackingId: complaint.trackingId
  };
};

const pushTimelineEntry = (
  timeline: CaseTimelineEntry[],
  label: string,
  rawDate?: Date | null,
  details?: string
) => {
  if (!rawDate) {
    return;
  }

  const date = new Date(rawDate);
  timeline.push({
    label,
    timestamp: date.toISOString(),
    relativeTime: formatRelativeTime(date),
    details
  });
};

const buildCaseTimeline = (
  complaint: ComplaintDocument,
  aimlRecord?: AimlRecordDocument | null
): CaseTimelineEntry[] => {
  const timeline: CaseTimelineEntry[] = [];

  pushTimelineEntry(
    timeline,
    'Case Submitted',
    complaint.createdAt ?? resolveTimestamp(complaint as unknown as TimestampCarrier),
    complaint.name ? `Submitted by ${complaint.name}` : undefined
  );

  const latestUpdate = complaint.lastUpdated ?? complaint.updatedAt;
  if (latestUpdate) {
    pushTimelineEntry(
      timeline,
      'Case Updated',
      latestUpdate,
      complaint.status ? `Status: ${complaint.status}` : undefined
    );
  }

  if (complaint.assignedOfficer) {
    pushTimelineEntry(
      timeline,
      'Analyst Assigned',
      latestUpdate ?? complaint.createdAt,
      `Analyst ID: ${(complaint.assignedOfficer as Types.ObjectId).toString()}`
    );
  }

  if (aimlRecord) {
    const aimlTimestamp =
      (aimlRecord.updatedAt as Date | undefined) ??
      (aimlRecord.createdAt as Date | undefined) ??
      resolveTimestamp(aimlRecord as unknown as TimestampCarrier);

    pushTimelineEntry(
      timeline,
      'AI Analysis Completed',
      aimlTimestamp,
      `Risk: ${aimlRecord.risk_category}`
    );
  }

  return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

const findAimlRecordForComplaint = async (
  complaint: ComplaintDocument,
  complaintId: string
): Promise<AimlRecordDocument | null> => {
  const filters: Record<string, string>[] = [];
  const pushFilter = (key: string, value?: string | null) => {
    if (value && value.trim().length > 0) {
      filters.push({ [key]: value } as Record<string, string>);
    }
  };

  pushFilter('complaint_id', complaintId);
  pushFilter('complaintId', complaintId);
  pushFilter('tracking_id', complaint.trackingId);
  pushFilter('trackingId', complaint.trackingId);

  if (!filters.length) {
    return null;
  }

  return AimlRecordModel.findOne({ $or: filters })
    .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
    .exec();
};

const resolveAimlDescription = (record?: AimlRecordDocument | null): string | null => {
  if (!record) {
    return null;
  }

  if (typeof record.description === 'string' && record.description.trim().length > 0) {
    return record.description.trim();
  }

  return null;
};

const toComplaintActivity = (complaint: ComplaintDocument): CaseActivity => {
  const timestamp = resolveTimestamp(complaint as unknown as TimestampCarrier);
  const caseId = complaint.trackingId ?? complaint._id.toString();
  const departmentLabel = complaint.department ? ` (${complaint.department})` : '';
  const actor = complaint.assignedOfficer
    ? 'Analyst team'
    : complaint.name
    ? `Reporter ${complaint.name}`
    : 'Case management';
  const verb = complaint.status === 'Resolved' ? 'closed' : 'updated';
  const message = `${actor} ${verb} case ${caseId}${departmentLabel}`;
  const context = formatContext([
    complaint.status ? `Status: ${complaint.status}` : undefined,
    complaint.priority ? `Priority: ${complaint.priority}` : undefined
  ]);

  return {
    id: `complaint:${complaint._id.toString()}`,
    source: 'complaint',
    message,
    timestamp: timestamp.toISOString(),
    relativeTime: formatRelativeTime(timestamp),
    context
  };
};

const toAimlActivity = (record: AimlRecordDocument): CaseActivity => {
  const timestamp = resolveTimestamp(record as unknown as TimestampCarrier);
  const message = `System flagged ${record.attack_type} as ${record.risk_category} risk`;
  const context = formatContext([
    `Priority: ${record.priority}`,
    record.should_alert_user ? 'User alert dispatched' : undefined
  ]);

  return {
    id: `aiml:${record._id.toString()}`,
    source: 'aiml',
    message,
    timestamp: timestamp.toISOString(),
    relativeTime: formatRelativeTime(timestamp),
    context
  };
};

const toFileScannerActivity = (record: FileScannerDocument): CaseActivity => {
  const timestamp = resolveTimestamp(record as unknown as TimestampCarrier);
  const message = `Automated file scanner detected ${record.attack_type}`;

  return {
    id: `fileScanner:${record._id.toString()}`,
    source: 'fileScanner',
    message,
    timestamp: timestamp.toISOString(),
    relativeTime: formatRelativeTime(timestamp),
    context: 'File scanner insight'
  };
};

export const getRecentCaseActivities = async (): Promise<CaseActivity[]> => {
  const [complaints, aimlRecords, fileScannerRecords] = await Promise.all([
    ComplaintModel.find({})
      .sort({ updatedAt: -1, lastUpdated: -1, createdAt: -1, _id: -1 })
      .limit(FETCH_WINDOW_PER_COLLECTION)
      .exec(),
    AimlRecordModel.find({})
      .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
      .limit(FETCH_WINDOW_PER_COLLECTION)
      .exec(),
    FileScannerModel.find({})
      .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
      .limit(FETCH_WINDOW_PER_COLLECTION)
      .exec()
  ]);

  const activities: CaseActivity[] = [
    ...complaints.map(toComplaintActivity),
    ...aimlRecords.map(toAimlActivity),
    ...fileScannerRecords.map(toFileScannerActivity)
  ];

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, MAX_ACTIVITY_ITEMS);
};
