import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  MessageSquare, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Mail,
  Phone,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientMessage {
  id: string;
  client_id: string;
  subject: string;
  message: string;
  message_type: 'general' | 'urgent' | 'update' | 'reminder';
  sent_at: string;
  read_at: string | null;
  client: {
    id: string;
    name: string;
    company: string;
    email: string;
  };
}

interface FollowUpItem {
  id: string;
  client_id: string;
  client_name: string;
  client_company: string;
  client_email: string;
  last_contact_date: string;
  days_since_contact: number;
  suggested_follow_up_date: string;
  days_until_follow_up: number;
  priority: 'high' | 'medium' | 'low';
  contact_type: 'email' | 'phone' | 'meeting';
  notes: string;
  project_count: number;
  active_projects: any[];
}

export function FollowUpTracker() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFollowUpData();
  }, []);

  const loadFollowUpData = async () => {
    setLoading(true);
    try {
      // Fetch all client messages
      const { data: messages, error: messagesError } = await supabase
        .from('client_messages')
        .select(`
          *,
          client:clients(id, name, company, email)
        `)
        .order('sent_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Fetch active projects for each client
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          status,
          client_id,
          due_date,
          current_stage
        `)
        .eq('status', 'active');

      if (projectsError) throw projectsError;

      // Generate follow-up items
      const followUpItems = generateFollowUpItems(messages || [], projects || []);
      setFollowUps(followUpItems);

    } catch (error) {
      console.error('Error loading follow-up data:', error);
      toast({
        title: "Error",
        description: "Failed to load follow-up data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFollowUpItems = (messages: ClientMessage[], projects: any[]): FollowUpItem[] => {
    const clientMessageMap = new Map<string, ClientMessage[]>();
    const clientProjectMap = new Map<string, any[]>();
    
    // Group messages by client
    messages.forEach(message => {
      if (!clientMessageMap.has(message.client_id)) {
        clientMessageMap.set(message.client_id, []);
      }
      clientMessageMap.get(message.client_id)!.push(message);
    });

    // Group projects by client
    projects.forEach(project => {
      if (!clientProjectMap.has(project.client_id)) {
        clientProjectMap.set(project.client_id, []);
      }
      clientProjectMap.get(project.client_id)!.push(project);
    });

    const followUpItems: FollowUpItem[] = [];
    const now = new Date();

    // Process each client
    for (const [clientId, clientMessages] of clientMessageMap) {
      if (clientMessages.length === 0) continue;

      const client = clientMessages[0].client;
      const lastMessage = clientMessages[0]; // Most recent message
      const lastContactDate = new Date(lastMessage.sent_at);
      const daysSinceContact = Math.ceil((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));

      // Determine follow-up timing based on message type and client activity
      const activeProjects = clientProjectMap.get(clientId) || [];
      const projectCount = activeProjects.length;
      
      let suggestedFollowUpDays = 7; // Default
      let priority: 'high' | 'medium' | 'low' = 'medium';
      let contactType: 'email' | 'phone' | 'meeting' = 'email';

      // Adjust follow-up timing based on various factors
      if (lastMessage.message_type === 'urgent') {
        suggestedFollowUpDays = 1;
        priority = 'high';
        contactType = 'phone';
      } else if (lastMessage.message_type === 'update') {
        suggestedFollowUpDays = 3;
        priority = 'medium';
      } else if (projectCount > 0) {
        // Active projects need more frequent follow-up
        suggestedFollowUpDays = 5;
        priority = 'medium';
      } else {
        // No active projects - less frequent follow-up
        suggestedFollowUpDays = 14;
        priority = 'low';
      }

      // Check if any projects are overdue
      const hasOverdueProjects = activeProjects.some((project: any) => {
        if (!project.due_date) return false;
        const dueDate = new Date(project.due_date);
        return dueDate < now;
      });

      if (hasOverdueProjects) {
        suggestedFollowUpDays = 1;
        priority = 'high';
        contactType = 'phone';
      }

      const suggestedFollowUpDate = new Date(lastContactDate);
      suggestedFollowUpDate.setDate(suggestedFollowUpDate.getDate() + suggestedFollowUpDays);
      
      const daysUntilFollowUp = Math.ceil((suggestedFollowUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Only include if follow-up is due or overdue
      if (daysUntilFollowUp <= 0 || daysSinceContact >= suggestedFollowUpDays) {
        followUpItems.push({
          id: clientId,
          client_id: clientId,
          client_name: client.name,
          client_company: client.company,
          client_email: client.email,
          last_contact_date: lastMessage.sent_at,
          days_since_contact: daysSinceContact,
          suggested_follow_up_date: suggestedFollowUpDate.toISOString(),
          days_until_follow_up: daysUntilFollowUp,
          priority,
          contact_type: contactType,
          notes: generateFollowUpNotes(client, lastMessage, activeProjects, daysSinceContact),
          project_count: projectCount,
          active_projects: activeProjects
        });
      }
    }

    return followUpItems.sort((a, b) => {
      // Sort by priority first, then by days since contact
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.days_since_contact - a.days_since_contact;
    });
  };

  const generateFollowUpNotes = (client: any, lastMessage: ClientMessage, activeProjects: any[], daysSinceContact: number): string => {
    let notes = `Last contacted ${daysSinceContact} day${daysSinceContact !== 1 ? 's' : ''} ago via ${lastMessage.message_type} message.`;
    
    if (activeProjects.length > 0) {
      notes += ` ${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}.`;
      
      const overdueProjects = activeProjects.filter((project: any) => {
        if (!project.due_date) return false;
        const dueDate = new Date(project.due_date);
        return dueDate < new Date();
      });
      
      if (overdueProjects.length > 0) {
        notes += ` ${overdueProjects.length} project${overdueProjects.length !== 1 ? 's' : ''} overdue.`;
      }
    } else {
      notes += ' No active projects.';
    }

    return notes;
  };

  const markFollowUpComplete = async (clientId: string) => {
    try {
      // Create a new message record for the follow-up
      const followUp = followUps.find(f => f.client_id === clientId);
      if (!followUp) return;

      const { error } = await supabase
        .from('client_messages')
        .insert({
          client_id: clientId,
          subject: `Follow-up: ${followUp.client_company}`,
          message: `Follow-up completed via ${followUp.contact_type}. ${followUp.notes}`,
          message_type: 'reminder',
          sent_at: new Date().toISOString()
        });

      if (error) throw error;

      // Reload data
      await loadFollowUpData();

      toast({
        title: "Success",
        description: "Follow-up marked as complete",
      });
    } catch (error) {
      console.error('Error marking follow-up complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark follow-up complete",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getContactTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'meeting': return <User className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (daysUntilFollowUp: number) => {
    if (daysUntilFollowUp < 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-300">Overdue</Badge>;
    } else if (daysUntilFollowUp === 0) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Due Today</Badge>;
    } else if (daysUntilFollowUp <= 2) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Due Soon</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Scheduled</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Follow-up Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading follow-ups...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Follow-up Tracker
            </div>
            <Button onClick={loadFollowUpData} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Track client communications and manage follow-up reminders
          </div>
          
          {followUps.length > 0 ? (
            <div className="space-y-4">
              {followUps.map((followUp) => (
                <div key={followUp.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getContactTypeIcon(followUp.contact_type)}
                      <Badge className={getPriorityColor(followUp.priority)}>
                        {followUp.priority} priority
                      </Badge>
                      {getStatusBadge(followUp.days_until_follow_up)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {followUp.days_since_contact} days since last contact
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="font-medium">{followUp.client_company}</div>
                    <div className="text-sm text-muted-foreground">
                      Contact: {followUp.client_name} ({followUp.client_email})
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm text-muted-foreground mb-1">Notes:</div>
                    <div className="text-sm bg-gray-100 p-2 rounded">
                      {followUp.notes}
                    </div>
                  </div>
                  
                  {followUp.active_projects.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm text-muted-foreground mb-1">Active Projects:</div>
                      <div className="space-y-1">
                        {followUp.active_projects.map((project: any) => (
                          <div key={project.id} className="text-sm bg-blue-50 p-2 rounded">
                            <div className="font-medium">{project.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Due: {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'No due date'}
                              {project.due_date && new Date(project.due_date) < new Date() && (
                                <span className="text-red-600 ml-2">(Overdue)</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Suggested: {new Date(followUp.suggested_follow_up_date).toLocaleDateString()}
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => markFollowUpComplete(followUp.client_id)}
                    >
                      Mark Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No follow-ups needed at the moment</p>
              <p className="text-xs">All client communications are up to date</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 