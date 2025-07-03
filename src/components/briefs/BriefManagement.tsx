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
import { BriefCard } from "./BriefCard";

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
  estimated_shoot_hours: number | null;
  estimated_edit_hours: number | null;
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
  "Social Media Content",
  "Print Design",
  "Photography",
  "Video Production",
  "Social content",
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
    estimatedShootHours: "",
    estimatedEditHours: "",
    estimatedHours: "",
    projectValue: "",
    treatAsOneoff: false,
    contractSigned: false,
    poRequired: true, // Added poRequired to form data
  });
  const { toast } = useToast();

  const selectedClient = clients.find(c => c.id === formData.clientId);
  // Modified logic: show project value if it's already set (from template),
  // or if it's a non-retainer, or a retainer treated as one-off.
  const showProjectValue = (formData.projectValue !== "" && formData.projectValue !== "0") || !selectedClient?.is_retainer || formData.treatAsOneoff;
  const clientTemplates = templates.filter(t => t.client_id === formData.clientId);
  const isDualHoursType = ["Video Production", "Photography", "Social Media Content"].includes(formData.workType);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, company, is_retainer')
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

      console.log('Loaded projects:', projectsData);

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
      setTemplates((templatesData || []).map((t: any) => ({
        ...t,
        estimated_shoot_hours: t.estimated_shoot_hours ?? null,
        estimated_edit_hours: t.estimated_edit_hours ?? null,
      })));
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
      title: template.template_name || "",
      clientId: template.client_id,
      workType: template.work_type,
      deliverables: template.deliverables.toString(),
      dueDate: "",
      poNumber: "",
      description: template.description || "",
      estimatedShootHours: template.estimated_shoot_hours?.toString() || "",
      estimatedEditHours: template.estimated_edit_hours?.toString() || "",
      estimatedHours: template.estimated_hours?.toString() || "",
      projectValue: template.project_value?.toString() || "",
      treatAsOneoff: false,
      contractSigned: false,
      poRequired: true, // Default to true when loading from template, user can change
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

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    if (value === "no-template") { // Check for the new non-empty placeholder value
      // Reset template-related fields if "No template" is selected
      setFormData(prev => ({
        ...prev,
        workType: "",
        deliverables: "",
        description: "",
        estimatedShootHours: "",
        estimatedEditHours: "",
        estimatedHours: "",
        projectValue: "",
        poRequired: true, // Reset to default true
      }));
    } else {
      const template = templates.find(t => t.id === value);
      if (template) {
        loadTemplateData(template);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check for required fields and provide feedback
    if (!formData.clientId || !formData.title || !formData.workType || !formData.deliverables || !formData.dueDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Client, Title, Work Type, Deliverables, Due Date).",
        variant: "destructive",
      });
      return; // Stop submission
    }

    setLoading(true);
    try {
      const projectData = {
        client_id: formData.clientId,
        title: formData.title,
        description: formData.description,
        work_type: formData.workType,
        deliverables: parseInt(formData.deliverables),
        due_date: formData.dueDate || null,
        estimated_hours: !isDualHoursType ? (formData.estimatedHours ? parseInt(formData.estimatedHours) : null) : null,
        estimated_shoot_hours: isDualHoursType ? (formData.estimatedShootHours ? parseInt(formData.estimatedShootHours) : null) : null,
        estimated_edit_hours: isDualHoursType ? (formData.estimatedEditHours ? parseInt(formData.estimatedEditHours) : null) : null,
        po_number: formData.poNumber || null,
        project_value: showProjectValue && formData.projectValue ? parseFloat(formData.projectValue) : null,
        is_retainer: selectedClient?.is_retainer || false,
        treat_as_oneoff: formData.treatAsOneoff,
        contract_signed: formData.contractSigned,
        po_required: formData.poRequired, // Use value from form data
        status: 'active', // Ensure new briefs are visible
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
        estimatedShootHours: "",
        estimatedEditHours: "",
        estimatedHours: "",
        projectValue: "",
        treatAsOneoff: false,
        contractSigned: false,
        poRequired: true, // Reset to default true for next brief
      });
      setSelectedTemplate("");
      setShowForm(false);
      await loadData();
      
      toast({
        title: "Success",
        description: "Brief created successfully",
      });
    } catch (error: any) {
      // Improved error logging for debugging
      console.error('Error creating brief:', error, error?.message, error?.details, error?.hint);
      toast({
        title: "Error",
        description: error?.message || error?.details || error?.hint || "Failed to create brief",
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
                            <SelectItem value="no-template">No template</SelectItem>
                            {clientTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.template_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Added missing Title field */}
                    <div>
                      <Label htmlFor="title">Brief Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Website Redesign for Acme Corp"
                        required
                      />
                    </div>

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
                    {isDualHoursType ? (
                      <>
                        <div>
                          <Label htmlFor="estimatedShootHours">Estimated Shoot Hours</Label>
                          <Input
                            id="estimatedShootHours"
                            type="number"
                            value={formData.estimatedShootHours}
                            onChange={(e) => setFormData({ ...formData, estimatedShootHours: e.target.value })}
                            placeholder="e.g., 8"
                            min="0"
                          />
                          <p className="text-xs text-muted-foreground">Set to 0 if no shoot hours are required. 0 means no shoot booking will be created.</p>
                        </div>
                        <div>
                          <Label htmlFor="estimatedEditHours">Estimated Edit Hours</Label>
                          <Input
                            id="estimatedEditHours"
                            type="number"
                            value={formData.estimatedEditHours}
                            onChange={(e) => setFormData({ ...formData, estimatedEditHours: e.target.value })}
                            placeholder="e.g., 12"
                            min="0"
                          />
                          <p className="text-xs text-muted-foreground">Set to 0 if no edit hours are required. 0 means no edit booking will be created.</p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <Label htmlFor="estimatedHours">Estimated Hours *</Label>
                        <Input
                          id="estimatedHours"
                          type="number"
                          value={formData.estimatedHours}
                          onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                          placeholder="e.g., 12"
                          min="1"
                          required
                        />
                      </div>
                    )}
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
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="poRequired"
                      checked={formData.poRequired}
                      onCheckedChange={(checked) => setFormData({ ...formData, poRequired: checked })}
                    />
                    <Label htmlFor="poRequired">PO Required?</Label>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(() => { console.log('Rendering projects:', projects); return null; })()}
            {projects.length === 0 && (
              <div className="col-span-2 text-center text-muted-foreground">
                <p>No briefs found. If you just created a brief and it does not appear, check the console for debug info.</p>
              </div>
            )}
            {projects.map((project, idx) => {
              console.log('Rendering project', idx, project);
              return (
                <BriefCard
                  key={project.id}
                  project={project}
                  onDelete={() => setDeletingProject(project)}
                />
              );
            })}
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
              setEditingTemplate({
                ...(template as any),
                estimated_shoot_hours: (template as any).estimated_shoot_hours ?? null,
                estimated_edit_hours: (template as any).estimated_edit_hours ?? null,
              });
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