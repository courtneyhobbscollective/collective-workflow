
import { StaffCard } from "./StaffCard";
import type { Staff } from "@/types/staff";

interface StaffGridProps {
  staff: Staff[];
  onEditStaff: (staff: Staff) => void;
  onResendInvitation: (staff: Staff) => void;
  onDeleteStaff: (staff: Staff) => void;
}

export function StaffGrid({ staff, onEditStaff, onResendInvitation, onDeleteStaff }: StaffGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {staff.map((member) => (
        <StaffCard
          key={member.id}
          staff={member}
          onEdit={onEditStaff}
          onResendInvitation={onResendInvitation}
          onDelete={onDeleteStaff}
        />
      ))}
    </div>
  );
}
