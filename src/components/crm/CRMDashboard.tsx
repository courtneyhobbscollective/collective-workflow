
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";
import { CRMMetrics } from "./CRMMetrics";
import { MonthFilter } from "./MonthFilter";
import { BillingRecordCard } from "./BillingRecordCard";

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
  const pendingCount = billingRecords.filter(r => r.invoice_status === 'pending').length;
  const paidCount = billingRecords.filter(r => r.invoice_status === 'paid').length;

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

      <CRMMetrics
        pendingCount={pendingCount}
        totalProjectValue={totalProjectValue}
        totalBillingAmount={totalBillingAmount}
        totalExpenses={totalExpenses}
        paidCount={paidCount}
      />

      <MonthFilter
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        monthlyGroups={monthlyGroups}
      />

      <div className="space-y-4">
        {filteredRecords.map((record) => {
          const projectExpenses = getProjectExpenses(record.project_id);
          const totalProjectExpenses = getTotalExpenses(record.project_id);
          
          return (
            <BillingRecordCard
              key={record.id}
              record={record}
              projectExpenses={projectExpenses}
              totalProjectExpenses={totalProjectExpenses}
              onUpdate={updateBillingRecord}
              onOpenExpenseModal={openExpenseModal}
            />
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
