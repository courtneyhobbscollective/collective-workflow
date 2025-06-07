
import { useState } from "react";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { StaffManagement } from "@/components/staff/StaffManagement";
import { ClientManagement } from "@/components/clients/ClientManagement";
import { BriefManagement } from "@/components/briefs/BriefManagement";
import { WorkflowBoard } from "@/components/workflow/WorkflowBoard";
import { CalendarView } from "@/components/calendar/CalendarView";
import { CRMDashboard } from "@/components/crm/CRMDashboard";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "staff":
        return <StaffManagement />;
      case "clients":
        return <ClientManagement />;
      case "briefs":
        return <BriefManagement />;
      case "workflow":
        return <WorkflowBoard />;
      case "calendar":
        return <CalendarView />;
      case "crm":
        return <CRMDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <TopNavigation activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="p-6">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
