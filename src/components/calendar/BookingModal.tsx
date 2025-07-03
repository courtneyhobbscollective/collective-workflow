import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Calendar as CalendarIcon, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { MultiDayBookingEngine } from "./MultiDayBookingEngine";
import { MultiDayBookingPreview } from "./MultiDayBookingPreview";

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
}

interface Project {
  id: string;
  title: string;
  estimated_hours?: number;
  estimated_shoot_hours?: number;
  estimated_edit_hours?: number;
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

interface BookingSlot {
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
  sequence: number;
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
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);
  const [alternativeStaff, setAlternativeStaff] = useState<Staff[]>([]);
  const [multiDaySlots, setMultiDaySlots] = useState<BookingSlot[]>([]);
  const [showMultiDayPreview, setShowMultiDayPreview] = useState(false);
  const [multiDayLoading, setMultiDayLoading] = useState(false);
  const { toast } = useToast();
  const [bookingStep, setBookingStep] = useState<'shoot' | 'edit' | null>(null);
  const [shootSlot, setShootSlot] = useState<TimeSlot | null>(null);
  const [editSlot, setEditSlot] = useState<TimeSlot | null>(null);
  const [shootDate, setShootDate] = useState<Date>();
  const [editDate, setEditDate] = useState<Date>();

  // Determine if dual booking is needed
  const hasShoot = typeof project?.estimated_shoot_hours === 'number' && project.estimated_shoot_hours > 0;
  const hasEdit = typeof project?.estimated_edit_hours === 'number' && project.estimated_edit_hours > 0;
  const needsDualBooking = hasShoot && hasEdit;
  const needsSingleShoot = hasShoot && !hasEdit;
  const needsSingleEdit = !hasShoot && hasEdit;
  const fallbackSingle = !hasShoot && !hasEdit;

  // Reset booking step when modal opens/closes or project changes
  useEffect(() => {
    if (isOpen && needsDualBooking) {
      setBookingStep('shoot');
      setShootSlot(null);
      setEditSlot(null);
      setShootDate(undefined);
      setEditDate(undefined);
    } else {
      setBookingStep(null);
      setShootSlot(null);
      setEditSlot(null);
      setShootDate(undefined);
      setEditDate(undefined);
    }
  }, [isOpen, project]);

  useEffect(() => {
    if (selectedDate && project) {
      findAvailableSlots();
    }
  }, [selectedDate, project, customHours]); // Added customHours to dependency array

  useEffect(() => {
    if (project && staff.length > 0) {
      findAlternativeStaff();
    }
  }, [project, staff]);

  const findAlternativeStaff = async () => {
    if (!project) return;

    try {
      // Find staff members with similar roles/departments who might be available
      const assignedStaff = staff.find(s => s.id === project.assigned_staff_id);
      const alternatives = staff.filter(s => 
        s.id !== project.assigned_staff_id && 
        s.department === assignedStaff?.department
      );
      
      setAlternativeStaff(alternatives);
    } catch (error) {
      console.error('Error finding alternative staff:', error);
    }
  };

  // Helper to get the correct hours for the current booking type
  function getCurrentBookingHours() {
    if (needsSingleShoot) return project?.estimated_shoot_hours || 0;
    if (needsSingleEdit) return project?.estimated_edit_hours || 0;
    if (fallbackSingle) return project?.estimated_hours || 0;
    // For dual, fallback to estimated_shoot_hours for shoot step, estimated_edit_hours for edit step
    if (needsDualBooking && bookingStep === 'shoot') return project?.estimated_shoot_hours || 0;
    if (needsDualBooking && bookingStep === 'edit') return project?.estimated_edit_hours || 0;
    return 0;
  }

  const findAvailableSlots = async () => {
    if (!selectedDate || !project) return;

    setLoadingSlots(true);
    setCapacityWarning(null);
    
    try {
      const dayOfWeek = selectedDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      const hoursNeeded = customHours ? parseFloat(customHours) : getCurrentBookingHours();

      // Get staff availability for the selected day
      const { data: availability, error: availError } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', project.assigned_staff_id)
        .eq('day_of_week', adjustedDay)
        .eq('is_available', true);

      if (availError) throw availError;

      if (!availability || availability.length === 0) {
        setCapacityWarning(`Staff member is not available on ${selectedDate.toLocaleDateString()}`);
        setAvailableSlots([]);
        return;
      }

      // Get existing bookings for the selected date
      const { data: existingBookings, error: bookingError } = await supabase
        .from('project_bookings')
        .select('*')
        .eq('staff_id', project.assigned_staff_id)
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'));

      if (bookingError) throw bookingError;

      // Calculate available time slots
      const slots: TimeSlot[] = [];

      availability?.forEach((avail) => {
        const startHour = parseInt(avail.start_time.split(':')[0]);
        const endHour = parseInt(avail.end_time.split(':')[0]);
        const totalAvailableHours = endHour - startHour;
        
        // Calculate booked hours for this day
        const bookedHours = existingBookings?.reduce((total, booking) => {
          return total + booking.hours_booked;
        }, 0) || 0;

        const remainingHours = totalAvailableHours - bookedHours;

        if (remainingHours < hoursNeeded) {
          setCapacityWarning(
            `Staff member only has ${remainingHours} hours available but needs ${hoursNeeded} hours. Please choose another staff member or reduce the hours.`
          );
          return;
        }

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

      if (slots.length === 0 && !capacityWarning) {
        setCapacityWarning(
          `No available slots found for ${hoursNeeded} hours on ${selectedDate.toLocaleDateString()}. This staff member is at capacity.`
        );
      }

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

  const findMultiDaySlots = async () => {
    if (!project) return;

    setMultiDayLoading(true);
    try {
      const hoursNeeded = customHours ? parseFloat(customHours) : getCurrentBookingHours();
      const engine = new MultiDayBookingEngine(project.assigned_staff_id, hoursNeeded);
      const result = await engine.findOptimalBookingSlots();

      if (result.canFit) {
        setMultiDaySlots(result.bookingSlots);
        setShowMultiDayPreview(true);
        setCapacityWarning(null);
      } else {
        setCapacityWarning(result.message);
        setMultiDaySlots([]);
      }
    } catch (error) {
      console.error('Error finding multi-day slots:', error);
      toast({
        title: "Error",
        description: "Failed to find multi-day booking options",
        variant: "destructive",
      });
    } finally {
      setMultiDayLoading(false);
    }
  };

  const handleMultiDayBooking = async () => {
    if (!project || multiDaySlots.length === 0) return;

    setLoading(true);
    try {
      // Create multiple bookings
      const bookingPromises = multiDaySlots.map((slot, index) => 
        supabase
          .from('project_bookings')
          .insert({
            project_id: project.id,
            staff_id: project.assigned_staff_id,
            booking_date: format(slot.date, 'yyyy-MM-dd'),
            start_time: slot.startTime,
            end_time: slot.endTime,
            hours_booked: slot.hours,
            status: 'scheduled',
            notes: `Multi-day booking sequence ${slot.sequence} of ${multiDaySlots.length}`
          })
      );

      const results = await Promise.all(bookingPromises);
      
      // Check if any failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to create ${errors.length} bookings`);
      }

      toast({
        title: "Success",
        description: `Created ${multiDaySlots.length} bookings across multiple days`,
      });

      onBookingCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating multi-day booking:', error);
      toast({
        title: "Error",
        description: "Failed to create multi-day booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    setCapacityWarning(null);
    setMultiDaySlots([]);
    setShowMultiDayPreview(false);
  };

  const staffMember = project ? staff.find(s => s.id === project.assigned_staff_id) : null;

  // Modified booking handler for dual booking
  const handleDualBooking = async () => {
    if (!project || !shootSlot || !editSlot) return;
    setLoading(true);
    try {
      // Insert shoot booking
      const { error: shootError } = await supabase
        .from('project_bookings')
        .insert({
          project_id: project.id,
          staff_id: project.assigned_staff_id,
          booking_date: format(shootSlot.date, 'yyyy-MM-dd'),
          start_time: shootSlot.startTime,
          end_time: shootSlot.endTime,
          hours_booked: shootSlot.hours,
          status: 'scheduled',
          type: 'shoot',
        });
      if (shootError) throw shootError;
      // Insert edit booking
      const { error: editError } = await supabase
        .from('project_bookings')
        .insert({
          project_id: project.id,
          staff_id: project.assigned_staff_id,
          booking_date: format(editSlot.date, 'yyyy-MM-dd'),
          start_time: editSlot.startTime,
          end_time: editSlot.endTime,
          hours_booked: editSlot.hours,
          status: 'scheduled',
          type: 'edit',
        });
      if (editError) throw editError;
      toast({
        title: 'Success',
        description: 'Shoot and Edit bookings created successfully',
      });
      onBookingCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating dual booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to create shoot/edit bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // UI for dual booking
  if (project && needsDualBooking && bookingStep) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Project: {project.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project Details</Label>
                <div className="space-y-1 text-sm">
                  <p><strong>Client:</strong> {project.client.company}</p>
                  <p><strong>Estimated Shoot Hours:</strong> {project.estimated_shoot_hours}h</p>
                  <p><strong>Estimated Edit Hours:</strong> {project.estimated_edit_hours}h</p>
                  <p><strong>Assigned to:</strong> {staffMember?.name}</p>
                </div>
              </div>
            </div>
            {bookingStep === 'shoot' && (
              <>
                <h3 className="text-lg font-semibold">Book Shoot Slot</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Select Shoot Date</Label>
                    <Calendar
                      mode="single"
                      selected={shootDate}
                      onSelect={setShootDate}
                      disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <Label>Available Shoot Time Slots</Label>
                    {shootDate ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {loadingSlots ? (
                          <p className="text-sm text-muted-foreground">Finding available slots...</p>
                        ) : availableSlots.length > 0 ? (
                          availableSlots.map((slot, index) => (
                            <Button
                              key={index}
                              variant={shootSlot === slot ? "default" : "outline"}
                              className="w-full justify-between"
                              onClick={() => setShootSlot(slot)}
                            >
                              <span>{slot.startTime} - {slot.endTime}</span>
                              <Badge variant="secondary">{slot.hours}h</Badge>
                            </Button>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {capacityWarning ? "Staff member at capacity" : "No available slots"}
                            </p>
                          </div>
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
                    onClick={() => setBookingStep('edit')}
                    disabled={!shootSlot || loading || !!capacityWarning}
                    className="flex-1"
                  >
                    Next: Book Edit Slot
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
            {bookingStep === 'edit' && (
              <>
                <h3 className="text-lg font-semibold">Book Edit Slot</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Select Edit Date</Label>
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                      disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <Label>Available Edit Time Slots</Label>
                    {editDate ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {loadingSlots ? (
                          <p className="text-sm text-muted-foreground">Finding available slots...</p>
                        ) : availableSlots.length > 0 ? (
                          availableSlots.map((slot, index) => (
                            <Button
                              key={index}
                              variant={editSlot === slot ? "default" : "outline"}
                              className="w-full justify-between"
                              onClick={() => setEditSlot(slot)}
                            >
                              <span>{slot.startTime} - {slot.endTime}</span>
                              <Badge variant="secondary">{slot.hours}h</Badge>
                            </Button>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {capacityWarning ? "Staff member at capacity" : "No available slots"}
                            </p>
                          </div>
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
                    onClick={handleDualBooking}
                    disabled={!editSlot || loading || !!capacityWarning}
                    className="flex-1"
                  >
                    {loading ? "Creating Bookings..." : "Create Shoot & Edit Bookings"}
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // UI for single shoot or single edit booking
  if (project && (needsSingleShoot || needsSingleEdit || fallbackSingle)) {
    const label = needsSingleShoot ? 'Shoot' : needsSingleEdit ? 'Edit' : 'Project';
    const hours = getCurrentBookingHours();
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Project: {project.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project Details</Label>
                <div className="space-y-1 text-sm">
                  <p><strong>Client:</strong> {project.client.company}</p>
                  <p><strong>Estimated {label} Hours:</strong> {hours}h</p>
                  <p><strong>Assigned to:</strong> {staffMember?.name}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="customHours">Custom Hours (Optional)</Label>
                <Input
                  id="customHours"
                  type="number"
                  step="0.5"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  placeholder={`Default: ${hours}h`}
                />
              </div>
            </div>
            {capacityWarning && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {capacityWarning}
                  {alternativeStaff.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Alternative staff members available:</p>
                      <ul className="mt-1 space-y-1">
                        {alternativeStaff.map(staff => (
                          <li key={staff.id} className="text-sm">
                            • {staff.name} ({staff.role})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {showMultiDayPreview && multiDaySlots.length > 0 && (
              <MultiDayBookingPreview
                bookingSlots={multiDaySlots}
                totalHours={customHours ? parseFloat(customHours) : hours}
                projectTitle={project.title}
                onConfirm={handleMultiDayBooking}
                onCancel={() => setShowMultiDayPreview(false)}
                loading={loading}
              />
            )}
            {!showMultiDayPreview && (
              <Tabs defaultValue="single" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single">Single Day Booking</TabsTrigger>
                  <TabsTrigger value="multi">Smart Multi-Day</TabsTrigger>
                </TabsList>
                <TabsContent value="single" className="space-y-4">
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
                            <div className="text-center py-4">
                              <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                {capacityWarning ? "Staff member at capacity" : "No available slots"}
                              </p>
                            </div>
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
                      disabled={!selectedSlot || loading || !!capacityWarning}
                      className="flex-1"
                    >
                      {loading ? "Creating Booking..." : "Create Single Day Booking"}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="multi" className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg">
                      <Zap className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Smart Multi-Day Scheduling</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Automatically find the best way to split this project across multiple days based on staff availability.
                      </p>
                      <Button 
                        onClick={findMultiDaySlots}
                        disabled={multiDayLoading}
                        size="lg"
                      >
                        {multiDayLoading ? "Analyzing Availability..." : "Find Optimal Schedule"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="customHours">Custom Hours (Optional)</Label>
                <Input
                  id="customHours"
                  type="number"
                  step="0.5"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  placeholder={`Default: ${project.estimated_hours}h`}
                />
              </div>
            </div>

            {capacityWarning && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {capacityWarning}
                  {alternativeStaff.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Alternative staff members available:</p>
                      <ul className="mt-1 space-y-1">
                        {alternativeStaff.map(staff => (
                          <li key={staff.id} className="text-sm">
                            • {staff.name} ({staff.role})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {showMultiDayPreview && multiDaySlots.length > 0 && (
              <MultiDayBookingPreview
                bookingSlots={multiDaySlots}
                totalHours={customHours ? parseFloat(customHours) : project.estimated_hours}
                projectTitle={project.title}
                onConfirm={handleMultiDayBooking}
                onCancel={() => setShowMultiDayPreview(false)}
                loading={loading}
              />
            )}

            {!showMultiDayPreview && (
              <Tabs defaultValue="single" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single">Single Day Booking</TabsTrigger>
                  <TabsTrigger value="multi">Smart Multi-Day</TabsTrigger>
                </TabsList>
                
                <TabsContent value="single" className="space-y-4">
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
                            <div className="text-center py-4">
                              <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                {capacityWarning ? "Staff member at capacity" : "No available slots"}
                              </p>
                            </div>
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
                      disabled={!selectedSlot || loading || !!capacityWarning}
                      className="flex-1"
                    >
                      {loading ? "Creating Booking..." : "Create Single Day Booking"}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="multi" className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg">
                      <Zap className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Smart Multi-Day Scheduling</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Automatically find the best way to split this project across multiple days based on staff availability.
                      </p>
                      <Button 
                        onClick={findMultiDaySlots}
                        disabled={multiDayLoading}
                        size="lg"
                      >
                        {multiDayLoading ? "Analyzing Availability..." : "Find Optimal Schedule"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}