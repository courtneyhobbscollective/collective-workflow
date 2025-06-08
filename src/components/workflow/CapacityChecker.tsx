
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
}

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
  const [capacityInfo, setCapacityInfo] = useState<{
    hasCapacity: boolean;
    availableHours: number;
    nextAvailableDate: string | null;
    alternatives: Staff[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staffId && projectHours > 0) {
      checkStaffCapacity();
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

      // Calculate total available hours and booked hours
      const totalAvailableHours = availability?.reduce((total, avail) => {
        const startHour = parseInt(avail.start_time.split(':')[0]);
        const endHour = parseInt(avail.end_time.split(':')[0]);
        return total + (endHour - startHour) * 5; // Assuming 5 working days per week
      }, 0) || 0;

      const totalBookedHours = bookings?.reduce((total, booking) => {
        return total + booking.hours_booked;
      }, 0) || 0;

      const availableHours = totalAvailableHours - totalBookedHours;
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
        nextAvailableDate: null, // Could be enhanced to find next available date
        alternatives
      };

      setCapacityInfo(result);
      onCapacityChange(hasCapacity, alternatives);
    } catch (error) {
      console.error('Error checking staff capacity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!staffId || loading) return null;

  if (!capacityInfo) return null;

  return (
    <div className="space-y-2">
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
    </div>
  );
}
