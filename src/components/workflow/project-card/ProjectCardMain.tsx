import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canMoveToStageOne } from "../ProjectValidation";
import { CapacityChecker } from "../CapacityChecker";
import { BookingButton } from "../BookingButton";
import { StatusSelector, formatStatusLabel } from "../StatusSelector";
import { PicterLinkModal } from "../PicterLinkModal";
import { ProjectClosureModal } from "../ProjectClosureModal";
import { ProjectValidation } from "../ProjectValidation";
import { ProjectCardHeader } from "../ProjectCardHeader";
import { ProjectPOSection } from "../ProjectPOSection";
import { ProjectStaffSection } from "../ProjectStaffSection";
import { ProjectCardActions } from "../ProjectCardActions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, Edit2 } from "lucide-react"; // Import Link and Edit2 icons
import type { Staff } from "@/types/staff";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

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
  notes: string;
  checklist: { label: string; completed: boolean }[];
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
  reload: () => void;
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
  onMoveProjectBack,
  reload
}: ProjectCardMainProps) {
  const [hasCapacity, setHasCapacity] = useState(true);
  const [alternativeStaff, setAlternativeStaff] = useState<Staff[]>([]);
  const [picterModalOpen, setPicterModalOpen] = useState(false);
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [checklist, setChecklist] = useState<{ label: string; completed: boolean }[]>(project.checklist);
  const [notes, setNotes] = useState(project.notes);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'ready_for_internal_review': return 'bg-purple-100 text-purple-800';
      case 'ready_to_send_client': return 'bg-green-100 text-green-800';
      case 'sent_to_client': return 'bg-teal-100 text-teal-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleChecklistChange = async (idx: number, checked: boolean) => {
    const updated = checklist.map((item, i) => i === idx ? { ...item, completed: checked } : item);
    setChecklist(updated);
    await saveProjectDetails(project.description, updated);
  };

  const handleChecklistLabelChange = async (idx: number, label: string) => {
    const updated = checklist.map((item, i) => i === idx ? { ...item, label } : item);
    setChecklist(updated);
    await saveProjectDetails(project.description, updated);
  };

  const handleAddChecklistItem = async () => {
    const updated = [...checklist, { label: '', completed: false }];
    setChecklist(updated);
    await saveProjectDetails(project.description, updated);
  };

  const handleRemoveChecklistItem = async (idx: number) => {
    const updated = checklist.filter((_, i) => i !== idx);
    setChecklist(updated);
    await saveProjectDetails(project.description, updated);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    const { error } = await supabase.from('projects').update({ notes }).eq('id', project.id);
    setIsSavingNotes(false);
    if (!error && typeof reload === 'function') reload();
  };

  // Show convert button if not incoming, checklist is empty, and description is not empty
  const canConvertDescriptionToTasks = project.current_stage !== 'incoming' && checklist.length === 0 && (project.description || '').trim() !== '';

  const handleConvertDescriptionToTasks = async () => {
    if (!(project.description || '').trim()) return;
    setIsSaving(true);
    const lines = project.description.split('\n').map(line => line.trim()).filter(line => line !== '');
    const newChecklist = lines.map(line => ({ label: line, completed: false }));
    setChecklist(newChecklist);
    await saveProjectDetails(project.description, newChecklist);
    setIsSaving(false);
  };

  // Save checklist to Supabase
  const saveProjectDetails = async (desc: string, cl: { label: string; completed: boolean }[]) => {
    setIsSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({ description: desc, checklist: cl })
      .eq('id', project.id);
    setIsSaving(false);
    if (error) {
      // Optionally show error toast
    } else {
      if (typeof reload === 'function') reload();
    }
  };

  // Helper: isProductionStage
  const isProductionStage = ["stage02", "stage03", "stage04", "stage05", "stage06", "production"].includes(project.current_stage);

  return (
    <>
      <div className={isProductionStage ? "space-y-2 p-0" : "space-y-2 p-4"}>
        <div>
          <label className="text-xs font-medium">Checklist:</label>
          <ul className="space-y-1 mt-1">
            {checklist.map((item, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={e => handleChecklistChange(idx, e.target.checked)}
                  className="accent-blue-600"
                />
                <Input
                  className={`text-xs flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                  value={item.label}
                  onChange={e => handleChecklistLabelChange(idx, e.target.value)}
                  placeholder={`Task ${idx + 1}`}
                  disabled={isSaving}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => handleRemoveChecklistItem(idx)}
                  disabled={isSaving}
                  title="Remove"
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs"
            onClick={handleAddChecklistItem}
            disabled={isSaving}
          >
            + Add Task
          </Button>
        </div>
        {isProductionStage && (
          <div>
            <label className="text-xs font-medium">Staff Notes:</label>
            <Textarea
              className="w-full text-xs mt-1"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Leave a note for your team..."
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs"
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
            >
              Save Note
            </Button>
          </div>
        )}
        {project.assigned_staff_id && project.estimated_hours && project.current_stage === 'incoming' && (
          <CapacityChecker
            staffId={project.assigned_staff_id}
            projectHours={project.estimated_hours}
            onCapacityChange={handleCapacityChange}
            allStaff={staff}
          />
        )}
        {project.picter_link && (
          <div className="flex items-center space-x-1 text-xs text-blue-600">
            <Link className="w-3 h-3" />
            <a href={project.picter_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
              View Picter Link
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 ml-1"
              onClick={() => setPicterModalOpen(true)}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}
        <ProjectValidation project={project} />
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
        {canConvertDescriptionToTasks && (
          <Button
            variant="outline"
            size="sm"
            className="mb-2 text-xs"
            onClick={handleConvertDescriptionToTasks}
            disabled={isSaving}
          >
            Convert Description to Tasks
          </Button>
        )}
      </div>
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