import { useState } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { WorkflowBoard } from "@/components/workflow/WorkflowBoard";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ClientManagement } from "@/components/clients/ClientManagement";
import { BriefManagement } from "@/components/briefs/BriefManagement";
import { StaffManagement } from "@/components/staff/StaffManagement";
import { CRMDashboard } from "@/components/crm/CRMDashboard";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { Footer } from "@/components/layout/Footer";
import { StaffDashboard } from "@/components/staff/StaffDashboard";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { staff, clientProfile } = useAuth(); // Get clientProfile as well

  const renderContent = () => {
    // If it's a client, they should be redirected by ProtectedRoute,
    // but as a fallback, ensure they don't see staff dashboard.
    if (clientProfile) {
      return <p className="text-center text-muted-foreground py-8">Access Denied: Please use your client dashboard.</p>;
    }

    // Show staff dashboard for Staff role, full dashboard for Admin
    if (activeTab === "dashboard") {
      return staff?.role === "Staff" ? <StaffDashboard /> : <Dashboard />;
    }
    
    switch (activeTab) {
      case "workflow":
        return <WorkflowBoard />;
      case "calendar":
        return <CalendarView />;
      case "chat":
        return <ChatInterface />;
      case "clients":
        return <ClientManagement />;
      case "briefs":
        return <BriefManagement />;
      case "staff":
        return <StaffManagement />;
      case "crm":
        // Only Admin can access CRM
        return staff?.role === "Admin" ? <CRMDashboard /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="container mx-auto px-4 py-6 flex-1 bg-gradient-to-br from-blue-50/30 to-indigo-100/30">
        {renderContent()}
      </div>
      <Footer />
    </div>
  );
};

export default Index;