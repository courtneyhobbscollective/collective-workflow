import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getValidationIssues, canMoveToStageOne } from "@/components/workflow/ProjectValidation";

interface ProjectStage {
  id: string;
  name: string;
  order_index: number;
  billing_percentage: number;
  description: string;
}

interface Project {
  id: string;
  title: string;
  current_stage: string;
  is_retainer: boolean;
  stage_status?: string;
  contract_signed: boolean;
  po_required: boolean;
  po_number: string;
  assigned_staff_id: string | null;
}

export function useProjectOperations(loadData: () => Promise<void>, stages: ProjectStage[]) {
  const { toast } = useToast();

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

  const updateProjectStatus = async (projectId: string, status: string, picterLink?: string, projects?: Project[]) => {
    try {
      const project = projects?.find(p => p.id === projectId);
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

      await loadData();

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

  const moveProject = async (projectId: string, newStageId: string, projects: Project[]) => {
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

  const moveProjectBack = async (projectId: string, newStageId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ current_stage: newStageId })
        .eq('id', projectId);

      if (error) throw error;

      await loadData();
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