import { useState } from 'react';
import { 
  Send, 
  FileDown, 
  MessageSquare, 
  CheckSquare,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ComplaintStatus } from '@/types/complaint';
import { toast } from '@/hooks/use-toast';

interface ActionPanelProps {
  status: ComplaintStatus;
  onAdvanceStatus: () => void;
}

const checklistItems: Record<ComplaintStatus, string[]> = {
  not_started: [
    'Review complaint details',
    'Verify reporter information',
    'Check for duplicate tickets',
  ],
  triaging: [
    'Assess incident severity',
    'Identify affected systems',
    'Determine incident category',
    'Set response priority',
  ],
  containment: [
    'Isolate affected systems',
    'Block malicious IPs/domains',
    'Disable compromised accounts',
    'Implement temporary controls',
  ],
  forensics: [
    'Collect and preserve evidence',
    'Analyze logs and artifacts',
    'Identify attack vectors',
    'Document findings',
  ],
  eradication: [
    'Remove malware/threats',
    'Patch vulnerabilities',
    'Reset compromised credentials',
    'Verify threat removal',
  ],
  recovery: [
    'Restore from clean backups',
    'Validate system integrity',
    'Monitor for reinfection',
    'Update security controls',
  ],
  user_confirming: [
    'Send resolution summary to user',
    'Await user confirmation',
    'Document user feedback',
  ],
  completed: [
    'Complete incident report',
    'Update knowledge base',
    'Conduct lessons learned',
  ],
  closed: [
    'Final review complete',
    'Incident archived',
  ],
};

export function ActionPanel({ status, onAdvanceStatus }: ActionPanelProps) {
  const [notes, setNotes] = useState('');
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const currentChecklist = checklistItems[status] || [];

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const allChecked = currentChecklist.length > 0 && 
    checkedItems.size === currentChecklist.length;

  const handleAddNote = () => {
    if (notes.trim()) {
      toast({
        title: "Note added",
        description: "Your note has been saved to the incident timeline.",
      });
      setNotes('');
    }
  };

  const handleAdvance = () => {
    setCheckedItems(new Set());
    onAdvanceStatus();
    toast({
      title: "Status updated",
      description: "Incident moved to next phase.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Checklist */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <CheckSquare className="h-5 w-5 text-primary" />
          Phase Checklist
        </h3>
        
        <div className="space-y-3">
          {currentChecklist.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <Checkbox 
                id={`check-${index}`}
                checked={checkedItems.has(index)}
                onCheckedChange={() => toggleItem(index)}
              />
              <label 
                htmlFor={`check-${index}`}
                className="text-sm cursor-pointer"
              >
                {item}
              </label>
            </div>
          ))}
        </div>

        {status !== 'closed' && (
          <Button 
            className="w-full mt-4" 
            disabled={!allChecked}
            onClick={handleAdvance}
          >
            Complete Phase & Advance
          </Button>
        )}
      </div>

      {/* Notes */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          Add Notes
        </h3>
        
        <Textarea 
          placeholder="Document your findings, actions taken, or observations..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[100px] mb-3"
        />
        
        <div className="flex gap-2">
          <Button onClick={handleAddNote} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
          <Button variant="outline">
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm">
            <Send className="h-4 w-4 mr-2" />
            Send Update
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
}
