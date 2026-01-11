import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Search Cases</h2>
        <Search className="h-8 w-8 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Search</CardTitle>
          <p className="text-sm text-muted-foreground">
            Find cases by various criteria
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="caseId">Case ID</Label>
              <Input id="caseId" placeholder="Enter case ID..." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="Enter username..." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email..." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="caseType">Case Type</Label>
              <Input id="caseType" placeholder="Enter case type..." />
            </div>
          </div>

          <Button className="w-full md:w-auto gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            Results will appear here after search
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
