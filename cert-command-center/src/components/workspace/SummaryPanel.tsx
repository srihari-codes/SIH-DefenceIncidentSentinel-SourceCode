import { 
  User, 
  Building2, 
  Mail, 
  Calendar, 
  Clock, 
  AlertTriangle,
  UserCheck,
  Target
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '@/types/complaint';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';

interface SummaryPanelProps {
  complaint: Complaint;
}

const categoryLabels: Record<Complaint['category'], string> = {
  malware: 'Malware',
  phishing: 'Phishing',
  ddos: 'DDoS Attack',
  data_breach: 'Data Breach',
  unauthorized_access: 'Unauthorized Access',
  ransomware: 'Ransomware',
  insider_threat: 'Insider Threat',
  other: 'Other',
};

export function SummaryPanel({ complaint }: SummaryPanelProps) {
  const isOverdue = new Date(complaint.deadline) < new Date();
  const timeRemaining = formatDistanceToNow(new Date(complaint.deadline), { addSuffix: true });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header with ID and Status */}
      <div className="bg-secondary/50 px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-sm text-muted-foreground">{complaint.ticketNumber}</span>
          <StatusBadge status={complaint.status} />
        </div>
        <h2 className="text-lg font-bold leading-tight">{complaint.title}</h2>
      </div>

      {/* Main Info Grid */}
      <div className="p-5 space-y-4">
        {/* Priority & Category Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Severity</p>
              <PriorityBadge priority={complaint.priority} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-sm font-medium">{categoryLabels[complaint.category]}</p>
            </div>
          </div>
        </div>

        {/* Assignment Info */}
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Assigned By</p>
                <p className="text-sm font-medium">{complaint.assignedBy}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Assigned To</p>
                <p className="text-sm font-medium">{complaint.assignedTo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deadline */}
        <div className={`p-3 rounded-lg border ${isOverdue ? 'bg-destructive/10 border-destructive/30' : 'bg-secondary/30 border-border'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className={`text-sm font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                  {format(new Date(complaint.deadline), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded ${isOverdue ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary'}`}>
              {timeRemaining}
            </span>
          </div>
        </div>

        {/* Reporter Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reporter Details</h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{complaint.reporterName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{complaint.reporterEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Organization</p>
                <p className="text-sm font-medium">{complaint.reporterOrg}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Received</p>
                <p className="text-sm font-medium">
                  {format(new Date(complaint.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pt-3 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
          <p className="text-sm leading-relaxed text-foreground/80">{complaint.description}</p>
        </div>

        {/* Affected Systems */}
        {complaint.affectedSystems && complaint.affectedSystems.length > 0 && (
          <div className="pt-3 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Affected Systems</h4>
            <div className="flex flex-wrap gap-2">
              {complaint.affectedSystems.map((system, i) => (
                <span 
                  key={i}
                  className="px-2 py-1 rounded-md bg-secondary text-xs font-mono"
                >
                  {system}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* IOC Indicators */}
        {complaint.iocIndicators && complaint.iocIndicators.length > 0 && (
          <div className="pt-3 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">IOC Indicators</h4>
            <div className="space-y-1">
              {complaint.iocIndicators.map((ioc, i) => (
                <code 
                  key={i}
                  className="block text-xs bg-secondary px-2 py-1 rounded font-mono text-muted-foreground"
                >
                  {ioc}
                </code>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}