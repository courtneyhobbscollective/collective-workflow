
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, FileText, Clock, CheckCircle, Plus, User } from "lucide-react";

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

interface BillingRecordCardProps {
  record: BillingRecord;
  projectExpenses: Expense[];
  totalProjectExpenses: number;
  onUpdate: (recordId: string, amount: number, invoiceNumber: string, status: string) => void;
  onOpenExpenseModal: (projectId: string) => void;
}

export function BillingRecordCard({ 
  record, 
  projectExpenses, 
  totalProjectExpenses, 
  onUpdate, 
  onOpenExpenseModal 
}: BillingRecordCardProps) {
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer';
      case 'invoiced':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'invoiced':
        return <FileText className="w-4 h-4" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Can be Invoiced';
      case 'invoiced':
        return 'Invoiced';
      case 'paid':
        return 'Paid';
      default:
        return status;
    }
  };

  const calculateBillingAmount = (record: BillingRecord) => {
    if (record.project.project_value) {
      return (record.project.project_value * record.billing_percentage) / 100;
    }
    return 0;
  };

  const startEditing = (record: BillingRecord) => {
    setEditingRecord(record.id);
    const calculatedAmount = calculateBillingAmount(record);
    setEditAmount(record.amount?.toString() || calculatedAmount.toString());
    setEditInvoiceNumber(record.invoice_number || "");
  };

  const handleStatusClick = (record: BillingRecord) => {
    if (record.invoice_status === 'pending') {
      const calculatedAmount = calculateBillingAmount(record);
      const defaultInvoiceNumber = `INV-${record.project.title.substring(0, 3).toUpperCase()}-${Date.now()}`;
      onUpdate(record.id, record.amount || calculatedAmount, defaultInvoiceNumber, 'invoiced');
    }
  };

  const calculatedAmount = calculateBillingAmount(record);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{record.project.title}</CardTitle>
            <div className="flex items-center space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{record.project.client.company}</span>
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
              <span className="text-sm text-muted-foreground">• {record.stage.name} • {record.billing_percentage}%</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {record.project.is_retainer && !record.project.treat_as_oneoff && " (Retainer)"}
              {record.project.treat_as_oneoff && " (One-off Upsell)"}
            </div>
            {record.project.po_number && (
              <p className="text-sm font-medium text-purple-600">
                PO: {record.project.po_number}
              </p>
            )}
            {record.project.project_value && (
              <p className="text-sm font-medium text-blue-600">
                Project Value: £{record.project.project_value.toLocaleString()} 
                → Billing Amount: £{calculatedAmount.toLocaleString()}
              </p>
            )}
            {totalProjectExpenses > 0 && (
              <p className="text-sm font-medium text-red-600">
                Total Expenses: £{totalProjectExpenses.toLocaleString()}
              </p>
            )}
          </div>
          <Badge 
            className={getStatusColor(record.invoice_status)}
            onClick={() => handleStatusClick(record)}
          >
            <div className="flex items-center space-x-1">
              {getStatusIcon(record.invoice_status)}
              <span>{getStatusText(record.invoice_status)}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {editingRecord === record.id ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Amount (£)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Invoice Number</label>
                <Input
                  value={editInvoiceNumber}
                  onChange={(e) => setEditInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="flex space-x-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => onUpdate(record.id, parseFloat(editAmount) || 0, editInvoiceNumber, 'invoiced')}
                  >
                    Mark as Invoiced
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingRecord(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Amount:</span> {record.amount ? `£${record.amount.toLocaleString()}` : `£${calculatedAmount.toLocaleString()} (calculated)`}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Invoice #:</span> {record.invoice_number || 'Not assigned'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Created:</span> {new Date(record.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEditing(record)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenExpenseModal(record.project_id)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Expense
                </Button>
                {record.invoice_status === 'invoiced' && (
                  <Button
                    size="sm"
                    onClick={() => onUpdate(record.id, record.amount || calculatedAmount, record.invoice_number || '', 'paid')}
                  >
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
            
            {projectExpenses.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <h4 className="text-sm font-medium mb-2">Project Expenses:</h4>
                <div className="space-y-1">
                  {projectExpenses.map((expense) => (
                    <div key={expense.id} className="flex justify-between text-xs">
                      <span>{expense.description} ({expense.category})</span>
                      <span>£{expense.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
