import { Clock, Building2, ArrowRight } from 'lucide-react';
import { Complaint } from '@/types/complaint';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ComplaintCardProps {
  complaint: Complaint;
  onOpen: (id: string) => void;
}

export function ComplaintCard({ complaint, onOpen }: ComplaintCardProps) {
  const isOverdue = new Date(complaint.deadline) < new Date();
  const timeLeft = formatDistanceToNow(new Date(complaint.deadline), { addSuffix: true });

  return (
    <div className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-muted-foreground">{complaint.ticketNumber}</span>
            <PriorityBadge priority={complaint.priority} size="sm" />
          </div>
          
          <h3 className="font-semibold text-foreground truncate mb-2">
            {complaint.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {complaint.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>{complaint.reporterOrg}</span>
            </div>
            <div className={cn(
              "flex items-center gap-1",
              isOverdue && complaint.status !== 'closed' && "text-destructive"
            )}>
              <Clock className="h-3.5 w-3.5" />
              <span>{isOverdue && complaint.status !== 'closed' ? 'Overdue' : timeLeft}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={complaint.status} />
          <Button 
            size="sm" 
            onClick={() => onOpen(complaint.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Open
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
