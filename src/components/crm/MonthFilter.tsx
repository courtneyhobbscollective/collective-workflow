
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonthFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  monthlyGroups: { [key: string]: any[] };
}

export function MonthFilter({ selectedMonth, onMonthChange, monthlyGroups }: MonthFilterProps) {
  return (
    <div className="mb-4">
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Filter by month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All months</SelectItem>
          {Object.keys(monthlyGroups).map((month) => (
            <SelectItem key={month} value={month}>
              {month} ({monthlyGroups[month].length})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
