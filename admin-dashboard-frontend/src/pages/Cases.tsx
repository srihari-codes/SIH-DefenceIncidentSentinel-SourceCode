import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

export default function Cases() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">All Cases</h2>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <Input placeholder="Search by Case ID, Server ID, or Assigned Analyst..." />
        </CardContent>
      </Card>

      {/* Filters & Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cases List</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="progress">In Progress</TabsTrigger>
              <TabsTrigger value="solved">Solved</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Server ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline/SLA</TableHead>
                    <TableHead>Assigned Analyst</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>CASE-001</TableCell>
                    <TableCell>SRV-001</TableCell>
                    <TableCell><Badge variant="secondary">---</Badge></TableCell>
                    <TableCell>---</TableCell>
                    <TableCell>---</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => navigate('/cases/1')}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="pending">
              <div className="text-muted-foreground text-sm">Pending cases will be filtered here</div>
            </TabsContent>

            <TabsContent value="progress">
              <div className="text-muted-foreground text-sm">In-progress cases will be filtered here</div>
            </TabsContent>

            <TabsContent value="solved">
              <div className="text-muted-foreground text-sm">Solved cases will be filtered here</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
