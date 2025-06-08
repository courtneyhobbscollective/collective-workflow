
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface BookingSlot {
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
  sequence: number;
}

interface MultiDayBookingPreviewProps {
  bookingSlots: BookingSlot[];
  totalHours: number;
  projectTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function MultiDayBookingPreview({
  bookingSlots,
  totalHours,
  projectTitle,
  onConfirm,
  onCancel,
  loading = false
}: MultiDayBookingPreviewProps) {
  const allocatedHours = bookingSlots.reduce((sum, slot) => sum + slot.hours, 0);
  const isComplete = allocatedHours >= totalHours;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Calendar className="w-5 h-5" />
          <span>Multi-Day Booking Schedule</span>
          {isComplete && <CheckCircle className="w-5 h-5 text-green-600" />}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {projectTitle} - {allocatedHours}h of {totalHours}h allocated
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {bookingSlots.map((slot) => (
            <div 
              key={`${slot.date.toISOString()}-${slot.sequence}`}
              className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
            >
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="min-w-[60px]">
                  Day {slot.sequence}
                </Badge>
                <div>
                  <div className="font-medium">
                    {format(slot.date, 'EEEE, MMM d')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {slot.startTime} - {slot.endTime}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{slot.hours}h</span>
              </div>
            </div>
          ))}
        </div>

        {!isComplete && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-sm text-orange-800">
              <strong>Remaining hours:</strong> {totalHours - allocatedHours}h need to be scheduled separately
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm">
              <strong>Total scheduled:</strong> {allocatedHours}h across {bookingSlots.length} days
            </div>
            <Badge variant={isComplete ? "default" : "secondary"}>
              {isComplete ? "Complete" : "Partial"}
            </Badge>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={onConfirm}
              disabled={loading || bookingSlots.length === 0}
              className="flex-1"
            >
              {loading ? "Creating Bookings..." : `Book ${bookingSlots.length} Sessions`}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
