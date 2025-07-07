# Multi-Day Calendar Booking System

## Overview
The new multi-day calendar booking system allows booking longer briefs (e.g., 20+ hours) across multiple available time slots and days, solving the limitation of the previous single-day booking system.

## Key Features

### 1. Intelligent Slot Discovery
- **Multi-day search**: Searches across 7, 14, 30, or 60 days for available slots
- **Due date respect**: Only shows slots before the brief's due date (with 1-day buffer)
- **Smart slot grouping**: Creates larger, practical time blocks (6h, 4h, 3h, 2h, 1h) based on available time
- **Consistent work sessions**: Prioritizes longer blocks to encourage focused work periods
- **Priority scoring**: Early completion slots (more time until due date) appear first
- **Conflict detection**: Prevents double-booking and time conflicts
- **Weekend exclusion**: Only considers weekdays (Monday-Friday)

### 2. Smart Slot Selection
- **Progressive booking**: Users can select multiple slots until the total hours are met
- **Real-time progress tracking**: Shows booked hours vs. total hours needed
- **Visual feedback**: Clear indication of completion status
- **Conflict prevention**: Prevents selecting overlapping slots for the same staff member
- **Urgency indicators**: Color-coded urgency levels based on proximity to due date

### 3. Multi-Slot Management
- **Individual slot removal**: Remove specific slots without affecting others
- **Summary view**: Clear overview of all selected slots
- **Staff distribution**: Can spread work across multiple staff members
- **Date flexibility**: Work can be spread across multiple days

## How It Works

### 1. Slot Discovery Algorithm
```typescript
// Calculate work deadline (due date minus 1 day for buffer)
const latestWorkDate = dueDate - 1 day;

// For each day from today to latestWorkDate:
// 1. Check if it's a weekday
// 2. Get existing calendar entries for each staff member
// 3. Calculate available time blocks by removing booked time
// 4. Create optimal slot durations based on available time:
//    - 6+ hours available → 6-hour block (Full Day)
//    - 4+ hours available → 4-hour block (Half Day)
//    - 3+ hours available → 3-hour block (Extended Session)
//    - 2+ hours available → 2-hour block (Short Session)
//    - 1 hour available → 1-hour block (Quick Session, only if needed)
// 5. Calculate priority scores:
//    - Days until due date (more time = higher priority for early completion)
//    - Session duration (longer = higher priority)
//    - Availability timing (sooner = higher priority)
// 6. Sort by priority score (early completion first)
```

### 2. Conflict Detection
- **Same staff member**: Prevents overlapping time slots
- **Same day conflicts**: Checks for time overlaps within the same day
- **Cross-day validation**: Ensures no double-booking across days

### 3. Progress Tracking
- **Real-time calculation**: Updates booked hours as slots are selected
- **Visual progress bar**: Shows completion percentage
- **Remaining hours**: Displays how many more hours need to be booked

## User Interface

### Left Panel - Slot Selection
- **Booking mode toggle**: Switch between shoot and edit work
- **Search period selector**: Choose how many days to search (7-60 days)
- **Progress indicator**: Visual progress bar and remaining hours
- **Due date information**: Shows brief due date and work deadline
- **Available slots list**: All available time slots with session types and staff names
- **Session type badges**: Color-coded badges showing Full Day, Half Day, Extended Session, etc.
- **Urgency badges**: Color-coded urgency levels (Plenty of Time, Moderate, Soon, Urgent) - prioritizing early completion

### Right Panel - Selected Slots
- **Selected slots summary**: List of all chosen time slots
- **Individual slot removal**: Remove specific slots with minus button
- **Total summary**: Shows total hours and number of slots
- **Booking button**: Only enabled when all hours are selected

## Example Use Cases

### Case 1: 20-Hour Brief
- **Shoot**: 12 hours
- **Edit**: 8 hours
- **Possible booking**:
  - Monday: 6h shoot (9-3pm) - Full Day
  - Tuesday: 6h shoot (9-3pm) - Full Day
  - Wednesday: 4h edit (9-1pm) - Half Day
  - Thursday: 4h edit (9-1pm) - Half Day

### Case 2: 40-Hour Brief
- **Shoot**: 24 hours
- **Edit**: 16 hours
- **Possible booking**:
  - Week 1: 24h shoot (4 days × 6h) - Full Day sessions
  - Week 2: 16h edit (4 days × 4h) - Half Day sessions

### Case 3: Multi-Staff Brief
- **Photographer**: 16h shoot
- **Editor**: 12h edit
- **Possible booking**:
  - Photographer: 3 days × 6h shoot (Full Day) + 1 day × 2h shoot (Short Session)
  - Editor: 3 days × 4h edit (Half Day)

## Technical Implementation

### Database Changes
- Added `calendar` column to `staff` table (JSONB)
- Stores calendar entries as JSON array
- Each entry includes: id, staffId, briefId, title, startTime, endTime, type, color

### Frontend Changes
- **CalendarBookingModal**: Completely rewritten for multi-day support
- **TimeSlot interface**: New interface for slot management
- **Slot selection logic**: Handles multiple slots per staff member
- **Conflict detection**: Prevents overlapping bookings

### Backend Changes
- **updateStaff function**: Now handles calendar field updates
- **fetchData function**: Loads calendar data from database
- **Booking creation**: Creates multiple calendar entries for multiple slots

## Benefits

1. **Flexibility**: Handle briefs of any duration
2. **Efficiency**: Optimize staff utilization across multiple days
3. **Accuracy**: Prevent overbooking and conflicts
4. **Visibility**: Clear overview of all scheduled work
5. **Scalability**: Support for complex multi-staff projects

## Future Enhancements

1. **Smart scheduling**: AI-powered slot recommendations
2. **Batch operations**: Book multiple briefs simultaneously
3. **Recurring bookings**: Support for recurring work patterns
4. **Resource optimization**: Suggest optimal slot combinations
5. **Calendar integration**: Sync with external calendar systems 