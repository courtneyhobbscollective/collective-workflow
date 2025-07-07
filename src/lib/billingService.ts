import { supabase } from './supabase';
import { 
  BillingQueueItem, 
  BillingSchedule, 
  Invoice, 
  Client, 
  Brief,
  BillingDashboardStats 
} from '../types';

export class BillingService {
  // Get all billing queue items
  static async getBillingQueue(): Promise<BillingQueueItem[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('billing_queue')
      .select(`
        *,
        clients(name, company_name, email),
        briefs(title, project_value)
      `)
      .order('due_date', { ascending: true });

    if (error) throw error;
    
    // Convert date strings to Date objects
    return (data || []).map(item => ({
      ...item,
      dueDate: new Date(item.due_date),
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      processedAt: item.processed_at ? new Date(item.processed_at) : undefined
    }));
  }

  // Get billing queue items by status
  static async getBillingQueueByStatus(status: 'pending' | 'processed' | 'cancelled'): Promise<BillingQueueItem[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('billing_queue')
      .select(`
        *,
        clients(name, company_name, email),
        briefs(title, project_value)
      `)
      .eq('status', status)
      .order('due_date', { ascending: true });

    if (error) throw error;
    
    // Convert date strings to Date objects
    return (data || []).map(item => ({
      ...item,
      dueDate: new Date(item.due_date),
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      processedAt: item.processed_at ? new Date(item.processed_at) : undefined
    }));
  }

  // Get billing schedules
  static async getBillingSchedules(): Promise<BillingSchedule[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('billing_schedule')
      .select(`
        *,
        clients(name, company_name, email)
      `)
      .eq('active', true)
      .order('next_billing_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Add retainer client to billing queue
  static async addRetainerToBillingQueue(clientId: string, amount: number, dueDate: Date): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('billing_queue')
      .insert({
        client_id: clientId,
        billing_type: 'retainer',
        amount: amount,
        due_date: dueDate.toISOString().split('T')[0],
        notes: 'Monthly retainer billing'
      });

    if (error) throw error;
  }

  // Add project stage billing to queue
  static async addProjectStageToBillingQueue(
    clientId: string, 
    briefId: string, 
    stage: string, 
    percentage: number, 
    amount: number,
    briefTitle: string
  ): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Calculate due date based on billing stage
    let dueDate: Date;
    if (percentage === 50) {
      // First stage (50%) - due immediately
      dueDate = new Date();
    } else {
      // Subsequent stages (30%, 20%) - due 30 days from now
      dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    const { error } = await supabase
      .from('billing_queue')
      .insert({
        client_id: clientId,
        brief_id: briefId,
        billing_type: 'project-stage',
        billing_stage: stage,
        billing_percentage: percentage,
        amount: amount,
        due_date: dueDate.toISOString().split('T')[0],
        notes: `Project stage billing: ${stage} for ${briefTitle}`
      });

    if (error) throw error;
  }

  // Process billing queue and create invoices
  static async processBillingQueue(): Promise<number> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.rpc('process_billing_queue');
    
    if (error) throw error;
    return data || 0;
  }

  // Create invoice from billing queue item
  static async createInvoiceFromQueue(queueItemId: string): Promise<Invoice> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get the queue item with related data
    const { data: queueItem, error: queueError } = await supabase
      .from('billing_queue')
      .select(`
        *,
        briefs(title)
      `)
      .eq('id', queueItemId)
      .single();

    if (queueError) throw queueError;
    if (!queueItem) throw new Error('Queue item not found');

    // Generate invoice number
    const { data: invoiceNumber, error: numberError } = await supabase.rpc('generate_invoice_number');
    if (numberError) throw numberError;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        client_id: queueItem.client_id,
        brief_id: queueItem.brief_id,
        invoice_number: invoiceNumber,
        amount: queueItem.amount,
        vat_amount: queueItem.amount * 0.20, // 20% VAT
        billing_type: queueItem.billing_type,
        billing_stage: queueItem.billing_stage,
        billing_percentage: queueItem.billing_percentage,
        status: 'draft',
        due_date: queueItem.due_date, // Use the due date from the billing queue
        notes: queueItem.notes
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice description based on billing type
    let description: string;
    if (queueItem.billing_type === 'retainer') {
      description = 'Monthly Retainer';
    } else {
      const briefTitle = queueItem.briefs?.title || 'Unknown Project';
      description = `${briefTitle} - ${queueItem.billing_stage || 'Project Stage'}`;
    }

    // Add invoice item
    await supabase
      .from('invoice_items')
      .insert({
        invoice_id: invoice.id,
        description: description,
        quantity: 1,
        unit_price: queueItem.amount
      });

    // Mark queue item as processed
    await supabase
      .from('billing_queue')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        processed_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', queueItemId);

    return invoice;
  }

  // Get billing dashboard statistics
  static async getBillingDashboardStats(): Promise<BillingDashboardStats> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.rpc('get_billing_dashboard_data');
    
    if (error) throw error;
    
    return {
      totalPendingAmount: data?.total_pending_amount || 0,
      totalOverdueAmount: data?.total_overdue_amount || 0,
      pendingRetainerCount: data?.pending_retainer_count || 0,
      pendingProjectCount: data?.pending_project_count || 0,
      overdueInvoicesCount: data?.overdue_invoices_count || 0
    };
  }

  // Set up retainer billing for a client
  static async setupRetainerBilling(
    clientId: string, 
    amount: number, 
    billingDay: number,
    startDate: Date
  ): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Update client with retainer info
    await supabase
      .from('clients')
      .update({
        retainer_amount: amount,
        retainer_billing_day: billingDay,
        retainer_start_date: startDate.toISOString().split('T')[0],
        retainer_active: true
      })
      .eq('id', clientId);

    // Create billing schedule
    await supabase
      .from('billing_schedule')
      .insert({
        client_id: clientId,
        billing_day: billingDay,
        amount: amount,
        active: true,
        next_billing_date: this.calculateNextBillingDate(billingDay, startDate)
      });

    // Add the first retainer billing to the queue
    const nextBillingDate = this.calculateNextBillingDate(billingDay, startDate);
    const dueDate = this.calculateRetainerDueDate(nextBillingDate);
    await this.addRetainerToBillingQueue(clientId, amount, dueDate);
  }

  // Calculate next billing date for retainer
  static calculateNextBillingDate(billingDay: number, startDate: Date): Date {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), billingDay);
    
    if (currentMonth > now) {
      return currentMonth;
    } else {
      return new Date(now.getFullYear(), now.getMonth() + 1, billingDay);
    }
  }

  // Calculate due date for retainer (30 days from billing date)
  static calculateRetainerDueDate(billingDate: Date): Date {
    return new Date(billingDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // Cancel retainer billing for a client
  static async cancelRetainerBilling(clientId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Update client
    await supabase
      .from('clients')
      .update({
        retainer_active: false,
        retainer_end_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', clientId);

    // Update billing schedule
    await supabase
      .from('billing_schedule')
      .update({ active: false })
      .eq('client_id', clientId);
  }

  // Get invoices by billing type
  static async getInvoicesByBillingType(billingType: 'manual' | 'retainer' | 'project-stage'): Promise<Invoice[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(name, company_name, email),
        briefs(title, project_value),
        invoice_items(*)
      `)
      .eq('billing_type', billingType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get monthly billing summary
  static async getMonthlyBillingSummary(year: number, month: number): Promise<{
    retainerInvoices: Invoice[];
    projectInvoices: Invoice[];
    totalRevenue: number;
    totalPending: number;
  }> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(name, company_name, email),
        briefs(title, project_value),
        invoice_items(*)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const invoices = data || [];
    const retainerInvoices = invoices.filter(inv => inv.billing_type === 'retainer');
    const projectInvoices = invoices.filter(inv => inv.billing_type === 'project-stage');
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total_amount, 0);
    
    const totalPending = invoices
      .filter(inv => inv.status === 'sent')
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    return {
      retainerInvoices,
      projectInvoices,
      totalRevenue,
      totalPending
    };
  }

  // Send invoice (update status to 'sent')
  static async sendInvoice(invoiceId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId);

    if (error) throw error;
  }

  // Mark invoice as paid
  static async markInvoiceAsPaid(invoiceId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('invoices')
      .update({ 
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', invoiceId);

    if (error) throw error;
  }

  // Cancel billing queue item
  static async cancelBillingQueueItem(queueItemId: string, reason?: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('billing_queue')
      .update({
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user'
      })
      .eq('id', queueItemId);

    if (error) throw error;
  }

  // Delete billing queue item permanently
  static async deleteBillingQueueItem(queueItemId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('billing_queue')
      .delete()
      .eq('id', queueItemId);

    if (error) throw error;
  }

  // Add retainer billing to queue for testing (manual trigger)
  static async addRetainerBillingToQueue(clientId: string, amount: number, dueDate?: Date): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const billingDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days from now
    const finalDueDate = dueDate || this.calculateRetainerDueDate(billingDate);
    
    await this.addRetainerToBillingQueue(clientId, amount, finalDueDate);
  }

  // Debug: Get all billing queue items with details
  static async debugBillingQueue(): Promise<any[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('billing_queue')
      .select(`
        *,
        clients(name, company_name, email, type),
        briefs(title, project_value)
      `)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }
} 