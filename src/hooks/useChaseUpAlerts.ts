
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChaseUpAlert {
  id: string;
  project_id: string;
  email_sent_at: string;
  chase_up_due_at: string;
  is_dismissed: boolean;
  chase_count: number;
  last_chase_at: string | null;
  dismissed_at: string | null;
  dismissed_by: string | null;
  created_at: string;
  updated_at: string;
  project: {
    id: string;
    title: string;
    client: {
      name: string;
      email?: string;
    };
  };
}

export function useChaseUpAlerts() {
  const [alerts, setAlerts] = useState<ChaseUpAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('client_chase_alerts')
        .select(`
          *,
          project:projects(
            id,
            title,
            client:clients(name, email)
          )
        `)
        .eq('is_dismissed', false)
        .lt('chase_up_due_at', new Date().toISOString())
        .order('chase_up_due_at', { ascending: true });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading chase-up alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load chase-up alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createChaseUpAlert = async (projectId: string) => {
    try {
      const chaseUpDueAt = new Date();
      chaseUpDueAt.setDate(chaseUpDueAt.getDate() + 2); // 2 days from now

      const { error } = await supabase
        .from('client_chase_alerts')
        .insert({
          project_id: projectId,
          chase_up_due_at: chaseUpDueAt.toISOString(),
        });

      if (error) throw error;
      
      await loadAlerts();
      
      toast({
        title: "Email Tracked",
        description: "Chase-up reminder set for 2 days",
      });
    } catch (error) {
      console.error('Error creating chase-up alert:', error);
      toast({
        title: "Error",
        description: "Failed to create chase-up alert",
        variant: "destructive",
      });
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('client_chase_alerts')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString(),
          dismissed_by: 'user', // In a real app, this would be the current user
        })
        .eq('id', alertId);

      if (error) throw error;
      
      await loadAlerts();
      
      toast({
        title: "Success",
        description: "Chase-up reminder cleared",
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive",
      });
    }
  };

  const sendFollowUp = async (alertId: string, projectTitle: string, clientEmail: string) => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      if (!alert) return;

      const newChaseCount = alert.chase_count + 1;
      const nextChaseUpDue = new Date();
      nextChaseUpDue.setDate(nextChaseUpDue.getDate() + 2);

      // Update the alert with new chase count and due date
      const { error } = await supabase
        .from('client_chase_alerts')
        .update({
          chase_count: newChaseCount,
          last_chase_at: new Date().toISOString(),
          chase_up_due_at: nextChaseUpDue.toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      // Generate follow-up email
      const subject = getFollowUpSubject(projectTitle, newChaseCount);
      const body = getFollowUpBody(projectTitle, newChaseCount);
      
      const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      await loadAlerts();
      
      toast({
        title: "Follow-up Sent",
        description: `Chase-up #${newChaseCount} email opened. Next reminder in 2 days.`,
      });
    } catch (error) {
      console.error('Error sending follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to send follow-up",
        variant: "destructive",
      });
    }
  };

  const getFollowUpSubject = (projectTitle: string, chaseCount: number) => {
    if (chaseCount === 1) {
      return `Just checking in on ${projectTitle}`;
    } else if (chaseCount === 2) {
      return `Following up on ${projectTitle} - any feedback?`;
    } else {
      return `Urgent: ${projectTitle} feedback needed`;
    }
  };

  const getFollowUpBody = (projectTitle: string, chaseCount: number) => {
    if (chaseCount === 1) {
      return `Hi,\n\nI wanted to check in regarding ${projectTitle}. We sent over the files a couple of days ago and would love to hear your thoughts.\n\nPlease let us know if you have any feedback or questions.\n\nThanks!`;
    } else if (chaseCount === 2) {
      return `Hi,\n\nI'm following up again on ${projectTitle}. We're keen to hear your feedback so we can move forward with any necessary changes.\n\nCould you please review the files when you have a moment?\n\nThanks!`;
    } else {
      return `Hi,\n\nThis is an urgent follow-up regarding ${projectTitle}. We really need your feedback to keep the project on track.\n\nPlease respond as soon as possible.\n\nThanks!`;
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return {
    alerts,
    loading,
    createChaseUpAlert,
    dismissAlert,
    sendFollowUp,
    getDaysOverdue,
    loadAlerts
  };
}
