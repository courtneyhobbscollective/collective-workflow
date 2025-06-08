
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProjectCardMain } from "./project-card/ProjectCardMain";
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

interface CollapsibleProjectCardProps {
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

export function CollapsibleProjectCard({
  project,
  staff,
  stages,
  onAssignStaff,
  onUpdateContract,
  onUpdatePoNumber,
  onMoveProject,
  onUpdateStatus,
  onBookingCreated = () => {}
}: CollapsibleProjectCardProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={project.id} className="border rounded-lg bg-white">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex flex-col items-start text-left">
            <span className="font-medium text-sm">{project.title}</span>
            <span className="text-xs text-muted-foreground">{project.client?.company || project.client?.name}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <ProjectCardMain
            project={project}
            staff={staff}
            stages={stages}
            onAssignStaff={onAssignStaff}
            onUpdateContract={onUpdateContract}
            onUpdatePoNumber={onUpdatePoNumber}
            onMoveProject={onMoveProject}
            onUpdateStatus={onUpdateStatus}
            onBookingCreated={onBookingCreated}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
