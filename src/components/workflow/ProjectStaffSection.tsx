
import { User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface AssignedStaff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface ProjectStaffSectionProps {
  assignedStaff: AssignedStaff | null;
  currentStage: string;
  staff: Staff[];
  onAssignStaff: (staffId: string) => void;
}

export function ProjectStaffSection({ 
  assignedStaff, 
  currentStage, 
  staff, 
  onAssignStaff 
}: ProjectStaffSectionProps) {
  if (assignedStaff) {
    return (
      <div className="flex items-center space-x-1 text-xs">
        <User className="w-3 h-3" />
        <span>{assignedStaff.name}</span>
      </div>
    );
  }

  if (currentStage === 'incoming') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-red-600">No staff assigned</p>
        <Select onValueChange={onAssignStaff}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Assign staff" />
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
    );
  }

  return <p className="text-xs text-red-600">No staff assigned</p>;
}
