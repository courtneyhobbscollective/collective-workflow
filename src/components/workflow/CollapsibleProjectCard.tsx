import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProjectCardMain } from "./project-card/ProjectCardMain";
import { IncomingBriefCard } from "./IncomingBriefCard";
import type { Staff } from "@/types/staff";
import { ChevronDown, Calendar, Clock, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  reload,
  isManagement = true // Assume management for now
}: CollapsibleProjectCardProps & { isManagement?: boolean }) {
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

  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(project.assigned_staff_id || "");
  const [reassignLoading, setReassignLoading] = useState(false);
  const [capacityInfo, setCapacityInfo] = useState<any>(null);

  // Fetch available hours for the assigned staff (simplified CapacityChecker logic)
  async function fetchCapacityInfo() {
    if (!project.assigned_staff_id) return;
    setCapacityInfo(null);
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    const { data: bookings } = await supabase
      .from('project_bookings')
      .select('*')
      .eq('staff_id', project.assigned_staff_id)
      .gte('booking_date', today.toISOString().slice(0,10))
      .lte('booking_date', weekFromNow.toISOString().slice(0,10));
    const standardDailyHours = 7;
    let totalWeeklyAvailable = 0;
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      const dateStr = currentDate.toISOString().slice(0,10);
      const dayBookings = bookings?.filter(b => b.booking_date === dateStr) || [];
      const bookedHours = dayBookings.reduce((total, b) => total + b.hours_booked, 0);
      const totalAvailable = Math.max(0, standardDailyHours - bookedHours);
      totalWeeklyAvailable += totalAvailable;
    }
    setCapacityInfo({ weeklyAvailable: totalWeeklyAvailable });
  }

  async function handleReassign() {
    if (!selectedStaffId || selectedStaffId === project.assigned_staff_id) return;
    setReassignLoading(true);
    await supabase.from('projects').update({ assigned_staff_id: selectedStaffId }).eq('id', project.id);
    setReassignLoading(false);
    setShowStaffDialog(false);
    if (reload) reload();
  }

  // Use regular card for other stages
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={project.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <AccordionTrigger hideChevron className="flex items-center w-full px-4 py-4 hover:bg-muted/50 transition-colors group no-underline hover:no-underline focus:no-underline">
          <div className="flex flex-1 w-full">
            {/* Left: main info */}
            <div className="flex flex-col flex-1">
              {/* First row: client org badge + status badge */}
              <div className="flex items-center w-full mb-1">
                <div className="flex items-center space-x-2 flex-1">
                  <span className="bg-blue-100 text-blue-800 border border-blue-300 font-normal text-xs px-2 py-0.5 rounded-full">{project.client?.company || project.client?.name}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <span className={`cursor-pointer font-normal text-xs px-3 py-1 rounded-full border ${
                        (project.stage_status || '').toLowerCase() === 'in progress' || (project.stage_status || '').toLowerCase() === 'in_progress'
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {project.stage_status ? project.stage_status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'In Progress'}
                      </span>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0">
                      {/* You may want to use StatusSelector here if available, as in IncomingBriefCard */}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* Second row: project title */}
              <h3 className="font-semibold text-sm mb-1 text-left w-full">{project.title}</h3>
              {/* Third row: due date, estimated hours, retainer/project badge */}
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
                <span className="inline-flex items-center"><Calendar className="w-3 h-3 mr-1" />{new Date(project.due_date).toLocaleDateString()}</span>
                {project.estimated_hours && (
                  <span className="inline-flex items-center"><Clock className="w-3 h-3 mr-1" />{project.estimated_hours}h</span>
                )}
                {project.is_retainer ? (
                  <span className="bg-green-100 text-green-800 border border-green-300 font-normal text-xs px-2 py-0.5 rounded">Retainer</span>
                ) : (
                  <span className="bg-blue-100 text-blue-800 border border-blue-300 font-normal text-xs px-2 py-0.5 rounded">Project</span>
                )}
              </div>
            </div>
            {/* Right: avatar and chevron stacked */}
            <div className="flex flex-col items-end justify-between ml-4 h-full py-1">
              {/* Avatar at the top, same size as chevron bg */}
              <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
                <DialogTrigger asChild>
                  {project.assigned_staff ? (
                    <img src={project.assigned_staff.profile_picture_url || ''} alt={project.assigned_staff.name} className="w-8 h-8 rounded-full border mb-2 cursor-pointer" onClick={fetchCapacityInfo} />
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border mb-2 bg-gray-100 text-orange-600 cursor-pointer" onClick={fetchCapacityInfo}>
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Staff Assignment</DialogTitle>
                    <DialogDescription>View current staff and reassign if needed.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      {project.assigned_staff && (
                        <img src={project.assigned_staff.profile_picture_url || ''} alt={project.assigned_staff.name} className="w-10 h-10 rounded-full border" />
                      )}
                      <div>
                        <div className="font-medium">{project.assigned_staff?.name}</div>
                        <div className="text-xs text-muted-foreground">{project.assigned_staff?.email}</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-xs mb-1">Available Hours (This Week):</div>
                      <div className="text-sm">{capacityInfo ? `${capacityInfo.weeklyAvailable}h` : '...'}</div>
                    </div>
                    {isManagement && (
                      <div className="space-y-2">
                        <div className="font-medium text-xs mb-1">Reassign to:</div>
                        <select
                          className="w-full border rounded p-2"
                          value={selectedStaffId}
                          onChange={e => setSelectedStaffId(e.target.value)}
                        >
                          {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <DialogFooter>
                          <Button
                            variant="default"
                            size="default"
                            onClick={handleReassign}
                            disabled={reassignLoading || selectedStaffId === project.assigned_staff_id}
                          >
                            {reassignLoading ? 'Reassigning...' : 'Confirm Reassignment'}
                          </Button>
                        </DialogFooter>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              {/* Chevron at the bottom */}
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover:bg-accent transition-colors mt-auto">
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              </span>
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
