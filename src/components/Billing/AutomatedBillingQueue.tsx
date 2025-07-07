import React, { useState, useEffect } from 'react';
import { BillingService } from '../../lib/billingService';
import { BillingQueueItem, BillingDashboardStats } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import { 
  Clock, Calendar, DollarSign, AlertTriangle, 
  CheckCircle, Play, X, RefreshCw, Filter,
  Users, FileText, TrendingUp
} from 'lucide-react';

const AutomatedBillingQueue: React.FC = () => {
  const [billingQueue, setBillingQueue] = useState<BillingQueueItem[]>([]);
  const [stats, setStats] = useState<BillingDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'retainer' | 'project-stage'>('all');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'processed' | 'cancelled'>('pending');

  useEffect(() => {
    loadBillingQueue();
    loadStats();
  }, []);

  const loadBillingQueue = async () => {
    try {
      setLoading(true);
      const queue = await BillingService.getBillingQueueByStatus(filterStatus);
      setBillingQueue(queue);
    } catch (error) {
      console.error('Failed to load billing queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const dashboardStats = await BillingService.getBillingDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load billing stats:', error);
    }
  };

  const processBillingQueue = async () => {
    try {
      setProcessing(true);
      const processedCount = await BillingService.processBillingQueue();
      await loadBillingQueue();
      await loadStats();
      alert(`Successfully processed ${processedCount} billing items`);
    } catch (error) {
      console.error('Failed to process billing queue:', error);
      alert('Failed to process billing queue');
    } finally {
      setProcessing(false);
    }
  };

  const createInvoiceFromQueue = async (queueItemId: string) => {
    try {
      await BillingService.createInvoiceFromQueue(queueItemId);
      await loadBillingQueue();
      await loadStats();
      alert('Invoice created successfully');
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const cancelQueueItem = async (queueItemId: string) => {
    const reason = prompt('Reason for cancellation:');
    if (reason !== null) {
      try {
        await BillingService.cancelBillingQueueItem(queueItemId, reason);
        await loadBillingQueue();
        await loadStats();
        alert('Queue item cancelled successfully');
      } catch (error) {
        console.error('Failed to cancel queue item:', error);
        alert('Failed to cancel queue item');
      }
    }
  };

  const filteredQueue = billingQueue.filter(item => {
    if (filterType !== 'all' && item.billingType !== filterType) return false;
    return true;
  });

  const getBillingTypeIcon = (type: string) => {
    switch (type) {
      case 'retainer': return <Users className="h-4 w-4" />;
      case 'project-stage': return <FileText className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getBillingTypeColor = (type: string) => {
    switch (type) {
      case 'retainer': return 'bg-blue-100 text-blue-800';
      case 'project-stage': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <LoadingSpinner size="xl" text="Loading billing queue..." className="py-12" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Automated Billing Queue</h2>
          <p className="text-gray-600">Manage automated billing for retainer and project clients</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={processBillingQueue}
            disabled={processing}
            className="btn-primary flex items-center"
          >
            {processing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {processing ? 'Processing...' : 'Process Queue'}
          </button>
          <button
            onClick={() => {
              loadBillingQueue();
              loadStats();
            }}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  £{stats.totalPendingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  £{stats.totalOverdueAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Retainer Queue</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.pendingRetainerCount}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Project Queue</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.pendingProjectCount}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Overdue Invoices</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.overdueInvoicesCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <div className="flex space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="retainer">Retainer</option>
              <option value="project-stage">Project Stage</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Billing Queue Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project/Brief
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQueue.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBillingTypeColor(item.billingType)}`}>
                      {getBillingTypeIcon(item.billingType)}
                      <span className="ml-1 capitalize">
                        {item.billingType === 'project-stage' ? 'Project' : item.billingType}
                        {item.billingPercentage && ` (${item.billingPercentage}%)`}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.clients?.name || 'Unknown Client'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.clients?.company_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.briefs?.title || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.billingStage}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      £{item.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1 capitalize">{item.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => createInvoiceFromQueue(item.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Create Invoice
                          </button>
                          <button
                            onClick={() => cancelQueueItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {item.status === 'processed' && (
                        <span className="text-green-600">Processed</span>
                      )}
                      {item.status === 'cancelled' && (
                        <span className="text-red-600">Cancelled</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredQueue.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Clock className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No billing queue items</h3>
            <p className="text-gray-500">
              {filterStatus === 'pending' 
                ? 'No pending billing items at the moment.'
                : `No ${filterStatus} billing items found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomatedBillingQueue; 