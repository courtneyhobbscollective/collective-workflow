import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Workflow,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  UserCog,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import { UserMenu } from "./UserMenu";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TopNavigation({ activeTab, onTabChange }: TopNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { staff } = useAuth();

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "workflow", label: "Workflow", icon: Workflow },
    { id: "briefs", label: "Briefs", icon: FileText },
    { id: "clients", label: "Clients", icon: Users },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "staff", label: "Staff", icon: UserCog },
    ...(staff?.role === 'Admin' ? [{ id: "crm", label: "CRM", icon: TrendingUp }] : []),
  ];

  const NavButton = ({ item }: { item: typeof navigationItems[0] }) => (
    <Button
      variant={activeTab === item.id ? "default" : "ghost"}
      onClick={() => {
        onTabChange(item.id);
        setMobileMenuOpen(false);
      }}
      className="w-full justify-start"
    >
      <item.icon className="w-4 h-4 mr-2" />
      {item.label}
    </Button>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden lg:block border-0 shadow-sm bg-white/80 backdrop-blur-sm w-full p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Logo size="sm" />
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-1">
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.id}>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        activeTab === item.id && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => onTabChange(item.id)}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                      {item.id === "crm" && staff?.role === 'Admin' && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Admin
                        </Badge>
                      )}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-0 shadow-sm bg-white/80 backdrop-blur-sm w-full p-4">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center space-x-2">
            <UserMenu />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="mt-4 space-y-2 border-t pt-4">
            {navigationItems.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
