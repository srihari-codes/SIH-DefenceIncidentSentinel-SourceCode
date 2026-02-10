import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "./pages/VerifyEmail";
import Callback from "./pages/Callback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/dashboard/personnel" element={<Dashboard role="personnel" />} />
          <Route path="/dashboard/family" element={<Dashboard role="family" />} />
          <Route path="/dashboard/veteran" element={<Dashboard role="veteran" />} />
          <Route path="/dashboard/cert" element={<Dashboard role="cert" />} />
          <Route path="/dashboard/admin" element={<Dashboard role="admin" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
