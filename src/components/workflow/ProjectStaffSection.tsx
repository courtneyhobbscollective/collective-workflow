
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_picture_url?: string | null;
}

interface ProjectStaffSectionProps {
  assignedStaffId: string | null;
  staff: Staff[];
  onAssignStaff: (staffId: string) => void;
}

export function ProjectStaffSection({ assignedStaffId, staff, onAssignStaff }: ProjectStaffSectionProps) {
  const assignedStaff = staff.find(s => s.id === assignedStaffId);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">Assigned Staff</span>
      </div>
      
      {assignedStaff ? (
        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
          <Avatar className="w-6 h-6">
            <AvatarImage src={assignedStaff.profile_picture_url || undefined} />
            <AvatarFallback className="text-xs">
              {assignedStaff.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{assignedStaff.name}</span>
        </div>
      ) : (
        <Select value={assignedStaffId || ""} onValueChange={onAssignStaff}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Assign staff..." />
          </SelectTrigger>
          <SelectContent>
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
      )}
    </div>
  );
}
