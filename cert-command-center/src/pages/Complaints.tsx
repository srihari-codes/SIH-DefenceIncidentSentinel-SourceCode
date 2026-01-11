import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SortAsc } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { mockComplaints } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Complaint, ComplaintStatus, Priority } from '@/types/complaint';

export default function Complaints() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredComplaints = mockComplaints.filter(complaint => {
    const matchesSearch = 
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.reporterOrg.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="text-2xl font-bold">My Complaints</h1>
          <p className="text-muted-foreground">Manage and process your assigned incidents</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, title, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="triaging">Triaging</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="containment">Containment</SelectItem>
              <SelectItem value="eradication">Eradication</SelectItem>
              <SelectItem value="recovery">Recovery</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Ticket ID</TableHead>
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Organization</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Deadline</TableHead>
                <TableHead className="font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm">{complaint.ticketNumber}</TableCell>
                  <TableCell className="max-w-[250px] truncate font-medium">{complaint.title}</TableCell>
                  <TableCell className="text-muted-foreground">{complaint.reporterOrg}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={complaint.priority} size="sm" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={complaint.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(complaint.deadline), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/workspace/${complaint.id}`)}
                    >
                      Open Workspace
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredComplaints.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No complaints found matching your filters.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
