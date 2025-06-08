
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, User } from "lucide-react";

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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer';
      case 'invoiced':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Can be Invoiced';
      case 'invoiced':
        return 'Invoiced';
      default:
        return status;
    }
  };

  const handleStatusClick = (record: BillingRecord) => {
    if (record.invoice_status === 'pending') {
      const calculatedAmount = calculateBillingAmount(record);
      const defaultInvoiceNumber = `INV-${record.project.title.substring(0, 3).toUpperCase()}-${Date.now()}`;
      onUpdate(record.id, record.amount || calculatedAmount, defaultInvoiceNumber, 'invoiced');
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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
              <TableHead>Deal Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{record.project.client.name}</span>
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Client Information</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Company</label>
                            <p className="text-lg font-semibold">{record.project.client.company}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Contact Name</label>
                            <p>{record.project.client.name}</p>
                          </div>
                          {record.project.client.email && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Email</label>
                              <p>{record.project.client.email}</p>
                            </div>
                          )}
                          {record.project.client.phone && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Phone</label>
                              <p>{record.project.client.phone}</p>
                            </div>
                          )}
                          {record.project.client.contact_person && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Contact Person</label>
                              <p>{record.project.client.contact_person}</p>
                            </div>
                          )}
                          {record.project.client.address && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Address</label>
                              <p>{record.project.client.address}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
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
                    {totalProjectExpenses > 0 ? (
                      <span className="text-red-600 font-medium">
                        £{totalProjectExpenses.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">£0</span>
                    )}
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
                    <Badge 
                      className={getStatusColor(record.invoice_status)}
                      onClick={() => handleStatusClick(record)}
                    >
                      {getStatusText(record.invoice_status)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenExpenseModal(record.project_id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Expense
                    </Button>
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
