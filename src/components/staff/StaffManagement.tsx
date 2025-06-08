
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EditStaffModal } from "./EditStaffModal";
import { AddStaffForm } from "./AddStaffForm";
import { StaffGrid } from "./StaffGrid";
import type { Staff } from "@/types/staff";

export function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
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

  const handleAddStaff = async (formData: {
    name: string;
    email: string;
    role: 'Admin' | 'Staff';
    profile_picture_url: string;
  }) => {
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
        <AddStaffForm
          onSubmit={handleAddStaff}
          onCancel={() => setShowForm(false)}
        />
      )}

      <StaffGrid
        staff={staff}
        onEditStaff={setEditingStaff}
        onResendInvitation={resendInvitation}
      />

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
