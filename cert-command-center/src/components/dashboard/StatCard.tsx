import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: 'default' | 'critical' | 'warning' | 'success';
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const variants = {
    default: 'bg-card border-border',
    critical: 'bg-critical/10 border-critical/30',
    warning: 'bg-warning/10 border-warning/30',
    success: 'bg-success/10 border-success/30',
  };

  const iconVariants = {
    default: 'bg-secondary text-foreground',
    critical: 'bg-critical/20 text-critical',
    warning: 'bg-warning/20 text-warning',
    success: 'bg-success/20 text-success',
  };

  return (
    <div className={cn(
      "p-5 rounded-xl border transition-all hover:shadow-md",
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-2 font-medium",
              trend.positive ? "text-success" : "text-destructive"
            )}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", iconVariants[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
