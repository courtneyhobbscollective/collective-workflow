import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { Clock, FileText, Plus, MessageSquare } from "lucide-react"; // Import MessageSquare
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientBriefSubmissionForm } from "@/components/clients/ClientBriefSubmissionForm";
import { ClientChatInterface } from "@/components/clients/ClientChatInterface"; // Import ClientChatInterface
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components

interface ClientProfile {
  client_id: string;
  client: {
    company: string;
    name: string;
    is_retainer: boolean; // Added is_retainer to client profile
  };
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  current_stage: string;
  work_type: string;
  deliverables: number | null;
  due_date: string | null;
  estimated_hours: number | null;
  project_value: number | null;
  stage_status: string | null;
  picter_link: string | null;
  project_stages: {
    name: string;
  };
}

export function ClientDashboardPage() {
  const { user, clientProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBriefFormModal, setShowBriefFormModal] = useState(false);
  const { toast } = useToast();

  const fetchClientData = async () => {
    if (!user || !clientProfile) {
      setLoading(false);
      return;
    }
    try {
      // Fetch projects for this client
      if (clientProfile?.client_id) {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id,
            title,
            description,
            current_stage,
            work_type,
            deliverables,
            due_date,
            estimated_hours,
            project_value,
            stage_status,
            picter_link,
            project_stages(name)
          `)
          .eq('client_id', clientProfile.client_id)
          .in('status', ['active', 'on_hold']) // Only show active or on-hold projects
          .order('due_date', { ascending: true });

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
      }
    } catch (error: any) {
      console.error("Error fetching client data:", error);
      toast({
        title: "Error",
        description: "Failed to load client data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [user, clientProfile, toast]); // Re-fetch when user or clientProfile changes

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'ready_for_internal_review': return 'bg-purple-100 text-purple-800';
      case 'ready_to_send_client': return 'bg-green-100 text-green-800';
      case 'sent_to_client': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStageStatusLabel = (status: string | null) => {
    const labels: Record<string, string> = {
      in_progress: "In Progress",
      on_hold: "On Hold",
      ready_for_internal_review: "Ready for Internal Review",
      ready_to_send_client: "Ready to be Sent",
      sent_to_client: "Sent to Client",
      closed: "Closed"
    };
    return status ? labels[status] || status.replace(/_/g, ' ') : 'N/A';
  };

  const handleBriefSubmitted = () => {
    fetchClientData(); // Refresh projects after a new brief is submitted
    setShowBriefFormModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading client dashboard...</p>
      </div>
    );
  }

  if (!clientProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>No client profile found for this user. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">
          Welcome, {clientProfile.client.name} from {clientProfile.client.company}!
        </h2>
        <Button onClick={() => setShowBriefFormModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Submit New Brief
        </Button>
      </div>
      
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <TabsTrigger value="projects">
            <FileText className="w-4 h-4 mr-2" />
            Your Projects
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Client Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <p className="text-muted-foreground">Here are your current live projects:</p>
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>You currently have no active projects.</p>
                <p className="text-sm">New projects will appear here once they begin.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Accordion key={project.id} type="single" collapsible className="w-full">
                  <AccordionItem value={project.id} className="border rounded-lg bg-white shadow-sm">
                    <AccordionTrigger className="flex-1 text-left hover:no-underline p-4">
                      <div className="flex flex-col items-start text-left space-y-1">
                        <h3 className="font-semibold text-base">{project.title}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span className="font-medium">{project.work_type}</span>
                          {project.due_date && (
                            <>
                              <span className="text-xs">•</span>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Due: {format(new Date(project.due_date), 'MMM d, yyyy')}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(project.stage_status)}>
                        {project.project_stages?.name || 'N/A'}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3 text-sm">
                        {project.description && (
                          <div>
                            <p className="font-medium">Description:</p>
                            <p className="text-muted-foreground">{project.description}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="font-medium">Current Stage:</p>
                            <p className="text-muted-foreground">{project.project_stages?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Stage Status:</p>
                            <p className="text-muted-foreground">{formatStageStatusLabel(project.stage_status)}</p>
                          </div>
                          {project.deliverables && (
                            <div>
                              <p className="font-medium">Deliverables:</p>
                              <p className="text-muted-foreground">{project.deliverables}</p>
                            </div>
                          )}
                          {project.estimated_hours && (
                            <div>
                              <p className="font-medium">Estimated Hours:</p>
                              <p className="text-muted-foreground">{project.estimated_hours}h</p>
                            </div>
                          )}
                          {project.project_value && (
                            <div>
                              <p className="font-medium">Project Value:</p>
                              <p className="text-muted-foreground">£{project.project_value.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        {project.picter_link && (
                          <div>
                            <p className="font-medium">Picter Link:</p>
                            <a 
                              href={project.picter_link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline"
                            >
                              View Project on Picter
                            </a>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <ClientChatInterface />
        </TabsContent>
      </Tabs>

      <Dialog open={showBriefFormModal} onOpenChange={setShowBriefFormModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit New Brief</DialogTitle>
          </DialogHeader>
          <ClientBriefSubmissionForm
            onBriefSubmitted={handleBriefSubmitted}
            onClose={() => setShowBriefFormModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}