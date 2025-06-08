
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Clock, User, Building } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProjectBooking {
  id: string;
  project_id: string;
  staff_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  hours_booked: number;
  status: string;
  notes?: string;
  project: {
    title: string;
    estimated_hours?: number;
    client: {
      company: string;
    };
  };
}

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
}

interface BookingReassignmentModalProps {
  booking: ProjectBooking | null;
  isOpen: boolean;
  onClose: () => void;
  staff: Staff[];
  onBookingUpdate: () => void;
}

export function BookingReassignmentModal({
  booking,
  isOpen,
  onClose,
  staff,
  onBookingUpdate
}: BookingReassignmentModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedStaff, setSelectedStaff] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (booking && isOpen) {
      setSelectedDate(new Date(booking.booking_date));
      setSelectedStaff(booking.staff_id);
      setStartTime(booking.start_time);
      setEndTime(booking.end_time);
    }
  }, [booking, isOpen]);

  const handleReassign = async () => {
    if (!booking || !selectedDate || !selectedStaff || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate hours based on time selection
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const hoursBooked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      if (hoursBooked <= 0) {
        toast({
          title: "Error",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }

      // Update the booking
      const { error: bookingError } = await supabase
        .from('project_bookings')
        .update({
          staff_id: selectedStaff,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          hours_booked: hoursBooked,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      // Update project assigned staff if it changed
      if (selectedStaff !== booking.staff_id) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ assigned_staff_id: selectedStaff })
          .eq('id', booking.project_id);

        if (projectError) throw projectError;
      }

      toast({
        title: "Success",
        description: "Booking reassigned successfully",
      });
      
      onBookingUpdate();
      onClose();
    } catch (error) {
      console.error('Error reassigning booking:', error);
      toast({
        title: "Error",
        description: "Failed to reassign booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
      const halfHour = `${hour.toString().padStart(2, '0')}:30`;
      slots.push(halfHour);
    }
    return slots;
  };

  if (!booking) return null;

  const currentStaff = staff.find(s => s.id === booking.staff_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Reassign Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-base mb-2">{booking.project.title}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Building className="w-4 h-4" />
              <span>{booking.project.client.company}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Assignment</label>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{currentStaff?.name} ({currentStaff?.role})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(booking.booking_date), 'EEEE, MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{booking.start_time} - {booking.end_time}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reassign to Staff</label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">New Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Time</label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeSlots().map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Time</label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeSlots().map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {startTime && endTime && (
              <div className="text-sm text-muted-foreground">
                Duration: {((new Date(`2000-01-01T${endTime}`).getTime() - new Date(`2000-01-01T${startTime}`).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours
              </div>
            )}
          </div>

          <div className="flex space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassign}
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Reassigning..." : "Reassign Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
