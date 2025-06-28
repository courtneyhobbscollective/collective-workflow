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
import { ClientDashboardPage } from "@/pages/ClientDashboardPage"; // Import the renamed ClientDashboardPage
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout"; // Import the new layout
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { Footer } from "@/components/layout/Footer";
import { useState } from "react";

const queryClient = new QueryClient();

// Simple test component to debug white screen
function TestPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">App is working!</h1>
        <p className="text-muted-foreground">If you can see this, the basic app is loading correctly.</p>
      </div>
    </div>
  );
}

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
                  <Route path="/test" element={<TestPage />} />
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
                      <TopNavigation activeTab={activeTab} onTabChange={setActiveTab} />
                      <main className="flex-1 bg-gradient-to-br from-blue-50/30 to-indigo-100/30">
                        <Index activeTab={activeTab} onTabChange={setActiveTab} />
                      </main>
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