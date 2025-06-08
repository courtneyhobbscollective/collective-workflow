
import { Card, CardContent } from "@/components/ui/card";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarHeader } from "./CalendarHeader";
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
    client: {
      company: string;
    };
  };
}

interface CalendarMainViewProps {
  currentDate: Date;
  view: "week" | "month";
  bookings: ProjectBooking[];
  staff: Staff[];
  selectedStaff: string;
  onViewChange: (view: "week" | "month") => void;
  onNavigateDate: (direction: "prev" | "next") => void;
  onShowAvailabilityModal: () => void;
  onTodayClick: () => void;
  onBookingUpdate: () => void;
  onBookingClick: (booking: ProjectBooking) => void;
}

export function CalendarMainView({
  currentDate,
  view,
  bookings,
  staff,
  selectedStaff,
  onViewChange,
  onNavigateDate,
  onShowAvailabilityModal,
  onTodayClick,
  onBookingUpdate,
  onBookingClick
}: CalendarMainViewProps) {
  const filteredBookings = selectedStaff === "all" 
    ? bookings 
    : bookings.filter(booking => booking.staff_id === selectedStaff);

  return (
    <Card>
      <CardContent className="p-2 sm:p-4 lg:p-6">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={onViewChange}
          onNavigateDate={onNavigateDate}
          onShowAvailabilityModal={onShowAvailabilityModal}
          onTodayClick={onTodayClick}
        />
        <div className="mt-6">
          <CalendarGrid
            currentDate={currentDate}
            view={view}
            bookings={filteredBookings}
            staff={staff}
            selectedStaff={selectedStaff}
            onBookingUpdate={onBookingUpdate}
            onBookingClick={onBookingClick}
          />
        </div>
      </CardContent>
    </Card>
  );
}
