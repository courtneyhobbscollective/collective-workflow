import { useState, useEffect } from "react";
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
  estimated_shoot_hours?: number | null;
  estimated_edit_hours?: number | null;
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
  onUpdateStatus: (projectId: string, status: string, picterLink?: string, details?: { reason?: string; action?: string }) => void;
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
  reload,
  currentUser
}: ProjectCardMainProps & { currentUser?: { id: string; name: string; profile_picture_url?: string } }) {
  const [hasCapacity, setHasCapacity] = useState(true);
  const [alternativeStaff, setAlternativeStaff] = useState<Staff[]>([]);
  const [picterModalOpen, setPicterModalOpen] = useState(false);
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [checklist, setChecklist] = useState<{ label: string; completed: boolean }[]>(project.checklist || []);
  const [notes, setNotes] = useState(project.notes || "");
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [messages, setMessages] = useState<{ id: string; user_id: string; message: string; created_at: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const canProgress = canMoveToStageOne(project);

  const handleCapacityChange = (capacity: boolean, alternatives: Staff[]) => {
    setHasCapacity(capacity);
    setAlternativeStaff(alternatives);
  };

  const handleStatusChange = (newStatus: string, details?: { reason?: string; action?: string }) => {
    if (newStatus === "ready_for_internal_review") {
      setPicterModalOpen(true);
    } else if (newStatus === "close_project") {
      setClosureModalOpen(true);
    } else {
      onUpdateStatus(project.id, newStatus, undefined, details);
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
    await saveProjectDetails(project.description || '', updated);
  };

  const handleChecklistLabelChange = async (idx: number, label: string) => {
    const updated = checklist.map((item, i) => i === idx ? { ...item, label } : item);
    setChecklist(updated);
    await saveProjectDetails(project.description || '', updated);
  };

  const handleAddChecklistItem = async () => {
    const updated = [...checklist, { label: '', completed: false }];
    setChecklist(updated);
    await saveProjectDetails(project.description || '', updated);
  };

  const handleRemoveChecklistItem = async (idx: number) => {
    const updated = checklist.filter((_, i) => i !== idx);
    setChecklist(updated);
    await saveProjectDetails(project.description || '', updated);
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
    const lines = (project.description || '').split('\n').map(line => line.trim()).filter(line => line !== '');
    const newChecklist = lines.map(line => ({ label: line, completed: false }));
    setChecklist(newChecklist);
    await saveProjectDetails(project.description || '', newChecklist);
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

  // Fetch messages for this project
  useEffect(() => {
    async function fetchMessages() {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('project_notes')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });
      if (!error && data) setMessages(data);
      setLoadingMessages(false);
    }
    fetchMessages();
  }, [project.id]);

  async function handleSendMessage() {
    if (!newMessage.trim() || !currentUser) return;
    setSending(true);
    const optimisticMsg = {
      id: Math.random().toString(36),
      user_id: currentUser.id,
      message: newMessage,
      created_at: new Date().toISOString()
    };
    setMessages(msgs => [...msgs, optimisticMsg]);
    setNewMessage("");
    const { error } = await supabase.from('project_notes').insert({
      project_id: project.id,
      user_id: currentUser.id,
      message: optimisticMsg.message
    });
    if (!error) {
      // Refetch to get canonical order/ids
      const { data } = await supabase
        .from('project_notes')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    }
    setSending(false);
  }

  if (isProductionStage) {
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
                  estimated_shoot_hours: project.estimated_shoot_hours ?? null,
                  estimated_edit_hours: project.estimated_edit_hours ?? null,
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
            <CardContent className="p-3 flex flex-col space-y-2">
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

  return (
    <>
      <div className={isProductionStage ? "space-y-2 p-0" : "space-y-2 p-4"}>
        {isProductionStage && (project.description || '').trim() && (
          <div className="mt-2">
            <label className="text-xs font-medium">Description:</label>
            <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
              {(project.description || '').split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {isProductionStage && canConvertDescriptionToTasks && (
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
        {/* Staff Message Chain */}
        <div className="my-4">
          <label className="text-xs font-medium mb-1 block">Staff Message Chain:</label>
          <div className="border rounded bg-muted p-2 max-h-40 overflow-y-auto space-y-2 mb-2">
            {loadingMessages ? (
              <div className="text-xs text-muted-foreground">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-xs text-muted-foreground">No messages yet.</div>
            ) : (
              messages.map(msg => {
                const user = staff.find(s => s.id === msg.user_id) || currentUser;
                return (
                  <div key={msg.id} className="flex items-start space-x-2">
                    <img src={user?.profile_picture_url || ''} alt={user?.name} className="w-6 h-6 rounded-full border" />
                    <div>
                      <div className="text-xs font-semibold">{user?.name || 'User'}</div>
                      <div className="text-xs bg-white rounded px-2 py-1 shadow-sm">{msg.message}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Input
              className="text-xs flex-1"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Leave a message for your team..."
              disabled={sending}
              onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
            />
            <Button
              variant="default"
              size="sm"
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
            >
              Send
            </Button>
          </div>
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
              estimated_shoot_hours: project.estimated_shoot_hours ?? null,
              estimated_edit_hours: project.estimated_edit_hours ?? null,
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