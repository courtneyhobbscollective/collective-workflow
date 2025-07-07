import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { BillingService } from '../../lib/billingService';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import AutomatedBillingQueue from './AutomatedBillingQueue';
import { 
  DollarSign, FileText, Calendar, AlertTriangle, 
  CheckCircle, Clock, Download, Send, Plus, Filter,
  Zap, Users, FileText as FileTextIcon, Bug, Trash2,
  TrendingUp, CreditCard
} from 'lucide-react';

interface MonthlyStats {
  month: string;
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  vatLiability: number;
  invoiceCount: number;
  invoices: Invoice[];
}

const BillingPage: React.FC = () => {
  const { invoices, clients, briefs, loading, error, clearError, deleteInvoice, refreshInvoices } = useApp();
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [activeTab, setActiveTab] = useState<'automated' | 'invoices'>('automated');
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<any[]>([]);
  const [debugLoading, setDebugLoading] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Group invoices by month
  useEffect(() => {
    const grouped = invoices.reduce((acc, invoice) => {
      const date = new Date(invoice.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          totalRevenue: 0,
          totalPending: 0,
          totalOverdue: 0,
          vatLiability: 0,
          invoiceCount: 0,
          invoices: []
        };
      }
      
      acc[monthKey].invoices.push(invoice);
      acc[monthKey].invoiceCount++;
      
      if (invoice.status === 'paid') {
        acc[monthKey].totalRevenue += invoice.totalAmount;
        acc[monthKey].vatLiability += invoice.vatAmount;
      } else if (invoice.status === 'sent') {
        acc[monthKey].totalPending += invoice.totalAmount;
      } else if (invoice.status === 'overdue') {
        acc[monthKey].totalOverdue += invoice.totalAmount;
      }
      
      return acc;
    }, {} as Record<string, MonthlyStats>);
    
    const sortedMonths = Object.values(grouped).sort((a, b) => {
      const [yearA, monthA] = a.month.split(' ');
      const [yearB, monthB] = b.month.split(' ');
      return new Date(`${monthA} 1, ${yearA}`).getTime() - new Date(`${monthB} 1, ${yearB}`).getTime();
    }).reverse();
    
    setMonthlyStats(sortedMonths);
    if (sortedMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(sortedMonths[0].month);
    }
  }, [invoices, selectedMonth]);

  const currentMonthStats = monthlyStats.find(stat => stat.month === selectedMonth) || {
    month: '',
    totalRevenue: 0,
    totalPending: 0,
    totalOverdue: 0,
    vatLiability: 0,
    invoiceCount: 0,
    invoices: []
  };

  const filteredInvoices = currentMonthStats.invoices.filter(invoice => 
    filterStatus === 'all' || invoice.status === filterStatus
  );

  // Overall stats (all time)
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const overdueAmount = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Debug functions
  const loadDebugData = async () => {
    setDebugLoading(true);
    try {
      const data = await BillingService.debugBillingQueue();
      setDebugData(data);
      console.log('Billing Queue Debug Data:', data);
    } catch (error) {
      console.error('Failed to load debug data:', error);
    } finally {
      setDebugLoading(false);
    }
  };

  const addTestRetainerBilling = async () => {
    const retainerClients = clients.filter(c => c.type === 'retainer' && c.retainerActive);
    if (retainerClients.length === 0) {
      alert('No active retainer clients found. Please create a retainer client first.');
      return;
    }
    
    const client = retainerClients[0];
    try {
      await BillingService.addRetainerBillingToQueue(client.id, client.retainerAmount || 1000);
      alert(`Added test retainer billing for ${client.name}`);
      loadDebugData(); // Refresh debug data
    } catch (error) {
      console.error('Failed to add test retainer billing:', error);
      alert('Failed to add test retainer billing');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      setDeletingInvoice(invoiceId);
      await deleteInvoice(invoiceId);
      await refreshInvoices(); // Refresh invoices after deletion
      alert('Invoice deleted successfully');
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice');
    } finally {
      setDeletingInvoice(null);
      setShowDeleteConfirm(null);
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'badge-neutral';
      case 'sent': return 'bg-blue-50 text-blue-700';
      case 'paid': return 'badge-success';
      case 'overdue': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const InvoiceCard: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
    const client = clients.find(c => c.id === invoice.clientId);
    const brief = briefs.find(b => b.id === invoice.briefId);

    return (
      <div className="card card-hover p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
            <p className="text-sm text-gray-600">{client?.name}</p>
            {brief && (
              <p className="text-xs text-gray-500 mt-1">{brief.title}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              £{invoice.totalAmount.toLocaleString()}
            </p>
            <span className={`badge ${getStatusColor(invoice.status)} mt-2`}>
              {getStatusIcon(invoice.status)}
              <span className="ml-1 capitalize">{invoice.status}</span>
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount:</span>
            <span className="text-gray-900">£{invoice.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">VAT:</span>
            <span className="text-gray-900">£{invoice.vatAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm font-medium border-t pt-2">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">£{invoice.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
          </div>
          {invoice.paidDate && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Paid: {new Date(invoice.paidDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button className="btn-ghost text-sm">
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
            {invoice.status === 'draft' && (
              <button className="btn-ghost text-sm text-blue-600 hover:text-blue-700">
                <Send className="h-4 w-4 mr-1" />
                Send
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(invoice.id)}
              disabled={deletingInvoice === invoice.id}
              className="btn-ghost text-sm text-red-600 hover:text-red-700"
            >
              {deletingInvoice === invoice.id ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </>
              )}
            </button>
          </div>
          
          {invoice.status === 'overdue' && (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600">Manage invoices and automated billing</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="btn-ghost text-sm"
          >
            <Bug className="h-4 w-4 mr-1" />
            Debug
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">£{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">£{pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">£{overdueAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total VAT Liability</p>
              <p className="text-2xl font-bold text-gray-900">
                £{(invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.vatAmount, 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('automated')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'automated'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Zap className="h-4 w-4 inline mr-2" />
            Automated Billing
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Invoices
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'automated' && (
        <AutomatedBillingQueue key="automated-billing" />
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Monthly Breakdown */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h2>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {monthlyStats.map((stat) => (
                  <option key={stat.month} value={stat.month}>
                    {stat.month}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-600">Revenue</p>
                    <p className="text-lg font-bold text-green-900">£{currentMonthStats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-600">Pending</p>
                    <p className="text-lg font-bold text-blue-900">£{currentMonthStats.totalPending.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-600">Overdue</p>
                    <p className="text-lg font-bold text-red-900">£{currentMonthStats.totalOverdue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-purple-600">VAT Liability</p>
                    <p className="text-lg font-bold text-purple-900">£{currentMonthStats.vatLiability.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Filters */}
            <div className="flex items-center space-x-4 mb-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              <span className="text-sm text-gray-500">
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} in {selectedMonth}
              </span>
            </div>
          </div>

          {/* Invoices Grid */}
          {filteredInvoices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No invoices found"
              description={`No ${filterStatus === 'all' ? '' : filterStatus + ' '}invoices for ${selectedMonth}`}
            />
          )}
        </div>
      )}

      {/* Debug Section */}
      {showDebug && (
        <div className="card p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Tools</h3>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <button
                onClick={loadDebugData}
                disabled={debugLoading}
                className="btn-secondary text-sm"
              >
                {debugLoading ? 'Loading...' : 'Load Debug Data'}
              </button>
              <button
                onClick={addTestRetainerBilling}
                className="btn-secondary text-sm"
              >
                Add Test Retainer Billing
              </button>
            </div>
            
            {debugData.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Billing Queue Debug Data:</h4>
                <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Invoice</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete this invoice? This will permanently remove the invoice and all associated data.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteInvoice(showDeleteConfirm)}
                disabled={deletingInvoice === showDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deletingInvoice === showDeleteConfirm ? 'Deleting...' : 'Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="card p-4 bg-red-50 border border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;