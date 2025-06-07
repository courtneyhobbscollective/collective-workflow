
import { Users, UserPlus, Briefcase, Workflow, BarChart3, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "staff", label: "Staff Management", icon: Users },
  { id: "clients", label: "Client Management", icon: UserPlus },
  { id: "briefs", label: "Brief Management", icon: Briefcase },
  { id: "workflow", label: "Workflow Board", icon: Workflow },
  { id: "crm", label: "CRM Dashboard", icon: DollarSign },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <div className="w-64 bg-card border-r border-border h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground">Collective Workflow</h1>
        <p className="text-sm text-muted-foreground mt-1">Creative Agency CRM</p>
      </div>
      
      <nav className="px-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
