import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Calendar as CalendarIcon, Clock, MapPin, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { Staff, PersonalCalendarEntry } from "@/types/staff";
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

interface TimeOff {
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

interface StaffAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff[];
  onAvailabilityUpdated: () => void;
}

const GOOGLE_CLIENT_ID = '452807347544-jndml49ifaukosogaeanopvod0fp746.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const GOOGLE_REDIRECT_URI = window.location.origin;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar'
].join(' ');

function getGoogleOAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Helper to get all time slots for a day
function getTimeSlots(startHour, endHour, duration) {
  const slots = [];
  let start = new Date();
  start.setHours(startHour, 0, 0, 0);
  let end = new Date(start);
  end.setHours(endHour, 0, 0, 0);
  while (start < end) {
    const slotEnd = new Date(start.getTime() + duration * 60000);
    if (slotEnd > end) break;
    slots.push({
      start: start.toTimeString().slice(0, 5),
      end: slotEnd.toTimeString().slice(0, 5),
    });
    start = new Date(start.getTime() + 15 * 60000); // 15 min increments for flexibility
  }
  return slots;
}

// Helper to check overlap
function isOverlapping(slot, events) {
  const slotStart = slot.start;
  const slotEnd = slot.end;
  return events.some(ev => {
    return (
      (ev.start_time < slotEnd && ev.end_time > slotStart)
    );
  });
}

// AvailableTimeSlots component
function AvailableTimeSlots({ date, duration, staffId, onSelect, selectedStart }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const dayStr = date.toISOString().slice(0, 10);
      // Fetch bookings
      const { data: bookings } = await supabase
        .from('project_bookings')
        .select('start_time, end_time, booking_date')
        .eq('staff_id', staffId)
        .eq('booking_date', dayStr);
      // Fetch time off
      const { data: timeOff } = await supabase
        .from('staff_time_off')
        .select('start_time, end_time, start_date, end_date, is_full_day')
        .eq('staff_id', staffId)
        .or(`start_date.eq.${dayStr},end_date.eq.${dayStr}`);
      // Fetch personal entries
      const { data: personal } = await supabase
        .from('personal_calendar_entries')
        .select('start_time, end_time, entry_date')
        .eq('staff_id', staffId)
        .eq('entry_date', dayStr);
      // Normalize all events to { start_time, end_time }
      const allEvents = [];
      (bookings || []).forEach(ev => allEvents.push({ start_time: ev.start_time, end_time: ev.end_time }));
      (personal || []).forEach(ev => allEvents.push({ start_time: ev.start_time, end_time: ev.end_time }));
      (timeOff || []).forEach(ev => {
        if (ev.is_full_day) {
          allEvents.push({ start_time: '00:00', end_time: '23:59' });
        } else {
          allEvents.push({ start_time: ev.start_time, end_time: ev.end_time });
        }
      });
      setEvents(allEvents);
      setLoading(false);
    }
    fetchEvents();
  }, [date, staffId]);

  // For demo, use 9-17 as working hours, Mon-Fri only
  const day = date.getDay();
  if (day === 0 || day === 6) {
    return <div className="text-sm text-muted-foreground">No working hours on weekends.</div>;
  }
  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading available slots...</div>;
  }
  const slots = getTimeSlots(9, 17, duration);
  const available = slots.filter(slot => !isOverlapping(slot, events));
  if (available.length === 0) {
    return <div className="text-sm text-muted-foreground">No available slots for this day. Try another date or duration.</div>;
  }
  return (
    <div className="space-y-2">
      <Label>Available Time Slots</Label>
      <div className="flex flex-wrap gap-2">
        {available.map(slot => (
          <Button
            key={slot.start}
            type="button"
            variant={selectedStart === slot.start ? "default" : "outline"}
            onClick={() => onSelect(slot)}
          >
            {slot.start} - {slot.end}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function StaffAvailabilityModal({ 
  isOpen, 
  onClose, 
  staff, 
  onAvailabilityUpdated 
}: StaffAvailabilityModalProps) {
  const { staff: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';
  const [selectedStaff, setSelectedStaff] = useState<string>(isAdmin ? '' : currentUser?.id || '');
  const [timeOffRecords, setTimeOffRecords] = useState<TimeOff[]>([]);
  const [personalEntries, setPersonalEntries] = useState<PersonalCalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);
  const [showPersonalEntryForm, setShowPersonalEntryForm] = useState(false);
  const [timeOffFormData, setTimeOffFormData] = useState({
    start_date: new Date(),
    end_date: new Date(),
    reason: "",
    type: "vacation",
    is_full_day: true,
    start_time: "",
    end_time: "",
    notes: ""
  });
  const [personalEntryFormData, setPersonalEntryFormData] = useState({
    title: "",
    description: "",
    entry_date: new Date(),
    start_time: "",
    end_time: "",
    entry_type: "meeting" as const,
    meeting_link: "",
    location: "",
    is_all_day: false,
    duration: 30
  });
  const { toast } = useToast();
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && selectedStaff) {
      loadTimeOffRecords();
      loadPersonalEntries();
    }
  }, [isOpen, selectedStaff]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code && !googleAccessToken) {
      (async () => {
        try {
          const params = new URLSearchParams();
          params.append('code', code);
          params.append('client_id', GOOGLE_CLIENT_ID);
          params.append('client_secret', GOOGLE_CLIENT_SECRET);
          params.append('redirect_uri', GOOGLE_REDIRECT_URI);
          params.append('grant_type', 'authorization_code');
          const tokenRes = await axios.post('https://oauth2.googleapis.com/token', params);
          setGoogleAccessToken(tokenRes.data.access_token);
          toast({ title: 'Google login successful', description: 'Access token acquired' });
          url.searchParams.delete('code');
          window.history.replaceState({}, document.title, url.pathname);
        } catch (err) {
          toast({ title: 'Failed to get access token', description: String(err), variant: 'destructive' });
        }
      })();
    }
  }, []);

  // If not admin, always use current user's staff ID
  useEffect(() => {
    if (!isAdmin && currentUser?.id) {
      setSelectedStaff(currentUser.id);
    }
  }, [isAdmin, currentUser]);

  const loadTimeOffRecords = async () => {
    if (!selectedStaff) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_time_off')
        .select('*')
        .eq('staff_id', selectedStaff)
        .gte('end_date', format(new Date(), 'yyyy-MM-dd'))
        .order('start_date');

      if (error) throw error;
      setTimeOffRecords(data || []);
    } catch (error) {
      console.error('Error loading time off records:', error);
      toast({
        title: "Error",
        description: "Failed to load time off records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalEntries = async () => {
    if (!selectedStaff) return;
    
    try {
      const { data, error } = await supabase
        .from('personal_calendar_entries')
        .select('*')
        .eq('staff_id', selectedStaff)
        .gte('entry_date', format(new Date(), 'yyyy-MM-dd'))
        .order('entry_date');

      if (error) {
        console.error('Database error loading personal entries:', error);
        if (error.code === '42P01') {
          setPersonalEntries([]);
          return;
        }
        throw error;
      }
      setPersonalEntries((data || []) as PersonalCalendarEntry[]);
    } catch (error) {
      console.error('Error loading personal entries:', error);
      setPersonalEntries([]);
      if (error && typeof error === 'object' && 'code' in error && error.code !== '42P01') {
        toast({
          title: "Error",
          description: "Failed to load personal calendar entries",
          variant: "destructive",
        });
      }
    }
  };

  const handleTimeOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      const { error } = await supabase
        .from('staff_time_off')
        .insert({
          staff_id: selectedStaff,
          start_date: format(timeOffFormData.start_date, 'yyyy-MM-dd'),
          end_date: format(timeOffFormData.end_date, 'yyyy-MM-dd'),
          reason: timeOffFormData.reason,
          type: timeOffFormData.type,
          is_full_day: timeOffFormData.is_full_day,
          start_time: timeOffFormData.is_full_day ? null : timeOffFormData.start_time,
          end_time: timeOffFormData.is_full_day ? null : timeOffFormData.end_time,
          notes: timeOffFormData.notes || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time off added successfully",
      });

      setShowTimeOffForm(false);
      setTimeOffFormData({
        start_date: new Date(),
        end_date: new Date(),
        reason: "",
        type: "vacation",
        is_full_day: true,
        start_time: "",
        end_time: "",
        notes: ""
      });
      loadTimeOffRecords();
      onAvailabilityUpdated();
    } catch (error) {
      console.error('Error adding time off:', error);
      toast({
        title: "Error",
        description: "Failed to add time off",
        variant: "destructive",
      });
    }
  };

  const handlePersonalEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      const { error } = await supabase
        .from('personal_calendar_entries')
        .insert({
          staff_id: selectedStaff,
          title: personalEntryFormData.title,
          description: personalEntryFormData.description || null,
          entry_date: format(personalEntryFormData.entry_date, 'yyyy-MM-dd'),
          start_time: personalEntryFormData.start_time,
          end_time: personalEntryFormData.end_time,
          entry_type: personalEntryFormData.entry_type,
          meeting_link: personalEntryFormData.meeting_link || null,
          location: personalEntryFormData.location || null,
          is_all_day: personalEntryFormData.is_all_day
        });

      if (error) {
        console.error('Database error adding personal entry:', error);
        if (error.code === '42P01') {
          toast({
            title: "Error",
            description: "Personal calendar entries not available yet. Please run the database migration first.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Calendar entry added successfully",
      });

      setShowPersonalEntryForm(false);
      setPersonalEntryFormData({
        title: "",
        description: "",
        entry_date: new Date(),
        start_time: "",
        end_time: "",
        entry_type: "meeting",
        meeting_link: "",
        location: "",
        is_all_day: false,
        duration: 30
      });
      loadPersonalEntries();
      onAvailabilityUpdated();
    } catch (error) {
      console.error('Error adding personal entry:', error);
      toast({
        title: "Error",
        description: "Failed to add calendar entry",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTimeOff = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff_time_off')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time off deleted successfully",
      });

      loadTimeOffRecords();
      onAvailabilityUpdated();
    } catch (error) {
      console.error('Error deleting time off:', error);
      toast({
        title: "Error",
        description: "Failed to delete time off",
        variant: "destructive",
      });
    }
  };

  const handleDeletePersonalEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personal_calendar_entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error deleting personal entry:', error);
        if (error.code === '42P01') {
          toast({
            title: "Error",
            description: "Personal calendar entries not available yet. Please run the database migration first.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Calendar entry deleted successfully",
      });

      loadPersonalEntries();
      onAvailabilityUpdated();
    } catch (error) {
      console.error('Error deleting personal entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete calendar entry",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vacation': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'holiday': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'client_call': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to create a Google Meet event
  async function createGoogleMeetEvent({ summary, start, end }: { summary: string, start: string, end: string }) {
    if (!googleAccessToken) {
      toast({ title: 'Please sign in with Google first', variant: 'destructive' });
      return null;
    }
    try {
      const event = {
        summary,
        start: { dateTime: start },
        end: { dateTime: end },
        conferenceData: {
          createRequest: {
            requestId: Math.random().toString(36).substring(2)
          }
        }
      };
      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        event,
        {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const meetLink = response.data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri;
      return meetLink;
    } catch (error) {
      toast({ title: 'Failed to create Google Meet event', description: String(error), variant: 'destructive' });
      return null;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Staff Availability</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isAdmin && (
            <div>
              <Label>Select Staff Member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedStaff && (
            <Tabs defaultValue="time-off" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="time-off">Time Off</TabsTrigger>
                <TabsTrigger value="personal">Personal Entries</TabsTrigger>
              </TabsList>

              <TabsContent value="time-off" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Time Off Records</h3>
                  <Button onClick={() => setShowTimeOffForm(!showTimeOffForm)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Time Off
                  </Button>
                </div>

                {showTimeOffForm && (
                  <form onSubmit={handleTimeOffSubmit} className="space-y-4 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Calendar
                          mode="single"
                          selected={timeOffFormData.start_date}
                          onSelect={(date) => date && setTimeOffFormData(prev => ({ ...prev, start_date: date }))}
                          className="rounded-md border"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Calendar
                          mode="single"
                          selected={timeOffFormData.end_date}
                          onSelect={(date) => date && setTimeOffFormData(prev => ({ ...prev, end_date: date }))}
                          className="rounded-md border"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Reason</Label>
                        <Input
                          value={timeOffFormData.reason}
                          onChange={(e) => setTimeOffFormData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Reason for time off"
                          required
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={timeOffFormData.type} onValueChange={(value) => setTimeOffFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vacation">Vacation</SelectItem>
                            <SelectItem value="sick">Sick Leave</SelectItem>
                            <SelectItem value="holiday">Holiday</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={timeOffFormData.is_full_day}
                        onCheckedChange={(checked) => setTimeOffFormData(prev => ({ ...prev, is_full_day: checked }))}
                      />
                      <Label>Full Day</Label>
                    </div>

                    {!timeOffFormData.is_full_day && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={timeOffFormData.start_time}
                            onChange={(e) => setTimeOffFormData(prev => ({ ...prev, start_time: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={timeOffFormData.end_time}
                            onChange={(e) => setTimeOffFormData(prev => ({ ...prev, end_time: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        value={timeOffFormData.notes}
                        onChange={(e) => setTimeOffFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button type="submit" size="sm">Add Time Off</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowTimeOffForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {loading ? (
                    <div>Loading...</div>
                  ) : timeOffRecords.length === 0 ? (
                    <p className="text-muted-foreground">No upcoming time off scheduled</p>
                  ) : (
                    timeOffRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getTypeColor(record.type)}>
                              {record.type}
                            </Badge>
                            <span className="font-medium">{record.reason}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(record.start_date), 'MMM d, yyyy')} - {format(new Date(record.end_date), 'MMM d, yyyy')}
                            {!record.is_full_day && record.start_time && record.end_time && (
                              <span> ({record.start_time} - {record.end_time})</span>
                            )}
                          </div>
                          {record.notes && (
                            <div className="text-sm text-muted-foreground mt-1">{record.notes}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTimeOff(record.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="personal" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Personal Calendar Entries</h3>
                  <Button onClick={() => setShowPersonalEntryForm(!showPersonalEntryForm)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Entry
                  </Button>
                </div>

                {showPersonalEntryForm && (
                  <form onSubmit={handlePersonalEntrySubmit} className="space-y-4 p-4 border rounded-lg">
                    {!googleAccessToken && (
                      <div className="mb-2 flex flex-col items-start space-y-2">
                        <span className="text-sm text-muted-foreground">To create a Google Meet link, please sign in with your Google account:</span>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => { window.location.href = getGoogleOAuthUrl(); }}
                        >
                          Sign in with Google
                        </button>
                      </div>
                    )}
                    <div>
                      <Label>Meeting Duration</Label>
                      <select
                        value={personalEntryFormData.duration || 30}
                        onChange={e => setPersonalEntryFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                        className="input"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Calendar
                        mode="single"
                        selected={personalEntryFormData.entry_date}
                        onSelect={date => date && setPersonalEntryFormData(prev => ({ ...prev, entry_date: date }))}
                        className="rounded-md border"
                      />
                    </div>
                    {personalEntryFormData.entry_date && personalEntryFormData.duration && (
                      <AvailableTimeSlots
                        date={personalEntryFormData.entry_date}
                        duration={personalEntryFormData.duration}
                        staffId={selectedStaff}
                        onSelect={slot => setPersonalEntryFormData(prev => ({ ...prev, start_time: slot.start, end_time: slot.end }))}
                        selectedStart={personalEntryFormData.start_time}
                      />
                    )}
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={personalEntryFormData.title}
                        onChange={(e) => setPersonalEntryFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Meeting title"
                        required
                      />
                    </div>

                    <div>
                      <Label>Description (Optional)</Label>
                      <Textarea
                        value={personalEntryFormData.description}
                        onChange={(e) => setPersonalEntryFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Meeting description"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={personalEntryFormData.is_all_day}
                        onCheckedChange={(checked) => setPersonalEntryFormData(prev => ({ ...prev, is_all_day: checked }))}
                      />
                      <Label>All Day</Label>
                    </div>

                    {!personalEntryFormData.is_all_day && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Location (Optional)</Label>
                          <Input
                            value={personalEntryFormData.location}
                            onChange={(e) => setPersonalEntryFormData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Meeting location"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>Meeting Link</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={personalEntryFormData.meeting_link}
                          onChange={(e) => setPersonalEntryFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
                          placeholder="Google Meet or Zoom link"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!personalEntryFormData.title || !personalEntryFormData.start_time || !personalEntryFormData.end_time) {
                              toast({ title: 'Please fill in title, start, and end time first', variant: 'destructive' });
                              return;
                            }
                            const start = `${format(personalEntryFormData.entry_date, 'yyyy-MM-dd')}T${personalEntryFormData.start_time}`;
                            const end = `${format(personalEntryFormData.entry_date, 'yyyy-MM-dd')}T${personalEntryFormData.end_time}`;
                            const meetLink = await createGoogleMeetEvent({
                              summary: personalEntryFormData.title,
                              start,
                              end
                            });
                            if (meetLink) setPersonalEntryFormData(prev => ({ ...prev, meeting_link: meetLink }));
                          }}
                          disabled={!googleAccessToken}
                        >
                          Create Google Meet Link
                        </Button>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button type="submit" size="sm">Add Entry</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowPersonalEntryForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {personalEntries.length === 0 ? (
                    <p className="text-muted-foreground">No personal calendar entries</p>
                  ) : (
                    personalEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getEntryTypeColor(entry.entry_type)}>
                              {entry.entry_type.replace('_', ' ')}
                            </Badge>
                            <span className="font-medium">{entry.title}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                            {!entry.is_all_day && (
                              <span> • {entry.start_time} - {entry.end_time}</span>
                            )}
                          </div>
                          {entry.description && (
                            <div className="text-sm text-muted-foreground mt-1">{entry.description}</div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            {entry.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{entry.location}</span>
                              </div>
                            )}
                            {entry.meeting_link && (
                              <div className="flex items-center space-x-1">
                                <Link className="w-3 h-3" />
                                <a href={entry.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Join Meeting
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePersonalEntry(entry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}