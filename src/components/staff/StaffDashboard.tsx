import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertTriangle, Calendar, User, Bell, MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  XCircle,
  ArrowRight,
  Briefcase,
  Target,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  title: string;
  client: {
    company: string;
  };
  current_stage: string;
  due_date: string;
  estimated_hours: number;
}

interface ProjectBooking {
  id: string;
  project: {
    title: string;
    client: {
      company: string;
    };
  };
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface TodoItem {
  id: string;
  type: 'project_due' | 'booking_upcoming' | 'project_overdue' | 'mention_notification';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  mentionCreatedAt?: string;
}

interface MentionNotification {
  id: string;
  message_id: string;
  mentioned_staff_email: string;
  mentioned_staff_name: string;
  is_read: boolean;
  created_at: string;
  messages: {
    content: string;
    sender_name: string;
    created_at: string;
    channel_id: string;
  };
}

export function StaffDashboard({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<ProjectBooking[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [personalStats, setPersonalStats] = useState({
    activeProjects: 0,
    upcomingBookings: 0,
    priorityTasks: 0,
    overdueProjects: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!currentStaff) return;

    try {
      console.log('Loading staff dashboard data...');
      
      // Load projects
      console.log('Loading projects...');
      const projectsData = await loadProjects();
      
      // Load bookings
      console.log('Loading bookings...');
      const bookingsData = await loadBookings();
      
      // Generate todo items
      console.log('Generating todo items...');
      const todos = generateTodoItems(projectsData, bookingsData, currentStaff.id);
      setTodoItems(todos);

      // Calculate personal stats
      const stats = {
        activeProjects: projectsData.filter(p => p.current_stage !== 'completed' && p.current_stage !== 'cancelled').length,
        upcomingBookings: bookingsData.filter(b => new Date(b.booking_date) > new Date()).length,
        priorityTasks: todos.filter(t => t.priority === 'high').length,
        overdueProjects: projectsData.filter(p => 
          p.current_stage !== 'completed' && 
          p.current_stage !== 'cancelled' && 
          new Date(p.due_date) < new Date()
        ).length,
      };
      setPersonalStats(stats);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async (): Promise<Project[]> => {
    if (!currentStaff) return [];

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(company)
        `)
        .eq('assigned_staff_id', currentStaff.id)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  };

  const loadBookings = async (): Promise<ProjectBooking[]> => {
    if (!currentStaff) return [];

    try {
      const { data, error } = await supabase
        .from('project_bookings')
        .select(`
          *,
          project:projects(
            title,
            client:clients(company)
          )
        `)
        .eq('staff_id', currentStaff.id)
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading bookings:', error);
      return [];
    }
  };

  const generateTodoItems = (projects: Project[], bookings: ProjectBooking[], staffId: string) => {
    const todos: TodoItem[] = [];

    // Add overdue projects
    projects.forEach(project => {
      if (project.due_date && new Date(project.due_date) < new Date()) {
        todos.push({
          id: `overdue-${project.id}`,
          type: 'project_overdue',
          title: 'Overdue Project',
          description: `${project.title} for ${project.client.company} is overdue`,
          priority: 'high',
          dueDate: project.due_date
        });
      }
    });

    // Add upcoming due dates
    projects.forEach(project => {
      if (project.due_date) {
        const dueDate = new Date(project.due_date);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        
        if (dueDate > new Date() && dueDate <= threeDaysFromNow) {
          todos.push({
            id: `due-${project.id}`,
            type: 'project_due',
            title: 'Project Due Soon',
            description: `${project.title} for ${project.client.company} is due soon`,
            priority: 'medium',
            dueDate: project.due_date
          });
        }
      }
    });

    // Add upcoming bookings
    bookings.slice(0, 3).forEach(booking => {
      todos.push({
        id: `booking-${booking.id}`,
        type: 'booking_upcoming',
        title: 'Upcoming Booking',
        description: `${booking.project.title} on ${new Date(booking.booking_date).toLocaleDateString()} at ${booking.start_time}`,
        priority: 'low'
      });
    });

    return todos;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  if (!currentStaff) {
    return <div className="text-center p-8">No staff member found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Staff Dashboard</h2>
        <p className="text-muted-foreground">Your personal workspace and tasks</p>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* To-Do List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Your To-Do List</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todoItems.length > 0 ? (
              <div className="space-y-3">
                {todoItems.map((todo) => (
                  <div key={todo.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {todo.type === 'project_overdue' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {todo.type === 'project_due' && <Clock className="w-4 h-4 text-orange-500" />}
                      {todo.type === 'booking_upcoming' && <Calendar className="w-4 h-4 text-blue-500" />}
                      {todo.type === 'mention_notification' && <User className="w-4 h-4 text-gray-500" />}
                      <div>
                        <p className="font-medium text-sm">{todo.title}</p>
                        <p className="text-xs text-muted-foreground">{todo.description}</p>
                      </div>
                    </div>
                    <Badge variant={getPriorityColor(todo.priority)}>
                      {todo.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No pending tasks - great job!</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Quick Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Active Projects:</span>
              <span className="font-medium">{assignedProjects.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Upcoming Bookings:</span>
              <span className="font-medium">{upcomingBookings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Priority Tasks:</span>
              <span className="font-medium">{todoItems.filter(t => t.priority === 'high').length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Your Current Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {assignedProjects.length > 0 ? (
              <div className="space-y-3">
                {assignedProjects.map((project) => (
                  <div key={project.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm">{project.title}</h4>
                    <p className="text-xs text-muted-foreground">{project.client.company}</p>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline">{project.current_stage}</Badge>
                      {project.estimated_hours && (
                        <span className="text-xs text-muted-foreground">{project.estimated_hours}h estimated</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No assigned projects</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm">{booking.project.title}</h4>
                    <p className="text-xs text-muted-foreground">{booking.project.client.company}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs">{new Date(booking.booking_date).toLocaleDateString()}</span>
                      <span className="text-xs">{booking.start_time} - {booking.end_time}</span>
                    </div>
                    <Badge className={`mt-1 ${getStatusColor(booking.status)}`} variant="secondary">
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No upcoming bookings</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
