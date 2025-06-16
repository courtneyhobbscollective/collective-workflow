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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { StatusSelector, formatStatusLabel } from "../StatusSelector"; // Import formatStatusLabel
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
  onBookingCreated = () => {}
}: IncomingProjectCardMainProps) {
  const [hasCapacity, setHasCapacity] = useState(true);
  const [alternativeStaff, setAlternativeStaff] = useState<Staff[]>([]);
  const [picterModalOpen, setPicterModalOpen] = useState(false); // Not used in IncomingProjectCardMain, but kept for consistency if needed
  const [closureModalOpen, setClosureModalOpen] = useState(false); // Not used in IncomingProjectCardMain, but kept for consistency if needed

  const canProgress = canMoveToStageOne(project);

  const handleCapacityChange = (capacity: boolean, alternatives: Staff[]) => {
    setHasCapacity(capacity);
    setAlternativeStaff(alternatives);
  };

  const handleStatusChange = (newStatus: string) => {
    // For incoming briefs, we only expect 'in_progress' or 'on_hold'
    // No picter link or closure logic needed here
    onUpdateStatus(project.id, newStatus);
  };

  const handleEmailClient = (emailData: { subject: string; body: string; to: string }) => {
    const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.open(mailtoLink);
    // No status update to 'sent_to_client' for incoming briefs
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

      {/* Project Status Section */}
      <Card>
        <CardContent className="p-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Project Status:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Badge 
                  className={`cursor-pointer ${getStatusColor(project.stage_status || 'in_progress')}`}
                >
                  {formatStatusLabel(project.stage_status || 'in_progress')}
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0">
                <StatusSelector
                  currentStage={project.current_stage}
                  currentStatus={project.stage_status || 'in_progress'}
                  internalReviewCompleted={project.internal_review_completed || false}
                  picterLink={project.picter_link}
                  onStatusChange={handleStatusChange}
                  onEmailClient={handleEmailClient}
                  project={project}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Validation and Actions */}
      <div className="space-y-3">
        <ProjectValidation project={project} />
        
        <ProjectCardActions
          currentStage={project.current_stage}
          stages={stages}
          canProgress={canProgress}
          onMoveProject={(newStageId) => onMoveProject(project.id, newStageId)}
        />
      </div>
    </div>
  );
}