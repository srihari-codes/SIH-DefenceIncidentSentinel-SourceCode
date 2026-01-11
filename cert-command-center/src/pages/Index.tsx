import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  ClipboardList, 
  Clock, 
  CheckCircle2,
  TrendingUp,
  Zap
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ComplaintCard } from '@/components/dashboard/ComplaintCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { mockComplaints, mockAnalystStats } from '@/data/mockData';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  
  const urgentComplaints = mockComplaints
    .filter(c => c.status !== 'closed')
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  const handleOpenComplaint = (id: string) => {
    navigate(`/workspace/${id}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, Alex</h1>
            <p className="text-muted-foreground">Here's your incident response overview</p>
          </div>
          <Button onClick={() => navigate('/complaints')} className="sm:w-auto">
            <ClipboardList className="h-4 w-4 mr-2" />
            View All Complaints
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Critical Incidents" 
            value={mockAnalystStats.criticalCount}
            icon={AlertTriangle}
            variant="critical"
          />
          <StatCard 
            title="Pending Triage" 
            value={mockAnalystStats.pendingTriage}
            icon={Clock}
            variant="warning"
          />
          <StatCard 
            title="In Progress" 
            value={mockAnalystStats.inProgress}
            icon={Zap}
          />
          <StatCard 
            title="Closed Today" 
            value={mockAnalystStats.closedToday}
            icon={CheckCircle2}
            variant="success"
            trend={{ value: '12% vs yesterday', positive: true }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Urgent Complaints */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Priority Queue
              </h2>
              <span className="text-sm text-muted-foreground">
                {mockAnalystStats.totalAssigned} total assigned
              </span>
            </div>

            <div className="space-y-3">
              {urgentComplaints.map(complaint => (
                <ComplaintCard 
                  key={complaint.id} 
                  complaint={complaint}
                  onOpen={handleOpenComplaint}
                />
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/complaints')}
            >
              View All Complaints
            </Button>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
