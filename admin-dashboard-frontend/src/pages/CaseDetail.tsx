import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Play, FileText, Send } from "lucide-react";

export default function CaseDetail() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Case Detail</h2>
        <Badge variant="secondary">Status: ---</Badge>
      </div>

      {/* Case Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Case Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-muted-foreground">Case details from backend</div>
        </CardContent>
      </Card>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-muted-foreground">User details from backend</div>
        </CardContent>
      </Card>

      {/* Problem Description */}
      <Card>
        <CardHeader>
          <CardTitle>Problem Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Problem description from backend</div>
        </CardContent>
      </Card>

      {/* Uploaded Evidence */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Evidence files from backend</div>
        </CardContent>
      </Card>

      {/* AI Playbook */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            AI Playbook for This Case
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">AI generated playbook from backend</div>
        </CardContent>
      </Card>

      {/* Analyst Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Analyst Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Add your notes here..." className="min-h-[100px]" />
        </CardContent>
      </Card>

      {/* Case Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Case Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Timeline of actions from backend</div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Case Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="default" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Mark Solved
            </Button>
            <Button variant="secondary" className="gap-2">
              <Clock className="h-4 w-4" />
              Mark Pending
            </Button>
            <Button variant="outline" className="gap-2">
              <Play className="h-4 w-4" />
              Start Analysis
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              Send Message to User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
