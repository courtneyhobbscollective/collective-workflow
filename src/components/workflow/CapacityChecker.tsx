import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { MultiDayBookingEngine } from "@/components/calendar/MultiDayBookingEngine";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { Staff } from "@/types/staff";

interface CapacityCheckerProps {
  staffId: string | null;
  projectHours: number;
  onCapacityChange: (hasCapacity: boolean, alternatives: Staff[]) => void;
  allStaff: Staff[];
}

export function CapacityChecker({ 
  staffId, 
  projectHours, 
  onCapacityChange, 
  allStaff 
}: CapacityCheckerProps) {
  const [capacityInfo, setCapacityInfo<{
    hasCapacity: boolean;
    availableHours: number;
    nextAvailableDate: string | null;
    alternatives: Staff[];
    timeOffConflicts: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [multiDayOption, setMultiDayOption<{
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
      // Get next 7 days to check availability
      const today = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);

      // Check staff availability for the next week
      const { data: availability, error: availError } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staffId)
        .eq('is_available', true);

      if (availError) throw availError;

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

      // Calculate total available hours and booked hours
      const totalAvailableHours = availability?.reduce((total, avail) => {
        const startHour = parseInt(avail.start_time.split(':')[0]);
        const endHour = parseInt(avail.end_time.split(':')[0]);
        return total + (endHour - startHour) * 5; // Assuming 5 working days per week
      }, 0) || 0;

      const totalBookedHours = bookings?.reduce((total, booking) => {
        return total + booking.hours_booked;
      }, 0) || 0;

      // Calculate hours lost due to time off
      const timeOffHours = timeOff?.reduce((total, timeOffRecord) => {
        if (timeOffRecord.is_full_day) {
          // Calculate days between start and end date
          const start = new Date(timeOffRecord.start_date);
          const end = new Date(timeOffRecord.end_date);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return total + (diffDays * 8); // Assuming 8 hour work days
        } else if (timeOffRecord.start_time && timeOffRecord.end_time) {
          const startHour = parseInt(timeOffRecord.start_time.split(':')[0]);
          const endHour = parseInt(timeOffRecord.end_time.split(':')[0]);
          return total + (endHour - startHour);
        }
        return total;
      }, 0) || 0;

      const availableHours = totalAvailableHours - totalBookedHours - timeOffHours;
      const hasCapacity = availableHours >= projectHours;

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
        availableHours,
        nextAvailableDate: null,
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
      {/* Single Day Capacity Check */}
      {capacityInfo && (
        <>
          {capacityInfo.hasCapacity ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Staff member has capacity ({capacityInfo.availableHours}h available)
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p>Staff member at capacity (only {capacityInfo.availableHours}h available, needs {projectHours}h)</p>
                  
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
