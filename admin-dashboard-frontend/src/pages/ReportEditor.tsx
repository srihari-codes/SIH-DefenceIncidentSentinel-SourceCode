import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Download, Send } from "lucide-react";

export default function ReportEditor() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Report Editor</h2>
      </div>

      {/* AI Suggested Resolution */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            AI Suggested Resolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            AI-generated resolution from backend
          </div>
        </CardContent>
      </Card>

      {/* Analyst Final Resolution */}
      <Card>
        <CardHeader>
          <CardTitle>Analyst Final Resolution</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your final resolution..."
            className="min-h-[200px]"
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Report Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="default" className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            <Button variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              Send to User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
