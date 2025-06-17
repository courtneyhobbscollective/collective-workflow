/** @jsxImportSource react */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { Clock, FileText, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } => "@/components/ui/dialog";
import { ClientBriefSubmissionForm } from "@/components/clients/ClientBriefSubmissionForm";
import { ClientChatInterface } from "@/components/clients/ClientChatInterface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClientProfile {
  client_id: string;
  client: {
    company: string;
    name: string;
    is_retainer: boolean;
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
  console.log("ClientDashboardPage component rendering...");
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
          .in('status', ['active', 'on_hold'])
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
  }, [user, clientProfile, toast]);

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
    fetchClientData();
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
    <div className="space-y-10"> {/* Increased overall spacing */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"> {/* Increased gap */}
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight"> {/* Larger, bolder, tighter tracking */}
          Welcome, {clientProfile.client.name} from {clientProfile.client.company}!
        </h2>
        <Button 
          onClick={() => setShowBriefFormModal(true)} 
          className="px-8 py-4 text-lg font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200" {/* More prominent button */}
        >
          <Plus className="w-6 h-6 mr-3" /> {/* Larger icon */}
          Submit New Brief
        </Button>
      </div>
      
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200 rounded-xl shadow-sm p-1"> {/* Refined tabs container */}
          <TabsTrigger 
            value="projects" 
            className="data-[state=active]:bg-gray-50 data-[state=active]:shadow-inner data-[state=active]:text-gray-900 rounded-lg transition-all duration-200 py-3 text-base font-medium" {/* Softer active state, larger text */}
          >
            <FileText className="w-5 h-5 mr-2" /> {/* Larger icon */}
            Your Projects
          </TabsTrigger>
          <TabsTrigger 
            value="chat" 
            className="data-[state=active]:bg-gray-50 data-[state=active]:shadow-inner data-[state=active]:text-gray-900 rounded-lg transition-all duration-200 py-3 text-base font-medium" {/* Softer active state, larger text */}
          >
            <MessageSquare className="w-5 h-5 mr-2" /> {/* Larger icon */}
            Client Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-8 mt-8"> {/* Increased spacing */}
          <p className="text-xl text-gray-800 font-semibold">Here are your current live projects:</p> {/* Larger, darker, bolder text */}
          {projects.length === 0 ? (
            <Card className="shadow-lg border-dashed border-2 border-gray-300 bg-gray-50 rounded-2xl"> {/* Enhanced empty state card */}
              <CardContent className="p-10 text-center text-muted-foreground"> {/* Increased padding */}
                <FileText className="mx-auto h-20 w-20 mb-8 opacity-50 text-gray-400" /> {/* Larger, muted icon */}
                <p className="text-2xl font-bold mb-3">You currently have no active projects.</p> {/* Larger, bolder text */}
                <p className="text-lg">New projects will appear here once they begin.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> {/* Increased gap */}
              {projects.map((project) => (
                <Accordion key={project.id} type="single" collapsible className="w-full">
                  <AccordionItem value={project.id} className="border border-gray-200 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-200"> {/* More rounded corners, prominent shadows */}
                    <AccordionTrigger className="flex-1 text-left hover:no-underline p-6"> {/* Increased padding */}
                      <div className="flex flex-col items-start text-left space-y-2">
                        <h3 className="font-bold text-xl text-gray-900">{project.title}</h3> {/* Bolder, darker, larger title */}
                        <div className="flex items-center space-x-4 text-base text-gray-600"> {/* Darker muted text, increased spacing */}
                          <span className="font-medium">{project.work_type}</span>
                          {project.due_date && (
                            <>
                              <span className="text-sm">•</span>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-5 h-5" /> {/* Larger icon */}
                                <span>Due: {format(new Date(project.due_date), 'MMM d, yyyy')}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(project.stage_status)} px-4 py-2 text-base font-semibold rounded-full`}> {/* Larger, more rounded badge */}
                        {project.project_stages?.name || 'N/A'}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6"> {/* Increased padding */}
                      <div className="space-y-5 text-lg"> {/* Larger text, increased spacing */}
                        {project.description && (
                          <div>
                            <p className="font-semibold text-gray-800">Description:</p> {/* Bolder label */}
                            <p className="text-gray-700">{project.description}</p> {/* Darker text */}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-6"> {/* Increased gap */}
                          <div>
                            <p className="font-semibold text-gray-800">Current Stage:</p>
                            <p className="text-gray-700">{project.project_stages?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">Stage Status:</p>
                            <p className="text-gray-700">{formatStageStatusLabel(project.stage_status)}</p>
                          </div>
                          {project.deliverables && (
                            <div>
                              <p className="font-semibold text-gray-800">Deliverables:</p>
                              <p className="text-gray-700">{project.deliverables}</p>
                            </div>
                          )}
                          {project.estimated_hours && (
                            <div>
                              <p className="font-semibold text-gray-800">Estimated Hours:</p>
                              <p className="text-gray-700">{project.estimated_hours}h</p>
                            </div>
                          )}
                          {project.project_value && (
                            <div>
                              <p className="font-semibold text-gray-800">Project Value:</p>
                              <p className="text-gray-700">£{project.project_value.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        {project.picter_link && (
                          <div>
                            <p className="font-semibold text-gray-800">Picter Link:</p>
                            <a 
                              href={project.picter_link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline font-medium"
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

        <TabsContent value="chat" className="space-y-4 mt-6">
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