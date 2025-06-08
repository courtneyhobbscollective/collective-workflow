
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface BillingRecord {
  id: string;
  project_id: string;
  stage_id: string;
  billing_percentage: number;
  amount: number | null;
  invoice_status: string;
  invoice_number: string | null;
  created_at: string;
  processed_at: string | null;
  project: {
    title: string;
    project_value: number | null;
    is_retainer: boolean;
    treat_as_oneoff: boolean;
    po_number: string | null;
    client: {
      company: string;
      name: string;
      email?: string;
      phone?: string;
      contact_person?: string;
      address?: string;
    };
  };
  stage: {
    name: string;
  };
}

interface StatusBadgeProps {
  record: BillingRecord;
  onStatusChange: (record: BillingRecord, newStatus: string) => void;
}

export function StatusBadge({ record, onStatusChange }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer';
      case 'invoiced':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Can be Invoiced';
      case 'invoiced':
        return 'Invoiced';
      case 'on_hold':
        return 'On Hold';
      default:
        return status;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge className={getStatusColor(record.invoice_status)}>
          {getStatusText(record.invoice_status)}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-48 bg-background border shadow-md">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Change Status</h4>
          <div className="space-y-1">
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onStatusChange(record, 'pending')}
            >
              Can be Invoiced
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onStatusChange(record, 'invoiced')}
            >
              Invoiced
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onStatusChange(record, 'on_hold')}
            >
              On Hold
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
