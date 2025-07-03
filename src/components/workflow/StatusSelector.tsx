import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useChaseUpAlerts } from "@/hooks/useChaseUpAlerts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface StatusSelectorProps {
  currentStage: string;
  currentStatus: string;
  internalReviewCompleted: boolean;
  picterLink?: string;
  onStatusChange: (status: string) => void;
  onEmailClient: (emailData: { subject: string; body: string; to: string }) => void;
  project: {
    id: string;
    title: string;
    client: {
      name: string;
      email?: string;
    };
  };
}

const getStatusOptions = (stage: string) => {
  return [
    "on_hold",
    "in_progress",
    "shoot_booked",
    "edit_booked",
    "waiting_for_client_sign_off"
  ];
};

export const formatStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    in_progress: "In Progress",
    on_hold: "On Hold",
    shoot_booked: "Shoot Booked",
    edit_booked: "Edit Booked",
    waiting_for_client_sign_off: "Waiting for Client sign off"
  };
  return labels[status] || status;
};

export function StatusSelector({
  currentStage,
  currentStatus,
  internalReviewCompleted,
  picterLink,
  onStatusChange,
  onEmailClient,
  project
}: StatusSelectorProps) {
  const statusOptions = getStatusOptions(currentStage);
  const { createChaseUpAlert } = useChaseUpAlerts();
  const [showOnHoldModal, setShowOnHoldModal] = useState(false);
  const [onHoldReason, setOnHoldReason] = useState("");
  const [onHoldAction, setOnHoldAction] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const handleStatusSelect = (status: string) => {
    if (status === "on_hold") {
      setPendingStatus(status);
      setShowOnHoldModal(true);
    } else {
      onStatusChange(status);
    }
  };

  const handleOnHoldSubmit = () => {
    setShowOnHoldModal(false);
    if (pendingStatus) {
      onStatusChange(pendingStatus, { reason: onHoldReason, action: onHoldAction });
      setOnHoldReason("");
      setOnHoldAction("");
      setPendingStatus(null);
    }
  };

  const getEmailContent = (stage: string) => {
    const clientName = project.client.name;
    const projectTitle = project.title;
    
    if (stage === "stage03") {
      return {
        subject: `Your ${projectTitle} is ready for review 🎉`,
        body: `Hey, ${clientName}\n\nWe're so excited to share with you the first of two rounds of amends of your ${projectTitle}. You can find your asset(s) here: ${picterLink}\n\nPlease leave any and all feedback within Picter using the timestamp tool within the next 3 working days. This will help us keep your project time efficient.\n\nThanks so much`
      };
    } else if (stage === "stage04") {
      return {
        subject: `Your ${projectTitle} is ready for review 🎉`,
        body: `Hey, ${clientName}\n\nWe're so excited to share with you the second of your two rounds of amends of your ${projectTitle}. You can find your asset(s) here: ${picterLink}\n\nPlease leave any and all feedback within Picter using the timestamp tool within the next 3 working days. This will help us keep your project time efficient.\n\nThanks so much`
      };
    } else if (stage === "stage05") {
      return {
        subject: `Your ${projectTitle} - final delivery 🎯`,
        body: `Hey, ${clientName}\n\nWe're so excited to share with you the final version of your ${projectTitle}. You can find your asset(s) here: ${picterLink}\n\nPlease note all of our projects come with 2 rounds of amends as standard. If you need more please don't hesitate to contact us.\n\nThanks so much`
      };
    }
    
    return { subject: "", body: "" };
  };

  const handleEmailClient = async () => {
    const emailContent = getEmailContent(currentStage);
    onEmailClient({
      ...emailContent,
      to: project.client.email || ""
    });
    
    // Create chase-up alert when email is sent
    await createChaseUpAlert(project.id);

    // Update status to sent_to_client after opening the email client
    onStatusChange("sent_to_client");
  };

  const canSelectReadyToSend = internalReviewCompleted && picterLink;
  
  return (
    <div className="space-y-2">
      <Select 
        value={currentStatus} 
        onValueChange={handleStatusSelect}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((status) => (
            <SelectItem 
              key={status} 
              value={status}
              disabled={status === "ready_to_send_client" && !canSelectReadyToSend}
            >
              {formatStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {currentStatus === "ready_to_send_client" && picterLink && project.client.email && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={handleEmailClient}
        >
          <Mail className="w-3 h-3 mr-1" />
          Email Client
        </Button>
      )}
      <Dialog open={showOnHoldModal} onOpenChange={setShowOnHoldModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Put Brief On Hold</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reason for putting on hold</label>
              <Textarea
                value={onHoldReason}
                onChange={e => setOnHoldReason(e.target.value)}
                placeholder="Describe why this brief is being put on hold..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Action plan to get back on track</label>
              <Textarea
                value={onHoldAction}
                onChange={e => setOnHoldAction(e.target.value)}
                placeholder="Describe what needs to happen to resume progress..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleOnHoldSubmit} disabled={!onHoldReason.trim()}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}