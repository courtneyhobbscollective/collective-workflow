
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProjectStage {
  id: string;
  name: string;
  order_index: number;
  billing_percentage: number;
  description: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
  is_retainer: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  client_id: string;
  assigned_staff_id: string | null;
  current_stage: string;
  work_type: string;
  deliverables: number;
  due_date: string;
  po_number: string;
  estimated_hours: number;
  is_retainer: boolean;
  status: string;
  client: Client;
  assigned_staff: Staff | null;
}

export function WorkflowBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('project_stages')
        .select('*')
        .order('order_index');

      if (stagesError) throw stagesError;

      // Load projects with related data
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(*),
          assigned_staff:staff(*)
        `)
        .eq('status', 'active');

      if (projectsError) throw projectsError;

      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);

      if (staffError) throw staffError;

      setStages(stagesData || []);
      setProjects(projectsData || []);
      setStaff(staffData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignStaff = async (projectId: string, staffId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ assigned_staff_id: staffId })
        .eq('id', projectId);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: "Staff member assigned successfully",
      });
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast({
        title: "Error",
        description: "Failed to assign staff member",
        variant: "destructive",
      });
    }
  };

  const moveProject = async (projectId: string, newStageId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;

    // Check if staff is assigned before allowing progression from incoming
    if (project.current_stage === 'incoming' && !project.assigned_staff_id) {
      toast({
        title: "Staff Assignment Required",
        description: "Please assign a staff member before moving this project forward",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({ current_stage: newStageId })
        .eq('id', projectId);

      if (error) throw error;

      await loadData();

      // Show billing notification for non-retainer projects
      if (!project.is_retainer) {
        const stage = stages.find(s => s.id === newStageId);
        if (stage && stage.billing_percentage > 0) {
          toast({
            title: "Billing Triggered",
            description: `${stage.billing_percentage}% invoice generated for one-off project`,
          });
        }
      }

      toast({
        title: "Success",
        description: `Project moved to ${stages.find(s => s.id === newStageId)?.name}`,
      });
    } catch (error) {
      console.error('Error moving project:', error);
      toast({
        title: "Error",
        description: "Failed to move project",
        variant: "destructive",
      });
    }
  };

  const getProjectsForStage = (stageId: string) => {
    return projects.filter(project => project.current_stage === stageId);
  };

  const getNextStage = (currentStage: string) => {
    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  };

  const getStageColor = (stageId: string) => {
    const colors = {
      'incoming': 'bg-gray-100',
      'stage01': 'bg-blue-100',
      'stage02': 'bg-yellow-100',
      'stage03': 'bg-orange-100',
      'stage04': 'bg-red-100',
      'stage05': 'bg-green-100',
      'stage06': 'bg-purple-100',
    };
    return colors[stageId as keyof typeof colors] || 'bg-gray-100';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Workflow Board</h2>
        <p className="text-muted-foreground">Track projects through your creative workflow with staff assignments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto">
        {stages.map((stage) => (
          <div key={stage.id} className={`${getStageColor(stage.id)} p-4 rounded-lg min-h-[500px]`}>
            <h3 className="font-semibold text-sm mb-3">{stage.name}</h3>
            <div className="space-y-3">
              {getProjectsForStage(stage.id).map((project) => (
                <Card key={project.id} className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{project.client?.company || project.client?.name}</p>
                      <p className="text-xs text-muted-foreground">{project.work_type}</p>
                      
                      {project.due_date && (
                        <div className="flex items-center space-x-1 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(project.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {project.is_retainer ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Retainer
                        </span>
                      ) : (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Project
                        </span>
                      )}

                      {project.assigned_staff ? (
                        <div className="flex items-center space-x-1 text-xs">
                          <User className="w-3 h-3" />
                          <span>{project.assigned_staff.name}</span>
                        </div>
                      ) : project.current_stage === 'incoming' ? (
                        <div className="space-y-2">
                          <p className="text-xs text-red-600">No staff assigned</p>
                          <Select onValueChange={(staffId) => assignStaff(project.id, staffId)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Assign staff" />
                            </SelectTrigger>
                            <SelectContent>
                              {staff.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name} - {member.role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <p className="text-xs text-red-600">No staff assigned</p>
                      )}

                      {project.estimated_hours && (
                        <p className="text-xs">Est. Hours: {project.estimated_hours}</p>
                      )}

                      {getNextStage(project.current_stage) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => moveProject(project.id, getNextStage(project.current_stage)!.id)}
                          disabled={project.current_stage === 'incoming' && !project.assigned_staff_id}
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Move Forward
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
