import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, LogOut, User, Settings, Bell } from "lucide-react";

interface DashboardProps {
  role: string;
}

const Dashboard = ({ role }: DashboardProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user data from localStorage
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (!token || !userData) {
      navigate("/");
      return;
    }

    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    navigate("/");
  };

  const getRoleName = () => {
    const roleNames: Record<string, string> = {
      personnel: "Defence Personnel",
      family: "Family Member / Dependent",
      veteran: "Veteran / Retired Officer",
      cert: "CERT Analyst",
      admin: "Admin / MoD Authority",
    };
    return roleNames[role] || "User";
  };

  const getRoleDescription = () => {
    const descriptions: Record<string, string> = {
      personnel: "Access to defence operations and personnel resources",
      family: "Family services, benefits, and dependent support portal",
      veteran: "Veteran affairs, pension management, and retirement services",
      cert: "CERT operations, threat analysis, and security intelligence",
      admin: "System administration, user management, and MoD authority controls",
    };
    return descriptions[role] || "Dashboard access";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(213,100%,18%)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,40%,96.1%)] to-white">
      {/* Header */}
      <header className="bg-white border-b border-[hsl(213,100%,18%)]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-[hsl(213,100%,18%)]" />
              <div>
                <h1 className="text-xl font-bold text-[hsl(213,100%,18%)]">
                  SecureDefence Portal
                </h1>
                <p className="text-sm text-[hsl(0,0%,31%)]">{getRoleName()}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[hsl(213,100%,18%)] mb-2">
            Welcome back, {user.fullName}
          </h2>
          <p className="text-[hsl(0,0%,31%)]">
            {getRoleDescription()}
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Email:</span> {user.email}
                </div>
                <div>
                  <span className="font-semibold">Role:</span> {getRoleName()}
                </div>
                <div>
                  <span className="font-semibold">MFA:</span>{" "}
                  {user.mfaMethod === "totp" ? "Authenticator App" : "Email OTP"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage authentication and privacy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Change Password
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Update MFA Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Recent updates and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[hsl(0,0%,31%)]">
                No new notifications at this time.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Role-Specific Content */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for your role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {role === "admin" && (
                  <>
                    <Button variant="outline">User Management</Button>
                    <Button variant="outline">System Configuration</Button>
                    <Button variant="outline">Access Control</Button>
                    <Button variant="outline">Audit & Compliance</Button>
                  </>
                )}
                {role === "personnel" && (
                  <>
                    <Button variant="outline">Personnel Records</Button>
                    <Button variant="outline">Service Details</Button>
                    <Button variant="outline">Leave Management</Button>
                    <Button variant="outline">Training & Assignments</Button>
                  </>
                )}
                {role === "family" && (
                  <>
                    <Button variant="outline">Family Benefits</Button>
                    <Button variant="outline">Medical Services</Button>
                    <Button variant="outline">Education Support</Button>
                    <Button variant="outline">Welfare Programs</Button>
                  </>
                )}
                {role === "veteran" && (
                  <>
                    <Button variant="outline">Pension Management</Button>
                    <Button variant="outline">Medical Facilities</Button>
                    <Button variant="outline">Veteran Services</Button>
                    <Button variant="outline">Retirement Benefits</Button>
                  </>
                )}
                {role === "cert" && (
                  <>
                    <Button variant="outline">Threat Analysis</Button>
                    <Button variant="outline">Incident Reports</Button>
                    <Button variant="outline">Security Monitoring</Button>
                    <Button variant="outline">CERT Operations</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
