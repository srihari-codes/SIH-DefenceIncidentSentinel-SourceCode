import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Folder, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Folder className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">---</div>
            <p className="text-xs text-muted-foreground">All time cases</p>
          </CardContent>
        </Card>

        <Card className="border-warning/20 hover:border-warning/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Cases</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">---</div>
            <p className="text-xs text-muted-foreground">Awaiting resolution</p>
          </CardContent>
        </Card>

        <Card className="border-success/20 hover:border-success/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solved Cases</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">---</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:border-accent/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">---</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Search Case ID</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Enter case ID..." className="max-w-md" />
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Case Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Pie Chart - Data from backend</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Types</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Bar Chart - Data from backend</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workload & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-muted-foreground text-sm">Backend will provide workload data</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Alerts</CardTitle>
            <Bell className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-muted-foreground text-sm">Alert notifications will appear here</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Case Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Case Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-muted-foreground text-sm">Recent activities from backend</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
