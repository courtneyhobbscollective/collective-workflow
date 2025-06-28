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

export function StaffAvailabilityModal({ 
  isOpen, 
  onClose, 
  staff, 
  onAvailabilityUpdated 
}: StaffAvailabilityModalProps) {
  const [selectedStaff, setSelectedStaff] = useState<string>("");
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
    is_all_day: false
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && selectedStaff) {
      loadTimeOffRecords();
      loadPersonalEntries();
    }
  }, [isOpen, selectedStaff]);

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
        // If table doesn't exist, just set empty array
        if (error.code === '42P01') { // Table doesn't exist
          setPersonalEntries([]);
          return;
        }
        throw error;
      }
      setPersonalEntries((data || []) as PersonalCalendarEntry[]);
    } catch (error) {
      console.error('Error loading personal entries:', error);
      // Set empty array as fallback to prevent white screen
      setPersonalEntries([]);
      toast({
        title: "Warning",
        description: "Personal calendar entries not available yet. Please run the database migration.",
        variant: "destructive",
      });
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
        if (error.code === '42P01') { // Table doesn't exist
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
        is_all_day: false
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
        if (error.code === '42P01') { // Table doesn't exist
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Staff Availability</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Select Staff Member</Label>
            <Select value={selectedStaff || "select-staff-member"} onValueChange={(value) => setSelectedStaff(value === "select-staff-member" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select-staff-member">Choose staff member</SelectItem>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

                    <div>
                      <Label>Date</Label>
                      <Calendar
                        mode="single"
                        selected={personalEntryFormData.entry_date}
                        onSelect={(date) => date && setPersonalEntryFormData(prev => ({ ...prev, entry_date: date }))}
                        className="rounded-md border"
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
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={personalEntryFormData.start_time}
                            onChange={(e) => setPersonalEntryFormData(prev => ({ ...prev, start_time: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={personalEntryFormData.end_time}
                            onChange={(e) => setPersonalEntryFormData(prev => ({ ...prev, end_time: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select value={personalEntryFormData.entry_type} onValueChange={(value: any) => setPersonalEntryFormData(prev => ({ ...prev, entry_type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="client_call">Client Call</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Location (Optional)</Label>
                        <Input
                          value={personalEntryFormData.location}
                          onChange={(e) => setPersonalEntryFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Meeting location"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Meeting Link (Optional)</Label>
                      <Input
                        value={personalEntryFormData.meeting_link}
                        onChange={(e) => setPersonalEntryFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
                        placeholder="Google Meet, Zoom, etc."
                      />
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