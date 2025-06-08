
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { BookingModal } from "@/components/calendar/BookingModal";

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

interface BookingButtonProps {
  project: Project;
  staff: Staff[];
  onBookingCreated: () => void;
  disabled?: boolean;
}

export function BookingButton({ 
  project, 
  staff, 
  onBookingCreated, 
  disabled = false 
}: BookingButtonProps) {
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="w-full mt-2"
        onClick={() => setShowBookingModal(true)}
        disabled={disabled || !project.assigned_staff_id}
      >
        <Calendar className="w-3 h-3 mr-1" />
        Book Calendar
      </Button>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        project={project}
        staff={staff}
        onBookingCreated={() => {
          onBookingCreated();
          setShowBookingModal(false);
        }}
      />
    </>
  );
}
