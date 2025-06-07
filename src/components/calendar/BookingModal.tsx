
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, addHours, parseISO } from "date-fns";

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
}

interface Project {
  id: string;
  title: string;
  estimated_hours: number;
  assigned_staff_id: string;
  client: {
    company: string;
  };
}

interface StaffAvailability {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  staff: Staff[];
  onBookingCreated: () => void;
}

export function BookingModal({ 
  isOpen, 
  onClose, 
  project, 
  staff, 
  onBookingCreated 
}: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customHours, setCustomHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate && project) {
      findAvailableSlots();
    }
  }, [selectedDate, project]);

  const findAvailableSlots = async () => {
    if (!selectedDate || !project) return;

    setLoadingSlots(true);
    try {
      const dayOfWeek = selectedDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7

      // Get staff availability for the selected day
      const { data: availability, error: availError } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', project.assigned_staff_id)
        .eq('day_of_week', adjustedDay)
        .eq('is_available', true);

      if (availError) throw availError;

      // Get existing bookings for the selected date
      const { data: existingBookings, error: bookingError } = await supabase
        .from('project_bookings')
        .select('*')
        .eq('staff_id', project.assigned_staff_id)
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'));

      if (bookingError) throw bookingError;

      // Calculate available time slots
      const slots: TimeSlot[] = [];
      const hoursNeeded = project.estimated_hours;

      availability?.forEach((avail) => {
        const startHour = parseInt(avail.start_time.split(':')[0]);
        const endHour = parseInt(avail.end_time.split(':')[0]);
        
        // Check each possible starting hour
        for (let hour = startHour; hour <= endHour - hoursNeeded; hour++) {
          const slotStart = `${hour.toString().padStart(2, '0')}:00`;
          const slotEnd = `${(hour + hoursNeeded).toString().padStart(2, '0')}:00`;
          
          // Check if this slot conflicts with existing bookings
          const hasConflict = existingBookings?.some(booking => {
            const bookingStart = parseInt(booking.start_time.split(':')[0]);
            const bookingEnd = parseInt(booking.end_time.split(':')[0]);
            return (hour < bookingEnd && (hour + hoursNeeded) > bookingStart);
          });

          if (!hasConflict && (hour + hoursNeeded) <= endHour) {
            slots.push({
              date: selectedDate,
              startTime: slotStart,
              endTime: slotEnd,
              hours: hoursNeeded
            });
          }
        }
      });

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error finding available slots:', error);
      toast({
        title: "Error",
        description: "Failed to find available time slots",
        variant: "destructive",
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    if (!project || !selectedSlot) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_bookings')
        .insert({
          project_id: project.id,
          staff_id: project.assigned_staff_id,
          booking_date: format(selectedSlot.date, 'yyyy-MM-dd'),
          start_time: selectedSlot.startTime,
          end_time: selectedSlot.endTime,
          hours_booked: customHours ? parseFloat(customHours) : selectedSlot.hours,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project booking created successfully",
      });

      onBookingCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(undefined);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setCustomHours("");
  };

  const staffMember = project ? staff.find(s => s.id === project.assigned_staff_id) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Project: {project?.title}</DialogTitle>
        </DialogHeader>
        
        {project && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project Details</Label>
                <div className="space-y-1 text-sm">
                  <p><strong>Client:</strong> {project.client.company}</p>
                  <p><strong>Estimated Hours:</strong> {project.estimated_hours}h</p>
                  <p><strong>Assigned to:</strong> {staffMember?.name}</p>
                </div>
              </div>
              <div>
                <Label>Custom Hours (Optional)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  placeholder={`Default: ${project.estimated_hours}h`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  className="rounded-md border"
                />
              </div>

              <div>
                <Label>Available Time Slots</Label>
                {selectedDate ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {loadingSlots ? (
                      <p className="text-sm text-muted-foreground">Finding available slots...</p>
                    ) : availableSlots.length > 0 ? (
                      availableSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={selectedSlot === slot ? "default" : "outline"}
                          className="w-full justify-between"
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <span>{slot.startTime} - {slot.endTime}</span>
                          <Badge variant="secondary">{slot.hours}h</Badge>
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No available slots for {project.estimated_hours} hours on this date.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a date to see available time slots.
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleBooking} 
                disabled={!selectedSlot || loading}
                className="flex-1"
              >
                {loading ? "Creating Booking..." : "Create Booking"}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
