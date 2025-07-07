import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Brief, BriefStage, BriefStatus } from '../../types';
import { BillingService } from '../../lib/billingService';
import BriefCreationModal from './BriefCreationModal';
import CalendarBookingModal from './CalendarBookingModal';
import { 
  ChevronRight, ChevronLeft, ChevronDown, Clock, User, DollarSign, Calendar, 
  CheckCircle, AlertTriangle, ExternalLink, Upload, Plus 
} from 'lucide-react';
import { capitalizeWords } from '../../lib/capitalizeWords';

const BriefWorkflow: React.FC = () => {
  const { briefs, clients, staff, updateBrief, updateStaff, addNotification, loading, error, clearError } = useApp();
  
  // Debug loading state
  console.log('BriefWorkflow render - loading:', loading, 'briefs count:', briefs.length);
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [assigningBrief, setAssigningBrief] = useState<Brief | null>(null);
  const [assignStaffIds, setAssignStaffIds] = useState<string[]>([]);
  const [expandedBriefs, setExpandedBriefs] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedBriefCards, setExpandedBriefCards] = useState<Set<string>>(new Set());
  const [addingTaskBriefId, setAddingTaskBriefId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());
  const [hoveredStaffAvatar, setHoveredStaffAvatar] = useState<string | null>(null);
  const [hoveredStatusBadge, setHoveredStatusBadge] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [unassigningStaff, setUnassigningStaff] = useState<Set<string>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [bookingBrief, setBookingBrief] = useState<Brief | null>(null);

  const stages: { key: BriefStage; name: string; color: string; description: string }[] = [
    { key: 'incoming', name: 'Incoming', color: 'bg-gray-50 text-gray-700', description: 'New briefs awaiting setup' },
    { key: 'pre-production', name: 'Pre-Production', color: 'bg-gray-50 text-gray-700', description: 'Planning and preparation' },
    { key: 'production', name: 'Production', color: 'bg-amber-50 text-amber-700', description: 'Active work in progress' },
    { key: 'amend-1', name: 'Amend 1', color: 'bg-amber-50 text-amber-700', description: 'First round of revisions' },
    { key: 'amend-2', name: 'Amend 2', color: 'bg-red-50 text-red-700', description: 'Second round of revisions' },
    { key: 'final-delivery', name: 'Final Delivery', color: 'bg-gray-50 text-gray-700', description: 'Final assets delivered' },
    { key: 'client-submission', name: 'Client Submission', color: 'bg-green-50 text-green-700', description: 'Submitted to client' }
  ];

  const getBriefsByStage = (stage: BriefStage) => {
    return briefs
      .filter(brief => brief.stage === stage)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()); // Sort by due date (earliest first)
  };

  const getDueDateStatus = (dueDate: Date) => {
    const today = new Date();
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = dueDateOnly.getTime() - todayOnly.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue'; // Past due date
    if (diffDays === 0) return 'due-today'; // Due today
    if (diffDays === 1) return 'due-tomorrow'; // Due tomorrow
    return 'normal'; // More than 1 day away
  };

  const capitalizeTitle = (title: string) => {
    return title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const canAdvanceBrief = (brief: Brief) => {
    if (brief.stage === 'incoming') {
      // Must have contract signed
      if (!brief.contractSigned) return false;
      
      // Must have staff assigned
      if (!brief.assignedStaff || brief.assignedStaff.length === 0) return false;
      
      // Must have calendar entries booked for the assigned staff
      const assignedStaffMembers = staff.filter(s => brief.assignedStaff?.includes(s.id));
      const hasCalendarBookings = assignedStaffMembers.some(member => {
        return member.calendar.some(entry => {
          // Check if there's a calendar entry linked to this brief
          return entry.briefId === brief.id;
        });
      });
      
      if (!hasCalendarBookings) return false;
      
      return true;
    }
    return true;
  };

  const canMoveBack = (brief: Brief) => {
    const currentStageIndex = stages.findIndex(s => s.key === brief.stage);
    return currentStageIndex > 0; // Can move back if not at the first stage
  };

  const needsReviewUrl = (stage: BriefStage) => {
    return ['amend-1', 'amend-2', 'client-submission'].includes(stage);
  };



  const handleContractSigned = async (brief: Brief) => {
    await updateBrief(brief.id, { contractSigned: true }, true); // Use optimistic update
  };

  const handleConvertDescriptionToTasks = async (brief: Brief) => {
    if (!brief.description) return;
    const lines = brief.description.split('\n').map(line => line.trim()).filter(Boolean);
    const tasks = lines.map((line, idx) => ({
      id: `t-${Date.now()}-${idx}`,
      title: line,
      completed: false,
    }));
    await updateBrief(brief.id, { tasks }, true); // Use optimistic update
  };

  const handleToggleTask = async (brief: Brief, taskId: string) => {
    // Add visual feedback for the specific task being updated
    setUpdatingTasks(prev => new Set(prev).add(taskId));
    
    const tasks = brief.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    
    try {
      await updateBrief(brief.id, { tasks }, true); // Use optimistic update
    } finally {
      // Remove loading state after update
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleAssignStaff = async () => {
    if (!assigningBrief) return;
    await updateBrief(assigningBrief.id, { assignedStaff: assignStaffIds }, true); // Use optimistic update
    setAssigningBrief(null);
    setAssignStaffIds([]);
  };

  const handleUnassignStaff = async (brief: Brief, staffId: string) => {
    try {
      // Add loading state for this specific unassign action
      setUnassigningStaff(prev => new Set(prev).add(staffId));
      
      const updatedAssignedStaff = brief.assignedStaff?.filter(id => id !== staffId) || [];
      console.log('Unassigning staff:', { briefId: brief.id, staffId, updatedAssignedStaff });
      await updateBrief(brief.id, { assignedStaff: updatedAssignedStaff }, true); // Use optimistic update
      
      // Update the modal state if this brief is currently being assigned
      if (assigningBrief && assigningBrief.id === brief.id) {
        setAssigningBrief({ ...assigningBrief, assignedStaff: updatedAssignedStaff });
        setAssignStaffIds(updatedAssignedStaff);
      }
    } catch (error) {
      console.error('Failed to unassign staff:', error);
      // The error will be handled by updateBrief and shown in the UI
    } finally {
      // Remove loading state
      setUnassigningStaff(prev => {
        const newSet = new Set(prev);
        newSet.delete(staffId);
        return newSet;
      });
    }
  };

  const toggleBriefExpansion = (briefId: string) => {
    setExpandedBriefs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(briefId)) {
        newSet.delete(briefId);
      } else {
        newSet.add(briefId);
      }
      return newSet;
    });
  };

  const toggleTaskExpansion = (briefId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(briefId)) {
        newSet.delete(briefId);
      } else {
        newSet.add(briefId);
      }
      return newSet;
    });
  };

  const toggleBriefCardExpansion = (briefId: string) => {
    setExpandedBriefCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(briefId)) {
        newSet.delete(briefId);
      } else {
        newSet.add(briefId);
      }
      return newSet;
    });
  };

  const handleAddTask = async (brief: Brief) => {
    if (!newTaskTitle.trim()) return;
    
    const newTask = {
      id: `t-${Date.now()}-${Math.random()}`,
      title: newTaskTitle.trim(),
      completed: false,
    };
    
    const updatedTasks = [...(brief.tasks || []), newTask];
    
    try {
      await updateBrief(brief.id, { tasks: updatedTasks }, true); // Use optimistic update
      setNewTaskTitle('');
      setAddingTaskBriefId(null);
    } catch (error) {
      // If optimistic update fails, the error will be handled by updateBrief
      console.error('Failed to add task:', error);
    }
  };

  const handleDeleteTask = async (brief: Brief, taskId: string) => {
    const updatedTasks = brief.tasks.filter(task => task.id !== taskId);
    await updateBrief(brief.id, { tasks: updatedTasks }, true); // Use optimistic update
  };

  const handleUpdateStatus = async (brief: Brief, status: BriefStatus) => {
    setUpdatingStatus(brief.id);
    try {
      await updateBrief(brief.id, { status }, true); // Use optimistic update
      setHoveredStatusBadge(null);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleMoveForward = async (brief: Brief) => {
    const currentStageIndex = stages.findIndex(s => s.key === brief.stage);
    if (currentStageIndex < stages.length - 1) {
      const nextStage = stages[currentStageIndex + 1];
      
      // If the next stage needs a review URL, show a simple prompt
      if (needsReviewUrl(nextStage.key)) {
        const reviewUrl = prompt(`Please provide a review URL for ${nextStage.name} stage:`);
        if (!reviewUrl) {
          alert('Review URL is required for this stage.');
        return;
      }

      setIsAdvancing(true);
      try {
        const updates: Partial<Brief> = {
          stage: nextStage.key,
            reviewUrls: { ...brief.reviewUrls, [nextStage.key]: reviewUrl }
        };

        await updateBrief(brief.id, updates);
        
        // Generate billing for project clients
        const client = clients.find(c => c.id === brief.clientId);
        if (client?.type === 'project' && brief.projectValue > 0) {
          const billingStages = ['pre-production', 'amend-1', 'final-delivery'];
          const billingPercentages = [50, 30, 20];
          const stageIndex = billingStages.indexOf(nextStage.key);
          
          if (stageIndex !== -1) {
            const amount = (brief.projectValue * billingPercentages[stageIndex]) / 100;
            const billingStage = `${billingPercentages[stageIndex]}-percent`;
            
            try {
              await BillingService.addProjectStageToBillingQueue(
                brief.clientId,
                brief.id,
                billingStage,
                billingPercentages[stageIndex],
                amount,
                brief.title
              );
              
              // Update the brief's billing stage
              await updateBrief(brief.id, { billingStage: billingStage as any }, true);
              
              if (user) {
                addNotification({
                  userId: user.id,
                  title: 'Billing Queue Updated',
                  message: `Billing item for ${brief.title} (${billingPercentages[stageIndex]}% - £${amount.toLocaleString()}) has been added to the billing queue.`,
                  type: 'info',
                  read: false
                });
              }
            } catch (error) {
              console.error('Failed to add billing to queue:', error);
              if (user) {
                addNotification({
                  userId: user.id,
                  title: 'Billing Error',
                  message: `Failed to add billing for ${brief.title} to the queue.`,
                  type: 'error',
                  read: false
                });
              }
            }
          }
        }

          // Add review notification
          if (user) {
          addNotification({
              userId: user.id,
            title: 'Review Required',
            message: `${brief.title} needs review at ${nextStage.name} stage`,
            type: 'warning',
            read: false,
            actionUrl: `/briefs/${brief.id}`
          });
        }
        } catch (error) {
          console.error('Failed to advance brief:', error);
        } finally {
          setIsAdvancing(false);
        }
      } else {
        // For stages that don't need review URL, advance directly
        setIsAdvancing(true);
        try {
          const updates: Partial<Brief> = {
            stage: nextStage.key
          };

          await updateBrief(brief.id, updates);
          
          // Generate billing for project clients
          const client = clients.find(c => c.id === brief.clientId);
          if (client?.type === 'project' && brief.projectValue > 0) {
            const billingStages = ['pre-production', 'amend-1', 'final-delivery'];
            const billingPercentages = [50, 30, 20];
            const stageIndex = billingStages.indexOf(nextStage.key);
            
            if (stageIndex !== -1) {
              const amount = (brief.projectValue * billingPercentages[stageIndex]) / 100;
              const billingStage = `${billingPercentages[stageIndex]}-percent`;
              
              try {
                await BillingService.addProjectStageToBillingQueue(
                  brief.clientId,
                  brief.id,
                  billingStage,
                  billingPercentages[stageIndex],
                  amount,
                  brief.title
                );
                
                // Update the brief's billing stage
                await updateBrief(brief.id, { billingStage: billingStage as any }, true);
                
                if (user) {
                  addNotification({
                    userId: user.id,
                    title: 'Billing Queue Updated',
                    message: `Billing item for ${brief.title} (${billingPercentages[stageIndex]}% - £${amount.toLocaleString()}) has been added to the billing queue.`,
                    type: 'info',
                    read: false
                  });
                }
              } catch (error) {
                console.error('Failed to add billing to queue:', error);
                if (user) {
                  addNotification({
                    userId: user.id,
                    title: 'Billing Error',
                    message: `Failed to add billing for ${brief.title} to the queue.`,
                    type: 'error',
                    read: false
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to advance brief:', error);
        } finally {
          setIsAdvancing(false);
        }
      }
    }
  };

  const handleMoveBack = async (brief: Brief) => {
    const currentStageIndex = stages.findIndex(s => s.key === brief.stage);
    if (currentStageIndex > 0) {
      const previousStage = stages[currentStageIndex - 1];
      
      setIsAdvancing(true);
      try {
        const updates: Partial<Brief> = {
          stage: previousStage.key
        };

        await updateBrief(brief.id, updates);
        
        // Add notification about moving back
        if (user) {
          addNotification({
            userId: user.id,
            title: 'Brief Moved Back',
            message: `${brief.title} has been moved back to ${previousStage.name} stage`,
            type: 'info',
            read: false
          });
        }
      } catch (error) {
        console.error('Failed to move brief back:', error);
      } finally {
        setIsAdvancing(false);
      }
    }
  };

  const handleBookCalendar = async (brief: Brief) => {
    if (!brief.assignedStaff || brief.assignedStaff.length === 0) {
      alert('Please assign staff before booking calendar.');
      return;
    }

    setBookingBrief(brief);
    setShowCalendarModal(true);
  };

  const handleCalendarBookings = async (bookings: any[]) => {
    try {
      console.log('Creating calendar entries:', bookings);
      
      // Update each staff member's calendar with the new entries
      const staffUpdates = staff.map(member => {
        const memberBookings = bookings.filter(booking => booking.staffId === member.id);
        if (memberBookings.length > 0) {
          const updatedCalendar = [...member.calendar, ...memberBookings];
          return {
            staffId: member.id,
            calendar: updatedCalendar
          };
        }
        return null;
      }).filter(Boolean);
      
      // Update each staff member in the database
      for (const update of staffUpdates) {
        if (update) {
          await updateStaff(update.staffId, { calendar: update.calendar });
        }
      }
      
      // Show success message
      const uniqueStaffCount = new Set(bookings.map(b => b.staffId)).size;
      alert(`Calendar entries created: ${bookings.length} booking(s) for ${uniqueStaffCount} staff member(s)`);
      
    } catch (error) {
      console.error('Failed to book calendar:', error);
      alert('Failed to book calendar. Please try again.');
    }
  };

  // Helper to calculate available hours for a staff member considering all assigned briefs
  function getStaffAvailableHoursForBrief(
    staffMember: import('../../types').Staff,
    brief: import('../../types').Brief
  ): number {
    // Calculate hours from calendar entries (all time, not just current month)
    let bookedHours = 0;
    if (staffMember.calendar && Array.isArray(staffMember.calendar)) {
      bookedHours = staffMember.calendar.reduce((sum: number, entry: import('../../types').CalendarEntry) => {
        const entryStart = new Date(entry.startTime);
        const entryEnd = new Date(entry.endTime);
        const duration = (entryEnd.getTime() - entryStart.getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);
    }
    
    // Calculate hours from ALL assigned briefs (not just current month)
    const assignedBriefsHours = briefs
      .filter(b => 
        b.assignedStaff?.includes(staffMember.id) && 
        b.id !== brief.id // Exclude current brief being assigned
      )
      .reduce((sum, assignedBrief) => {
        // Sum shoot and edit hours from estimated hours
        const shootHours = assignedBrief.estimatedHours?.shoot || 0;
        const editHours = assignedBrief.estimatedHours?.edit || 0;
        return sum + shootHours + editHours;
      }, 0);
    
    const totalBookedHours = bookedHours + assignedBriefsHours;
    return Math.max(0, staffMember.monthlyAvailableHours - totalBookedHours);
  }

  function getStaffWeeklyAvailableHours(staffMember: import('../../types').Staff): {
    available: number;
    booked: number;
    total: number;
    upcoming: number;
  } {
    // Calculate current week boundaries
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Calculate booked hours from calendar entries for current week only
    const weeklyBookedHours = staffMember.calendar
      .filter(entry => {
        const entryStart = new Date(entry.startTime);
        return entryStart >= startOfWeek && entryStart <= endOfWeek;
      })
      .reduce((sum, entry) => {
        const entryStart = new Date(entry.startTime);
        const entryEnd = new Date(entry.endTime);
        const duration = (entryEnd.getTime() - entryStart.getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);
    
    // Calculate upcoming commitments (assigned briefs not yet scheduled)
    const upcomingCommitments = briefs
      .filter(b => b.assignedStaff?.includes(staffMember.id))
      .reduce((sum, brief) => {
        const shootHours = brief.estimatedHours?.shoot || 0;
        const editHours = brief.estimatedHours?.edit || 0;
        return sum + shootHours + editHours;
      }, 0);
    
    const weeklyAvailableHours = staffMember.monthlyAvailableHours;
    
    return {
      available: Math.max(0, weeklyAvailableHours - weeklyBookedHours),
      booked: weeklyBookedHours, // Only actual calendar bookings
      total: weeklyAvailableHours,
      upcoming: upcomingCommitments // Future commitments not yet scheduled
    };
  }

  const BriefCard: React.FC<{ brief: Brief }> = ({ brief }) => {
    const client = clients.find(c => c.id === brief.clientId);
    const assignedStaffMembers = staff.filter(s => brief.assignedStaff?.includes(s.id));
    const completedTasks = brief.tasks?.filter(t => t.completed).length || 0;
    const totalTasks = brief.tasks?.length || 0;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const dueDateStatus = getDueDateStatus(brief.dueDate);
    
    // Helper function to check if calendar is booked for this brief
    const hasCalendarBookings = assignedStaffMembers.some(member => {
      return member.calendar.some(entry => entry.briefId === brief.id);
    });

    // Determine card background color based on due date status
    const getCardBackgroundClass = () => {
      switch (dueDateStatus) {
        case 'overdue':
          return 'bg-red-50 border-red-200';
        case 'due-today':
          return 'bg-red-50 border-red-200';
        case 'due-tomorrow':
          return 'bg-yellow-50 border-yellow-200';
        default:
          return 'bg-white border-gray-200';
      }
    };

    return (
      <div className={`card card-hover p-4 ${getCardBackgroundClass()}`}>
        {/* Clickable header section */}
        <div 
          className="flex items-start justify-between mb-3 cursor-pointer"
          onClick={() => toggleBriefCardExpansion(brief.id)}
        >
          <div className="flex items-center space-x-2 flex-1">
            <div className="flex items-center space-x-1">
              {expandedBriefCards.has(brief.id) ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          <div>
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{capitalizeTitle(brief.title)}</h3>
              <div className="flex items-center space-x-2 mt-1">
                {client && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {client.companyName || client.name}
                  </span>
                )}
                
                {/* Status Badge with Hover Dropdown */}
                <div className="relative group">
                  <button
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      brief.status === 'in-progress' ? 'bg-green-100 text-green-800' :
                      brief.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                      brief.status === 'waiting-for-client' ? 'bg-blue-100 text-blue-800' :
                      brief.status === 'shoot-booked' ? 'bg-purple-100 text-purple-800' :
                      brief.status === 'sent-for-client-feedback' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => {
                      if (hoverTimeout) clearTimeout(hoverTimeout);
                      setHoveredStatusBadge(brief.id);
                    }}
                    onMouseLeave={() => {
                      const timeout = setTimeout(() => setHoveredStatusBadge(null), 300);
                      setHoverTimeout(timeout);
                    }}
                  >
                    {brief.status === 'in-progress' ? 'In Progress' :
                     brief.status === 'on-hold' ? 'On Hold' :
                     brief.status === 'waiting-for-client' ? 'Waiting for Client' :
                     brief.status === 'shoot-booked' ? 'Shoot Booked' :
                     brief.status === 'sent-for-client-feedback' ? 'Sent for Feedback' :
                     brief.status}
                  </button>
                  {hoveredStatusBadge === brief.id && (
                    <div 
                      className="absolute top-8 left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[180px]"
                      onMouseEnter={() => {
                        if (hoverTimeout) clearTimeout(hoverTimeout);
                      }}
                      onMouseLeave={() => {
                        const timeout = setTimeout(() => setHoveredStatusBadge(null), 300);
                        setHoverTimeout(timeout);
                      }}
                    >
                      <div className="text-xs font-medium text-gray-900 mb-2">Update Status</div>
                      {(['in-progress', 'on-hold', 'waiting-for-client', 'shoot-booked', 'sent-for-client-feedback'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(brief, status)}
                          disabled={updatingStatus === brief.id}
                          className={`block w-full text-left text-xs py-1 px-2 rounded hover:bg-gray-50 transition-colors ${
                            brief.status === status ? 'bg-gray-100 font-medium' : ''
                          } ${updatingStatus === brief.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {status === 'in-progress' ? 'In Progress' :
                           status === 'on-hold' ? 'On Hold' :
                           status === 'waiting-for-client' ? 'Waiting for Client' :
                           status === 'shoot-booked' ? 'Shoot Booked' :
                           status === 'sent-for-client-feedback' ? 'Sent for Client Feedback' :
                           status}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {assignedStaffMembers.length > 0 ? (
              <div className="flex -space-x-1">
                {assignedStaffMembers.map(member => (
                  <div
                    key={member.id}
                    className="relative group"
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => {
                      if (hoverTimeout) clearTimeout(hoverTimeout);
                      setHoveredStaffAvatar(member.id);
                    }}
                    onMouseLeave={() => {
                      const timeout = setTimeout(() => setHoveredStaffAvatar(null), 300);
                      setHoverTimeout(timeout);
                    }}
                  >
                    <img
                      src={member.avatar}
                      alt={capitalizeWords(member.name)}
                      className="h-8 w-8 rounded-full border-2 border-white cursor-pointer"
                      title={capitalizeWords(member.name)}
                    />
                    {hoveredStaffAvatar === member.id && (
                      <div 
                        className="absolute top-8 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[120px]"
                        onMouseEnter={() => {
                          if (hoverTimeout) clearTimeout(hoverTimeout);
                        }}
                        onMouseLeave={() => {
                          const timeout = setTimeout(() => setHoveredStaffAvatar(null), 300);
                          setHoverTimeout(timeout);
                        }}
                      >
                        <div className="text-xs font-medium text-gray-900 mb-1">{capitalizeWords(member.name)}</div>
                        <button
                          onClick={() => handleUnassignStaff(brief, member.id)}
                          disabled={unassigningStaff.has(member.id)}
                          className={`text-xs text-red-600 hover:text-red-700 font-medium transition-colors w-full text-left py-1 px-1 rounded hover:bg-red-50 ${
                            unassigningStaff.has(member.id) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {unassigningStaff.has(member.id) ? 'Unassigning...' : 'Unassign'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-2 h-2 bg-gray-300 rounded-full" title="No staff assigned"></div>
            )}
            {brief.isRecurring && (
              <div className="w-2 h-2 bg-gray-900 rounded-full" title="Recurring brief"></div>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {expandedBriefCards.has(brief.id) && (
          <>

        {/* Expandable Description */}
        {brief.description && (
          <div className="mb-3">
            <button
              onClick={() => toggleBriefExpansion(brief.id)}
              className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              {expandedBriefs.has(brief.id) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>Description</span>
            </button>
            {expandedBriefs.has(brief.id) && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{brief.description}</p>
                {!brief.tasks?.length && (
                  <button
                    onClick={() => handleConvertDescriptionToTasks(brief)}
                    className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Convert to Task List
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tasks Section */}
        {brief.tasks && brief.tasks.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => toggleTaskExpansion(brief.id)}
              className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              {expandedTasks.has(brief.id) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>Tasks ({brief.tasks.filter(t => t.completed).length}/{brief.tasks.length})</span>
            </button>
            {expandedTasks.has(brief.id) && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-700">Task List</div>
                  <button
                    onClick={() => setAddingTaskBriefId(brief.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    + Add Task
                  </button>
                </div>
                <ul className="space-y-2">
                  {brief.tasks.map(task => (
                    <li key={task.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(brief, task.id)}
                          disabled={updatingTasks.has(task.id)}
                          className={`rounded border-gray-300 text-gray-900 focus:ring-gray-900 transition-opacity ${
                            updatingTasks.has(task.id) ? 'opacity-50' : ''
                          }`}
                        />
                        <span className={`text-xs ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {task.title}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(brief, task.id)}
                        disabled={updatingTasks.has(task.id)}
                        className={`opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 transition-all duration-200 ${
                          updatingTasks.has(task.id) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {updatingTasks.has(task.id) ? '⋯' : '×'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Add Task Input */}
        {addingTaskBriefId === brief.id && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter new task..."
                className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask(brief)}
                autoFocus
              />
              <button
                onClick={() => handleAddTask(brief)}
                disabled={!newTaskTitle.trim()}
                className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAddingTaskBriefId(null);
                  setNewTaskTitle('');
                }}
                className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Show Add Task button when no tasks exist */}
        {(!brief.tasks || brief.tasks.length === 0) && (
          <div className="mb-3">
            <button
              onClick={() => toggleTaskExpansion(brief.id)}
              className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              {expandedTasks.has(brief.id) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>Tasks (0/0)</span>
            </button>
            {expandedTasks.has(brief.id) && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-700">Task List</div>
                  <button
                    onClick={() => setAddingTaskBriefId(brief.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    + Add First Task
                  </button>
                </div>
                <div className="text-xs text-gray-500 italic">No tasks yet. Add your first task to get started.</div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{completedTasks}/{totalTasks} tasks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              Due: {brief.dueDate.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              {brief.estimatedHours.shoot + brief.estimatedHours.edit}h
            </span>
          </div>
        </div>

        {/* PO Number - moved under due date */}
        <div className="mb-3">
            {brief.poNumber && (
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-500">PO: {brief.poNumber}</span>
              </div>
            )}
            {!brief.poNumber && brief.stage === 'incoming' && (
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-amber-600">No PO</span>
              </div>
            )}
          </div>

        <div className="flex items-center justify-between mb-2">
          <button
            className={`text-xs px-3 py-1 rounded border transition-colors
              ${brief.contractSigned
                ? 'bg-green-100 text-green-700 border-green-300 cursor-default'
                : 'btn-secondary'}
            `}
            disabled={brief.contractSigned}
            onClick={() => handleContractSigned(brief)}
          >
            {brief.contractSigned ? 'Contract Signed' : 'Mark Contract Signed'}
          </button>
          <button
            className={`text-xs px-3 py-1 rounded border transition-colors
              ${assignedStaffMembers.length > 0
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'btn-ghost'
              }
            `}
            onClick={() => {
              setAssigningBrief(brief);
              setAssignStaffIds(brief.assignedStaff || []);
            }}
          >
            {assignedStaffMembers.length > 0 ? 'Staff Assigned' : 'Assign Staff'}
          </button>
        </div>

        {/* Calendar Booking Status */}
        {brief.stage === 'incoming' && (
          <div className="mb-2">
            <div className={`flex items-center space-x-2 text-xs px-3 py-1 rounded border ${
              hasCalendarBookings
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-amber-100 text-amber-700 border-amber-300'
            }`}>
              <Calendar className="h-3 w-3" />
              <span>
                {hasCalendarBookings 
                  ? 'Calendar Booked' 
                  : 'Calendar Not Booked'
                }
              </span>
            </div>
          </div>
        )}
        
          </>
        )}

        {/* Navigation buttons - always visible */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={() => handleMoveBack(brief)}
            disabled={!canMoveBack(brief) || isAdvancing}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdvancing ? (
              <span className="flex items-center">
                <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Moving...
              </span>
            ) : (
              <>
                <ChevronLeft className="h-3 w-3" />
                <span>Move Back</span>
              </>
            )}
          </button>
          
          {brief.stage === 'incoming' && (
            <button
              onClick={() => handleBookCalendar(brief)}
              disabled={!brief.assignedStaff || brief.assignedStaff.length === 0}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                hasCalendarBookings
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>
                {hasCalendarBookings ? 'Calendar Booked' : 'Book Calendar'}
              </span>
            </button>
          )}
          
          <button
            onClick={() => handleMoveForward(brief)}
            disabled={!canAdvanceBrief(brief) || isAdvancing}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdvancing ? (
              <span className="flex items-center">
                <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Moving...
              </span>
            ) : (
              <>
                <span>Move Forward</span>
            <ChevronRight className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Brief Workflow</h1>
          <p className="text-gray-600">Manage briefs through their lifecycle stages</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Brief
          </button>
          <div className="text-sm text-gray-500">Total briefs: {briefs.length}</div>
        </div>
      </div>

      {/* Weekly Staff Hours Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week's Staff Availability</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {staff.map(member => {
            const weeklyHours = getStaffWeeklyAvailableHours(member);
            const utilizationPercentage = (weeklyHours.booked / weeklyHours.total) * 100;
            const isExpanded = expandedBriefCards.has(`staff-${member.id}`);
            
            return (
              <div key={member.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Collapsed view - always visible */}
                <div 
                  className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleBriefCardExpansion(`staff-${member.id}`)}
                >
                  <img 
                    src={member.avatar} 
                    alt={capitalizeWords(member.name)} 
                    className="h-8 w-8 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{capitalizeWords(member.name)}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 truncate">{member.skills.join(', ')}</span>
                      <span className="text-xs font-medium text-gray-700 ml-2">
                        {utilizationPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Utilization bar - always visible */}
                <div className="px-3 pb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        utilizationPercentage > 90 ? 'bg-red-500' :
                        utilizationPercentage > 75 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-white p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Available:</span>
                      <span className={`font-medium ${
                        weeklyHours.available < 10 ? 'text-red-600' : 
                        weeklyHours.available < 20 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {weeklyHours.available.toFixed(1)}h
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Booked (This Week):</span>
                      <span className="font-medium text-gray-900">
                        {weeklyHours.booked.toFixed(1)}h
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Upcoming:</span>
                      <span className="font-medium text-blue-600">
                        {weeklyHours.upcoming.toFixed(1)}h
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Capacity:</span>
                      <span className="font-medium text-gray-900">
                        {weeklyHours.total.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && briefs.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center">
            <svg className="animate-spin h-8 w-8 mr-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-gray-600">Loading briefs...</span>
          </div>
        </div>
      )}

      {/* Workflow Stages */}
      {(!loading || briefs.length > 0) && (
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'start',
          }}
        >
          {stages.map((stage) => {
            const stageBriefs = getBriefsByStage(stage.key);
            
            return (
              <div
                key={stage.key}
                className="bg-gray-50 rounded-xl p-4 flex flex-col min-w-[280px]"
                style={{ minWidth: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">{stage.name}</h3>
                  <span className="text-xs text-gray-500">({stageBriefs.length})</span>
                </div>
                
                <div className="space-y-3 flex-1">
                  {stageBriefs.map((brief) => (
                    <BriefCard key={brief.id} brief={brief} />
                  ))}
                  
                  {stageBriefs.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-xs">No briefs in this stage</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}



      {/* Brief Creation Modal */}
      <BriefCreationModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Calendar Booking Modal */}
      <CalendarBookingModal
        isOpen={showCalendarModal}
        onClose={() => {
          setShowCalendarModal(false);
          setBookingBrief(null);
        }}
        brief={bookingBrief}
        staff={staff}
        onBookCalendar={handleCalendarBookings}
      />

      {/* Assign Staff Modal */}
      {assigningBrief && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Assign Staff</h3>
            <p className="text-sm text-gray-600 mb-4">
              Staff can only be assigned if they have sufficient available hours. 
              Required: {(assigningBrief.estimatedHours.shoot + assigningBrief.estimatedHours.edit).toFixed(1)}h
            </p>
            {/* Currently Assigned Staff */}
            {assigningBrief.assignedStaff && assigningBrief.assignedStaff.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Currently Assigned</h4>
                <div className="space-y-2">
                  {staff
                    .filter(member => assigningBrief.assignedStaff?.includes(member.id))
                    .map(member => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img src={member.avatar} alt={capitalizeWords(member.name)} className="h-8 w-8 rounded-full" />
                <div>
                            <p className="text-sm font-medium text-gray-900">{capitalizeWords(member.name)}</p>
                            <p className="text-xs text-gray-500">{member.skills.join(', ')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnassignStaff(assigningBrief, member.id)}
                          disabled={unassigningStaff.has(member.id)}
                          className={`text-xs text-red-600 hover:text-red-700 font-medium transition-colors ${
                            unassigningStaff.has(member.id) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {unassigningStaff.has(member.id) ? 'Unassigning...' : 'Unassign'}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Available Staff */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Available Staff</h4>
              <div className="space-y-2">
                {staff.map(member => {
                const availableHours = getStaffAvailableHoursForBrief(member, assigningBrief);
                const requiredHours = assigningBrief.estimatedHours.shoot + assigningBrief.estimatedHours.edit;
                const canAssign = availableHours >= requiredHours;
                return (
                  <label key={member.id} className={`flex items-center space-x-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${!canAssign ? 'opacity-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={assignStaffIds.includes(member.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setAssignStaffIds(prev => [...prev, member.id]);
                        } else {
                          setAssignStaffIds(prev => prev.filter(id => id !== member.id));
                        }
                      }}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      disabled={!canAssign}

                    />
                    <img src={member.avatar} alt={capitalizeWords(member.name)} className="h-8 w-8 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{capitalizeWords(member.name)}</p>
                      <p className="text-xs text-gray-500">{member.skills.join(', ')}</p>
                      <p className={`text-xs mt-1 ${canAssign ? 'text-green-600' : 'text-red-500'}`}>
                        {canAssign 
                          ? `Available: ${availableHours.toFixed(1)}h` 
                          : `Insufficient hours (${availableHours.toFixed(1)}h available, ${requiredHours.toFixed(1)}h required)`
                        }
                    </p>
                  </div>
                  </label>
                );
              })}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
                <button
                  className="btn-secondary"
                onClick={() => setAssigningBrief(null)}
                >
                  Cancel
                </button>
                <button
                className="btn-primary"
                onClick={handleAssignStaff}
                disabled={false} // Allow saving even when unassigning all staff
              >
                {assignStaffIds.length === 0 ? 'Remove All Staff' : 'Save'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BriefWorkflow;