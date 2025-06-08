
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
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
    <Card className="lg:max-h-96 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <Clock className="w-4 h-4" />
          <span>Unscheduled Projects</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto">
        <div className="space-y-2">
          {unscheduledProjects.map((project) => (
            <div key={project.id} className="p-3 border rounded-lg">
              <h4 className="font-medium text-sm line-clamp-2">{project.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{project.client.company}</p>
              <p className="text-xs text-blue-600">{project.estimated_hours}h estimated</p>
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() => onOpenBookingModal(project)}
              >
                Schedule
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
