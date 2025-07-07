import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, ChevronLeft, ChevronRight, Plus, Minus, Check, AlertTriangle } from 'lucide-react';
import { Brief, Staff } from '../../types';
import { capitalizeWords } from '../../lib/capitalizeWords';

interface CalendarBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: Brief | null;
  staff: Staff[];
  onBookCalendar: (bookings: CalendarBooking[]) => void;
}

interface CalendarBooking {
  staffId: string;
  briefId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'booked';
  color: string;
}

interface TimeSlot {
  id: string;
  date: Date;
  start: string;
  end: string;
  duration: number;
  staffId: string;
  staffName: string;
  type: 'shoot' | 'edit';
}

const CalendarBookingModal: React.FC<CalendarBookingModalProps> = ({
  isOpen,
  onClose,
  brief,
  staff,
  onBookCalendar
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingMode, setBookingMode] = useState<'shoot' | 'edit'>('shoot');
  const [selectedShootSlots, setSelectedShootSlots] = useState<TimeSlot[]>([]);
  const [selectedEditSlots, setSelectedEditSlots] = useState<TimeSlot[]>([]);
  const [searchDays, setSearchDays] = useState(30); // Search next 30 days by default

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && brief) {
      setCurrentMonth(new Date());
      setSelectedShootSlots([]);
      setSelectedEditSlots([]);
      setSearchDays(30);
      setBookingMode('shoot'); // Always start with shoot mode
    }
  }, [isOpen, brief]);

  // Auto-switch to edit mode when shoot hours are complete
  useEffect(() => {
    if (brief && bookingMode === 'shoot') {
      const shootBookedHours = selectedShootSlots.reduce((sum: number, slot: TimeSlot) => sum + slot.duration, 0);
      const shootTotalHours = brief.estimatedHours.shoot;
      
      if (shootBookedHours >= shootTotalHours && brief.estimatedHours.edit > 0) {
        setBookingMode('edit');
      }
    }
  }, [selectedShootSlots, brief, bookingMode]);

  if (!isOpen || !brief) return null;

  const assignedStaffMembers = staff.filter(s => brief.assignedStaff?.includes(s.id));
  const totalHours = bookingMode === 'shoot' ? brief.estimatedHours.shoot : brief.estimatedHours.edit;
  
  // Helper functions to get current mode's slots
  const getCurrentModeSlots = () => bookingMode === 'shoot' ? selectedShootSlots : selectedEditSlots;
  const setCurrentModeSlots = (slots: TimeSlot[]) => {
    if (bookingMode === 'shoot') {
      setSelectedShootSlots(slots);
    } else {
      setSelectedEditSlots(slots);
    }
  };
  
  const bookedHours = getCurrentModeSlots().reduce((sum: number, slot: TimeSlot) => sum + slot.duration, 0);
  const remainingHours = totalHours - bookedHours;
  
  // Check if both shoot and edit modes are complete
  const shootBookedHours = selectedShootSlots.reduce((sum: number, slot: TimeSlot) => sum + slot.duration, 0);
  const editBookedHours = selectedEditSlots.reduce((sum: number, slot: TimeSlot) => sum + slot.duration, 0);
  const shootComplete = shootBookedHours >= brief.estimatedHours.shoot;
  const editComplete = editBookedHours >= brief.estimatedHours.edit;
  const bothModesComplete = shootComplete && editComplete;

  // Generate calendar days for current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);

  // Find all available slots across multiple days
  const findAllAvailableSlots = (): TimeSlot[] => {
    const allSlots: TimeSlot[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Calculate the latest possible work date (due date minus 1 day for buffer)
    const dueDate = new Date(brief.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const latestWorkDate = new Date(dueDate);
    latestWorkDate.setDate(dueDate.getDate() - 1); // Day before due date
    
    // Determine search end date (either searchDays from today or latestWorkDate, whichever is earlier)
    const searchEndDate = new Date(today);
    searchEndDate.setDate(today.getDate() + searchDays);
    
    const actualEndDate = searchEndDate < latestWorkDate ? searchEndDate : latestWorkDate;
    
    // Helper: get slots from the other mode
    const getOtherModeSlots = () =>
      bookingMode === 'shoot' ? selectedEditSlots : selectedShootSlots;
    
    // Search through days from today to the actual end date
    for (let dayOffset = 0; dayOffset < searchDays; dayOffset++) {
      const searchDate = new Date(today);
      searchDate.setDate(today.getDate() + dayOffset);
      
      // Stop if we've reached the latest work date
      if (searchDate > actualEndDate) break;
      
      // Skip weekends
      const dayOfWeek = searchDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      assignedStaffMembers.forEach(member => {
        // Get existing calendar entries for this staff member on this date
        const existingEntries = member.calendar.filter(entry => {
          const entryDate = new Date(entry.startTime);
          return entryDate.toDateString() === searchDate.toDateString();
        });
        
        // Also treat slots from the other mode as 'booked' for this staff member
        const otherModeSlots = getOtherModeSlots().filter(slot =>
          slot.staffId === member.id &&
          slot.date.toDateString() === searchDate.toDateString()
        ).map(slot => ({
          startTime: new Date(
            new Date(slot.date).setHours(Number(slot.start.split(':')[0]), Number(slot.start.split(':')[1]), 0, 0)
          ),
          endTime: new Date(
            new Date(slot.date).setHours(Number(slot.end.split(':')[0]), Number(slot.end.split(':')[1]), 0, 0)
          )
        }));
        
        // Merge both existing calendar entries and other mode slots
        const allBlockedEntries = [
          ...existingEntries.map(e => ({ startTime: new Date(e.startTime), endTime: new Date(e.endTime) })),
          ...otherModeSlots
        ];
        
        // Sort all blocked entries by start time
        allBlockedEntries.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        // Define work hours (9 AM to 5 PM)
        const workStartHour = 9;
        const workEndHour = 17;
        
        // Find all available time blocks for this day
        let availableBlocks: Array<{start: number, end: number}> = [];
        
        // Start with the full work day
        availableBlocks.push({ start: workStartHour, end: workEndHour });
        
        // Remove blocked time from all blocked entries
        allBlockedEntries.forEach(entry => {
          const entryStart = entry.startTime.getHours();
          const entryEnd = entry.endTime.getHours();
          
          availableBlocks = availableBlocks.flatMap(block => {
            if (entryStart >= block.end || entryEnd <= block.start) {
              // No overlap
              return [block];
            } else if (entryStart <= block.start && entryEnd >= block.end) {
              // Entry completely covers block
              return [];
            } else if (entryStart <= block.start && entryEnd < block.end) {
              // Entry overlaps start of block
              return [{ start: entryEnd, end: block.end }];
            } else if (entryStart > block.start && entryEnd >= block.end) {
              // Entry overlaps end of block
              return [{ start: block.start, end: entryStart }];
            } else {
              // Entry is in middle of block
              return [
                { start: block.start, end: entryStart },
                { start: entryEnd, end: block.end }
              ];
            }
          });
        });
        
        // Generate slots from available blocks
        availableBlocks.forEach(block => {
          const blockDuration = block.end - block.start;
          
          // Create larger, more practical time blocks
          // Prioritize larger blocks to encourage consistent work sessions
          const slotDurations = [];
          
          // If we have 6+ hours available, create a 6-hour block
          if (blockDuration >= 6 && remainingHours >= 6) {
            slotDurations.push(6);
          }
          
          // If we have 4+ hours available, create a 4-hour block
          if (blockDuration >= 4 && remainingHours >= 4) {
            slotDurations.push(4);
          }
          
          // If we have 3+ hours available, create a 3-hour block
          if (blockDuration >= 3 && remainingHours >= 3) {
            slotDurations.push(3);
          }
          
          // If we have 2+ hours available, create a 2-hour block
          if (blockDuration >= 2 && remainingHours >= 2) {
            slotDurations.push(2);
          }
          
          // Only create 1-hour blocks if we have limited time or need small amounts
          if (blockDuration >= 1 && remainingHours >= 1 && remainingHours <= 2) {
            slotDurations.push(1);
          }
          
          // Create one slot per available block, using the largest practical duration
          if (slotDurations.length > 0) {
            const bestDuration = Math.max(...slotDurations);
            const startHour = block.start;
            const endHour = startHour + bestDuration;
            
            allSlots.push({
              id: `${member.id}-${searchDate.toISOString()}-${startHour}-${bestDuration}`,
              date: new Date(searchDate),
              start: `${startHour.toString().padStart(2, '0')}:00`,
              end: `${endHour.toString().padStart(2, '0')}:00`,
              duration: bestDuration,
              staffId: member.id,
              staffName: capitalizeWords(member.name),
              type: bookingMode
            });
          }
        });
      });
    }
    
    // Calculate priority scores for each slot (higher score = higher priority)
    const slotsWithPriority = allSlots.map(slot => {
      const daysUntilDue = Math.ceil((dueDate.getTime() - slot.date.getTime()) / (1000 * 60 * 60 * 24));
      const daysFromToday = Math.ceil((slot.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Priority factors:
      // 1. More time until due date = higher priority (encourage early completion)
      // 2. Longer sessions = higher priority
      // 3. Sooner availability = higher priority (but not as important as due date)
      
      let priorityScore = 0;
      
      // Due date priority (most important) - REVERSED for early completion
      if (daysUntilDue > 14) priorityScore += 1000; // Plenty of time (highest priority)
      else if (daysUntilDue > 7) priorityScore += 500; // Moderate
      else if (daysUntilDue > 3) priorityScore += 200; // Soon
      else priorityScore += 50; // Urgent (lowest priority)
      
      // Session duration priority
      priorityScore += slot.duration * 10; // Longer sessions get higher priority
      
      // Availability priority (sooner is better, but not as important as due date)
      if (daysFromToday <= 2) priorityScore += 20; // Available soon
      else if (daysFromToday <= 7) priorityScore += 10; // Available this week
      else priorityScore += 5; // Available later
      
      return { ...slot, priorityScore };
    });
    
    // Sort by priority score (highest first), then by date, then by start time
    return slotsWithPriority
      .sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore; // Higher priority first
        }
        const dateCompare = a.date.getTime() - b.date.getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.start.localeCompare(b.start);
      })
      .map(({ priorityScore, ...slot }) => slot); // Remove priority score from final result
  };

  const availableSlots = findAllAvailableSlots();

  const handleSlotSelect = (slot: TimeSlot) => {
    // Check if this slot conflicts with already selected slots for the same staff member
    const conflictingSlot = getCurrentModeSlots().find(selected => 
      selected.staffId === slot.staffId && 
      selected.date.toDateString() === slot.date.toDateString() &&
      ((selected.start < slot.end && selected.end > slot.start))
    );
    
    if (conflictingSlot) {
      alert('This time slot conflicts with an already selected slot for this staff member.');
      return;
    }
    
    // Check if adding this slot would exceed the total hours needed
    if (bookedHours + slot.duration > totalHours) {
      alert(`Adding this slot would exceed the total ${totalHours} hours needed.`);
      return;
    }
    
    setCurrentModeSlots([...getCurrentModeSlots(), slot]);
  };

  const handleSlotRemove = (slotId: string) => {
    setCurrentModeSlots(getCurrentModeSlots().filter(slot => slot.id !== slotId));
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleBookCalendar = () => {
    if (!bothModesComplete) {
      const missingShoot = brief.estimatedHours.shoot - shootBookedHours;
      const missingEdit = brief.estimatedHours.edit - editBookedHours;
      
      let message = 'Please complete both shoot and edit bookings:\n';
      if (missingShoot > 0) message += `- Shoot: ${missingShoot} hours remaining\n`;
      if (missingEdit > 0) message += `- Edit: ${missingEdit} hours remaining`;
      
      alert(message);
      return;
    }
    
    const bookings: CalendarBooking[] = [];
    
    // Combine both shoot and edit slots for booking
    const allSelectedSlots = [...selectedShootSlots, ...selectedEditSlots];
    
    allSelectedSlots.forEach(slot => {
      const [startHour, startMinute] = slot.start.split(':').map(Number);
      const [endHour, endMinute] = slot.end.split(':').map(Number);
      
      const startTime = new Date(slot.date);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(slot.date);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      bookings.push({
        staffId: slot.staffId,
        briefId: brief.id,
        title: `${brief.title} - ${slot.staffName} (${slot.type})`,
        startTime,
        endTime,
        type: 'booked',
        color: '#3B82F6'
      });
    });
    
    if (bookings.length > 0) {
      onBookCalendar(bookings);
      onClose();
    }
  };

  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getSelectedSlotsForDate = (date: Date) => {
    const allSelectedSlots = [...selectedShootSlots, ...selectedEditSlots];
    return allSelectedSlots.filter(slot => slot.date.toDateString() === date.toDateString());
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 h-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Multi-Day Calendar Booking</h3>
            <p className="text-sm text-gray-600">{brief.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Left Panel - Calendar and Slot Selection */}
          <div className="w-full lg:w-2/3 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
            {/* Booking Mode Toggle */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setBookingMode('shoot')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    bookingMode === 'shoot' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Shoot ({brief.estimatedHours.shoot}h)
                </button>
                <button
                  onClick={() => setBookingMode('edit')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    bookingMode === 'edit' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Edit ({brief.estimatedHours.edit}h)
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Search days:</label>
                <select
                  value={searchDays}
                  onChange={(e) => setSearchDays(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                </select>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mb-6">
              {/* Overall Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Overall Progress
                  </span>
                  <span className={`text-sm font-medium ${
                    bothModesComplete ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {bothModesComplete ? 'Ready to Book!' : 'Complete both modes'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((shootBookedHours + editBookedHours) / (brief.estimatedHours.shoot + brief.estimatedHours.edit)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Current Mode Progress */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {bookingMode === 'shoot' ? 'Shoot' : 'Edit'} Hours: {bookedHours}/{totalHours}
                  </span>
                  <span className={`text-sm font-medium ${
                    remainingHours === 0 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {remainingHours === 0 ? 'Complete!' : `${remainingHours}h remaining`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      bookingMode === 'shoot' ? 'bg-blue-600' : 'bg-purple-600'
                    }`}
                    style={{ width: `${(bookedHours / totalHours) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Due Date Information */}
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div className="text-sm">
                    <span className="font-medium text-yellow-800">Due Date:</span>
                    <span className="text-yellow-700 ml-1">
                      {new Date(brief.dueDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  Work must be completed by {new Date(brief.dueDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })} (day before due date). <span className="font-medium">Early completion is encouraged!</span>
                </div>
              </div>
            </div>

            {/* Available Slots */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Available Time Slots</h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No available slots found in the next {searchDays} days</p>
                    <p className="text-sm">Try increasing the search period or check staff availability</p>
                  </div>
                ) : (
                  availableSlots.map(slot => {
                    const isSelected = getCurrentModeSlots().some(s => s.id === slot.id);
                    const isDisabled = bookedHours + slot.duration > totalHours;
                    
                    // Determine session type based on duration
                    const getSessionType = (duration: number) => {
                      if (duration >= 6) return 'Full Day';
                      if (duration >= 4) return 'Half Day';
                      if (duration >= 3) return 'Extended Session';
                      if (duration >= 2) return 'Short Session';
                      return 'Quick Session';
                    };
                    
                    // Determine urgency level based on days until due date
                    const daysUntilDue = Math.ceil((new Date(brief.dueDate).getTime() - slot.date.getTime()) / (1000 * 60 * 60 * 24));
                    const getUrgencyLevel = (days: number) => {
                      if (days > 14) return { level: 'Plenty of Time', color: 'bg-green-100 text-green-800 border-green-200' };
                      if (days > 7) return { level: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
                      if (days > 3) return { level: 'Soon', color: 'bg-orange-100 text-orange-800 border-orange-200' };
                      return { level: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' };
                    };
                    
                    const sessionType = getSessionType(slot.duration);
                    const urgency = getUrgencyLevel(daysUntilDue);
                    
                    return (
                      <button
                        key={slot.id}
                        onClick={() => !isSelected && !isDisabled && handleSlotSelect(slot)}
                        disabled={isDisabled}
                        className={`w-full p-4 rounded-lg border text-left transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 text-blue-900' 
                            : isDisabled
                            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            : urgency.color
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="font-medium text-lg">
                                {slot.staffName}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                slot.duration >= 6 ? 'bg-green-100 text-green-800' :
                                slot.duration >= 4 ? 'bg-blue-100 text-blue-800' :
                                slot.duration >= 3 ? 'bg-purple-100 text-purple-800' :
                                slot.duration >= 2 ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {sessionType}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                urgency.level === 'Plenty of Time' ? 'bg-green-100 text-green-800' :
                                urgency.level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                urgency.level === 'Soon' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {urgency.level}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {slot.date.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                              {slot.start} - {slot.end} ({slot.duration} hours)
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-6 w-6 text-blue-600 ml-3" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Selected Slots Summary */}
          <div className="w-full lg:w-1/3 p-4 lg:p-6 bg-gray-50 flex flex-col h-full max-h-[95vh]">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Selected Time Slots</h4>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {getCurrentModeSlots().length === 0 && (bookingMode === 'shoot' || selectedShootSlots.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No {bookingMode} slots selected</p>
                  <p className="text-sm">Choose time slots from the left panel</p>
                </div>
              ) : (
                <div className="space-y-3 pb-32">
                  {/* Show shoot slots if in edit mode and shoot slots exist */}
                  {bookingMode === 'edit' && selectedShootSlots.length > 0 && (
                    <>
                      <div className="text-xs font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
                        Shoot Slots (Complete)
                      </div>
                      {selectedShootSlots.map(slot => {
                        const getSessionType = (duration: number) => {
                          if (duration >= 6) return 'Full Day';
                          if (duration >= 4) return 'Half Day';
                          if (duration >= 3) return 'Extended Session';
                          if (duration >= 2) return 'Short Session';
                          return 'Quick Session';
                        };
                        
                        const sessionType = getSessionType(slot.duration);
                        
                        return (
                          <div key={slot.id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <div className="font-medium text-sm text-blue-900">{slot.staffName}</div>
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {sessionType}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Shoot
                                  </span>
                                </div>
                                <div className="text-sm text-blue-700">
                                  {slot.date.toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                <div className="text-sm text-blue-700">
                                  {slot.start} - {slot.end} ({slot.duration}h)
                                </div>
                              </div>
                              <div className="text-green-600">
                                <Check className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="text-xs font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
                        Edit Slots (In Progress)
                      </div>
                    </>
                  )}
                  
                  {/* Show current mode slots */}
                  <>
                    {getCurrentModeSlots().length === 0 && bookingMode === 'edit' && selectedShootSlots.length > 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">Select edit slots to complete booking</p>
                      </div>
                    ) : (
                      getCurrentModeSlots().map(slot => {
                        // Determine session type based on duration
                        const getSessionType = (duration: number) => {
                          if (duration >= 6) return 'Full Day';
                          if (duration >= 4) return 'Half Day';
                          if (duration >= 3) return 'Extended Session';
                          if (duration >= 2) return 'Short Session';
                          return 'Quick Session';
                        };
                        
                        const sessionType = getSessionType(slot.duration);
                        
                        return (
                          <div key={slot.id} className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <div className="font-medium text-sm">{slot.staffName}</div>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    slot.duration >= 6 ? 'bg-green-100 text-green-800' :
                                    slot.duration >= 4 ? 'bg-blue-100 text-blue-800' :
                                    slot.duration >= 3 ? 'bg-purple-100 text-purple-800' :
                                    slot.duration >= 2 ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {sessionType}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {bookingMode === 'shoot' ? 'Shoot' : 'Edit'}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {slot.date.toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {slot.start} - {slot.end} ({slot.duration}h)
                                </div>
                              </div>
                              <button
                                onClick={() => handleSlotRemove(slot.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Current Mode Hours:</span>
                      <span>{bookedHours}/{totalHours}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Current Mode Slots:</span>
                      <span>{getCurrentModeSlots().length}</span>
                    </div>
                    
                    {/* Both Modes Summary */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-2">Both Modes Summary:</div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Shoot:</span>
                        <span className={shootComplete ? 'text-green-600 font-medium' : 'text-gray-600'}>
                          {shootBookedHours}/{brief.estimatedHours.shoot}h {shootComplete ? '✓' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Edit:</span>
                        <span className={editComplete ? 'text-green-600 font-medium' : 'text-gray-600'}>
                          {editBookedHours}/{brief.estimatedHours.edit}h {editComplete ? '✓' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-medium mt-1">
                        <span>Total:</span>
                        <span className={bothModesComplete ? 'text-green-600' : 'text-gray-700'}>
                          {shootBookedHours + editBookedHours}/{brief.estimatedHours.shoot + brief.estimatedHours.edit}h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 left-0 right-0 bg-gray-50 pt-4 pb-2 z-10">
              <button
                onClick={handleBookCalendar}
                disabled={!bothModesComplete}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  !bothModesComplete
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {!bothModesComplete 
                  ? (() => {
                      const missingShoot = brief.estimatedHours.shoot - shootBookedHours;
                      const missingEdit = brief.estimatedHours.edit - editBookedHours;
                      if (missingShoot > 0 && missingEdit > 0) {
                        return `Complete both modes (${missingShoot}s + ${missingEdit}e)`;
                      } else if (missingShoot > 0) {
                        return `Complete shoot (${missingShoot}h)`;
                      } else if (missingEdit > 0) {
                        return `Complete edit (${missingEdit}h)`;
                      }
                      return 'Complete both modes';
                    })()
                  : 'Book Calendar Entries'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarBookingModal; 