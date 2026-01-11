import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, X, Edit, Play } from "lucide-react";

export default function PlaybookDetail() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Playbook Detail</h2>
        <Badge variant="secondary">Status: ---</Badge>
      </div>

      {/* AI Steps */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            AI-Generated Resolution Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            Full AI steps and instructions from backend
          </div>
        </CardContent>
      </Card>

      {/* Suggested Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Suggested Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            AI-suggested commands from backend
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Playbook Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="default" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Accept
            </Button>
            <Button variant="destructive" className="gap-2">
              <X className="h-4 w-4" />
              Reject
            </Button>
            <Button variant="secondary" className="gap-2">
              <Edit className="h-4 w-4" />
              Modify
            </Button>
            <Button variant="outline" className="gap-2">
              <Play className="h-4 w-4" />
              Apply to Case
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
