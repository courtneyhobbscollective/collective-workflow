
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, Clock, CheckCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";

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

export function CRMDashboard() {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadBillingRecords();
    loadExpenses();
  }, []);

  const loadBillingRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_billing_records')
        .select(`
          *,
          project:projects(
            title,
            project_value,
            is_retainer,
            treat_as_oneoff,
            po_number,
            client:clients(company, name)
          ),
          stage:project_stages(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBillingRecords(data || []);
    } catch (error) {
      console.error('Error loading billing records:', error);
      toast({
        title: "Error",
        description: "Failed to load billing records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const updateBillingRecord = async (recordId: string, amount: number, invoiceNumber: string, status: string) => {
    try {
      const { error } = await supabase
        .from('crm_billing_records')
        .update({
          amount,
          invoice_number: invoiceNumber,
          invoice_status: status,
          processed_at: status === 'invoiced' ? new Date().toISOString() : null
        })
        .eq('id', recordId);

      if (error) throw error;

      await loadBillingRecords();
      setEditingRecord(null);
      setEditAmount("");
      setEditInvoiceNumber("");
      
      toast({
        title: "Success",
        description: "Billing record updated successfully",
      });
    } catch (error) {
      console.error('Error updating billing record:', error);
      toast({
        title: "Error",
        description: "Failed to update billing record",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
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

  const getMonthlyGroups = () => {
    const groups: { [key: string]: BillingRecord[] } = {};
    billingRecords.forEach(record => {
      const month = new Date(record.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      if (!groups[month]) groups[month] = [];
      groups[month].push(record);
    });
    return groups;
  };

  const getProjectExpenses = (projectId: string) => {
    return expenses.filter(expense => expense.project_id === projectId);
  };

  const getTotalExpenses = (projectId: string) => {
    return getProjectExpenses(projectId).reduce((sum, expense) => sum + expense.amount, 0);
  };

  const openExpenseModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setExpenseModalOpen(true);
  };

  const totalProjectValue = billingRecords.reduce((sum, r) => sum + (r.project.project_value || 0), 0);
  const totalBillingAmount = billingRecords.reduce((sum, r) => sum + (r.amount || calculateBillingAmount(r)), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const monthlyGroups = getMonthlyGroups();
  const filteredRecords = selectedMonth 
    ? monthlyGroups[selectedMonth] || []
    : billingRecords;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">CRM Dashboard</h2>
        <p className="text-muted-foreground">Manage billing and invoicing for projects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Can be Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billingRecords.filter(r => r.invoice_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Project Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{totalProjectValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Billing Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{totalBillingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{totalExpenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billingRecords.filter(r => r.invoice_status === 'paid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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

      <div className="space-y-4">
        {filteredRecords.map((record) => {
          const calculatedAmount = calculateBillingAmount(record);
          const projectExpenses = getProjectExpenses(record.project_id);
          const totalProjectExpenses = getTotalExpenses(record.project_id);
          
          return (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{record.project.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {record.project.client.company} • {record.stage.name} • {record.billing_percentage}%
                      {record.project.is_retainer && !record.project.treat_as_oneoff && " (Retainer)"}
                      {record.project.treat_as_oneoff && " (One-off Upsell)"}
                    </p>
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
                  <Badge className={getStatusColor(record.invoice_status)}>
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
                            onClick={() => updateBillingRecord(record.id, parseFloat(editAmount) || 0, editInvoiceNumber, 'invoiced')}
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
                          onClick={() => openExpenseModal(record.project_id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Expense
                        </Button>
                        {record.invoice_status === 'invoiced' && (
                          <Button
                            size="sm"
                            onClick={() => updateBillingRecord(record.id, record.amount || calculatedAmount, record.invoice_number || '', 'paid')}
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
        })}
      </div>

      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        projectId={selectedProjectId}
        onExpenseAdded={loadExpenses}
      />
    </div>
  );
}
