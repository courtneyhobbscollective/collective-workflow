import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
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
    estimated_hours?: number;
    client: {
      company: string;
    };
  };
}

interface CalendarGridProps {
  currentDate: Date;
  view: "week" | "month";
  bookings: ProjectBooking[];
  staff: Staff[];
  selectedStaff: string;
  onBookingUpdate: () => void;
  onBookingClick: (booking: ProjectBooking) => void;
}

export function CalendarGrid({ 
  currentDate, 
  view, 
  bookings, 
  staff, 
  selectedStaff,
  onBookingUpdate,
  onBookingClick
}: CalendarGridProps) {
  const [multiDayBookings, setMultiDayBookings] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check for multi-day bookings by grouping by project_id
    const projectBookingCounts = bookings.reduce((acc, booking) => {
      acc[booking.project_id] = (acc[booking.project_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const multiDayProjectIds = new Set(
      Object.entries(projectBookingCounts)
        .filter(([_, count]) => count > 1)
        .map(([projectId]) => projectId)
    );

    setMultiDayBookings(multiDayProjectIds);
  }, [bookings]);

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getMonthDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getDays = () => view === "week" ? getWeekDays() : getMonthDays();

  const getBookingsForDay = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.booking_date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const days = getDays();

  if (view === "week") {
    return (
      <div className="w-full overflow-hidden">
        {/* Week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {days.map((day) => (
            <div key={day.toISOString()} className="text-center p-2 border-b">
              <div className="font-medium text-sm">{format(day, 'EEE')}</div>
              <div className="text-lg font-semibold">{format(day, 'd')}</div>
              <div className="text-xs text-muted-foreground">{format(day, 'MMM')}</div>
            </div>
          ))}
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] sm:min-h-[150px] p-2 border rounded-lg bg-background",
                  isToday && "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                )}
              >
                <div className="space-y-1">
                  {dayBookings.map((booking) => {
                    const staffMember = staff.find(s => s.id === booking.staff_id);
                    const isMultiDay = multiDayBookings.has(booking.project_id);
                    
                    return (
                      <Badge
                        key={booking.id}
                        className={cn(
                          "text-xs block cursor-pointer transition-colors w-full text-left relative p-2",
                          getStatusColor(booking.status)
                        )}
                        onClick={() => onBookingClick(booking)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="truncate flex-1 min-w-0">
                              <div className="truncate text-xs font-medium">
                                {booking.project.title}
                              </div>
                            </div>
                            {isMultiDay && (
                              <div className="ml-1 w-2 h-2 bg-current rounded-full opacity-60 flex-shrink-0" 
                                   title="Multi-day booking" />
                            )}
                          </div>
                          <div className="text-xs opacity-80">
                            {booking.start_time} - {booking.end_time}
                          </div>
                          {selectedStaff === "all" && staffMember && (
                            <div className="text-xs opacity-70 truncate">
                              {staffMember.name}
                            </div>
                          )}
                        </div>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Month view with square boxes for mobile
  return (
    <div className="w-full overflow-hidden">
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Day headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-medium text-xs sm:text-sm p-2 bg-muted/30">
            {day}
          </div>
        ))}
        
        {/* Calendar days - made square on mobile */}
        {days.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border rounded-lg p-1 sm:p-2 bg-background aspect-square sm:aspect-auto sm:min-h-[120px]",
                isToday && "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
              )}
            >
              <div className={cn(
                "text-xs sm:text-sm font-medium mb-1 p-1",
                isToday && "text-blue-600 font-semibold"
              )}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1 overflow-hidden">
                {dayBookings.slice(0, 2).map((booking) => {
                  const staffMember = staff.find(s => s.id === booking.staff_id);
                  const isMultiDay = multiDayBookings.has(booking.project_id);
                  
                  return (
                    <Badge
                      key={booking.id}
                      className={cn(
                        "text-xs block cursor-pointer transition-colors w-full text-left relative",
                        getStatusColor(booking.status)
                      )}
                      onClick={() => onBookingClick(booking)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="truncate flex-1 min-w-0">
                          <div className="truncate text-xs">
                            {booking.project.title}
                          </div>
                          {selectedStaff === "all" && staffMember && (
                            <div className="text-xs opacity-80 truncate">
                              {staffMember.name}
                            </div>
                          )}
                        </div>
                        {isMultiDay && (
                          <div className="ml-1 w-1.5 h-1.5 bg-current rounded-full opacity-70 flex-shrink-0" 
                               title="Multi-day booking" />
                        )}
                      </div>
                    </Badge>
                  );
                })}
                {dayBookings.length > 2 && (
                  <div className="text-xs text-muted-foreground px-1 cursor-pointer hover:text-foreground">
                    +{dayBookings.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
