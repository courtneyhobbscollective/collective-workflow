
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";
import { CRMMetrics } from "./CRMMetrics";
import { BillingTable } from "./BillingTable";

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

export function CRMDashboard() {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
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
            client:clients(
              company, 
              name, 
              email, 
              phone, 
              contact_person, 
              address
            )
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

  const calculateBillingAmount = (record: BillingRecord) => {
    if (record.project.project_value) {
      return (record.project.project_value * record.billing_percentage) / 100;
    }
    return 0;
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

  const getMonthlyData = () => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const months = [
      {
        name: currentMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        start: currentMonth,
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      },
      {
        name: lastMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        start: lastMonth,
        end: new Date(now.getFullYear(), now.getMonth(), 0)
      },
      {
        name: twoMonthsAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        start: twoMonthsAgo,
        end: new Date(now.getFullYear(), now.getMonth() - 1, 0)
      }
    ];

    return months.map(month => {
      const records = billingRecords.filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate >= month.start && recordDate <= month.end;
      });

      const total = records.reduce((sum, record) => {
        return sum + (record.amount || calculateBillingAmount(record));
      }, 0);

      return {
        ...month,
        records,
        total
      };
    });
  };

  const totalProjectValue = billingRecords.reduce((sum, r) => sum + (r.project.project_value || 0), 0);
  const totalBillingAmount = billingRecords.reduce((sum, r) => sum + (r.amount || calculateBillingAmount(r)), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingCount = billingRecords.filter(r => r.invoice_status === 'pending').length;
  const invoicedCount = billingRecords.filter(r => r.invoice_status === 'invoiced').length;

  const monthlyData = getMonthlyData();

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">CRM Dashboard</h2>
        <p className="text-muted-foreground">Manage billing and invoicing for projects</p>
      </div>

      <CRMMetrics
        pendingCount={pendingCount}
        totalProjectValue={totalProjectValue}
        totalBillingAmount={totalBillingAmount}
        totalExpenses={totalExpenses}
        paidCount={invoicedCount}
      />

      <div className="space-y-8">
        {monthlyData.map((month, index) => (
          <div key={month.name} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-foreground">
                {index === 0 ? month.name : `${month.name} (History)`}
              </h3>
              <div className="text-lg font-medium text-primary">
                Month Total: £{month.total.toLocaleString()}
              </div>
            </div>
            
            {month.records.length > 0 ? (
              <BillingTable
                records={month.records}
                expenses={expenses}
                onUpdate={updateBillingRecord}
                onOpenExpenseModal={openExpenseModal}
                calculateBillingAmount={calculateBillingAmount}
                getTotalExpenses={getTotalExpenses}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No billing records for this month
              </div>
            )}
          </div>
        ))}
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
