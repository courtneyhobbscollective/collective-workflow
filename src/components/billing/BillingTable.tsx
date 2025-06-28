
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ClientInfoModal } from "./ClientInfoModal";
import { CommentsModal } from "./CommentsModal";
import { ExpenseCell } from "./ExpenseCell";

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

interface Expense {
  id: string;
  project_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

interface BillingTableProps {
  records: BillingRecord[];
  expenses: Expense[];
  onUpdate: (recordId: string, amount: number, invoiceNumber: string, status: string) => void;
  onOpenExpenseModal: (projectId: string) => void;
  calculateBillingAmount: (record: BillingRecord) => number;
  getTotalExpenses: (projectId: string) => number;
}

export function BillingTable({ 
  records, 
  expenses, 
  onUpdate, 
  onOpenExpenseModal, 
  calculateBillingAmount, 
  getTotalExpenses 
}: BillingTableProps) {
  const [comments, setComments] = useState<{[key: string]: string}>({});

  const handleStatusChange = (record: BillingRecord, newStatus: string) => {
    const calculatedAmount = calculateBillingAmount(record);
    const defaultInvoiceNumber = newStatus === 'invoiced' ? `INV-${record.project.title.substring(0, 3).toUpperCase()}-${Date.now()}` : '';
    onUpdate(record.id, record.amount || calculatedAmount, defaultInvoiceNumber, newStatus);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleCommentsUpdate = (recordId: string, newComments: {[key: string]: string}) => {
    setComments(newComments);
  };

  const getProjectExpenses = (projectId: string) => {
    return expenses.filter(expense => expense.project_id === projectId);
  };

  return (
    <ScrollArea className="w-full">
      <div className="min-w-[800px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Project Name</TableHead>
              <TableHead className="text-left">Company</TableHead>
              <TableHead className="text-left">Client Name</TableHead>
              <TableHead className="w-12 text-left">
                <MessageSquare className="w-4 h-4" />
              </TableHead>
              <TableHead className="text-left">Stage</TableHead>
              <TableHead className="text-left">Expenses</TableHead>
              <TableHead className="text-left">Status</TableHead>
              <TableHead className="text-left">Deal Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const totalProjectExpenses = getTotalExpenses(record.project_id);
              const calculatedAmount = calculateBillingAmount(record);
              const projectExpenses = getProjectExpenses(record.project_id);
              
              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium text-left">
                    <div>
                      <div>{record.project.title}</div>
                      {record.project.po_number && (
                        <div className="text-sm text-purple-600">
                          PO: {record.project.po_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-left">{record.project.client.company}</TableCell>
                  
                  <TableCell className="text-left">
                    <div className="text-left">
                      <ClientInfoModal client={record.project.client} />
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-left">
                    <CommentsModal 
                      recordId={record.id}
                      comments={comments}
                      onCommentsUpdate={handleCommentsUpdate}
                    />
                  </TableCell>
                  
                  <TableCell className="text-left">
                    <div title={record.stage.name}>
                      {truncateText(record.stage.name, 9)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.billing_percentage}%
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-left">
                    <ExpenseCell 
                      totalExpenses={totalProjectExpenses}
                      expenses={projectExpenses}
                      onOpenExpenseModal={() => onOpenExpenseModal(record.project_id)}
                    />
                  </TableCell>
                  
                  <TableCell className="text-left">
                    <StatusBadge 
                      record={record}
                      onStatusChange={handleStatusChange}
                    />
                  </TableCell>
                  
                  <TableCell className="text-left">
                    <div className="font-medium">
                      £{(record.amount || calculatedAmount).toLocaleString()}
                    </div>
                    {record.project.project_value && (
                      <div className="text-sm text-muted-foreground">
                        of £{record.project.project_value.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
