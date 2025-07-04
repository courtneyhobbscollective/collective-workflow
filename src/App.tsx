import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StaffProvider } from "@/contexts/StaffContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthPage } from "@/components/auth/AuthPage";
import { PasswordSetupPage } from "@/components/auth/PasswordSetupPage";
import { ClientAuthPage } from "@/pages/ClientAuthPage";
import { ClientDashboardPage } from "@/pages/ClientDashboardPage";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Footer } from "@/components/layout/Footer";
import { useState } from "react";

const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StaffProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-background flex flex-col">
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/client-auth" element={<ClientAuthPage />} />
                  <Route path="/setup-password" element={<PasswordSetupPage />} />
                  <Route path="/client-dashboard" element={
                    <ProtectedRoute requiredRole="Client">
                      <ClientDashboardLayout>
                        <ClientDashboardPage />
                      </ClientDashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Index activeTab={activeTab} onTabChange={setActiveTab} />
                      <Footer />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </StaffProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;