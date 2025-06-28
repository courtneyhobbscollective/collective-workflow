import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import type { Staff } from "@/types/staff";

interface Project {
  id: string;
  title: string;
  estimated_hours: number;
  assigned_staff_id: string;
  client: {
    company: string;
  };
}

interface ProjectBooking {
  id: string;
  project_id: string;
  staff_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  hours_booked: number;
  status: string;
  project: {
    title: string;
    client: {
      company: string;
    };
  };
}

interface UnscheduledProjectsProps {
  projects: Project[];
  bookings: ProjectBooking[];
  selectedStaff: string;
  onOpenBookingModal: (project: Project) => void;
}

export function UnscheduledProjects({
  projects,
  bookings,
  selectedStaff,
  onOpenBookingModal
}: UnscheduledProjectsProps) {
  const filteredProjects = selectedStaff === "all"
    ? projects
    : projects.filter(project => project.assigned_staff_id === selectedStaff);

  const unscheduledProjects = filteredProjects.filter(p => 
    !bookings.some(b => b.project_id === p.id)
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <Clock className="w-4 h-4" />
          <span>Unscheduled Projects</span>
          {unscheduledProjects.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {unscheduledProjects.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto">
        <div className="space-y-3">
          {unscheduledProjects.length > 0 ? (
            unscheduledProjects.map((project) => (
              <div key={project.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 text-orange-900">{project.title}</h4>
                    <p className="text-xs text-orange-700 truncate">{project.client.company}</p>
                    <p className="text-xs text-orange-600 font-medium">{project.estimated_hours}h estimated</p>
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ This project needs to be scheduled through the workflow production stages
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All projects are scheduled</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
