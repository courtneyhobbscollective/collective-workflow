import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Settings, Users } from "lucide-react";
import type { Staff } from "@/types/staff";

interface CalendarHeaderProps {
  currentDate: Date;
  view: "week" | "month";
  onViewChange: (view: "week" | "month") => void;
  onNavigateDate: (direction: "prev" | "next") => void;
  onShowAvailabilityModal: () => void;
  onTodayClick: () => void;
  staff: Staff[];
  selectedStaff: string;
  onStaffChange: (staffId: string) => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onNavigateDate,
  onShowAvailabilityModal,
  onTodayClick,
  staff,
  selectedStaff,
  onStaffChange
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Calendar</h2>
          <p className="text-sm text-muted-foreground">Manage staff availability and project scheduling</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <Select value={selectedStaff} onValueChange={onStaffChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onShowAvailabilityModal}
            className="w-full sm:w-auto"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Availability
          </Button>
          <Select value={view} onValueChange={onViewChange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center space-x-2 text-base lg:text-lg font-semibold">
          <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
          <span>
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric',
              ...(view === "week" && { day: 'numeric' })
            })}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => onNavigateDate("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onTodayClick}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigateDate("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
