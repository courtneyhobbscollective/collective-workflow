import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useChaseUpAlerts } from "@/hooks/useChaseUpAlerts";

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
  const baseOptions = ["in_progress", "on_hold"];
  
  if (["stage03", "stage04", "stage05"].includes(stage)) {
    return [...baseOptions, "ready_for_internal_review", "ready_to_send_client", "sent_to_client"];
  }
  
  if (stage === "stage06") {
    return [...baseOptions, "ready_for_internal_review", "ready_to_send_client", "close_project"];
  }
  
  return baseOptions;
};

export const formatStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    in_progress: "In Progress",
    on_hold: "On Hold",
    ready_for_internal_review: "Ready for Internal Review",
    ready_to_send_client: "Ready to be Sent to Client",
    sent_to_client: "Sent to Client",
    close_project: "Close Down This Project"
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
        onValueChange={onStatusChange}
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
    </div>
  );
}