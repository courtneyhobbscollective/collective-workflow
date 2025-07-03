import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, FileText, Calendar, ChevronDown } from "lucide-react";
import { IncomingProjectCardMain } from "./project-card/IncomingProjectCardMain";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusSelector, formatStatusLabel } from "./StatusSelector";
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

interface IncomingBriefCardProps {
  project: Project;
  staff: Staff[];
  stages: ProjectStage[];
  onAssignStaff: (projectId: string, staffId: string) => void;
  onUpdateContract: (projectId: string, signed: boolean) => void;
  onUpdatePoNumber: (projectId: string, poNumber: string) => void;
  onMoveProject: (projectId: string, newStageId: string) => void;
  onUpdateStatus: (projectId: string, status: string, picterLink?: string, details?: { reason?: string; action?: string }) => void;
  onBookingCreated?: () => void;
  onMoveProjectBack: (projectId: string, newStageId: string) => void;
}

export function IncomingBriefCard({
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
}: IncomingBriefCardProps) {
  const assignedStaff = staff.find(s => s.id === project.assigned_staff_id);
  const dueDate = new Date(project.due_date);
  const isOverdue = dueDate < new Date();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (newStatus: string, details?: { reason?: string; action?: string }) => {
    onUpdateStatus(project.id, newStatus, undefined, details);
  };

  const handleEmailClient = (emailData: { subject: string; body: string; to: string }) => {
    const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.open(mailtoLink);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={project.id} className="border rounded-lg bg-white shadow-sm">
        <div className="flex w-full px-4 py-4 hover:bg-muted/50 transition-colors group items-center">
          {/* Left: AccordionTrigger fills all space except right controls */}
          <div className="flex-1 min-w-0">
            <AccordionTrigger hideChevron className="w-full h-full block no-underline hover:no-underline focus:no-underline select-none p-0 m-0">
              <div className="flex flex-col min-w-0 w-full gap-1">
                <div className="flex items-center">
                  {project.client?.company || project.client?.name ? (
                    <Badge className="bg-blue-100 text-blue-800 border border-blue-300 font-normal px-3 py-1 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis">
                      {project.client?.company || project.client?.name}
                    </Badge>
                  ) : null}
                </div>
                <h3 className="font-semibold text-base text-left truncate" style={{maxWidth: '100%'}}>{project.title}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  <Calendar className="w-3 h-3" />
                  <span className={isOverdue ? "text-red-600 font-medium" : ""}>{dueDate.toLocaleDateString()}</span>
                  {project.estimated_hours && (
                    <>
                      <Clock className="w-3 h-3" />
                      <span>{project.estimated_hours}h</span>
                    </>
                  )}
                  {project.is_retainer ? (
                    <Badge className="bg-green-100 text-green-800 border border-green-300 font-normal">Retainer</Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 border border-blue-300 font-normal">Project</Badge>
                  )}
                </div>
              </div>
            </AccordionTrigger>
          </div>
          {/* Right-side controls, always right-aligned */}
          <div className="flex items-center flex-shrink-0 ml-2 space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-status-badge
                  className={
                    getStatusColor(project.stage_status || 'in_progress') +
                    ' cursor-pointer rounded-full px-3 py-1 text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }
                  style={{ zIndex: 9999, position: 'relative' }}
                  onClick={e => e.stopPropagation()}
                >
                  {formatStatusLabel(project.stage_status || 'in_progress')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" style={{ zIndex: 99999, position: 'relative' }}>
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
            {assignedStaff ? (
              <Avatar className="w-6 h-6 avatar" onClick={e => e.stopPropagation()}>
                <AvatarImage src={assignedStaff.profile_picture_url || undefined} />
                <AvatarFallback className="text-xs">
                  {assignedStaff.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex items-center text-orange-600">
                <User className="w-4 h-4" />
              </div>
            )}
            {/* Chevron in a circle at the far right */}
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover:bg-accent transition-colors chevron-down" onClick={e => e.stopPropagation()}>
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </span>
          </div>
        </div>
        
        <AccordionContent className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Project Details and Description */}
            <div className="space-y-4 h-full">
              <Card className="bg-gray-50 h-full">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2">Project Details</h4>
                  <div className="space-y-1 text-xs">
                    <div><span className="font-medium">Work Type:</span> {project.work_type}</div>
                    <div><span className="font-medium">Deliverables:</span> {project.deliverables}</div>
                    {project.po_number && (
                      <div><span className="font-medium">PO Number:</span> {project.po_number}</div>
                    )}
                  </div>
                  {project.description && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">Description</h4>
                      <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                        {(project.description || '').split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Right: Action Required */}
            <div className="h-full">
              <IncomingProjectCardMain
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
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
