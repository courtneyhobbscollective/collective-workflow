import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarMainView } from "./CalendarMainView";
import { BookingModal } from "./BookingModal";
import { StaffAvailabilityModal } from "./StaffAvailabilityModal";
import { BookingDetailsModal } from "./BookingDetailsModal";
import type { Staff, PersonalCalendarEntry } from "@/types/staff";

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

export function CalendarView() {
  const { staff: currentUser } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<ProjectBooking[]>([]);
  const [staffTimeOff, setStaffTimeOff] = useState<StaffTimeOff[]>([]);
  const [personalEntries, setPersonalEntries] = useState<PersonalCalendarEntry[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>(currentUser?.id || "all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("month");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ProjectBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  // Update selectedStaff when currentUser changes
  useEffect(() => {
    if (currentUser?.id) {
      setSelectedStaff(currentUser.id);
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      console.log('Loading calendar data...');
      
      // Load staff
      console.log('Loading staff data...');
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);

      if (staffError) {
        console.error('Staff loading error:', staffError);
        throw new Error(`Failed to load staff: ${staffError.message}`);
      }

      // Load bookings
      console.log('Loading bookings data...');
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('project_bookings')
        .select(`
          *,
          project:projects(
            title,
            client:clients(company)
          )
        `)
        .order('booking_date', { ascending: true });

      if (bookingsError) {
        console.error('Bookings loading error:', bookingsError);
        throw new Error(`Failed to load bookings: ${bookingsError.message}`);
      }

      // Load staff time off
      console.log('Loading time off data...');
      const { data: timeOffData, error: timeOffError } = await supabase
        .from('staff_time_off')
        .select('*')
        .eq('status', 'approved') // Only show approved time off
        .order('start_date', { ascending: true });

      if (timeOffError) {
        console.error('Time off loading error:', timeOffError);
        // Don't throw for time off - just use empty array
        console.log('Using empty time off array due to error');
      }

      // Load personal calendar entries
      console.log('Loading personal entries data...');
      const { data: personalEntriesData, error: personalEntriesError } = await supabase
        .from('personal_calendar_entries')
        .select('*')
        .order('entry_date', { ascending: true });

      if (personalEntriesError) {
        console.error('Error loading personal entries:', personalEntriesError);
        // If table doesn't exist, just continue with empty array
        if (personalEntriesError.code === '42P01') {
          console.log('Personal calendar entries table does not exist yet');
        } else {
          console.log('Using empty personal entries array due to error');
        }
      }

      // Transform staff data to match our Staff interface
      const transformedStaff = (staffData || []).map((member: any) => ({
        ...member,
        department: member.department || 'General',
        invitation_status: member.invitation_status as 'pending' | 'invited' | 'accepted'
      })) as Staff[];

      console.log('Setting calendar data...');
      setStaff(transformedStaff);
      setBookings(bookingsData || []);
      setStaffTimeOff(timeOffData || []);
      setPersonalEntries((personalEntriesData || []) as PersonalCalendarEntry[]);
      
      console.log('Calendar data loaded successfully');
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load calendar data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const openBookingDetailsModal = (booking: ProjectBooking) => {
    setSelectedBooking(booking);
    setShowBookingDetailsModal(true);
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading calendar...</div>;
  }

  return (
    <div className="space-y-4 p-4 max-w-full">
      {/* Full-width calendar */}
      <div className="w-full">
        <CalendarMainView
          currentDate={currentDate}
          view={view}
          bookings={bookings}
          staff={staff}
          staffTimeOff={staffTimeOff}
          personalEntries={personalEntries}
          selectedStaff={selectedStaff}
          onViewChange={setView}
          onNavigateDate={navigateDate}
          onShowAvailabilityModal={() => setShowAvailabilityModal(true)}
          onTodayClick={handleTodayClick}
          onBookingUpdate={loadData}
          onBookingClick={openBookingDetailsModal}
          onStaffChange={setSelectedStaff}
        />
      </div>

      <StaffAvailabilityModal
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        staff={staff}
        onAvailabilityUpdated={loadData}
      />

      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={showBookingDetailsModal}
        onClose={() => setShowBookingDetailsModal(false)}
        staff={staff}
        onBookingUpdate={loadData}
      />
    </div>
  );
}
