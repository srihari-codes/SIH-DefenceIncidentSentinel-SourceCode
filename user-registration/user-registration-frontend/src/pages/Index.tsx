import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <AuthLayout activeTab={activeTab}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-[hsl(210,40%,96.1%)] p-1 rounded-lg">
          <TabsTrigger 
            value="login"
            className="data-[state=active]:bg-white data-[state=active]:text-[hsl(213,100%,18%)] data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Login
          </TabsTrigger>
          <TabsTrigger 
            value="register"
            className="data-[state=active]:bg-white data-[state=active]:text-[hsl(213,100%,18%)] data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Register
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="login" className="mt-0">
          <LoginForm />
        </TabsContent>
        
        <TabsContent value="register" className="mt-0">
          <RegisterForm />
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
};

export default Index;
