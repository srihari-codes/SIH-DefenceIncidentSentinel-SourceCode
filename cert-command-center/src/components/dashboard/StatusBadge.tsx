import { cn } from '@/lib/utils';
import { ComplaintStatus } from '@/types/complaint';

interface StatusBadgeProps {
  status: ComplaintStatus;
}

const statusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  not_started: { 
    label: 'Not Started', 
    className: 'bg-muted text-muted-foreground border-border' 
  },
  triaging: { 
    label: 'In Triage', 
    className: 'bg-warning/15 text-warning border-warning/30' 
  },
  containment: { 
    label: 'Containment', 
    className: 'bg-critical/15 text-critical border-critical/30' 
  },
  forensics: { 
    label: 'Forensics', 
    className: 'bg-high/15 text-high border-high/30' 
  },
  eradication: { 
    label: 'Eradication', 
    className: 'bg-medium/15 text-medium border-medium/30' 
  },
  recovery: { 
    label: 'Recovery', 
    className: 'bg-primary/15 text-primary border-primary/30' 
  },
  user_confirming: { 
    label: 'User Confirming', 
    className: 'bg-info/15 text-info border-info/30' 
  },
  completed: { 
    label: 'Completed', 
    className: 'bg-success/15 text-success border-success/30' 
  },
  closed: { 
    label: 'Closed', 
    className: 'bg-muted text-muted-foreground border-border' 
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium",
      config.className
    )}>
      {config.label}
    </span>
  );
}
