import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Send, Inbox } from "lucide-react";

export default function Alerts() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Alerts & Messages</h2>
        <Bell className="h-8 w-8 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Communication Center</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage alerts and messages
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="alerts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="alerts">
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="sent">
                <Send className="h-4 w-4 mr-2" />
                Sent Messages
              </TabsTrigger>
              <TabsTrigger value="received">
                <Inbox className="h-4 w-4 mr-2" />
                Received Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alerts" className="space-y-4">
              <div className="text-muted-foreground">Alert notifications from backend</div>
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              <div className="text-muted-foreground">Sent messages from backend</div>
            </TabsContent>

            <TabsContent value="received" className="space-y-4">
              <div className="text-muted-foreground">Received messages from backend</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
