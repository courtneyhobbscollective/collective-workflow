import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface ExpenseCellProps {
  totalExpenses: number;
  expenses: Expense[];
  onOpenExpenseModal: () => void;
}

export function ExpenseCell({ totalExpenses, expenses, onOpenExpenseModal }: ExpenseCellProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <DollarSign className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm font-medium">
            £{totalExpenses.toLocaleString()}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenExpenseModal}
          className="h-6 w-6 p-0"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      
      {expenses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {expenses.slice(0, 2).map((expense) => (
            <Badge key={expense.id} variant="outline" className="text-xs">
              {expense.category}: £{expense.amount}
            </Badge>
          ))}
          {expenses.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{expenses.length - 2} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
} 