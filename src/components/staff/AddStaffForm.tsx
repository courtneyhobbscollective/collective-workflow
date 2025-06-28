import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfilePictureUpload } from "./ProfilePictureUpload";
import type { Staff } from "@/types/staff";

interface AddStaffFormProps {
  onSubmit: (formData: {
    name: string;
    email: string;
    role: 'Admin' | 'Staff';
    profile_picture_url: string;
    available_hours_per_week: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export function AddStaffForm({ onSubmit, onCancel }: AddStaffFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Staff" as 'Admin' | 'Staff',
    profile_picture_url: "",
    available_hours_per_week: 22,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ name: "", email: "", role: "Staff", profile_picture_url: "", available_hours_per_week: 22 });
  };

  const handleImageUploaded = (url: string) => {
    setFormData({ ...formData, profile_picture_url: url });
  };

  return (
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
            <div>
              <Label htmlFor="available_hours">Available Hours Per Week *</Label>
              <Input
                id="available_hours"
                type="number"
                min="1"
                max="168"
                value={formData.available_hours_per_week}
                onChange={(e) => setFormData({ ...formData, available_hours_per_week: parseInt(e.target.value) || 22 })}
                placeholder="22"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of hours this staff member is available for project work per week
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button type="submit">Add Staff Member & Send Invitation</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
