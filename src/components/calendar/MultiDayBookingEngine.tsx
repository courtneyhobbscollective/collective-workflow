
import { format, addDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface StaffAvailability {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ExistingBooking {
  booking_date: string;
  start_time: string;
  end_time: string;
  hours_booked: number;
}

interface BookingSlot {
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
  sequence: number;
}

interface MultiDayBookingResult {
  canFit: boolean;
  totalDays: number;
  bookingSlots: BookingSlot[];
  message: string;
}

export class MultiDayBookingEngine {
  private staffId: string;
  private totalHours: number;
  private minDailyHours: number = 2; // Minimum hours per booking
  private maxLookAheadDays: number = 14;

  constructor(staffId: string, totalHours: number) {
    this.staffId = staffId;
    this.totalHours = totalHours;
  }

  async findOptimalBookingSlots(): Promise<MultiDayBookingResult> {
    try {
      const availability = await this.getStaffAvailability();
      const existingBookings = await this.getExistingBookings();
      
      const bookingSlots = this.calculateOptimalSlots(availability, existingBookings);
      
      if (bookingSlots.length === 0) {
        return {
          canFit: false,
          totalDays: 0,
          bookingSlots: [],
          message: `Cannot fit ${this.totalHours} hours in the next ${this.maxLookAheadDays} days`
        };
      }

      const totalAllocatedHours = bookingSlots.reduce((sum, slot) => sum + slot.hours, 0);
      
      return {
        canFit: totalAllocatedHours >= this.totalHours,
        totalDays: bookingSlots.length,
        bookingSlots,
        message: this.generateBookingMessage(bookingSlots)
      };
    } catch (error) {
      console.error('Error finding optimal booking slots:', error);
      return {
        canFit: false,
        totalDays: 0,
        bookingSlots: [],
        message: 'Error calculating availability'
      };
    }
  }

  private async getStaffAvailability(): Promise<StaffAvailability[]> {
    const { data, error } = await supabase
      .from('staff_availability')
      .select('*')
      .eq('staff_id', this.staffId)
      .eq('is_available', true);

    if (error) throw error;
    return data || [];
  }

  private async getExistingBookings(): Promise<ExistingBooking[]> {
    const today = new Date();
    const endDate = addDays(today, this.maxLookAheadDays);

    const { data, error } = await supabase
      .from('project_bookings')
      .select('booking_date, start_time, end_time, hours_booked')
      .eq('staff_id', this.staffId)
      .gte('booking_date', format(today, 'yyyy-MM-dd'))
      .lte('booking_date', format(endDate, 'yyyy-MM-dd'));

    if (error) throw error;
    return data || [];
  }

  private calculateOptimalSlots(
    availability: StaffAvailability[], 
    existingBookings: ExistingBooking[]
  ): BookingSlot[] {
    const slots: BookingSlot[] = [];
    let remainingHours = this.totalHours;
    const today = new Date();

    for (let dayOffset = 0; dayOffset < this.maxLookAheadDays && remainingHours > 0; dayOffset++) {
      const currentDate = addDays(today, dayOffset);
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // Convert Sunday from 0 to 7
      
      // Skip weekends for now
      if (dayOfWeek === 6 || dayOfWeek === 7) continue;

      const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
      if (!dayAvailability) continue;

      const availableHours = this.calculateAvailableHoursForDay(
        currentDate, 
        dayAvailability, 
        existingBookings
      );

      if (availableHours >= this.minDailyHours) {
        const hoursToBook = Math.min(remainingHours, availableHours);
        
        const startHour = parseInt(dayAvailability.start_time.split(':')[0]);
        const endHour = startHour + hoursToBook;
        
        slots.push({
          date: currentDate,
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00`,
          hours: hoursToBook,
          sequence: slots.length + 1
        });

        remainingHours -= hoursToBook;
      }
    }

    return slots;
  }

  private calculateAvailableHoursForDay(
    date: Date, 
    availability: StaffAvailability, 
    existingBookings: ExistingBooking[]
  ): number {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = existingBookings.filter(booking => booking.booking_date === dateStr);
    
    const startHour = parseInt(availability.start_time.split(':')[0]);
    const endHour = parseInt(availability.end_time.split(':')[0]);
    const totalAvailableHours = endHour - startHour;
    
    const bookedHours = dayBookings.reduce((sum, booking) => sum + booking.hours_booked, 0);
    
    return Math.max(0, totalAvailableHours - bookedHours);
  }

  private generateBookingMessage(slots: BookingSlot[]): string {
    if (slots.length === 1) {
      return `Can be booked on ${format(slots[0].date, 'MMM d')} (${slots[0].hours}h)`;
    }
    
    const totalHours = slots.reduce((sum, slot) => sum + slot.hours, 0);
    const daysList = slots.map(slot => 
      `${format(slot.date, 'MMM d')} (${slot.hours}h)`
    ).join(', ');
    
    return `Can be split across ${slots.length} days: ${daysList} - Total: ${totalHours}h`;
  }
}
