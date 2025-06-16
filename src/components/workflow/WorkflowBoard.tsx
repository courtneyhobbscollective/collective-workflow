import { useState } from "react";
import { StageColumn } from "./StageColumn";
import { ChaseUpAlerts } from "./ChaseUpAlerts";
import { WorkflowHeader } from "./WorkflowHeader";
import { useWorkflowData } from "@/hooks/useWorkflowData";
import { useProjectOperations } from "@/utils/projectOperations";
import { useToast } from "@/hooks/use-toast";

export function WorkflowBoard() {
  const { projects, setProjects, stages, staff, loading, loadData } = useWorkflowData();
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const { 
    assignStaff, 
    updateContractStatus, 
    updatePoNumber, 
    updateProjectStatus, 
    moveProject,
    moveProjectBack
  } = useProjectOperations(stages, projects, setProjects); // Pass projects and setProjects
  const { toast } = useToast();

  const handleBookingCreated = () => {
    loadData(); // Still need to reload for new bookings as they are not part of project state
    toast({
      title: "Success",
      description: "Calendar booking created successfully",
    });
  };

  const getFilteredProjects = (stageId: string) => {
    const stageProjects = projects.filter(project => project.current_stage === stageId);
    
    if (selectedStaff === "all") {
      return stageProjects;
    }
    
    return stageProjects.filter(project => project.assigned_staff_id === selectedStaff);
  };

  const handleUpdateProjectStatus = (projectId: string, status: string, picterLink?: string) => {
    updateProjectStatus(projectId, status, picterLink); // projects param removed
  };

  const handleMoveProject = (projectId: string, newStageId: string) => {
    moveProject(projectId, newStageId); // projects param removed
  };

  const handleMoveProjectBack = (projectId: string, newStageId: string) => {
    moveProjectBack(projectId, newStageId);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  // Find incoming stage and other stages
  const incomingStage = stages?.find(stage => stage.id === 'incoming');
  const otherStages = stages?.filter(stage => stage.id !== 'incoming') || [];

  return (
    <div className="space-y-6">
      <WorkflowHeader
        staff={staff}
        selectedStaff={selectedStaff}
        onStaffChange={setSelectedStaff}
      />

      <ChaseUpAlerts />

      {/* Incoming Briefs - Full Width Row */}
      {incomingStage && (
        <div className="mb-6">
          <StageColumn
            stage={incomingStage}
            projects={getFilteredProjects(incomingStage.id)}
            staff={staff}
            stages={stages}
            onAssignStaff={assignStaff}
            onUpdateContract={updateContractStatus}
            onUpdatePoNumber={updatePoNumber}
            onMoveProject={handleMoveProject}
            onUpdateStatus={handleUpdateProjectStatus}
            onBookingCreated={handleBookingCreated}
            isIncomingStage={true}
            onMoveProjectBack={handleMoveProjectBack}
          />
        </div>
      )}

      {/* Other Stages - 2 Column Grid */}
      {otherStages.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {otherStages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              projects={getFilteredProjects(stage.id)}
              staff={staff}
              stages={stages}
              onAssignStaff={assignStaff}
              onUpdateContract={updateContractStatus}
              onUpdatePoNumber={updatePoNumber}
              onMoveProject={handleMoveProject}
              onUpdateStatus={handleUpdateProjectStatus}
              onBookingCreated={handleBookingCreated}
              onMoveProjectBack={handleMoveProjectBack}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          No workflow stages configured
        </div>
      )}
    </div>
  );
}