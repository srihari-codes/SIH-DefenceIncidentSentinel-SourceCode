import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Playbooks() {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">AI Playbooks</h2>
        <BookOpen className="h-8 w-8 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Playbooks</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-generated guides for case resolution
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Playbook ID</TableHead>
                <TableHead>Case ID</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>PB-001</TableCell>
                <TableCell>CASE-001</TableCell>
                <TableCell>---</TableCell>
                <TableCell><Badge variant="secondary">---</Badge></TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => navigate('/playbooks/1')}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
