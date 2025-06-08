
import { Card, CardContent } from "@/components/ui/card";
import { StaffFilter } from "@/components/calendar/StaffFilter";
import type { Staff } from "@/types/staff";

interface WorkflowHeaderProps {
  staff: Staff[];
  selectedStaff: string;
  onStaffChange: (staffId: string) => void;
}

export function WorkflowHeader({ 
  staff, 
  selectedStaff, 
  onStaffChange 
}: WorkflowHeaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Workflow Board</h2>
        <p className="text-muted-foreground">Track projects through your creative workflow with staff assignments and project gates</p>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="max-w-xs">
            <StaffFilter
              staff={staff}
              selectedStaff={selectedStaff}
              onStaffChange={onStaffChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
