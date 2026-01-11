import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Settings() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDarkMode = root.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    root.classList.toggle("dark");
    setIsDark(!isDark);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <SettingsIcon className="h-8 w-8 text-primary" />
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize the look and feel
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  {isDark ? "Currently using dark theme" : "Currently using light theme"}
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={isDark}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage notification preferences
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground">
            Notification settings from backend
          </div>
        </CardContent>
      </Card>

      {/* Other Settings */}
      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
          <p className="text-sm text-muted-foreground">
            Additional system settings
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            Additional settings from backend
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
