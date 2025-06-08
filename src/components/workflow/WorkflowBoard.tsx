
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StageColumn } from "./StageColumn";
import { getValidationIssues, canMoveToStageOne } from "./ProjectValidation";

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
  contract_signed: boolean;
  po_required: boolean;
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

  const updateContractStatus = async (projectId: string, signed: boolean) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ contract_signed: signed })
        .eq('id', projectId);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: `Contract marked as ${signed ? 'signed' : 'not signed'}`,
      });
    } catch (error) {
      console.error('Error updating contract status:', error);
      toast({
        title: "Error",
        description: "Failed to update contract status",
        variant: "destructive",
      });
    }
  };

  const updatePoNumber = async (projectId: string, poNumber: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ po_number: poNumber })
        .eq('id', projectId);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: "PO number updated successfully",
      });
    } catch (error) {
      console.error('Error updating PO number:', error);
      toast({
        title: "Error",
        description: "Failed to update PO number",
        variant: "destructive",
      });
    }
  };

  const moveProject = async (projectId: string, newStageId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;

    // Check validation for moving from incoming to stage01
    if (project.current_stage === 'incoming' && !canMoveToStageOne(project)) {
      const issues = getValidationIssues(project);
      toast({
        title: "Cannot Move Project",
        description: `Please resolve: ${issues.join(', ')}`,
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

  const handleBookingCreated = () => {
    // Refresh data when a booking is created
    loadData();
    toast({
      title: "Success",
      description: "Calendar booking created successfully",
    });
  };

  const getProjectsForStage = (stageId: string) => {
    return projects.filter(project => project.current_stage === stageId);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Workflow Board</h2>
        <p className="text-muted-foreground">Track projects through your creative workflow with staff assignments and project gates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto">
        {stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            projects={getProjectsForStage(stage.id)}
            staff={staff}
            stages={stages}
            onAssignStaff={assignStaff}
            onUpdateContract={updateContractStatus}
            onUpdatePoNumber={updatePoNumber}
            onMoveProject={moveProject}
            onBookingCreated={handleBookingCreated}
          />
        ))}
      </div>
    </div>
  );
}
