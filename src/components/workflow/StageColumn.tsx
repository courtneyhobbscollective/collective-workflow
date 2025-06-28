import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CollapsibleProjectCard } from "./CollapsibleProjectCard";
import type { Staff } from "@/types/staff";

interface ProjectStage {
  id: string;
  name: string;
  order_index: number;
  billing_percentage: number;
  description: string;
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

interface StageColumnProps {
  stage: ProjectStage;
  projects: Project[];
  staff: Staff[];
  stages: ProjectStage[];
  onAssignStaff: (projectId: string, staffId: string) => void;
  onUpdateContract: (projectId: string, signed: boolean) => void;
  onUpdatePoNumber: (projectId: string, poNumber: string) => void;
  onMoveProject: (projectId: string, newStageId: string) => void;
  onUpdateStatus: (projectId: string, status: string, picterLink?: string) => void;
  onBookingCreated?: () => void;
  isIncomingStage?: boolean;
  onMoveProjectBack: (projectId: string, newStageId: string) => void;
}

export function StageColumn({
  stage,
  projects,
  staff,
  stages,
  onAssignStaff,
  onUpdateContract,
  onUpdatePoNumber,
  onMoveProject,
  onUpdateStatus,
  onBookingCreated = () => {},
  isIncomingStage = false,
  onMoveProjectBack
}: StageColumnProps) {
  return (
    <Card className={`${isIncomingStage ? 'w-full' : 'min-w-[300px]'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{stage.name}</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {projects.length}
          </Badge>
        </div>
        {/* Only show description if not a production stage and not stage01 */}
        {!(isProductionStage(stage) || stage.id === 'stage01') && stage.description && (
          <p className="text-xs text-muted-foreground">{stage.description}</p>
        )}
        {stage.billing_percentage > 0 && false && (
          <Badge variant="outline" className="w-fit">
            {stage.billing_percentage}% Billing
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No projects in this stage
          </p>
        ) : (
          projects.map((project) => (
            <CollapsibleProjectCard
              key={project.id}
              project={project}
              staff={staff}
              stages={stages}
              onAssignStaff={onAssignStaff}
              onUpdateContract={onUpdateContract}
              onUpdatePoNumber={onUpdatePoNumber}
              onMoveProject={onMoveProject}
              onUpdateStatus={onUpdateStatus}
              onBookingCreated={onBookingCreated}
              onMoveProjectBack={onMoveProjectBack}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function isProductionStage(stage) {
  return ["stage02", "stage03", "stage04", "stage05", "stage06", "production"].includes(stage.id);
}