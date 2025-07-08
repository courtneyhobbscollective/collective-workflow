import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Invoice } from '../../types';
import { BillingService } from '../../lib/billingService';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import AutomatedBillingQueue from './AutomatedBillingQueue';
import { 
  DollarSign, FileText, Calendar, AlertTriangle, 
  CheckCircle, Clock, Download, Send, Plus, Filter,
  Zap, Users, FileText as FileTextIcon, Bug, Trash2,
  TrendingUp, CreditCard, X
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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [hoveredStatusInvoice, setHoveredStatusInvoice] = useState<string | null>(null);

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

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // This would typically generate and download a PDF
      console.log('Downloading invoice:', invoice.invoiceNumber);
      alert(`Downloading invoice ${invoice.invoiceNumber}`);
      // TODO: Implement actual PDF generation and download
    } catch (error) {
      console.error('Failed to download invoice:', error);
      alert('Failed to download invoice');
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      // This would typically send the invoice via email
      console.log('Sending invoice:', invoice.invoiceNumber);
      alert(`Sending invoice ${invoice.invoiceNumber} to client`);
      // TODO: Implement actual email sending
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Failed to send invoice');
    }
  };

  const handleUpdateInvoiceStatus = async (invoice: Invoice, newStatus: Invoice['status']) => {
    try {
      // This would update the invoice status in the database
      console.log(`Updating invoice ${invoice.invoiceNumber} status to ${newStatus}`);
      alert(`Invoice status updated to ${newStatus}`);
      // TODO: Implement actual status update
      await refreshInvoices(); // Refresh invoices after status change
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      alert('Failed to update invoice status');
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

  const InvoiceRow: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
    const client = clients.find(c => c.id === invoice.clientId);
    const brief = briefs.find(b => b.id === invoice.briefId);
    const { user } = useAuth();
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const statusDropdownTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleStatusMouseEnter = () => {
      if (statusDropdownTimeout.current) clearTimeout(statusDropdownTimeout.current);
      setStatusDropdownOpen(true);
    };
    const handleStatusMouseLeave = () => {
      statusDropdownTimeout.current = setTimeout(() => setStatusDropdownOpen(false), 120);
    };

    return (
      <div 
        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer relative z-10"
        onClick={() => setSelectedInvoice(invoice)}
        style={{ overflow: 'visible' }}
      >
        <div className="flex items-center space-x-6 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{invoice.invoiceNumber}</h3>
              <div className="relative z-30" style={{ overflow: 'visible' }}>
                <span 
                  className={`badge ${getStatusColor(invoice.status)} ${user?.role === 'admin' ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
                  onMouseEnter={user?.role === 'admin' ? handleStatusMouseEnter : undefined}
                  onMouseLeave={user?.role === 'admin' ? handleStatusMouseLeave : undefined}
                >
                  {getStatusIcon(invoice.status)}
                  <span className="ml-1 capitalize">{invoice.status}</span>
                </span>
                {user?.role === 'admin' && statusDropdownOpen && (
                  <div
                    className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[120px]"
                    style={{ overflow: 'visible' }}
                    onMouseEnter={handleStatusMouseEnter}
                    onMouseLeave={handleStatusMouseLeave}
                  >
                    <div className="text-xs font-medium text-gray-900 mb-2">Update Status</div>
                    {(['draft', 'sent', 'paid', 'overdue'] as const).map(status => (
                      <button
                        key={status}
                        onClick={e => {
                          e.stopPropagation();
                          handleUpdateInvoiceStatus(invoice, status);
                          setStatusDropdownOpen(false);
                        }}
                        className={`block w-full text-left text-xs py-1 px-2 rounded hover:bg-gray-50 transition-colors ${
                          invoice.status === status ? 'bg-gray-100 font-medium' : ''
                        }`}
                      >
                        {status === 'draft' ? 'Draft' :
                         status === 'sent' ? 'Sent' :
                         status === 'paid' ? 'Paid' :
                         status === 'overdue' ? 'Overdue' : status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded font-medium">
                {client?.companyName || client?.name}
              </span>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                invoice.billingType === 'retainer' 
                  ? 'text-purple-700 bg-purple-100' 
                  : 'text-green-700 bg-green-100'
              }`}>
                {invoice.billingType === 'retainer' ? 'Retainer' : 'Project'}
              </span>
              {brief?.poNumber && (
                <span className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded font-medium">
                  PO: {brief.poNumber}
                </span>
              )}
              {client?.companyName && client?.name && client.companyName !== client.name && (
                <span className="text-sm text-gray-600">{client.name}</span>
              )}
            </div>
            {brief && (
              <p className="text-xs text-gray-500 mt-1 truncate">{brief.title}</p>
            )}
          </div>
          <div className="text-right min-w-0">
            <p className="text-lg font-bold text-gray-900">£{invoice.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
            {invoice.paidDate && (
              <p className="text-xs text-green-600">Paid: {new Date(invoice.paidDate).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button 
            className="btn-ghost text-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadInvoice(invoice);
            }}
          >
            <Download className="h-4 w-4" />
          </button>
          {invoice.status === 'draft' && (
            <button 
              className="btn-ghost text-sm text-blue-600 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                handleSendInvoice(invoice);
              }}
            >
              <Send className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(invoice.id);
            }}
            disabled={deletingInvoice === invoice.id}
            className="btn-ghost text-sm text-red-600 hover:text-red-700"
          >
            {deletingInvoice === invoice.id ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
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
          <div>
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">£{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-gray-900">£{pendingAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4 bg-red-50 border-red-200">
          <div>
            <p className="text-sm font-medium text-red-600">Overdue</p>
            <p className="text-2xl font-bold text-red-900">£{overdueAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4 bg-purple-50 border-purple-200">
          <div>
            <p className="text-sm font-medium text-purple-600">Total VAT Liability</p>
            <p className="text-2xl font-bold text-purple-900">
              £{(invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.vatAmount, 0)).toLocaleString()}
            </p>
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
          {/* Invoice Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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
            </div>
            <span className="text-sm text-gray-500">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} in {selectedMonth}
            </span>
          </div>

          {/* Invoices by Month */}
          {filteredInvoices.length > 0 ? (
            <div className="space-y-6">
              {(() => {
                // Group invoices by month
                const groupedInvoices = filteredInvoices.reduce((groups, invoice) => {
                  const month = new Date(invoice.dueDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  });
                  if (!groups[month]) {
                    groups[month] = [];
                  }
                  groups[month].push(invoice);
                  return groups;
                }, {} as Record<string, Invoice[]>);

                return Object.entries(groupedInvoices).map(([month, monthInvoices]) => {
                  const monthTotal = monthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
                  return (
                    <div key={month} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{month}</h3>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {monthInvoices.length} invoice{monthInvoices.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            <span className="bg-[#682dba] text-white rounded-full px-4 py-1 font-semibold">Monthly total: £{monthTotal.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {monthInvoices.map((invoice) => (
                          <InvoiceRow key={invoice.id} invoice={invoice} />
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
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

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {(() => {
                const client = clients.find(c => c.id === selectedInvoice.clientId);
                const brief = briefs.find(b => b.id === selectedInvoice.briefId);
                
                return (
                  <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{selectedInvoice.invoiceNumber}</h3>
                        <p className="text-sm text-gray-600 mt-1">{client?.name}</p>
                        {client?.companyName && client.companyName !== client.name && (
                          <p className="text-sm text-gray-500">{client.companyName}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">£{selectedInvoice.totalAmount.toLocaleString()}</p>
                        <span className={`badge ${getStatusColor(selectedInvoice.status)} mt-2`}>
                          {getStatusIcon(selectedInvoice.status)}
                          <span className="ml-1 capitalize">{selectedInvoice.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Project Info */}
                    {brief && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Project:</span>
                            <p className="font-medium">{brief.title}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Work Type:</span>
                            <p className="font-medium capitalize">{brief.workType}</p>
                          </div>
                          {brief.poNumber && (
                            <div>
                              <span className="text-gray-500">PO Number:</span>
                              <p className="font-medium">{brief.poNumber}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Project Value:</span>
                            <p className="font-medium">£{brief.projectValue.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Invoice Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Invoice Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal:</span>
                          <span className="font-medium">£{selectedInvoice.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">VAT:</span>
                          <span className="font-medium">£{selectedInvoice.vatAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold border-t pt-2">
                          <span>Total:</span>
                          <span>£{selectedInvoice.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Important Dates</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Due Date:</span>
                            <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                          </div>
                          {selectedInvoice.paidDate && (
                            <div>
                              <span className="text-gray-500">Paid Date:</span>
                              <p className="font-medium text-green-600">{new Date(selectedInvoice.paidDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <p className="font-medium">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Billing Info</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Billing Type:</span>
                            <p className="font-medium capitalize">{selectedInvoice.billingType}</p>
                          </div>
                          {selectedInvoice.billingStage && (
                            <div>
                              <span className="text-gray-500">Billing Stage:</span>
                              <p className="font-medium capitalize">{selectedInvoice.billingStage}</p>
                            </div>
                          )}
                          {selectedInvoice.billingPercentage && (
                            <div>
                              <span className="text-gray-500">Percentage:</span>
                              <p className="font-medium">{selectedInvoice.billingPercentage}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button 
                        className="btn-secondary"
                        onClick={() => handleDownloadInvoice(selectedInvoice)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                      {selectedInvoice.status === 'draft' && (
                        <button 
                          className="btn-primary"
                          onClick={() => handleSendInvoice(selectedInvoice)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Invoice
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
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