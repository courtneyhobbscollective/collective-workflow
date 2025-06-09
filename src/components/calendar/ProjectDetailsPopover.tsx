import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Clock, User, Building, Target } from "lucide-react";
import { format } from "date-fns";
import type { Staff } from "@/types/staff";

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
    estimated_hours?: number;
    client: {
      company: string;
    };
  };
}

interface ProjectDetailsPopoverProps {
  booking: ProjectBooking;
  staff: Staff[];
  isMultiDay?: boolean;
  children: React.ReactNode;
}

export function ProjectDetailsPopover({ 
  booking, 
  staff, 
  isMultiDay = false,
  children 
}: ProjectDetailsPopoverProps) {
  const staffMember = staff.find(s => s.id === booking.staff_id);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base font-medium line-clamp-2">
                {booking.project.title}
              </CardTitle>
              <div className="flex flex-col gap-1 ml-2">
                <Badge 
                  variant="outline" 
                  className={getStatusColor(booking.status)}
                >
                  {booking.status.replace('_', ' ')}
                </Badge>
                <Badge variant={isMultiDay ? "default" : "secondary"} className="text-xs">
                  {isMultiDay ? "Multi-Day" : "Single Slot"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span>{booking.project.client.company}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{staffMember?.name} ({staffMember?.role})</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{format(new Date(booking.booking_date), 'EEEE, MMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{booking.start_time} - {booking.end_time} ({booking.hours_booked}h)</span>
            </div>
            
            {booking.project.estimated_hours && (
              <div className="flex items-center space-x-2 text-sm">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span>Total project: {booking.project.estimated_hours}h estimated</span>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
