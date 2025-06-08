
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ProfilePictureUpload } from "./ProfilePictureUpload";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  profile_picture_url: string | null;
}

interface EditStaffModalProps {
  staff: Staff;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Staff>) => Promise<void>;
}

export function EditStaffModal({ staff, open, onOpenChange, onUpdate }: EditStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: staff.name,
    email: staff.email,
    role: staff.role,
    profile_picture_url: staff.profile_picture_url || "",
  });
  const { toast } = useToast();

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

    setLoading(true);
    try {
      await onUpdate(staff.id, formData);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = (url: string) => {
    setFormData({ ...formData, profile_picture_url: url });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ProfilePictureUpload
            currentImageUrl={formData.profile_picture_url}
            onImageUploaded={handleImageUploaded}
            staffName={formData.name || "Staff Member"}
          />
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role *</Label>
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
          
          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Staff Member"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
