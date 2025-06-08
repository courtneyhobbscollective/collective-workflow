
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Expense {
  id: string;
  project_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

interface ExpenseCellProps {
  totalExpenses: number;
  expenses: Expense[];
  onOpenExpenseModal: () => void;
}

export function ExpenseCell({ totalExpenses, expenses, onOpenExpenseModal }: ExpenseCellProps) {
  return (
    <div className="flex items-center space-x-2">
      {totalExpenses > 0 ? (
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-red-600 font-medium hover:text-red-800 underline">
              £{totalExpenses.toLocaleString()}
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">Category: {expense.category}</p>
                      <p className="text-sm text-muted-foreground">Date: {new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">£{expense.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total:</span>
                  <span>£{totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
