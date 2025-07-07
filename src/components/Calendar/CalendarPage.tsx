import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarEntry } from '../../types';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, User, 
  Calendar as CalendarIcon, Filter 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { capitalizeWords } from '../../lib/capitalizeWords';

const STAFF_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e42', // Orange
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#a21caf', // Purple
  '#fbbf24', // Amber
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#0ea5e9', // Sky
  '#f472b6', // Pink
  '#64748b', // Slate
];

const CalendarPage: React.FC = () => {
  const { staff, briefs, clients, updateStaff } = useApp();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [modalStaff, setModalStaff] = useState<any>(null);
  const [showOtherEventModal, setShowOtherEventModal] = useState(false);
  const [otherEventForm, setOtherEventForm] = useState({
    type: 'meeting',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
  });
  const [otherEventError, setOtherEventError] = useState<string | null>(null);
  const [otherEventLoading, setOtherEventLoading] = useState(false);
  const [selectedOtherEventStaffId, setSelectedOtherEventStaffId] = useState<string>('');

  // Get all calendar entries from staff members
  const getAllCalendarEntries = (): CalendarEntry[] => {
    const allEntries: CalendarEntry[] = [];
    
    staff.forEach(member => {
      if (member.calendar && Array.isArray(member.calendar)) {
        member.calendar.forEach(entry => {
          // Convert string dates back to Date objects if needed
          const entryWithDates = {
            ...entry,
            startTime: typeof entry.startTime === 'string' ? new Date(entry.startTime) : entry.startTime,
            endTime: typeof entry.endTime === 'string' ? new Date(entry.endTime) : entry.endTime
          };
          allEntries.push(entryWithDates);
        });
      }
    });
    
    return allEntries;
  };

  const calendarEntries = getAllCalendarEntries();

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  const filteredEntries = calendarEntries.filter(entry => 
    selectedStaff === 'all' || entry.staffId === selectedStaff
  );

  const getEntriesForDay = (date: Date) => {
    return filteredEntries.filter(entry => 
      entry.startTime.toDateString() === date.toDateString()
    );
  };

  const StaffUtilizationCard: React.FC<{ member: any }> = ({ member }) => {
    // Get current week boundaries
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    // Calculate booked hours for current week from calendar entries
    const memberEntries = calendarEntries.filter(e => 
      e.staffId === member.id &&
      e.startTime >= startOfWeek && 
      e.startTime <= endOfWeek
    );
    
    const bookedHours = memberEntries.reduce((total, entry) => {
      const duration = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);
    
    const utilization = (bookedHours / member.monthlyAvailableHours) * 100;

    // Assign color by staff index for the color dot
    const staffIdx = staff.findIndex((s) => s.id === member.id);
    const colorDot = STAFF_COLORS[staffIdx % STAFF_COLORS.length];

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-1">
          <img
            src={member.avatar}
            alt={member.name}
            className="h-10 w-10 rounded-full"
          />
          <div className="flex items-center space-x-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: colorDot }}></span>
            <h3 className="text-sm font-medium text-gray-900">{capitalizeWords(member.name.split(' ')[0])}</h3>
          </div>
        </div>
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>This week: {bookedHours.toFixed(1)}h</span>
            <span>{utilization.toFixed(0)}% utilized</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                utilization > 90 ? 'bg-red-500' : 
                utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  async function handleOtherEventSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Book Other Event: submit handler fired');
    setOtherEventError(null);
    if (!user) { console.log('No user'); return; }
    setOtherEventLoading(true);
    // Determine staff member to book for
    let staffIdToBook: string;
    if (user.role === 'admin') {
      staffIdToBook = selectedOtherEventStaffId || (staff[0]?.id || '');
      if (!staffIdToBook) {
        setOtherEventError('Please select a staff member.');
        setOtherEventLoading(false);
        return;
      }
    } else {
      staffIdToBook = user.id;
    }
    const staffIdx = staff.findIndex(s => s.id === staffIdToBook);
    if (staffIdx === -1) { console.log('Staff not found for id', staffIdToBook); setOtherEventLoading(false); return; }
    const staffMember = staff[staffIdx];
    // Parse date and time
    const start = new Date(`${otherEventForm.date}T${otherEventForm.startTime}`);
    const end = new Date(`${otherEventForm.date}T${otherEventForm.endTime}`);
    console.log('Form values:', otherEventForm, 'Parsed start:', start, 'end:', end);
    // Overlap check
    const hasOverlap = (staffMember.calendar || []).some(entry => {
      return start < entry.endTime && end > entry.startTime;
    });
    if (hasOverlap) {
      setOtherEventError('This event overlaps with an existing booking. Please choose a different time.');
      setOtherEventLoading(false);
      console.log('Overlap detected');
      return;
    }
    // Assign color by event type
    const eventTypeColors: Record<string, string> = {
      meeting: '#3b82f6',
      call: '#10b981',
      holiday: '#f59e42',
      blocked: '#64748b',
    };
    let eventType: 'meeting' | 'blocked' | 'holiday';
    if (otherEventForm.type === 'call') {
      eventType = 'blocked';
    } else if (otherEventForm.type === 'meeting') {
      eventType = 'meeting';
    } else if (otherEventForm.type === 'holiday') {
      eventType = 'holiday';
    } else {
      eventType = 'blocked';
    }
    const color = eventTypeColors[otherEventForm.type] || '#64748b';
    const newEvent = {
      id: `evt-${Date.now()}`,
      staffId: staffMember.id,
      title: otherEventForm.title,
      description: otherEventForm.description,
      startTime: start,
      endTime: end,
      type: eventType,
      color,
    };
    console.log('Calling updateStaff with:', staffMember.id, { calendar: [...(staffMember.calendar || []), newEvent] });
    try {
      await updateStaff(staffMember.id, {
        calendar: [...(staffMember.calendar || []), newEvent],
      });
      console.log('updateStaff success');
      setShowOtherEventModal(false);
      setOtherEventForm({ type: 'meeting', title: '', description: '', date: '', startTime: '', endTime: '' });
      setOtherEventError(null);
      if (user.role === 'admin') setSelectedOtherEventStaffId('');
    } catch (err) {
      setOtherEventError('Failed to book event. Please try again.');
      console.error('updateStaff error', err);
    } finally {
      setOtherEventLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Manage staff schedules and bookings</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
            onClick={() => setShowOtherEventModal(true)}>
            <CalendarIcon className="h-4 w-4" />
            <span>Book Other Event</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Staff</option>
              {staff.map(member => (
                <option key={member.id} value={member.id}>{capitalizeWords(member.name)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Utilization */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {staff.map(member => (
          <StaffUtilizationCard key={member.id} member={member} />
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-gray-200 bg-white">
          <div className="p-3 text-xs font-semibold text-gray-400 text-right w-14">Time</div>
          {weekDays.map((day, index) => (
            <div key={index} className={`p-3 text-center border-l border-gray-100 first:border-l-0 ${
              day.toDateString() === new Date().toDateString() ? 'bg-indigo-50' : 'bg-white'
            }`}>
              <div className="text-xs font-semibold text-gray-700 tracking-wide">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-base font-bold mt-1 ${
                day.toDateString() === new Date().toDateString() 
                  ? 'text-indigo-600' 
                  : 'text-gray-900'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-96 overflow-y-auto bg-white">
          {Array.from({ length: 16 }, (_, i) => i + 8).map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[36px] relative group">
              <div className="p-1 text-xs text-gray-400 border-r border-gray-100 w-14 text-right align-top select-none">
                {hour}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                // Find entries that overlap this hour
                const dayEntries = getEntriesForDay(day).filter(entry => {
                  const entryStart = entry.startTime.getHours() + entry.startTime.getMinutes() / 60;
                  const entryEnd = entry.endTime.getHours() + entry.endTime.getMinutes() / 60;
                  return entryStart < hour + 1 && entryEnd > hour;
                });
                return (
                  <div key={dayIndex} className={`p-0.5 border-l border-gray-100 min-h-[36px] relative ${
                    day.toDateString() === new Date().toDateString() ? 'bg-indigo-50/50' : ''
                  }`}>
                    {/* Faint hour line */}
                    <div className="absolute left-0 right-0 top-0 h-px bg-gray-100 z-0" />
                    {dayEntries.map((entry, entryIdx) => {
                      const staffMember = staff.find(s => s.id === entry.staffId);
                      // Assign color by staff index
                      let blockColor = entry.color;
                      if (staffMember) {
                        const staffIdx = staff.findIndex(s => s.id === staffMember.id);
                        blockColor = STAFF_COLORS[staffIdx % STAFF_COLORS.length];
                      } else {
                        blockColor = '#6b7280'; // Default gray
                      }
                      // Calculate top and height for partial-hour events
                      const entryStart = entry.startTime.getHours() + entry.startTime.getMinutes() / 60;
                      const entryEnd = entry.endTime.getHours() + entry.endTime.getMinutes() / 60;
                      const blockTop = Math.max(0, (entryStart - hour) * 36); // px
                      const blockHeight = Math.max(16, (entryEnd - entryStart) * 36 - 4); // px, min 16px, gap 4px
                      // Compose single-line label
                      const label = `${entry.title}${staffMember ? ' • ' + capitalizeWords(staffMember.name) : ''} • ${entry.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-${entry.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      // Side-by-side logic for all-staff view
                      let blockStyle: React.CSSProperties = {
                        backgroundColor: blockColor,
                        top: blockTop,
                        height: blockHeight,
                        zIndex: 2,
                      };
                      if (selectedStaff === 'all' && dayEntries.length > 1) {
                        const gap = 2; // px
                        const widthPercent = 100 / dayEntries.length;
                        blockStyle = {
                          ...blockStyle,
                          width: `calc(${widthPercent}% - ${gap}px)` ,
                          left: `calc(${entryIdx * widthPercent}% + ${entryIdx * gap}px)`
                        };
                      } else {
                        blockStyle = {
                          ...blockStyle,
                          left: 4, // default left padding
                          right: 4
                        };
                      }
                      return (
                        <div
                          key={entry.id}
                          className="absolute rounded-md text-xs px-2 py-1 text-white font-medium shadow-sm transition-all duration-150 bg-opacity-90 hover:bg-opacity-100 hover:shadow-lg cursor-pointer truncate"
                          style={blockStyle}
                          title={label}
                          onClick={() => { setSelectedEntry(entry); setModalStaff(staffMember); }}
                        >
                          <span className="truncate block w-full">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedEntry && (
        (() => {
          let modalBlockColor = '#6b7280';
          if (modalStaff) {
            const staffIdx = staff.findIndex(s => s.id === modalStaff.id);
            if (staffIdx !== -1) {
              modalBlockColor = STAFF_COLORS[staffIdx % STAFF_COLORS.length];
            }
          }
          let brief: import('../../types').Brief | undefined, client: import('../../types').Client | undefined;
          if (selectedEntry.briefId) {
            brief = briefs.find(b => b.id === selectedEntry.briefId);
            if (brief) {
              client = clients.find(c => c.id === brief.clientId);
            }
          }
          let briefDescriptionBlock: React.ReactNode = null;
          if (brief && brief.description) {
            briefDescriptionBlock = (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap mb-2">
                {brief.description}
              </div>
            );
          }
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-0 relative border border-gray-200">
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() => { setSelectedEntry(null); setOtherEventError(null); }}
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-center space-x-3 px-6 pt-6 pb-2 border-b border-gray-100">
                  {modalStaff && (
                    <img src={modalStaff.avatar} alt={modalStaff.name} className="w-12 h-12 rounded-full border-2 border-white shadow" />
                  )}
                  <div>
                    <div className="text-base font-semibold text-gray-900 leading-tight">{modalStaff?.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Staff</div>
                  </div>
                </div>
                <div className="px-6 pt-3 pb-2 border-b border-gray-100">
                  <div className="text-base font-semibold text-gray-900 leading-tight">{brief?.title ? brief.title.replace(/\b\w/g, c => c.toUpperCase()) : selectedEntry.title.replace(/\b\w/g, c => c.toUpperCase())}</div>
                  {client && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">{client.companyName || client.name}</span>
                  )}
                </div>
                <div className="px-6 py-3 text-sm space-y-1 border-b border-gray-100">
                  <div><span className="font-medium text-gray-700">Date:</span> {selectedEntry.startTime.toLocaleDateString()}</div>
                  <div><span className="font-medium text-gray-700">Time:</span> {selectedEntry.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {selectedEntry.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                {briefDescriptionBlock && (
                  <div className="px-6 pt-3 pb-2">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Brief Description</div>
                    {briefDescriptionBlock}
                  </div>
                )}
                {otherEventError && (
                  <div className="px-6 text-red-600 text-xs mb-2">{otherEventError}</div>
                )}
                {(user && (user.role === 'admin' || user.id === selectedEntry.staffId)) && (
                  <div className="px-6 pb-5 pt-2 flex justify-end">
                    <button
                      className="px-3 py-1.5 text-xs rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:text-red-900 transition-colors font-medium shadow-sm"
                      style={{ minWidth: 0 }}
                      onClick={async () => {
                        const staffIdx = staff.findIndex(s => s.id === selectedEntry.staffId);
                        if (staffIdx === -1) return;
                        const staffMember = staff[staffIdx];
                        const updatedCalendar = (staffMember.calendar || []).filter(e => e.id !== selectedEntry.id);
                        await updateStaff(staffMember.id, { calendar: updatedCalendar });
                        setSelectedEntry(null);
                        setModalStaff(null);
                      }}
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}

      {showOtherEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => { setShowOtherEventModal(false); setOtherEventError(null); }}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Book Other Event</h2>
            <form className="space-y-4" onSubmit={handleOtherEventSubmit}>
              {/* Admin staff selector */}
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                  <select
                    className="input w-full"
                    value={selectedOtherEventStaffId}
                    onChange={e => setSelectedOtherEventStaffId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select staff...</option>
                    {staff.map(member => (
                      <option key={member.id} value={member.id}>{capitalizeWords(member.name)}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  className="input w-full"
                  value={otherEventForm.type}
                  onChange={e => setOtherEventForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="meeting">Meeting</option>
                  <option value="call">Phone Call</option>
                  <option value="holiday">Holiday</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  className="input w-full"
                  type="text"
                  value={otherEventForm.title}
                  onChange={e => setOtherEventForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Client Meeting"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="input w-full min-h-[60px]"
                  value={otherEventForm.description}
                  onChange={e => setOtherEventForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details"
                />
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    className="input w-full"
                    type="date"
                    value={otherEventForm.date}
                    onChange={e => setOtherEventForm(f => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    className="input w-full"
                    type="time"
                    value={otherEventForm.startTime}
                    onChange={e => setOtherEventForm(f => ({ ...f, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    className="input w-full"
                    type="time"
                    value={otherEventForm.endTime}
                    onChange={e => setOtherEventForm(f => ({ ...f, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" className="mr-2 px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setShowOtherEventModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700" disabled={otherEventLoading}>
                  {otherEventLoading ? 'Booking...' : 'Book Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;