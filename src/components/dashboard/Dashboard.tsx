
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Briefcase, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dashboard() {
  // Mock data for demo
  const stats = [
    { title: "Active Staff", value: "12", icon: Users, color: "text-blue-600" },
    { title: "Total Clients", value: "24", icon: UserPlus, color: "text-green-600" },
    { title: "Active Projects", value: "8", icon: Briefcase, color: "text-purple-600" },
    { title: "Pending Briefs", value: "3", icon: Clock, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your creative agency operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">New brief submitted for Brand X</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Project moved to Production stage</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Invoice generated for Client Y</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Brand X Logo Design</span>
                <span className="text-sm text-red-600">Tomorrow</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Website Redesign</span>
                <span className="text-sm text-orange-600">3 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Marketing Campaign</span>
                <span className="text-sm text-green-600">1 week</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
