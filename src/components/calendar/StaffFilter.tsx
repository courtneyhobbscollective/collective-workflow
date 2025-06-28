import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import type { Staff } from "@/types/staff";

interface StaffFilterProps {
  staff: Staff[];
  selectedStaff: string;
  onStaffChange: (staffId: string) => void;
}

export function StaffFilter({ staff, selectedStaff, onStaffChange }: StaffFilterProps) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <Users className="w-4 h-4" />
        <span className="font-medium text-sm">Staff:</span>
      </div>
      <Select value={selectedStaff} onValueChange={onStaffChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Staff" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Staff</SelectItem>
          {staff.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
