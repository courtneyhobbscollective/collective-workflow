
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
import { StaffDashboard } from "@/components/staff/StaffDashboard";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { staff } = useAuth();

  const renderContent = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-indigo-100/30">
      <div className="sticky top-0 z-50">
        <TopNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      <div className="container mx-auto px-4 py-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
