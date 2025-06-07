
import { Users, UserPlus, Briefcase, Workflow, BarChart3, DollarSign, Calendar, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setIsMobileMenuOpen(false); // Close mobile menu when item is selected
  };

  return (
    <div className="w-full bg-card border-b border-border">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Collective Workflow</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Creative Agency CRM</p>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "flex items-center space-x-2 px-3 xl:px-4 py-2 rounded-lg transition-colors text-sm",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon size={16} />
                  <span className="font-medium hidden xl:inline">{item.label}</span>
                  <span className="font-medium xl:hidden">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 border-t border-border pt-4">
            <nav className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={cn(
                      "flex flex-col items-center space-y-1 px-3 py-3 rounded-lg transition-colors text-sm",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon size={18} />
                    <span className="font-medium text-xs text-center">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
