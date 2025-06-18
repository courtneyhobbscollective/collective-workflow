import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canMoveToStageOne } from "../ProjectValidation";
import { CapacityChecker } from "../CapacityChecker";
import { BookingButton } from "../BookingButton";
import { ProjectValidation } from "../ProjectValidation";
import { ProjectContractSection } from "../ProjectContractSection";
import { ProjectPOSection } from "../ProjectPOSection";
import { ProjectStaffSection } from "../ProjectStaffSection";
import { ProjectCardActions } from "../ProjectCardActions";
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
  email?: string;
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
  stage_status?: string;
  picter_link?: string;
  internal_review_completed?: boolean;
  google_review_link?: string;
  client: Client;
  assigned_staff: Staff | null;
}

interface IncomingProjectCardMainProps {
  project: Project;
  staff: Staff[];
  stages: ProjectStage[];
  onAssignStaff: (projectId: string, staffId: string) => void;
  onUpdateContract: (projectId: string, signed: boolean) => void;
  onUpdatePoNumber: (projectId: string, poNumber: string) => void;
  onMoveProject: (projectId: string, newStageId: string) => void;
  onUpdateStatus: (projectId: string, status: string, picterLink?: string) => void;
  onBookingCreated?: () => void;
  onMoveProjectBack: (projectId: string, newStageId: string) => void;
}

export function IncomingProjectCardMain({
  project,
  staff,
  stages,
  onAssignStaff,
  onUpdateContract,
  onUpdatePoNumber,
  onMoveProject,
  onUpdateStatus,
  onBookingCreated = () => {},
  onMoveProjectBack
}: IncomingProjectCardMainProps) {
  const [hasCapacity, setHasCapacity] = useState(true);
  const [alternativeStaff, setAlternativeStaff] = useState<Staff[]>([]);

  const canProgress = canMoveToStageOne(project);

  const handleCapacityChange = (capacity: boolean, alternatives: Staff[]) => {
    setHasCapacity(capacity);
    setAlternativeStaff(alternatives);
  };

  return (
    <div className="space-y-4">
      {/* Priority Actions Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-900">Action Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Staff Assignment */}
          <ProjectStaffSection
            assignedStaffId={project.assigned_staff_id}
            staff={staff}
            onAssignStaff={(staffId) => onAssignStaff(project.id, staffId)}
          />

          {/* Capacity Check for assigned staff */}
          {project.assigned_staff_id && project.estimated_hours && (
            <CapacityChecker
              staffId={project.assigned_staff_id}
              projectHours={project.estimated_hours}
              onCapacityChange={handleCapacityChange}
              allStaff={staff}
            />
          )}

          {/* Calendar Booking */}
          {project.assigned_staff_id && hasCapacity && (
            <BookingButton
              project={{
                id: project.id,
                title: project.title,
                estimated_hours: project.estimated_hours,
                assigned_staff_id: project.assigned_staff_id,
                client: project.client
              }}
              staff={staff}
              onBookingCreated={onBookingCreated}
            />
          )}
        </CardContent>
      </Card>

      {/* Requirements Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-3">
            <ProjectContractSection
              contractSigned={project.contract_signed}
              currentStage={project.current_stage}
              onUpdateContract={(signed) => onUpdateContract(project.id, signed)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <ProjectPOSection
              poRequired={project.po_required}
              poNumber={project.po_number}
              currentStage={project.current_stage}
              projectId={project.id}
              onUpdatePoNumber={onUpdatePoNumber}
            />
          </CardContent>
        </Card>
      </div>

      {/* Validation and Actions */}
      <div className="space-y-3">
        <ProjectValidation project={project} />
        
        <ProjectCardActions
          currentStage={project.current_stage}
          stages={stages}
          canProgress={canProgress}
          onMoveProject={(newStageId) => onMoveProject(project.id, newStageId)}
          onMoveProjectBack={(newStageId) => onMoveProjectBack(project.id, newStageId)}
        />
      </div>
    </div>
  );
}
