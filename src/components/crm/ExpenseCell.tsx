
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ExpenseCellProps {
  totalExpenses: number;
  onOpenExpenseModal: () => void;
}

export function ExpenseCell({ totalExpenses, onOpenExpenseModal }: ExpenseCellProps) {
  return (
    <div className="flex items-center space-x-2">
      {totalExpenses > 0 ? (
        <span className="text-red-600 font-medium">
          £{totalExpenses.toLocaleString()}
        </span>
      ) : (
        <span className="text-muted-foreground">£0</span>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={onOpenExpenseModal}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
