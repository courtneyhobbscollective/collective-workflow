
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { StaffManagement } from "@/components/staff/StaffManagement";
import { ClientManagement } from "@/components/clients/ClientManagement";
import { BriefManagement } from "@/components/briefs/BriefManagement";
import { WorkflowBoard } from "@/components/workflow/WorkflowBoard";
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
      case "crm":
        return <CRMDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
