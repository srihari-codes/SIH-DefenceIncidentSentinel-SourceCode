import { useState } from 'react';
import { 
  Brain, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Wrench,
  BookOpen,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { AIPlaybook } from '@/types/complaint';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIPlaybookPanelProps {
  playbook: AIPlaybook | undefined;
  currentStatus: string;
}

export function AIPlaybookPanel({ playbook, currentStatus }: AIPlaybookPanelProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]));

  if (!playbook) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Playbook</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No playbook available for this incident</p>
          <Button variant="outline" size="sm" className="mt-4">
            Generate Playbook
          </Button>
        </div>
      </div>
    );
  }

  const togglePhase = (index: number) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPhases(newExpanded);
  };

  const getPhaseStatus = (phaseName: string): 'completed' | 'current' | 'pending' => {
    const statusOrder = ['not_started', 'triaging', 'containment', 'forensics', 'eradication', 'recovery', 'user_confirming', 'completed', 'closed'];
    const phaseMap: Record<string, string> = {
      'Initial Triage': 'triaging',
      'Containment': 'containment',
      'Forensic Analysis': 'forensics',
      'Eradication': 'eradication',
      'Recovery': 'recovery',
      'Post-Incident': 'completed'
    };
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const phaseIndex = statusOrder.indexOf(phaseMap[phaseName] || '');
    
    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary/5 px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Playbook</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{playbook.estimatedTime}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{playbook.title}</p>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-2">
        {playbook.steps.map((step, index) => {
          const isExpanded = expandedPhases.has(index);
          const phaseStatus = getPhaseStatus(step.phase);
          
          return (
            <div 
              key={index} 
              className={cn(
                "rounded-lg border transition-colors",
                phaseStatus === 'current' && "border-primary bg-primary/5",
                phaseStatus === 'completed' && "border-success/30 bg-success/5",
                phaseStatus === 'pending' && "border-border"
              )}
            >
              <button
                onClick={() => togglePhase(index)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  {phaseStatus === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                      phaseStatus === 'current' ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                  )}
                  <span className={cn(
                    "font-medium text-sm",
                    phaseStatus === 'completed' && "text-success",
                    phaseStatus === 'current' && "text-primary"
                  )}>
                    {step.phase}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pt-0 space-y-3">
                  {/* Actions */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Actions:</p>
                    <ul className="space-y-1">
                      {step.actions.map((action, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tools */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Tools:</p>
                    <div className="flex flex-wrap gap-1">
                      {step.tools.map((tool, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 rounded bg-secondary text-xs font-mono"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expected Outcome */}
                  <div className="p-2 rounded bg-secondary/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Expected Outcome:</p>
                    <p className="text-xs">{step.expectedOutcome}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommended Tools */}
      <div className="px-5 py-4 border-t border-border bg-secondary/20">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">Recommended Tools</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {playbook.recommendedTools.map((tool, i) => (
            <span 
              key={i}
              className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* References */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">References</p>
        </div>
        <div className="space-y-1">
          {playbook.references.map((ref, i) => (
            <a 
              key={i}
              href="#"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {ref}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}