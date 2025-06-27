import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, FileText, Calendar } from "lucide-react";
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
  onUpdateStatus: (projectId: string, status: string, picterLink?: string) => void;
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

  const handleStatusChange = (newStatus: string) => {
    onUpdateStatus(project.id, newStatus);
  };

  const handleEmailClient = (emailData: { subject: string; body: string; to: string }) => {
    const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.open(mailtoLink);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={project.id} className="border rounded-lg bg-white shadow-sm">
        {/* This div now acts as the header, containing both the AccordionTrigger and the Popover */}
        <div className="flex items-center justify-between w-full px-4 py-4 hover:bg-muted/50 transition-colors">
          {/* AccordionTrigger now only contains the content that expands/collapses the accordion */}
          <AccordionTrigger className="flex-1 text-left hover:no-underline p-0">
            <div className="flex flex-col items-start text-left space-y-2">
              {/* Client name above title, no color badge */}
              <span className="mb-1 text-xs font-medium text-muted-foreground">
                {project.client?.company || project.client?.name}
              </span>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-base">{project.title}</h3>
              </div>
              {/* Retainer/Project as plain text, not a badge */}
              <div className="flex space-x-1">
                {project.is_retainer ? (
                  <span className="text-xs font-medium text-green-700">Retainer</span>
                ) : (
                  <span className="text-xs font-medium text-blue-700">Project</span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                    {dueDate.toLocaleDateString()}
                  </span>
                </div>
                {project.estimated_hours && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{project.estimated_hours}h</span>
                  </div>
                )}
              </div>
            </div>
          </AccordionTrigger>

          {/* This div contains the assigned staff and the status badge, now outside the AccordionTrigger */}
          <div className="flex items-center space-x-2 ml-4">
            {assignedStaff ? (
              <div className="flex items-center space-x-2 bg-blue-50 px-2 py-1 rounded">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={assignedStaff.profile_picture_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {assignedStaff.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{assignedStaff.name}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-orange-600 bg-orange-50 px-2 py-1 rounded">
                <User className="w-4 h-4" />
                <span className="text-xs font-medium">Unassigned</span>
              </div>
            )}
            {/* Project Status Section - Moved here */}
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
        </div>
        
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4">
            {/* Project Overview Card */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Project Details</h4>
                    <div className="space-y-1 text-xs">
                      <div><span className="font-medium">Work Type:</span> {project.work_type}</div>
                      <div><span className="font-medium">Deliverables:</span> {project.deliverables}</div>
                      {project.po_number && (
                        <div><span className="font-medium">PO Number:</span> {project.po_number}</div>
                      )}
                    </div>
                  </div>
                  
                  {project.description && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Description</h4>
                      <p className="text-xs text-muted-foreground">{project.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Main Project Card Content - Fixed the prop passing */}
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
