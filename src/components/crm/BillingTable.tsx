
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  return (
    <ScrollArea className="w-full">
      <div className="min-w-[800px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Expenses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deal Value</TableHead>
              <TableHead>Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const totalProjectExpenses = getTotalExpenses(record.project_id);
              const calculatedAmount = calculateBillingAmount(record);
              
              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{record.project.title}</div>
                      {record.project.po_number && (
                        <div className="text-sm text-purple-600">
                          PO: {record.project.po_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>{record.project.client.company}</TableCell>
                  
                  <TableCell>
                    <ClientInfoModal client={record.project.client} />
                  </TableCell>
                  
                  <TableCell>
                    <div title={record.stage.name}>
                      {truncateText(record.stage.name, 9)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.billing_percentage}%
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <ExpenseCell 
                      totalExpenses={totalProjectExpenses}
                      onOpenExpenseModal={() => onOpenExpenseModal(record.project_id)}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <StatusBadge 
                      record={record}
                      onStatusChange={handleStatusChange}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium">
                      £{(record.amount || calculatedAmount).toLocaleString()}
                    </div>
                    {record.project.project_value && (
                      <div className="text-sm text-muted-foreground">
                        of £{record.project.project_value.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <CommentsModal 
                      recordId={record.id}
                      comments={comments}
                      onCommentsUpdate={handleCommentsUpdate}
                    />
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
