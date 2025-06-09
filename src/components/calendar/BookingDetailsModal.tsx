import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Building, Target, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookingReassignmentModal } from "./BookingReassignmentModal";
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
  notes?: string;
  project: {
    title: string;
    estimated_hours?: number;
    client: {
      company: string;
    };
  };
}

interface BookingDetailsModalProps {
  booking: ProjectBooking | null;
  isOpen: boolean;
  onClose: () => void;
  staff: Staff[];
  onBookingUpdate: () => void;
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  staff,
  onBookingUpdate
}: BookingDetailsModalProps) {
  const [showReassignModal, setShowReassignModal] = useState(false);
  const { toast } = useToast();

  if (!booking) return null;

  const staffMember = staff.find(s => s.id === booking.staff_id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('project_bookings')
        .update({ status: newStatus })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
      
      onBookingUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const handleReassignComplete = () => {
    setShowReassignModal(false);
    onBookingUpdate();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Booking Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-base mb-2">{booking.project.title}</h3>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span>{booking.project.client.company}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{staffMember?.name} ({staffMember?.role})</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(new Date(booking.booking_date), 'EEEE, MMM d, yyyy')}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{booking.start_time} - {booking.end_time} ({booking.hours_booked}h)</span>
              </div>
              
              {booking.project.estimated_hours && (
                <div className="flex items-center space-x-2 text-sm">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span>Total project: {booking.project.estimated_hours}h estimated</span>
                </div>
              )}

              {booking.notes && (
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground mb-1">Notes:</p>
                  <p className="text-gray-700">{booking.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {booking.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate('completed')}
                    className="text-green-600 hover:text-green-700"
                  >
                    Mark Complete
                  </Button>
                )}
                
                {booking.status === 'scheduled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate('in_progress')}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    Start Work
                  </Button>
                )}

                {booking.status !== 'cancelled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate('cancelled')}
                    className="text-red-600 hover:text-red-700"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReassignModal(true)}
                className="w-full"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Reassign Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BookingReassignmentModal
        booking={booking}
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        staff={staff}
        onBookingUpdate={handleReassignComplete}
      />
    </>
  );
}
