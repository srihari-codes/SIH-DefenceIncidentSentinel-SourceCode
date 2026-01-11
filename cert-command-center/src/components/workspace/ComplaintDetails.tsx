import { Building2, Mail, User, Calendar, Server, AlertCircle } from 'lucide-react';
import { Complaint } from '@/types/complaint';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { format } from 'date-fns';

interface ComplaintDetailsProps {
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

export function ComplaintDetails({ complaint }: ComplaintDetailsProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-mono text-muted-foreground">{complaint.ticketNumber}</span>
          <PriorityBadge priority={complaint.priority} />
        </div>
        <h2 className="text-xl font-bold">{complaint.title}</h2>
      </div>

      {/* Description */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
        <p className="text-sm leading-relaxed">{complaint.description}</p>
      </div>

      {/* Reporter Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reporter</p>
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

      {/* Category */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-secondary">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Category</p>
          <p className="text-sm font-medium">{categoryLabels[complaint.category]}</p>
        </div>
      </div>

      {/* Affected Systems */}
      {complaint.affectedSystems && complaint.affectedSystems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Affected Systems</h4>
          </div>
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
        <div>
          <h4 className="text-sm font-medium mb-2">IOC Indicators</h4>
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
  );
}
