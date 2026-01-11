import { Activity, CheckCircle, AlertTriangle, FileText, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const activities = [
  {
    id: 1,
    icon: AlertTriangle,
    iconColor: 'text-critical',
    title: 'Critical incident assigned',
    description: 'CERT-2024-001 - Ransomware Attack',
    time: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 2,
    icon: CheckCircle,
    iconColor: 'text-success',
    title: 'Incident resolved',
    description: 'CERT-2024-098 - Phishing attempt blocked',
    time: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: 3,
    icon: FileText,
    iconColor: 'text-primary',
    title: 'Evidence uploaded',
    description: 'New file added to CERT-2024-002',
    time: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: 4,
    icon: UserCheck,
    iconColor: 'text-warning',
    title: 'Status updated',
    description: 'CERT-2024-003 moved to Containment',
    time: new Date(Date.now() - 1000 * 60 * 180),
  },
];

export function RecentActivity() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Recent Activity</h2>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className={`p-2 rounded-lg bg-secondary ${activity.iconColor}`}>
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(activity.time, { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
