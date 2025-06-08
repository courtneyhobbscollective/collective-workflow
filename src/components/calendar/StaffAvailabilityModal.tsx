
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
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
}

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
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    start_date: new Date(),
    end_date: new Date(),
    reason: "",
    type: "vacation",
    is_full_day: true,
    start_time: "",
    end_time: "",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && selectedStaff) {
      loadTimeOffRecords();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      const { error } = await supabase
        .from('staff_time_off')
        .insert({
          staff_id: selectedStaff,
          start_date: format(formData.start_date, 'yyyy-MM-dd'),
          end_date: format(formData.end_date, 'yyyy-MM-dd'),
          reason: formData.reason,
          type: formData.type,
          is_full_day: formData.is_full_day,
          start_time: formData.is_full_day ? null : formData.start_time,
          end_time: formData.is_full_day ? null : formData.end_time,
          notes: formData.notes || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time off added successfully",
      });

      setShowAddForm(false);
      setFormData({
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

  const handleDelete = async (id: string) => {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vacation': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'holiday': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Staff Availability</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Select Staff Member</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Choose staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStaff && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Time Off Records</h3>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Off
                </Button>
              </div>

              {showAddForm && (
                <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, start_date: date }))}
                        className="rounded-md border"
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, end_date: date }))}
                        className="rounded-md border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Reason</Label>
                      <Input
                        value={formData.reason}
                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Reason for time off"
                        required
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
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
                      checked={formData.is_full_day}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_full_day: checked }))}
                    />
                    <Label>Full Day</Label>
                  </div>

                  {!formData.is_full_day && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={formData.start_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={formData.end_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit">Add Time Off</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
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
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
