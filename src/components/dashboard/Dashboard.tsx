import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserPlus, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  User,
  Eye,
  TrendingUp,
  Activity,
  Target,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StaffDashboard } from "@/components/staff/StaffDashboard";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_picture_url?: string;
  available_hours_per_week?: number;
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
  assigned_staff_id: string;
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
  staff_id: string;
  hours_booked: number;
}

interface TodoItem {
  id: string;
  type: 'project_due' | 'booking_upcoming' | 'project_overdue';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  staffId?: string;
}

interface TeamMemberData {
  staff: StaffMember;
  projects: Project[];
  bookings: ProjectBooking[];
  todos: TodoItem[];
  stats: {
    activeProjects: number;
    upcomingBookings: number;
    priorityTasks: number;
    overdueProjects: number;
    bookedHours: number;
    utilisationPercentage: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'project_created' | 'project_moved' | 'booking_created' | 'invoice_generated' | 'brief_submitted';
  title: string;
  description: string;
  timestamp: string;
  staff_name?: string;
  client_name?: string;
}

export function Dashboard() {
  const { staff: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamMemberData[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalStaff: 0,
    totalClients: 0,
    activeProjects: 0,
    pendingBriefs: 0,
  });
  const [teamEfficiency, setTeamEfficiency] = useState({
    totalBookedHours: 0,
    totalAvailableHours: 0,
    utilisationPercentage: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const { toast } = useToast();

  console.log('Dashboard render - currentUser:', currentUser);

  useEffect(() => {
    loadDashboardData();
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Dashboard loading timeout reached');
      setLoading(false);
    }, 5000); // 5 seconds

    return () => clearTimeout(timeout);
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('=== DASHBOARD LOADING START ===');
      console.log('Loading dashboard data for user:', currentUser);
      
      if (!currentUser) {
        console.log('No current user found, setting loading to false');
        setLoading(false);
        return;
      }

      if (currentUser.role === 'Admin') {
        console.log('Loading admin dashboard...');
        await loadAdminDashboard();
      } else {
        console.log('User is not admin, setting loading to false');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const loadAdminDashboard = async () => {
    try {
      console.log('=== LOADING ADMIN DASHBOARD ===');
      
      // Load all active staff members
      console.log('Loading staff data...');
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);

      if (staffError) {
        console.error('Staff error:', staffError);
        throw staffError;
      }
      console.log('Staff data loaded:', staffData?.length || 0, 'staff members');

      // Load all active projects
      console.log('Loading projects data...');
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(company)
        `)
        .eq('status', 'active');

      if (projectsError) {
        console.error('Projects error:', projectsError);
        throw projectsError;
      }
      console.log('Projects data loaded:', projectsData?.length || 0, 'projects');

      // Load all upcoming bookings with duration calculation
      console.log('Loading bookings data...');
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('project_bookings')
        .select(`
          *,
          project:projects(
            title,
            client:clients(company)
          )
        `)
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true });

      if (bookingsError) {
        console.error('Bookings error:', bookingsError);
        throw bookingsError;
      }
      console.log('Bookings data loaded:', bookingsData?.length || 0, 'bookings');

      // Load all clients for stats
      console.log('Loading clients data...');
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true);

      if (clientsError) {
        console.error('Clients error:', clientsError);
        throw clientsError;
      }
      console.log('Clients data loaded:', clientsData?.length || 0, 'clients');

      // Load recent activity
      console.log('Loading recent activity...');
      await loadRecentActivity();

      // Process team data with utilisation metrics
      console.log('Processing team data...');
      const teamMemberData: TeamMemberData[] = staffData?.map((staff: any) => {
        const staffProjects = projectsData?.filter(p => p.assigned_staff_id === staff.id) || [];
        const staffBookings = bookingsData?.filter(b => b.staff_id === staff.id) || [];
        const staffTodos = generateTodoItems(staffProjects, staffBookings, staff.id);
        
        console.log(`Processing ${staff.name}:`, {
          totalBookings: staffBookings.length,
          bookings: staffBookings.map(b => ({
            date: b.booking_date,
            hours: b.hours_booked,
            project: b.project?.title
          }))
        });
        
        // Calculate booked hours for this week
        const thisWeekBookings = staffBookings.filter(booking => {
          const bookingDate = new Date(booking.booking_date);
          const now = new Date();
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
        });

        console.log(`${staff.name} this week bookings:`, thisWeekBookings.map(b => ({
          date: b.booking_date,
          hours: b.hours_booked,
          project: b.project?.title
        })));

        const bookedHours = thisWeekBookings.reduce((total, booking) => {
          // Use the hours_booked field directly from the database
          return total + (booking.hours_booked || 0);
        }, 0);

        console.log(`${staff.name} total booked hours:`, bookedHours);

        // Use the available_hours_per_week from the staff data
        const availableHours = staff.available_hours_per_week || 22; // Default to 22 if not set

        const utilisationPercentage = availableHours > 0 ? (bookedHours / availableHours) * 100 : 0;

        console.log(`${staff.name} utilisation:`, {
          bookedHours,
          availableHours,
          utilisationPercentage: Math.round(utilisationPercentage * 10) / 10
        });

        return {
          staff: staff as StaffMember,
          projects: staffProjects,
          bookings: staffBookings,
          todos: staffTodos,
          stats: {
            activeProjects: staffProjects.length,
            upcomingBookings: staffBookings.length,
            priorityTasks: staffTodos.filter(t => t.priority === 'high').length,
            overdueProjects: staffProjects.filter(p => 
              p.due_date && new Date(p.due_date) < new Date()
            ).length,
            bookedHours: Math.round(bookedHours * 10) / 10,
            utilisationPercentage: Math.round(utilisationPercentage * 10) / 10,
          }
        };
      }) || [];

      console.log('Team data processed:', teamMemberData.length, 'team members');

      setTeamData(teamMemberData);

      // Calculate overall team efficiency using real available hours
      const productionStaff = teamMemberData.filter(member => member.staff.available_hours_per_week && member.staff.available_hours_per_week > 0);
      const totalBookedHours = productionStaff.reduce((total, member) => total + member.stats.bookedHours, 0);
      const totalAvailableHours = productionStaff.reduce((total, member) => {
        return total + (member.staff.available_hours_per_week || 0);
      }, 0);
      const overallUtilisation = totalAvailableHours > 0 ? (totalBookedHours / totalAvailableHours) * 100 : 0;

      console.log('Overall team efficiency:', {
        totalBookedHours,
        totalAvailableHours,
        overallUtilisation
      });

      setTeamEfficiency({
        totalBookedHours: Math.round(totalBookedHours * 10) / 10,
        totalAvailableHours,
        utilisationPercentage: Math.round(overallUtilisation * 10) / 10,
      });

      setOverallStats({
        totalStaff: staffData?.length || 0,
        totalClients: clientsData?.length || 0,
        activeProjects: projectsData?.length || 0,
        pendingBriefs: projectsData?.filter(p => p.current_stage === 'incoming').length || 0,
      });

      console.log('=== DASHBOARD LOADING COMPLETE ===');
      setLoading(false);

    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please check console for details.",
        variant: "destructive",
      });
      setLoading(false);
      throw error;
    }
  };

  const loadRecentActivity = async () => {
    try {
      console.log('Loading recent projects...');
      // Load recent project changes
      const { data: recentProjects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          current_stage,
          updated_at,
          client:clients(company)
        `)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (projectsError) {
        console.error('Recent projects error:', projectsError);
        throw projectsError;
      }

      console.log('Loading recent bookings...');
      // Load recent bookings
      const { data: recentBookings, error: bookingsError } = await supabase
        .from('project_bookings')
        .select(`
          id,
          booking_date,
          created_at,
          project:projects(title),
          staff:staff(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (bookingsError) {
        console.error('Recent bookings error:', bookingsError);
        throw bookingsError;
      }

      // Combine and format activity items
      const activityItems: ActivityItem[] = [];

      recentProjects?.forEach(project => {
        activityItems.push({
          id: `project-${project.id}`,
          type: 'project_moved',
          title: 'Project Stage Updated',
          description: `${project.title} moved to ${project.current_stage} stage`,
          timestamp: project.updated_at,
          client_name: project.client?.company,
        });
      });

      recentBookings?.forEach(booking => {
        activityItems.push({
          id: `booking-${booking.id}`,
          type: 'booking_created',
          title: 'New Booking Created',
          description: `${booking.project?.title} booked for ${new Date(booking.booking_date).toLocaleDateString()}`,
          timestamp: booking.created_at,
          staff_name: booking.staff?.name,
        });
      });

      // Sort by timestamp and take the most recent 10
      const sortedActivity = activityItems
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      console.log('Recent activity loaded:', sortedActivity.length, 'items');
      setRecentActivity(sortedActivity);

    } catch (error) {
      console.error('Error loading recent activity:', error);
      // Don't throw here, just set empty activity
      setRecentActivity([]);
    }
  };

  const generateTodoItems = (projects: Project[], bookings: ProjectBooking[], staffId: string): TodoItem[] => {
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
          dueDate: project.due_date,
          staffId
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
            dueDate: project.due_date,
            staffId
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
        priority: 'low',
        staffId
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

  // Handle case where no user is found
  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">No user profile found</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Unable to load dashboard. Please check your authentication.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For staff members, redirect to StaffDashboard
  if (currentUser.role !== 'Admin') {
    return <StaffDashboard />;
  }

  // Admin Dashboard
  const stats = [
    { title: "Active Staff", value: overallStats.totalStaff.toString(), icon: Users, color: "text-blue-600" },
    { title: "Total Clients", value: overallStats.totalClients.toString(), icon: UserPlus, color: "text-green-600" },
    { title: "Active Projects", value: overallStats.activeProjects.toString(), icon: Briefcase, color: "text-purple-600" },
    { title: "Pending Briefs", value: overallStats.pendingBriefs.toString(), icon: Clock, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-muted-foreground">Overview of your creative agency operations</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team Efficiency Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Team Efficiency</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Hours Booked This Week:</span>
              <span className="font-medium">{teamEfficiency.totalBookedHours}h / {teamEfficiency.totalAvailableHours}h</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilisation Rate</span>
                <span>{teamEfficiency.utilisationPercentage}%</span>
              </div>
              <Progress value={teamEfficiency.utilisationPercentage} className="h-2" />
            </div>
            <div className="text-xs text-muted-foreground">
              Target: 85% utilisation for optimal efficiency
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Team Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {teamData.slice(0, 4).map((member) => (
                <div key={member.staff.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{member.staff.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{member.stats.activeProjects} projects</p>
                    <p className="text-xs text-muted-foreground">{member.stats.bookedHours}h booked</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team View Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Team Overview</span>
          </TabsTrigger>
          <TabsTrigger value="team-view" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Team View</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Team Activity Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamData.map((member) => (
                    <div key={member.staff.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.staff.name}</p>
                          <p className="text-xs text-muted-foreground">{member.staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.stats.activeProjects} projects</p>
                        <p className="text-xs text-muted-foreground">{member.stats.bookedHours}h booked ({member.stats.utilisationPercentage}%)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{activity.description}</span>
                            {activity.client_name && (
                              <Badge variant="outline" className="text-xs">
                                {activity.client_name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team-view" className="space-y-6">
          {/* Individual Team Member Views - Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {teamData.map((member) => (
              <Card key={member.staff.id} className="space-y-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{member.staff.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.staff.role}</p>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Stats Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{member.stats.activeProjects} Active Projects</Badge>
                    <Badge variant="outline">{member.stats.bookedHours}h Booked</Badge>
                    <Badge variant={member.stats.utilisationPercentage > 85 ? "default" : "secondary"}>
                      {member.stats.utilisationPercentage}% Utilised
                    </Badge>
                    {member.stats.overdueProjects > 0 && (
                      <Badge variant="destructive">{member.stats.overdueProjects} Overdue</Badge>
                    )}
                  </div>

                  {/* To-Do List */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>To-Do List</span>
                    </h4>
                    {member.todos.length > 0 ? (
                      <div className="space-y-2">
                        {member.todos.slice(0, 3).map((todo) => (
                          <div key={todo.id} className="flex items-center justify-between p-2 border rounded text-sm">
                            <div className="flex items-center space-x-2">
                              {todo.type === 'project_overdue' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                              {todo.type === 'project_due' && <Clock className="w-3 h-3 text-orange-500" />}
                              {todo.type === 'booking_upcoming' && <Calendar className="w-3 h-3 text-blue-500" />}
                              <span className="truncate">{todo.description}</span>
                            </div>
                            <Badge variant={getPriorityColor(todo.priority)} className="text-xs">
                              {todo.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No pending tasks</p>
                    )}
                  </div>

                  {/* Current Projects */}
                  <div>
                    <h4 className="font-medium mb-3">Current Projects</h4>
                    {member.projects.length > 0 ? (
                      <div className="space-y-2">
                        {member.projects.slice(0, 2).map((project) => (
                          <div key={project.id} className="p-2 border rounded text-sm">
                            <p className="font-medium">{project.title}</p>
                            <p className="text-xs text-muted-foreground">{project.client.company}</p>
                            <div className="flex justify-between items-center mt-1">
                              <Badge variant="outline" className="text-xs">{project.current_stage}</Badge>
                              {project.estimated_hours && (
                                <span className="text-xs text-muted-foreground">{project.estimated_hours}h</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No assigned projects</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 