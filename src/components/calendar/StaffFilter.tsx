
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, User } from "lucide-react";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface StaffFilterProps {
  staff: Staff[];
  selectedStaff: string;
  onStaffChange: (staffId: string) => void;
}

export function StaffFilter({ staff, selectedStaff, onStaffChange }: StaffFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Staff Filter</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button
            variant={selectedStaff === "all" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onStaffChange("all")}
          >
            <Users className="w-4 h-4 mr-2" />
            All Staff
          </Button>
          
          {staff.map((member) => (
            <Button
              key={member.id}
              variant={selectedStaff === member.id ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => onStaffChange(member.id)}
            >
              <User className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">{member.name}</div>
                <div className="text-xs text-muted-foreground">{member.role}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
