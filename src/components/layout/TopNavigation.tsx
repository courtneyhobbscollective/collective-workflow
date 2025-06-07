
import { Users, UserPlus, Briefcase, Workflow, BarChart3, DollarSign, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "staff", label: "Staff Management", icon: Users },
  { id: "clients", label: "Client Management", icon: UserPlus },
  { id: "briefs", label: "Brief Management", icon: Briefcase },
  { id: "workflow", label: "Workflow Board", icon: Workflow },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "crm", label: "CRM Dashboard", icon: DollarSign },
];

export function TopNavigation({ activeSection, onSectionChange }: TopNavigationProps) {
  return (
    <div className="w-full bg-card border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Collective Workflow</h1>
            <p className="text-sm text-muted-foreground">Creative Agency CRM</p>
          </div>
          
          <nav className="flex space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
