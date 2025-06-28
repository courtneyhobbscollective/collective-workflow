import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface BillingRecord {
  id: string;
  invoice_status: string;
  invoice_number: string | null;
  amount: number | null;
}

interface StatusBadgeProps {
  record: BillingRecord;
  onStatusChange: (record: BillingRecord, newStatus: string) => void;
}

export function StatusBadge({ record, onStatusChange }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'invoiced':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0">
          <Badge className={`${getStatusColor(record.invoice_status)} cursor-pointer`}>
            {record.invoice_status}
            <ChevronDown className="w-3 h-3 ml-1" />
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onStatusChange(record, 'pending')}>
          Pending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange(record, 'invoiced')}>
          Invoiced
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange(record, 'paid')}>
          Paid
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 