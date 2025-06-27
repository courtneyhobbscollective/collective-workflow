import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProjectCardMain } from "./project-card/ProjectCardMain";
import { IncomingBriefCard } from "./IncomingBriefCard";
import type { Staff } from "@/types/staff";
import { ChevronDown } from "lucide-react";

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
  notes?: string;
  checklist?: string[];
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
  onMoveProjectBack: (projectId: string, newStageId: string) => void;
  reload?: () => void;
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
  onBookingCreated = () => {},
  onMoveProjectBack,
  reload
}: CollapsibleProjectCardProps) {
  // Use specialized incoming brief card for incoming stage
  if (project.current_stage === 'incoming') {
    return (
      <IncomingBriefCard
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
    );
  }

  // Use regular card for other stages
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={project.id} className="border rounded-lg bg-white group overflow-hidden">
        <AccordionTrigger className="hover:no-underline">
          <div className="relative">
            {/* Overlay for full-width hover effect, covers only the header */}
            <div className="absolute inset-0 rounded-t-lg pointer-events-none z-10 group-hover:bg-muted/50 group-data-[state=open]:bg-transparent transition-colors" />
            <div className="flex items-center justify-between w-full relative z-20" style={{ minHeight: '48px', padding: 0, margin: 0 }}>
              {/* Left: Main info */}
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                {/* Top row: due date, status */}
                <div className="flex items-center space-x-2 mb-1">
                  <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-semibold">
                    Due: {new Date(project.due_date).toLocaleDateString()}
                  </span>
                  {/* Status badge */}
                  {project.current_stage !== 'incoming' && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${project.stage_status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {project.stage_status ? project.stage_status.replace('_', ' ').toUpperCase() : 'IN PROGRESS'}
                    </span>
                  )}
                </div>
                {/* Client name */}
                <span className="text-xs font-medium text-muted-foreground">{project.client?.company || project.client?.name}</span>
                {/* Title */}
                <span className="font-medium text-sm">{project.title}</span>
                {/* Retainer/project label and estimated hours */}
                <div className="flex items-center space-x-2 mt-1">
                  {project.is_retainer ? (
                    <span className="text-xs font-medium text-green-700">Retainer</span>
                  ) : (
                    <span className="text-xs font-medium text-blue-700">Project</span>
                  )}
                  {project.estimated_hours && (
                    <span className="text-xs text-muted-foreground">Est. {project.estimated_hours}h</span>
                  )}
                </div>
              </div>
              {/* Right: Chevron and staff avatar flush right */}
              <div className="flex items-center space-x-0 flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                  <ChevronDown className="h-3 w-3 text-gray-600 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
                {project.assigned_staff && (
                  <img src={project.assigned_staff.profile_picture_url || ''} alt={project.assigned_staff.name} className="w-6 h-6 rounded-full border" />
                )}
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {(project.description || '').trim() && (
            <div className="mt-2">
              <label className="text-xs font-medium">Description:</label>
              <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                {(project.description || '').split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          <ProjectCardMain
            project={{
              ...project,
              notes: project.notes || "",
              checklist: Array.isArray(project.checklist)
                ? project.checklist.map(item =>
                    typeof item === 'string'
                      ? { label: item, completed: false }
                      : item
                  )
                : []
            }}
            staff={staff}
            stages={stages}
            onAssignStaff={onAssignStaff}
            onUpdateContract={onUpdateContract}
            onUpdatePoNumber={onUpdatePoNumber}
            onMoveProject={onMoveProject}
            onUpdateStatus={onUpdateStatus}
            onBookingCreated={onBookingCreated}
            onMoveProjectBack={onMoveProjectBack}
            reload={reload}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
