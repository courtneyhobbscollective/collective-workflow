import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canMoveToStageOne } from "../ProjectValidation";
import { CapacityChecker } from "../CapacityChecker";
import { BookingButton } from "../BookingButton";
import { StatusSelector } from "../StatusSelector";
import { PicterLinkModal } from "../PicterLinkModal";
import { ProjectClosureModal } from "../ProjectClosureModal";
import { ProjectValidation } from "../ProjectValidation";
import { ProjectCardHeader } from "../ProjectCardHeader";
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

interface ProjectCardMainProps {
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

export function ProjectCardMain({
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
}: ProjectCardMainProps) {
  const [hasCapacity, setHasCapacity] = useState(true);
  const [alternativeStaff, setAlternativeStaff] = useState<Staff[]>([]);
  const [picterModalOpen, setPicterModalOpen] = useState(false);
  const [closureModalOpen, setClosureModalOpen] = useState(false);

  const canProgress = canMoveToStageOne(project);

  const handleCapacityChange = (capacity: boolean, alternatives: Staff[]) => {
    setHasCapacity(capacity);
    setAlternativeStaff(alternatives);
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "ready_for_internal_review") {
      setPicterModalOpen(true);
    } else if (newStatus === "close_project") {
      setClosureModalOpen(true);
    } else {
      onUpdateStatus(project.id, newStatus);
    }
  };

  const handlePicterSubmit = (picterLink: string) => {
    onUpdateStatus(project.id, "ready_for_internal_review", picterLink);
  };

  const handleProjectClosure = () => {
    onUpdateStatus(project.id, "closed");
  };

  const handleEmailClient = (emailData: { subject: string; body: string; to: string }) => {
    const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.open(mailtoLink);
    
    // Update status to sent_to_client
    onUpdateStatus(project.id, "sent_to_client");
  };

  return (
    <>
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{project.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <ProjectCardHeader
              title={project.title}
              client={project.client}
              workType={project.work_type}
              dueDate={project.due_date}
              isRetainer={project.is_retainer}
            />

            <ProjectContractSection
              contractSigned={project.contract_signed}
              currentStage={project.current_stage}
              onUpdateContract={(signed) => onUpdateContract(project.id, signed)}
            />

            <ProjectPOSection
              poRequired={project.po_required}
              poNumber={project.po_number}
              currentStage={project.current_stage}
              projectId={project.id}
              onUpdatePoNumber={onUpdatePoNumber}
            />

            <ProjectStaffSection
              assignedStaffId={project.assigned_staff_id}
              staff={staff}
              onAssignStaff={(staffId) => onAssignStaff(project.id, staffId)}
            />

            {/* Capacity Checker for assigned staff */}
            {project.assigned_staff_id && project.estimated_hours && project.current_stage === 'incoming' && (
              <CapacityChecker
                staffId={project.assigned_staff_id}
                projectHours={project.estimated_hours}
                onCapacityChange={handleCapacityChange}
                allStaff={staff}
              />
            )}

            {project.estimated_hours && (
              <p className="text-xs">Est. Hours: {project.estimated_hours}</p>
            )}

            {/* Stage Status Selector */}
            {project.current_stage !== 'incoming' && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Status:</label>
                <StatusSelector
                  currentStage={project.current_stage}
                  currentStatus={project.stage_status || 'in_progress'}
                  internalReviewCompleted={project.internal_review_completed || false}
                  picterLink={project.picter_link}
                  onStatusChange={handleStatusChange}
                  onEmailClient={handleEmailClient}
                  project={project}
                />
              </div>
            )}

            <ProjectValidation project={project} />

            {/* Calendar Booking Button for incoming projects with assigned staff */}
            {project.current_stage === 'incoming' && project.assigned_staff_id && hasCapacity && (
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

            <ProjectCardActions
              currentStage={project.current_stage}
              stages={stages}
              canProgress={canProgress}
              onMoveProject={(newStageId) => onMoveProject(project.id, newStageId)}
              onMoveProjectBack={(newStageId) => onMoveProjectBack(project.id, newStageId)}
            />
          </div>
        </CardContent>
      </Card>

      <PicterLinkModal
        isOpen={picterModalOpen}
        onClose={() => setPicterModalOpen(false)}
        onSubmit={handlePicterSubmit}
        currentLink={project.picter_link}
      />

      <ProjectClosureModal
        isOpen={closureModalOpen}
        onClose={() => setClosureModalOpen(false)}
        onComplete={handleProjectClosure}
        projectId={project.id}
      />
    </>
  );
}