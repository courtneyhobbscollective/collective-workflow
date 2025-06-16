
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { MultiDayBookingEngine } from "@/components/calendar/MultiDayBookingEngine";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import type { Staff } from "@/types/staff";

interface CapacityCheckerProps {
  staffId: string | null;
  projectHours: number;
  onCapacityChange: (hasCapacity: boolean, alternatives: Staff[]) => void;
  allStaff: Staff[];
}

interface DailyCapacity {
  date: Date;
  availableHours: number;
  bookedHours: number;
  timeOffHours: number;
  totalAvailable: number;
}

export function CapacityChecker({ 
  staffId, 
  projectHours, 
  onCapacityChange, 
  allStaff 
}: CapacityCheckerProps) {
  const [capacityInfo, setCapacityInfo] = useState<{
    hasCapacity: boolean;
    weeklyAvailable: number;
    weeklyTotal: number;
    dailyBreakdown: DailyCapacity[];
    alternatives: Staff[];
    timeOffConflicts: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [multiDayOption, setMultiDayOption] = useState<{
    canFit: boolean;
    totalDays: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (staffId && projectHours > 0) {
      checkStaffCapacity();
      checkMultiDayOptions();
    }
  }, [staffId, projectHours]);

  const checkStaffCapacity = async () => {
    if (!staffId) return;
    
    setLoading(true);
    try {
      const today = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);

      console.log('Checking capacity for staff:', staffId, 'Project hours:', projectHours);

      // Get existing bookings for the next week
      const { data: bookings, error: bookingError } = await supabase
        .from('project_bookings')
        .select('*')
        .eq('staff_id', staffId)
        .gte('booking_date', format(today, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekFromNow, 'yyyy-MM-dd'));

      if (bookingError) throw bookingError;

      // Get time off for the next week
      const { data: timeOff, error: timeOffError } = await supabase
        .from('staff_time_off')
        .select('*')
        .eq('staff_id', staffId)
        .eq('status', 'approved')
        .lte('start_date', format(weekFromNow, 'yyyy-MM-dd'))
        .gte('end_date', format(today, 'yyyy-MM-dd'));

      if (timeOffError) throw timeOffError;

      console.log('Bookings found:', bookings);
      console.log('Time off found:', timeOff);

      // Calculate daily capacity for each weekday
      const dailyBreakdown: DailyCapacity[] = [];
      let totalWeeklyAvailable = 0;
      const standardDailyHours = 7; // 8 hours minus 1 hour lunch
      const weeklyStandardHours = standardDailyHours * 5; // Monday to Friday

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = addDays(today, dayOffset);
        const dayOfWeek = currentDate.getDay();
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        // Calculate booked hours for this specific day
        const dayBookings = bookings?.filter(booking => booking.booking_date === dateStr) || [];
        const bookedHours = dayBookings.reduce((total, booking) => total + booking.hours_booked, 0);

        // Calculate time off hours for this specific day
        const dayTimeOff = timeOff?.filter(timeOffRecord => {
          const startDate = new Date(timeOffRecord.start_date);
          const endDate = new Date(timeOffRecord.end_date);
          return currentDate >= startDate && currentDate <= endDate;
        }) || [];

        const timeOffHours = dayTimeOff.reduce((total, timeOffRecord) => {
          if (timeOffRecord.is_full_day) {
            return total + standardDailyHours; // Full day off
          } else if (timeOffRecord.start_time && timeOffRecord.end_time) {
            const startHour = parseInt(timeOffRecord.start_time.split(':')[0]);
            const endHour = parseInt(timeOffRecord.end_time.split(':')[0]);
            return total + (endHour - startHour);
          }
          return total;
        }, 0);

        const totalAvailable = Math.max(0, standardDailyHours - bookedHours - timeOffHours);
        totalWeeklyAvailable += totalAvailable;

        dailyBreakdown.push({
          date: currentDate,
          availableHours: standardDailyHours,
          bookedHours,
          timeOffHours,
          totalAvailable
        });
      }

      const hasCapacity = totalWeeklyAvailable >= projectHours;

      console.log('Total weekly available:', totalWeeklyAvailable, 'Project needs:', projectHours, 'Has capacity:', hasCapacity);

      // Find alternative staff if current one doesn't have capacity
      let alternatives: Staff[] = [];
      if (!hasCapacity) {
        const currentStaff = allStaff.find(s => s.id === staffId);
        alternatives = allStaff.filter(s => 
          s.id !== staffId && 
          s.department === currentStaff?.department
        );
      }

      const result = {
        hasCapacity,
        weeklyAvailable: totalWeeklyAvailable,
        weeklyTotal: weeklyStandardHours,
        dailyBreakdown,
        alternatives,
        timeOffConflicts: timeOff || []
      };

      setCapacityInfo(result);
      onCapacityChange(hasCapacity, alternatives);
    } catch (error) {
      console.error('Error checking staff capacity:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMultiDayOptions = async () => {
    if (!staffId) return;
    
    try {
      const engine = new MultiDayBookingEngine(staffId, projectHours);
      const result = await engine.findOptimalBookingSlots();
      
      setMultiDayOption({
        canFit: result.canFit,
        totalDays: result.totalDays,
        message: result.message
      });
    } catch (error) {
      console.error('Error checking multi-day options:', error);
    }
  };

  if (!staffId || loading) return null;

  if (!capacityInfo && !multiDayOption) return null;

  return (
    <div className="space-y-2">
      {/* Weekly Capacity Overview */}
      {capacityInfo && (
        <>
          {capacityInfo.hasCapacity ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-1">
                  <p>Staff member has sufficient capacity</p>
                  <p className="text-sm">
                    {capacityInfo.weeklyAvailable}h available this week out of {capacityInfo.weeklyTotal}h total
                    (Need: {projectHours}h)
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p>Insufficient capacity: Only {capacityInfo.weeklyAvailable}h available, needs {projectHours}h</p>
                  
                  {/* Daily Breakdown */}
                  <div>
                    <p className="font-medium text-sm">This week's breakdown:</p>
                    <div className="grid grid-cols-1 gap-1 mt-1 text-xs">
                      {capacityInfo.dailyBreakdown.map((day, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{format(day.date, 'EEE MMM d')}:</span>
                          <span className={day.totalAvailable > 0 ? "text-green-700" : "text-red-700"}>
                            {day.totalAvailable}h available
                            {day.bookedHours > 0 && ` (${day.bookedHours}h booked)`}
                            {day.timeOffHours > 0 && ` (${day.timeOffHours}h time off)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {capacityInfo.timeOffConflicts.length > 0 && (
                    <div>
                      <p className="font-medium text-sm">Upcoming time off:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {capacityInfo.timeOffConflicts.map(timeOff => (
                          <Badge key={timeOff.id} variant="outline" className="text-xs">
                            {timeOff.type}: {format(new Date(timeOff.start_date), 'MMM d')} - {format(new Date(timeOff.end_date), 'MMM d')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {capacityInfo.alternatives.length > 0 && (
                    <div>
                      <p className="font-medium">Alternative staff available:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {capacityInfo.alternatives.map(staff => (
                          <Badge key={staff.id} variant="outline">
                            {staff.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Multi-Day Option */}
      {multiDayOption && multiDayOption.canFit && !capacityInfo?.hasCapacity && (
        <Alert className="border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-medium">Multi-Day Option Available:</p>
              <p className="text-sm">{multiDayOption.message}</p>
              <Badge variant="outline" className="bg-white">
                {multiDayOption.totalDays} days required
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* No Options Available */}
      {multiDayOption && !multiDayOption.canFit && !capacityInfo?.hasCapacity && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <p>Cannot accommodate {projectHours}h in the next 14 days. Consider:</p>
            <ul className="text-sm mt-1 ml-4 list-disc">
              <li>Assigning to a different staff member</li>
              <li>Reducing project scope</li>
              <li>Scheduling for a later date</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
