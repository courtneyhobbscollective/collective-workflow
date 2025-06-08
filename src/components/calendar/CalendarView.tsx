import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Users, Clock, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StaffFilter } from "./StaffFilter";
import { CalendarGrid } from "./CalendarGrid";
import { BookingModal } from "./BookingModal";
import { StaffAvailabilityModal } from "./StaffAvailabilityModal";
import { BookingDetailsModal } from "./BookingDetailsModal";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface Project {
  id: string;
  title: string;
  estimated_hours: number;
  assigned_staff_id: string;
  client: {
    company: string;
  };
}

interface ProjectBooking {
  id: string;
  project_id: string;
  staff_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  hours_booked: number;
  status: string;
  project: {
    title: string;
    client: {
      company: string;
    };
  };
}

export function CalendarView() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<ProjectBooking[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("month");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ProjectBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Load projects with staff assignments
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(company)
        `)
        .eq('status', 'active')
        .not('assigned_staff_id', 'is', null)
        .not('estimated_hours', 'is', null);

      if (projectsError) throw projectsError;

      // Load bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('project_bookings')
        .select(`
          *,
          project:projects(
            title,
            client:clients(company)
          )
        `)
        .order('booking_date', { ascending: true });

      if (bookingsError) throw bookingsError;

      setStaff(staffData || []);
      setProjects(projectsData || []);
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const openBookingModal = (project: Project) => {
    setSelectedProject(project);
    setShowBookingModal(true);
  };

  const openBookingDetailsModal = (booking: ProjectBooking) => {
    setSelectedBooking(booking);
    setShowBookingDetailsModal(true);
  };

  const filteredBookings = selectedStaff === "all" 
    ? bookings 
    : bookings.filter(booking => booking.staff_id === selectedStaff);

  const filteredProjects = selectedStaff === "all"
    ? projects
    : projects.filter(project => project.assigned_staff_id === selectedStaff);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading calendar...</div>;
  }

  return (
    <div className="space-y-4 p-4 max-w-full">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Calendar</h2>
            <p className="text-sm text-muted-foreground">Manage staff availability and project scheduling</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAvailabilityModal(true)}
              className="w-full sm:w-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Availability
            </Button>
            <Select value={view} onValueChange={(value: "week" | "month") => setView(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month View</SelectItem>
                <SelectItem value="week">Week View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <StaffFilter
              staff={staff}
              selectedStaff={selectedStaff}
              onStaffChange={setSelectedStaff}
            />
            
            <Card className="lg:max-h-96 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Clock className="w-4 h-4" />
                  <span>Unscheduled Projects</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-80 overflow-y-auto">
                <div className="space-y-2">
                  {filteredProjects.filter(p => !bookings.some(b => b.project_id === p.id)).map((project) => (
                    <div key={project.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm line-clamp-2">{project.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{project.client.company}</p>
                      <p className="text-xs text-blue-600">{project.estimated_hours}h estimated</p>
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => openBookingModal(project)}
                      >
                        Schedule
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <CardTitle className="flex items-center space-x-2 text-base lg:text-lg">
                    <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span>
                      {currentDate.toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric',
                        ...(view === "week" && { day: 'numeric' })
                      })}
                    </span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 lg:p-6">
                <CalendarGrid
                  currentDate={currentDate}
                  view={view}
                  bookings={filteredBookings}
                  staff={staff}
                  selectedStaff={selectedStaff}
                  onBookingUpdate={loadData}
                  onBookingClick={openBookingDetailsModal}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        project={selectedProject}
        staff={staff}
        onBookingCreated={loadData}
      />

      <StaffAvailabilityModal
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        staff={staff}
        onAvailabilityUpdated={loadData}
      />

      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={showBookingDetailsModal}
        onClose={() => setShowBookingDetailsModal(false)}
        staff={staff}
        onBookingUpdate={loadData}
      />
    </div>
  );
}
