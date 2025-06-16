import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getValidationIssues, canMoveToStageOne } from "@/components/workflow/ProjectValidation";
import type { Staff } from "@/types/staff"; // Import Staff type

interface ProjectStage {
  id: string;
  name: string;
  order_index: number;
  billing_percentage: number;
  description: string;
}

interface Client { // Define Client interface if not already defined
  id: string;
  company: string;
  name: string;
  contact_name: string;
  contact_email: string;
  is_retainer: boolean;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  client_id: string;
  estimated_hours: number;
  status: 'active' | 'pending' | 'completed' | 'on_hold' | 'cancelled';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  current_stage: string;
  work_type: string;
  deliverables: number;
  due_date: string;
  po_number: string;
  is_retainer: boolean;
  contract_signed: boolean;
  po_required: boolean;
  project_value: number | null;
  stage_status: string;
  picter_link: string | null;
  client: Client;
  assigned_staff_id: string | null;
  assigned_staff: Staff | null;
}

export function useProjectOperations(
  stages: ProjectStage[],
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) {
  const { toast } = useToast();

  const updateProjectInState = (projectId: string, updates: Partial<Project>) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, ...updates } : p
      )
    );
  };

  const assignStaff = async (projectId: string, staffId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ assigned_staff_id: staffId })
        .eq('id', projectId);

      if (error) throw error;

      // Update local state
      updateProjectInState(projectId, { assigned_staff_id: staffId });
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

      // Update local state
      updateProjectInState(projectId, { contract_signed: signed });
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

      // Update local state
      updateProjectInState(projectId, { po_number: poNumber });
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

  const updateProjectStatus = async (projectId: string, status: string, picterLink?: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const updateData: any = { stage_status: status };
      
      if (picterLink) {
        updateData.picter_link = picterLink;
        updateData.internal_review_completed = true;
      }

      if (status === "ready_to_send_client") {
        updateData.internal_review_completed = true;
      }

      if (status === "closed") {
        updateData.status = "completed";
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;

      // Update local state
      updateProjectInState(projectId, updateData);

      // Create status history record
      await supabase
        .from('project_status_history')
        .insert({
          project_id: projectId,
          stage_id: project.current_stage,
          old_status: project.stage_status || 'in_progress',
          new_status: status,
          picter_link: picterLink
        });

      // Create admin notification for internal review
      if (status === "ready_for_internal_review" && picterLink) {
        await supabase
          .from('admin_notifications')
          .insert({
            project_id: projectId,
            notification_type: 'internal_review',
            title: `Internal Review Required: ${project.title}`,
            description: `Project is ready for internal review in ${stages.find(s => s.id === project.current_stage)?.name}`,
            picter_link: picterLink
          });
      }

      // Create admin notification for project closure
      if (status === "closed") {
        await supabase
          .from('admin_notifications')
          .insert({
            project_id: projectId,
            notification_type: 'send_final_email',
            title: `Send Final Email: ${project.title}`,
            description: `Project is closed and ready for final client email`
          });
      }

      toast({
        title: "Success",
        description: `Project status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating project status:', error);
      toast({
        title: "Error",
        description: "Failed to update project status",
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

      // Update local state
      updateProjectInState(projectId, { current_stage: newStageId });

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

  const moveProjectBack = async (projectId: string, newStageId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ current_stage: newStageId })
        .eq('id', projectId);

      if (error) throw error;

      // Update local state
      updateProjectInState(projectId, { current_stage: newStageId });

      toast({
        title: "Success",
        description: `Project moved back to ${stages.find(s => s.id === newStageId)?.name}`,
      });
    } catch (error) {
      console.error('Error moving project back:', error);
      toast({
        title: "Error",
        description: "Failed to move project back",
        variant: "destructive",
      });
    }
  };

  return {
    assignStaff,
    updateContractStatus,
    updatePoNumber,
    updateProjectStatus,
    moveProject,
    moveProjectBack
  };
}