import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import AutomatedBillingQueue from './AutomatedBillingQueue';
import { 
  DollarSign, FileText, Calendar, AlertTriangle, 
  CheckCircle, Clock, Download, Send, Plus, Filter,
  Zap, Users, FileText as FileTextIcon
} from 'lucide-react';

const BillingPage: React.FC = () => {
  const { invoices, clients, briefs, loading, error, clearError } = useApp();
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [activeTab, setActiveTab] = useState<'invoices' | 'automated'>('invoices');

  const filteredInvoices = invoices.filter(invoice => 
    filterStatus === 'all' || invoice.status === filterStatus
  );

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const overdueAmount = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

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

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
            <p className="text-gray-600">Manage invoices and track payments</p>
          </div>
          <button className="btn-primary" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </button>
        </div>
        <LoadingSpinner size="xl" text="Loading billing data..." className="py-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
          <p className="text-gray-600">Manage invoices and track payments</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
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
        </nav>
      </div>

      {activeTab === 'invoices' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    £{totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    £{pendingAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    £{overdueAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Overdue</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {invoices.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Invoices</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-4">
            <div className="flex items-center space-x-4">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex space-x-2">
                {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      filterStatus === status
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Invoices Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInvoices.map(invoice => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>

          {filteredInvoices.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No invoices found"
              description={
                filterStatus !== 'all' 
                  ? `No ${filterStatus} invoices at the moment.`
                  : 'Get started by creating your first invoice.'
              }
              action={
                filterStatus === 'all' ? {
                  label: "Create Invoice",
                  onClick: () => console.log('Create invoice'),
                  icon: Plus
                } : undefined
              }
            />
          )}
        </>
      ) : (
        <AutomatedBillingQueue />
      )}
    </div>
  );
};

export default BillingPage;