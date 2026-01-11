import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComplaintStatus } from '@/types/complaint';

interface IncidentTimelineProps {
  currentStatus: ComplaintStatus;
  onStatusChange: (status: ComplaintStatus) => void;
}

const steps: { status: ComplaintStatus; label: string; description: string }[] = [
  { status: 'not_started', label: 'Not Started', description: 'Complaint received, awaiting action' },
  { status: 'triaging', label: 'In Triage', description: 'Assess severity and scope' },
  { status: 'containment', label: 'Containment', description: 'Limit incident impact' },
  { status: 'forensics', label: 'Forensics', description: 'Deep analysis and evidence collection' },
  { status: 'eradication', label: 'Eradication', description: 'Remove threat vectors' },
  { status: 'recovery', label: 'Recovery', description: 'Restore normal operations' },
  { status: 'user_confirming', label: 'User Confirming', description: 'Awaiting user confirmation' },
  { status: 'completed', label: 'Completed', description: 'Analyst work complete' },
  { status: 'closed', label: 'Closed', description: 'Admin closed incident' },
];

export function IncidentTimeline({ currentStatus, onStatusChange }: IncidentTimelineProps) {
  const currentIndex = steps.findIndex(s => s.status === currentStatus);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Incident Response Lifecycle</h3>
      
      <div className="relative">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = index <= currentIndex + 1;

          return (
            <div key={step.status} className="flex gap-4 pb-6 last:pb-0">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-[15px] w-0.5 h-6 mt-8",
                    isCompleted ? "bg-success" : "bg-border"
                  )}
                  style={{ top: `${index * 64 + 24}px` }}
                />
              )}

              {/* Status Circle */}
              <button
                onClick={() => isClickable && onStatusChange(step.status)}
                disabled={!isClickable}
                className={cn(
                  "relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-success text-success-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                  isClickable && "cursor-pointer hover:scale-110",
                  !isClickable && "cursor-not-allowed"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>

              {/* Content */}
              <div className={cn(
                "flex-1 pt-1",
                !isCompleted && !isCurrent && "opacity-50"
              )}>
                <p className={cn(
                  "font-medium text-sm",
                  isCurrent && "text-primary"
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
