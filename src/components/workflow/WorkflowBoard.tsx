
import { StageColumn } from "./StageColumn";
import { ChaseUpAlerts } from "./ChaseUpAlerts";
import { useWorkflowData } from "@/hooks/useWorkflowData";
import { useProjectOperations } from "@/utils/projectOperations";
import { useToast } from "@/hooks/use-toast";

export function WorkflowBoard() {
  const { projects, stages, staff, loading, loadData } = useWorkflowData();
  const { 
    assignStaff, 
    updateContractStatus, 
    updatePoNumber, 
    updateProjectStatus, 
    moveProject 
  } = useProjectOperations(loadData, stages);
  const { toast } = useToast();

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

  const handleUpdateProjectStatus = (projectId: string, status: string, picterLink?: string) => {
    updateProjectStatus(projectId, status, picterLink, projects);
  };

  const handleMoveProject = (projectId: string, newStageId: string) => {
    moveProject(projectId, newStageId, projects);
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

      <ChaseUpAlerts />

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto">
        {stages?.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            projects={getProjectsForStage(stage.id)}
            staff={staff}
            stages={stages}
            onAssignStaff={assignStaff}
            onUpdateContract={updateContractStatus}
            onUpdatePoNumber={updatePoNumber}
            onMoveProject={handleMoveProject}
            onUpdateStatus={handleUpdateProjectStatus}
            onBookingCreated={handleBookingCreated}
          />
        )) || (
          <div className="col-span-7 text-center text-muted-foreground">
            No workflow stages configured
          </div>
        )}
      </div>
    </div>
  );
}
