import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Briefcase, Trash2, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DeleteBriefModal } from "./DeleteBriefModal";
import { BriefTemplateModal } from "./BriefTemplateModal";
import { BriefTemplateList } from "./BriefTemplateList";

interface Client {
  id: string;
  name: string;
  company: string;
  is_retainer: boolean;
}

interface BriefTemplate {
  id: string;
  client_id: string;
  template_name: string;
  work_type: string;
  deliverables: number;
  description: string | null;
  estimated_hours: number | null;
  project_value: number | null;
  client: {
    company: string;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  client_id: string;
  work_type: string;
  deliverables: number;
  due_date: string;
  po_number: string;
  estimated_hours: number;
  is_retainer: boolean;
  current_stage: string;
  project_value: number | null;
  treat_as_oneoff: boolean;
  client: Client;
}

const workTypes = [
  "Logo Design",
  "Website Development",
  "Branding",
  "Marketing Campaign",
  "Social Media Management",
  "Print Design",
  "Photography",
  "Video Production",
];

export function BriefManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<BriefTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("briefs");
  const [showForm, setShowForm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BriefTemplate | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    workType: "",
    deliverables: "",
    dueDate: "",
    poNumber: "",
    description: "",
    estimatedHours: "",
    projectValue: "",
    treatAsOneoff: false,
    contractSigned: false,
  });
  const { toast } = useToast();

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const showProjectValue = !selectedClient?.is_retainer || formData.treatAsOneoff;
  const clientTemplates = templates.filter(t => t.client_id === formData.clientId);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, company, is_retainer')
        .eq('is_active', true)
        .order('company');

      if (clientsError) throw clientsError;

      // Load projects (briefs)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, name, company, is_retainer)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('brief_templates')
        .select(`
          *,
          client:clients(company)
        `)
        .order('template_name');

      if (templatesError) throw templatesError;

      setClients(clientsData || []);
      setProjects(projectsData || []);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateData = (template: BriefTemplate) => {
    setFormData({
      title: "",
      clientId: template.client_id,
      workType: template.work_type,
      deliverables: template.deliverables.toString(),
      dueDate: "",
      poNumber: "",
      description: template.description || "",
      estimatedHours: template.estimated_hours?.toString() || "",
      projectValue: template.project_value?.toString() || "",
      treatAsOneoff: false,
      contractSigned: false,
    });
    setSelectedTemplate(template.id);
  };

  const handleCreateFromTemplate = (template: BriefTemplate) => {
    loadTemplateData(template);
    setShowForm(true);
    setActiveTab("briefs");
    toast({
      title: "Template Loaded",
      description: `Brief form populated with ${template.template_name} template data`,
    });
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        loadTemplateData(template);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.title || !formData.workType) return;

    setLoading(true);
    try {
      const projectData = {
        client_id: formData.clientId,
        title: formData.title,
        description: formData.description,
        work_type: formData.workType,
        deliverables: parseInt(formData.deliverables),
        due_date: formData.dueDate || null,
        estimated_hours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        po_number: formData.poNumber || null,
        project_value: showProjectValue && formData.projectValue ? parseFloat(formData.projectValue) : null,
        is_retainer: selectedClient?.is_retainer || false,
        treat_as_oneoff: formData.treatAsOneoff,
        contract_signed: formData.contractSigned,
        po_required: true,
      };

      const { error } = await supabase
        .from('projects')
        .insert(projectData);

      if (error) throw error;

      // Reset form
      setFormData({
        title: "",
        clientId: "",
        workType: "",
        deliverables: "",
        dueDate: "",
        poNumber: "",
        description: "",
        estimatedHours: "",
        projectValue: "",
        treatAsOneoff: false,
        contractSigned: false,
      });
      setSelectedTemplate("");
      setShowForm(false);
      await loadData();
      
      toast({
        title: "Success",
        description: "Brief created successfully",
      });
    } catch (error) {
      console.error('Error creating brief:', error);
      toast({
        title: "Error",
        description: "Failed to create brief",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrief = async (projectId: string) => {
    try {
      // Delete related records first (due to foreign key constraints)
      await supabase.from('project_bookings').delete().eq('project_id', projectId);
      await supabase.from('expenses').delete().eq('project_id', projectId);
      await supabase.from('crm_billing_records').delete().eq('project_id', projectId);
      await supabase.from('project_stage_history').delete().eq('project_id', projectId);
      await supabase.from('project_status_history').delete().eq('project_id', projectId);
      await supabase.from('project_closure_checklist').delete().eq('project_id', projectId);
      await supabase.from('admin_notifications').delete().eq('project_id', projectId);
      await supabase.from('client_chase_alerts').delete().eq('project_id', projectId);

      // Finally delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      await loadData();
      setDeletingProject(null);
      
      toast({
        title: "Success",
        description: "Brief deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting brief:', error);
      toast({
        title: "Error",
        description: "Failed to delete brief",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (stage: string) => {
    const colors = {
      'incoming': 'bg-orange-100 text-orange-800',
      'stage01': 'bg-blue-100 text-blue-800',
      'stage02': 'bg-yellow-100 text-yellow-800',
      'stage03': 'bg-purple-100 text-purple-800',
      'stage04': 'bg-red-100 text-red-800',
      'stage05': 'bg-green-100 text-green-800',
      'stage06': 'bg-gray-100 text-gray-800',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStageDisplayName = (stage: string) => {
    const names = {
      'incoming': 'Incoming Brief',
      'stage01': 'Pre-Production',
      'stage02': 'Production',
      'stage03': 'Amend 1',
      'stage04': 'Amend 2',
      'stage05': 'Final Delivery',
      'stage06': 'Client Submission',
    };
    return names[stage as keyof typeof names] || stage;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Brief Management</h2>
          <p className="text-muted-foreground">Create and manage project briefs and templates</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="briefs">Project Briefs</TabsTrigger>
          <TabsTrigger value="templates">Brief Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="briefs" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Brief
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Brief</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client">Client *</Label>
                      <Select value={formData.clientId} onValueChange={(value) => {
                        setFormData({ ...formData, clientId: value });
                        setSelectedTemplate("");
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.company} {client.is_retainer ? "(Retainer)" : "(Project)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedClient?.is_retainer && clientTemplates.length > 0 && (
                      <div>
                        <Label htmlFor="template">Use Template</Label>
                        <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No template</SelectItem>
                            {clientTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.template_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="title">Project Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter project title"
                      />
                    </div>
                    
                    {selectedClient?.is_retainer && (
                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="treatAsOneoff"
                            checked={formData.treatAsOneoff}
                            onCheckedChange={(checked) => setFormData({ ...formData, treatAsOneoff: checked })}
                          />
                          <Label htmlFor="treatAsOneoff">One-off Upsell (bill separately from retainer)</Label>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="workType">Type of Work *</Label>
                      <Select value={formData.workType} onValueChange={(value) => setFormData({ ...formData, workType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select work type" />
                        </SelectTrigger>
                        <SelectContent>
                          {workTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="deliverables">Number of Deliverables *</Label>
                      <Input
                        id="deliverables"
                        type="number"
                        value={formData.deliverables}
                        onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                        placeholder="e.g., 3"
                      />
                    </div>
                    
                    {showProjectValue && (
                      <div>
                        <Label htmlFor="projectValue">Project Value (£) *</Label>
                        <Input
                          id="projectValue"
                          type="number"
                          step="0.01"
                          value={formData.projectValue}
                          onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
                          placeholder="e.g., 5000.00"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="dueDate">Due Date *</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="poNumber">PO Number</Label>
                      <Input
                        id="poNumber"
                        value={formData.poNumber}
                        onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                        placeholder="e.g., PO-2024-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedHours">Estimated Hours</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        value={formData.estimatedHours}
                        onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                        placeholder="e.g., 40"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Brief Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the project requirements..."
                      rows={4}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit">Create Brief</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5" />
                      <span>{project.title}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletingProject(project)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{project.client?.company || project.client?.name}</p>
                    <p className="text-sm text-muted-foreground">{project.work_type}</p>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span>Deliverables: {project.deliverables}</span>
                      <span>Due: {new Date(project.due_date).toLocaleDateString()}</span>
                    </div>
                    {project.estimated_hours && (
                      <div className="text-xs">
                        <span>Est. Hours: {project.estimated_hours}</span>
                      </div>
                    )}
                    {project.project_value && (
                      <div className="text-xs font-medium">
                        <span>Value: £{project.project_value.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.current_stage)}`}>
                        {getStageDisplayName(project.current_stage)}
                      </span>
                      <div className="flex space-x-1">
                        {project.is_retainer && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Retainer
                          </span>
                        )}
                        {project.treat_as_oneoff && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            One-off
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowTemplateModal(true)}>
              <File className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          <BriefTemplateList
            templates={templates}
            onEditTemplate={(template) => {
              setEditingTemplate(template);
              setShowTemplateModal(true);
            }}
            onTemplateDeleted={loadData}
            onCreateFromTemplate={handleCreateFromTemplate}
          />
        </TabsContent>
      </Tabs>

      {deletingProject && (
        <DeleteBriefModal
          briefTitle={deletingProject.title}
          open={!!deletingProject}
          onOpenChange={(open) => !open && setDeletingProject(null)}
          onConfirm={() => handleDeleteBrief(deletingProject.id)}
        />
      )}

      <BriefTemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
        }}
        clients={clients}
        template={editingTemplate}
        onTemplateCreated={loadData}
      />
    </div>
  );
}
