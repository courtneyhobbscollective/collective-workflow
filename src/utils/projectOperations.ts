
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getValidationIssues, canMoveToStageOne } from "@/components/workflow/ProjectValidation";
import type { Dispatch, SetStateAction } from "react";

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
  picter_link?: string | null;
  internal_review_completed?: boolean;
  status?: string;
}

export function useProjectOperations(
  setProjects: Dispatch<SetStateAction<Project[]>>,
  stages: ProjectStage[]
) {
  const { toast } = useToast();

  const updateProjectInState = (projectId: string, updates: Partial<Project>) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      )
    );
  };

  const assignStaff = async (projectId: string, staffId: string) => {
    // Get current project from state via callback
    let originalProject: Project | undefined;
    setProjects(prevProjects => {
      originalProject = prevProjects.find(p => p.id === projectId);
      return prevProjects.map(project => 
        project.id === projectId ? { ...project, assigned_staff_id: staffId } : project
      );
    });

    if (!originalProject) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ assigned_staff_id: staffId })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member assigned successfully",
      });
    } catch (error) {
      console.error('Error assigning staff:', error);
      updateProjectInState(projectId, { assigned_staff_id: originalProject.assigned_staff_id });
      toast({
        title: "Error",
        description: "Failed to assign staff member",
        variant: "destructive",
      });
    }
  };

  const updateContractStatus = async (projectId: string, signed: boolean) => {
    let originalProject: Project | undefined;
    setProjects(prevProjects => {
      originalProject = prevProjects.find(p => p.id === projectId);
      return prevProjects.map(project => 
        project.id === projectId ? { ...project, contract_signed: signed } : project
      );
    });

    if (!originalProject) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ contract_signed: signed })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Contract marked as ${signed ? 'signed' : 'not signed'}`,
      });
    } catch (error) {
      console.error('Error updating contract status:', error);
      updateProjectInState(projectId, { contract_signed: originalProject.contract_signed });
      toast({
        title: "Error",
        description: "Failed to update contract status",
        variant: "destructive",
      });
    }
  };

  const updatePoNumber = async (projectId: string, poNumber: string) => {
    let originalProject: Project | undefined;
    setProjects(prevProjects => {
      originalProject = prevProjects.find(p => p.id === projectId);
      return prevProjects.map(project => 
        project.id === projectId ? { ...project, po_number: poNumber } : project
      );
    });

    if (!originalProject) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ po_number: poNumber })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "PO number updated successfully",
      });
    } catch (error) {
      console.error('Error updating PO number:', error);
      updateProjectInState(projectId, { po_number: originalProject.po_number });
      toast({
        title: "Error",
        description: "Failed to update PO number",
        variant: "destructive",
      });
    }
  };

  const updateProjectStatus = async (projectId: string, status: string, picterLink?: string, allProjects?: Project[]) => {
    const project = allProjects?.find(p => p.id === projectId);
    if (!project) return;

    const originalStageStatus = project.stage_status;
    const originalPicterLink = project.picter_link;
    const originalInternalReviewCompleted = project.internal_review_completed;
    const originalStatus = project.status;

    const updates: Partial<Project> = { stage_status: status };
    if (picterLink) {
      updates.picter_link = picterLink;
      updates.internal_review_completed = true;
    }
    if (status === "ready_to_send_client") {
      updates.internal_review_completed = true;
    }
    if (status === "closed") {
      updates.status = "completed";
    }

    updateProjectInState(projectId, updates);

    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;

      // Create status history record
      await supabase
        .from('project_status_history')
        .insert({
          project_id: projectId,
          stage_id: project.current_stage,
          old_status: originalStageStatus || 'in_progress',
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
      updateProjectInState(projectId, {
        stage_status: originalStageStatus,
        picter_link: originalPicterLink,
        internal_review_completed: originalInternalReviewCompleted,
        status: originalStatus
      });
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    }
  };

  const moveProject = async (projectId: string, newStageId: string, allProjects: Project[]) => {
    const project = allProjects.find(p => p.id === projectId);
    
    if (!project) return;

    if (project.current_stage === 'incoming' && !canMoveToStageOne(project)) {
      const issues = getValidationIssues(project);
      toast({
        title: "Cannot Move Project",
        description: `Please resolve: ${issues.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    const originalCurrentStage = project.current_stage;
    updateProjectInState(projectId, { current_stage: newStageId });

    try {
      const { error } = await supabase
        .from('projects')
        .update({ current_stage: newStageId })
        .eq('id', projectId);

      if (error) throw error;

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
      updateProjectInState(projectId, { current_stage: originalCurrentStage });
      toast({
        title: "Error",
        description: "Failed to move project",
        variant: "destructive",
      });
    }
  };

  const moveProjectBack = async (projectId: string, newStageId: string, allProjects: Project[]) => {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return;

    const originalCurrentStage = project.current_stage;
    updateProjectInState(projectId, { current_stage: newStageId });

    try {
      const { error } = await supabase
        .from('projects')
        .update({ current_stage: newStageId })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Project moved back to ${stages.find(s => s.id === newStageId)?.name}`,
      });
    } catch (error) {
      console.error('Error moving project back:', error);
      updateProjectInState(projectId, { current_stage: originalCurrentStage });
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
