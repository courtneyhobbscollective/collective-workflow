import { useState, useEffect } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { WorkflowBoard } from "@/components/workflow/WorkflowBoard";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ClientManagement } from "@/components/clients/ClientManagement";
import { BriefManagement } from "@/components/briefs/BriefManagement";
import { StaffManagement } from "@/components/staff/StaffManagement";
import { BillingDashboard } from "@/components/billing/BillingDashboard";
import { StaffDashboard } from "@/components/staff/StaffDashboard";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useStaff } from "@/contexts/StaffContext";
import { supabase } from "@/integrations/supabase/client";
import { CRMDashboard } from "@/components/crm/CRMDashboard";

interface IndexProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Index = ({ activeTab, onTabChange }: IndexProps) => {
  const { staff, clientProfile } = useAuth();

  const renderContent = () => {
    // If it's a client, they should be redirected by ProtectedRoute,
    // but as a fallback, ensure they don't see staff dashboard.
    if (clientProfile) {
      return <p className="text-center text-muted-foreground py-8">Access Denied: Please use your client dashboard.</p>;
    }

    // Show staff dashboard for Staff role, full dashboard for Admin
    if (activeTab === "dashboard") {
      return staff?.role === "Staff" ? <StaffDashboard onTabChange={onTabChange} /> : <Dashboard onTabChange={onTabChange} />;
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
        return staff?.role === "Admin" ? <StaffManagement /> : <Dashboard onTabChange={onTabChange} />;
      case "crm":
        return staff?.role === "Admin" ? <CRMDashboard /> : <Dashboard onTabChange={onTabChange} />;
      case "billing":
        return staff?.role === "Admin" ? <BillingDashboard /> : <Dashboard onTabChange={onTabChange} />;
      default:
        return <Dashboard onTabChange={onTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation activeTab={activeTab} onTabChange={onTabChange} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;