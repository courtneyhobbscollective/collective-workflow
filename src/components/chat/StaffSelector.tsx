
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStaff } from "@/contexts/StaffContext";

export function StaffSelector() {
  const { currentStaff, allStaff, setCurrentStaff } = useStaff();

  const handleStaffChange = (staffId: string) => {
    const selectedStaff = allStaff.find(s => s.id === staffId);
    if (selectedStaff) {
      setCurrentStaff(selectedStaff);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-muted-foreground">Chat as:</span>
      <Select value={currentStaff?.id || ""} onValueChange={handleStaffChange}>
        <SelectTrigger className="w-48">
          <SelectValue>
            {currentStaff && (
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={currentStaff.profile_picture_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {currentStaff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{currentStaff.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allStaff.map((staff) => (
            <SelectItem key={staff.id} value={staff.id}>
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={staff.profile_picture_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{staff.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
