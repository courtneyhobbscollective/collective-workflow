import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import BriefCreationModal from '../Briefs/BriefCreationModal';
import UserManagement from '../Admin/UserManagement';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import { 
  Users, Briefcase, DollarSign, Clock, AlertTriangle, 
  TrendingUp, Calendar, MessageSquare, CheckCircle, Plus, UserPlus
} from 'lucide-react';
import { capitalizeWords } from '../../lib/capitalizeWords';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dashboardStats, briefs, clients, staff, notifications, loading, error, clearError } = useApp();
  const [showCreateBrief, setShowCreateBrief] = React.useState(false);
  const [showUserManagement, setShowUserManagement] = React.useState(false);

  const StatCard = ({ title, value }: {
    title: string;
    value: string | number;
  }) => (
    <div className="card p-6 flex flex-col justify-center">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{title}</p>
    </div>
  );

  // Calculate individual staff utilisation
  const calculateStaffUtilisation = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember) return 0;

    const availableHours = staffMember.monthlyAvailableHours || 160;
    if (availableHours === 0) return 0;

    // Find all briefs assigned to this staff member
    const assignedBriefs = briefs.filter(brief => 
      brief.assignedStaff && brief.assignedStaff.includes(staffId)
    );

    // Calculate total assigned hours for this staff member
    let totalAssignedHours = 0;
    assignedBriefs.forEach(brief => {
      if (brief.estimatedHours) {
        const totalBriefHours = brief.estimatedHours.shoot + brief.estimatedHours.edit;
        const staffCount = brief.assignedStaff?.length || 1;
        const hoursPerStaff = totalBriefHours / staffCount;
        totalAssignedHours += hoursPerStaff;
      }
    });

    return Math.round((totalAssignedHours / availableHours) * 100);
  };

  const recentBriefs = briefs.slice(0, 5);
  const recentNotifications = notifications.slice(0, 5);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="card p-8 gradient-subtle">
          <h1 className="text-3xl font-semibold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your creative agency today.
          </p>
        </div>
        <LoadingSpinner size="xl" text="Loading dashboard data..." className="py-12" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
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

      {/* Welcome Header */}
      <div className="card p-8 gradient-subtle">
        <h1 className="text-3xl font-semibold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your creative agency today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clients"
          value={dashboardStats?.totalClients || 0}
        />
        <StatCard
          title="Active Briefs"
          value={dashboardStats?.activeBriefs || 0}
        />
        <StatCard
          title="Monthly Revenue"
          value={`£${(dashboardStats?.monthlyRevenue || 0).toLocaleString()}`}
        />
        <StatCard
          title="Staff Utilisation"
          value={`${dashboardStats?.staffUtilisation || 0}%`}
        />
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role === 'admin' && (
            <>
              <button 
                onClick={() => navigate('/clients')}
                className="flex items-center justify-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <Users className="h-5 w-5 text-gray-700 mr-2" />
                <span className="text-sm font-medium text-gray-800">Add New Client</span>
              </button>
              <button 
                onClick={() => setShowUserManagement(true)}
                className="flex items-center justify-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <UserPlus className="h-5 w-5 text-gray-700 mr-2" />
                <span className="text-sm font-medium text-gray-800">Add New User</span>
              </button>
            </>
          )}
          {user?.role === 'admin' && (
            <button 
              onClick={() => setShowCreateBrief(true)}
              className="flex items-center justify-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              <Plus className="h-5 w-5 text-gray-700 mr-2" />
              <span className="text-sm font-medium text-gray-800">Create Brief</span>
            </button>
          )}
          <button 
            onClick={() => navigate('/calendar')}
            className="flex items-center justify-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            <Calendar className="h-5 w-5 text-gray-700 mr-2" />
            <span className="text-sm font-medium text-gray-800">Book a Meeting</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Briefs */}
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Briefs</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentBriefs.length > 0 ? (
              recentBriefs.map((brief) => {
                const client = clients.find(c => c.id === brief.clientId);
                const statusColors = {
                  'incoming': 'badge-neutral',
                  'pre-production': 'badge-neutral',
                  'production': 'badge-warning',
                  'amend-1': 'badge-warning',
                  'amend-2': 'badge-error',
                  'final-delivery': 'badge-neutral',
                  'client-submission': 'badge-success'
                };
                
                return (
                  <div key={brief.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{brief.title}</h3>
                        <p className="text-sm text-gray-500">{client?.name}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`badge ${statusColors[brief.stage]}`}>
                          {brief.stage.replace('-', ' ')}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          £{brief.projectValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={Briefcase}
                title="No briefs yet"
                description={user?.role === 'admin' ? "Get started by creating your first brief." : "No briefs have been created yet."}
                action={user?.role === 'admin' ? {
                  label: "Create Brief",
                  onClick: () => setShowCreateBrief(true),
                  icon: Plus
                } : undefined}
                className="py-8"
              />
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => {
                const iconColors = {
                  'info': 'text-gray-500',
                  'warning': 'text-amber-500',
                  'error': 'text-red-500',
                  'success': 'text-green-500'
                };
                
                return (
                  <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${iconColors[notification.type]}`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No notifications"
                description="You're all caught up! No new notifications."
                className="py-8"
              />
            )}
          </div>
        </div>
      </div>

      {/* Staff Performance */}
      {user?.role === 'admin' && (
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Staff Performance</h2>
          </div>
          <div className="p-6">
            {staff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((member) => {
                  const utilisation = calculateStaffUtilisation(member.id);
                  return (
                    <div key={member.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="h-12 w-12 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{capitalizeWords(member.name)}</h3>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Utilisation</span>
                            <span>{utilisation}%</span>
                          </div>
                          <div className="mt-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gray-900 h-2 rounded-full" 
                              style={{ width: `${Math.min(utilisation, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No staff members"
                description="Add staff members to see their performance metrics."
                className="py-8"
              />
            )}
          </div>
        </div>
      )}

      {/* Brief Creation Modal - Only for admins */}
      {user?.role === 'admin' && (
        <BriefCreationModal 
          isOpen={showCreateBrief}
          onClose={() => setShowCreateBrief(false)}
        />
      )}

      {/* User Management Modal */}
      <UserManagement
        isOpen={showUserManagement}
        onClose={() => setShowUserManagement(false)}
      />
    </div>
  );
};

export default Dashboard;