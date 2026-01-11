import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SummaryPanel } from '@/components/workspace/SummaryPanel';
import { IncidentTimeline } from '@/components/workspace/IncidentTimeline';
import { EvidencePanel } from '@/components/workspace/EvidencePanel';
import { ActionPanel } from '@/components/workspace/ActionPanel';
import { AIPlaybookPanel } from '@/components/workspace/AIPlaybookPanel';
import { getComplaintById } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Complaint, ComplaintStatus } from '@/types/complaint';

const statusOrder: ComplaintStatus[] = [
  'not_started', 'triaging', 'containment', 'forensics', 'eradication', 'recovery', 'user_confirming', 'completed', 'closed'
];

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const complaint = getComplaintById(id || '');
  
  const [currentStatus, setCurrentStatus] = useState<ComplaintStatus>(
    complaint?.status || 'not_started'
  );

  if (!complaint) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground mb-4">Complaint not found</p>
          <Button onClick={() => navigate('/complaints')}>
            Return to Complaints
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const advanceStatus = () => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      setCurrentStatus(statusOrder[currentIndex + 1]);
    }
  };

  const updatedComplaint: Complaint = {
    ...complaint,
    status: currentStatus,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/complaints')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Complaints
        </Button>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Summary & Evidence */}
          <div className="lg:col-span-4 space-y-6">
            <SummaryPanel complaint={updatedComplaint} />
            <EvidencePanel evidence={complaint.evidence} />
          </div>

          {/* Center Column - Timeline & Playbook */}
          <div className="lg:col-span-4 space-y-6">
            <IncidentTimeline 
              currentStatus={currentStatus}
              onStatusChange={setCurrentStatus}
            />
            <AIPlaybookPanel 
              playbook={complaint.playbook}
              currentStatus={currentStatus}
            />
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <ActionPanel 
                status={currentStatus}
                onAdvanceStatus={advanceStatus}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
