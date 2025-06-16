import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
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

interface StaffTimeOff {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  status: string;
}

interface CalendarGridProps {
  currentDate: Date;
  view: "week" | "month";
  bookings: ProjectBooking[];
  staff: Staff[];
  staffTimeOff: StaffTimeOff[];
  selectedStaff: string;
  onBookingUpdate: () => void;
  onBookingClick: (booking: ProjectBooking) => void;
}

export function CalendarGrid({ 
  currentDate, 
  view, 
  bookings, 
  staff, 
  staffTimeOff,
  selectedStaff,
  onBookingUpdate,
  onBookingClick
}: CalendarGridProps) {
  const [multiDayBookings, setMultiDayBookings] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const getTimeOffForDay = (date: Date) => {
    return staffTimeOff.filter(timeOff => {
      const startDate = new Date(timeOff.start_date);
      const endDate = new Date(timeOff.end_date);
      return date >= startDate && date <= endDate;
    });
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

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-orange-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTimeOffColor = (type: string) => {
    switch (type) {
      case 'vacation': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'sick': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'holiday': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'personal': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
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
            const dayTimeOff = getTimeOffForDay(day);
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
                  {dayTimeOff.map((timeOff) => {
                    const staffMember = staff.find(s => s.id === timeOff.staff_id);
                    return (
                      <Badge
                        key={timeOff.id}
                        className={cn(
                          "text-xs block cursor-default transition-colors w-full text-left relative p-2",
                          getTimeOffColor(timeOff.type)
                        )}
                      >
                        <div className="space-y-1">
                          <div className="truncate text-xs font-medium">
                            {timeOff.type === 'vacation' ? 'Vacation' : timeOff.reason}
                          </div>
                          <div className="text-xs opacity-80">
                            {timeOff.is_full_day ? 'Full Day' : `${timeOff.start_time} - ${timeOff.end_time}`}
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

  // Month view with mobile optimization
  return (
    <div className="w-full overflow-hidden">
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Day headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-medium text-xs sm:text-sm p-2 bg-muted/30">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const dayTimeOff = getTimeOffForDay(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border rounded-lg bg-background aspect-square sm:aspect-auto sm:min-h-[120px] cursor-pointer transition-colors",
                isToday && "bg-blue-50 border-blue-200 ring-1 ring-blue-200",
                isSelected && "ring-2 ring-primary",
                "hover:bg-muted/20"
              )}
              onClick={() => handleDateClick(day)}
            >
              <div className="p-1 sm:p-2 h-full flex flex-col">
                <div className={cn(
                  "text-xs sm:text-sm font-medium mb-1",
                  isToday && "text-blue-600 font-semibold"
                )}>
                  {format(day, 'd')}
                </div>
                
                {/* Mobile: Show dots, Desktop: Show booking cards */}
                <div className="flex-1 overflow-hidden">
                  {/* Mobile dots (sm and below) */}
                  <div className="sm:hidden">
                    {(dayBookings.length > 0 || dayTimeOff.length > 0) && (
                      <div className="flex justify-center items-end h-full pb-1">
                        <div className="flex space-x-1">
                          {dayTimeOff.slice(0, 1).map((timeOff, index) => (
                            <div
                              key={timeOff.id}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                getTimeOffColor(timeOff.type).split(' ')[0].replace('bg-', 'bg-') // Extract base color
                              )}
                            />
                          ))}
                          {dayBookings.slice(0, 2).map((booking, index) => (
                            <div
                              key={booking.id}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                getStatusDotColor(booking.status)
                              )}
                            />
                          ))}
                          {(dayBookings.length + dayTimeOff.length) > 3 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop booking cards (sm and above) */}
                  <div className="hidden sm:block space-y-1">
                    {dayTimeOff.slice(0, 1).map((timeOff) => {
                      const staffMember = staff.find(s => s.id === timeOff.staff_id);
                      return (
                        <Badge
                          key={timeOff.id}
                          className={cn(
                            "text-xs block cursor-default transition-colors w-full text-left relative",
                            getTimeOffColor(timeOff.type)
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="truncate flex-1 min-w-0">
                              <div className="truncate text-xs">
                                {timeOff.type === 'vacation' ? 'Vacation' : timeOff.reason}
                              </div>
                              {selectedStaff === "all" && staffMember && (
                                <div className="text-xs opacity-80 truncate">
                                  {staffMember.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </Badge>
                      );
                    })}
                    {dayBookings.slice(0, 2 - dayTimeOff.length).map((booking) => {
                      const staffMember = staff.find(s => s.id === booking.staff_id);
                      const isMultiDay = multiDayBookings.has(booking.project_id);
                      
                      return (
                        <Badge
                          key={booking.id}
                          className={cn(
                            "text-xs block cursor-pointer transition-colors w-full text-left relative",
                            getStatusColor(booking.status)
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookingClick(booking);
                          }}
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
                              <div className="ml-2 w-1.5 h-1.5 bg-current rounded-full opacity-70 flex-shrink-0" 
                                   title="Multi-day booking" />
                            )}
                          </div>
                        </Badge>
                      );
                    })}
                    {(dayBookings.length + dayTimeOff.length) > 2 && (
                      <div className="text-xs text-muted-foreground px-1 cursor-pointer hover:text-foreground">
                        +{(dayBookings.length + dayTimeOff.length) - 2} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Selected date bookings */}
      {selectedDate && (
        <div className="sm:hidden mt-4 space-y-3">
          <div className="text-sm font-medium text-center">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </div>
          
          <div className="space-y-2">
            {getBookingsForDay(selectedDate).length === 0 && getTimeOffForDay(selectedDate).length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                No bookings or time off for this date
              </div>
            ) : (
              <>
                {getTimeOffForDay(selectedDate).map((timeOff) => {
                  const staffMember = staff.find(s => s.id === timeOff.staff_id);
                  return (
                    <div
                      key={timeOff.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-default transition-colors",
                        getTimeOffColor(timeOff.type)
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {timeOff.type === 'vacation' ? 'Vacation' : timeOff.reason}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {timeOff.is_full_day ? 'Full Day' : `${timeOff.start_time} - ${timeOff.end_time}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            {format(new Date(timeOff.start_date), 'MMM d')} - {format(new Date(timeOff.end_date), 'MMM d')}
                          </div>
                          {selectedStaff === "all" && staffMember && (
                            <div className="text-muted-foreground">
                              {staffMember.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {getBookingsForDay(selectedDate).map((booking) => {
                  const staffMember = staff.find(s => s.id === booking.staff_id);
                  const isMultiDay = multiDayBookings.has(booking.project_id);
                  
                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        getStatusColor(booking.status)
                      )}
                      onClick={() => onBookingClick(booking)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {booking.project.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.project.client.company}
                            </div>
                          </div>
                          {isMultiDay && (
                            <div className="ml-2 w-2 h-2 bg-current rounded-full opacity-60 flex-shrink-0" 
                                 title="Multi-day booking" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            {booking.start_time} - {booking.end_time}
                          </div>
                          {selectedStaff === "all" && staffMember && (
                            <div className="text-muted-foreground">
                              {staffMember.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}