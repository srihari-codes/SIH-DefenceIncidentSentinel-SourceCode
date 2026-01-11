import { cn } from '@/lib/utils';
import { Priority } from '@/types/complaint';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const variants = {
    critical: 'bg-critical/15 text-critical border-critical/30',
    high: 'bg-high/15 text-high border-high/30',
    medium: 'bg-medium/15 text-medium border-medium/30',
    low: 'bg-low/15 text-low border-low/30',
  };

  const labels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border font-medium uppercase tracking-wide",
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      variants[priority]
    )}>
      <span className={cn(
        "rounded-full mr-1.5",
        size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
        priority === 'critical' && 'bg-critical animate-pulse',
        priority === 'high' && 'bg-high',
        priority === 'medium' && 'bg-medium',
        priority === 'low' && 'bg-low',
      )} />
      {labels[priority]}
    </span>
  );
}
