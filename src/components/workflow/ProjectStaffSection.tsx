import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import type { Staff } from "@/types/staff";

interface ProjectStaffSectionProps {
  assignedStaffId: string | null;
  staff: Staff[];
  onAssignStaff: (staffId: string | null) => void; // Allow null for unassigning
}

export function ProjectStaffSection({ assignedStaffId, staff, onAssignStaff }: ProjectStaffSectionProps) {
  const assignedStaff = staff.find(s => s.id === assignedStaffId);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">Assigned Staff</span>
      </div>
      
      <Select 
        value={assignedStaffId || "unassigned"} 
        onValueChange={(value) => onAssignStaff(value === "unassigned" ? null : value)}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Assign staff..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">
            <div className="flex items-center space-x-2">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-xs">?</AvatarFallback>
              </Avatar>
              <span>Unassigned</span>
            </div>
          </SelectItem>
          {staff.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              <div className="flex items-center space-x-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={member.profile_picture_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                <span>{member.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}