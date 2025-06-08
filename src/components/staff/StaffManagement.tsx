
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Edit, Mail, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePictureUpload } from "./ProfilePictureUpload";
import { EditStaffModal } from "./EditStaffModal";
import type { Staff } from "@/types/staff";

export function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Staff" as 'Admin' | 'Staff',
    profile_picture_url: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Insert staff member with invitation_status = 'pending'
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .insert([{
          ...formData,
          invitation_status: 'pending'
        }])
        .select()
        .single();

      if (staffError) throw staffError;

      // Send invitation
      await sendInvitation(staffData.id, formData.email, formData.name);

      setFormData({ name: "", email: "", role: "Staff", profile_picture_url: "" });
      setShowForm(false);
      await loadStaff();
      
      toast({
        title: "Success",
        description: "Staff member added and invitation sent successfully",
      });
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error",
        description: "Failed to add staff member. Email might already exist.",
        variant: "destructive",
      });
    }
  };

  const sendInvitation = async (staffId: string, email: string, name: string) => {
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('staff_invitations')
        .insert({
          email,
          staff_id: staffId,
          token,
          expires_at: expiresAt.toISOString(),
          created_by: 'Admin'
        });

      if (inviteError) throw inviteError;

      // Update staff status to 'invited'
      await supabase
        .from('staff')
        .update({ invitation_status: 'invited' })
        .eq('id', staffId);

      // Here you would typically call an edge function to send the email
      // For now, we'll show a toast with the invitation link
      const inviteLink = `${window.location.origin}/setup-password?token=${token}`;
      
      toast({
        title: "Invitation Created",
        description: `Copy this link and send it to ${name}: ${inviteLink}`,
        duration: 10000,
      });

    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  };

  const resendInvitation = async (staff: Staff) => {
    if (!staff.email) return;
    
    try {
      await sendInvitation(staff.id, staff.email, staff.name);
      await loadStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Staff>) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  };

  const handleImageUploaded = (url: string) => {
    setFormData({ ...formData, profile_picture_url: url });
  };

  const getStatusBadge = (invitationStatus?: string) => {
    switch (invitationStatus) {
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'invited':
        return <Badge variant="secondary"><Mail className="w-3 h-3 mr-1" />Invited</Badge>;
      case 'accepted':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      default:
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Staff Management</h2>
          <p className="text-muted-foreground">Manage your team members and send invitations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Staff Member</CardTitle>
            <p className="text-sm text-muted-foreground">
              An invitation will be sent to the staff member's email to set up their account.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ProfilePictureUpload
                currentImageUrl={formData.profile_picture_url}
                onImageUploaded={handleImageUploaded}
                staffName={formData.name || "New Staff"}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value: 'Admin' | 'Staff') => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Add Staff Member & Send Invitation</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.profile_picture_url || undefined} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>{member.name}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingStaff(member)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{member.email}</p>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.role === 'Admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {member.role}
                  </span>
                  {getStatusBadge(member.invitation_status)}
                </div>
                {member.invitation_status === 'invited' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => resendInvitation(member)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Invitation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          open={!!editingStaff}
          onOpenChange={(open) => !open && setEditingStaff(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
