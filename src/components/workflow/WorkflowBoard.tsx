
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Clock, User, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProjectStage {
  id: string;
  name: string;
  order_index: number;
  billing_percentage: number;
  description: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
  is_retainer: boolean;
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
  client: Client;
  assigned_staff: Staff | null;
}

export function WorkflowBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editPoNumber, setEditPoNumber] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('project_stages')
        .select('*')
        .order('order_index');

      if (stagesError) throw stagesError;

      // Load projects with related data
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(*),
          assigned_staff:staff(*)
        `)
        .eq('status', 'active');

      if (projectsError) throw projectsError;

      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);

      if (staffError) throw staffError;

      setStages(stagesData || []);
      setProjects(projectsData || []);
      setStaff(staffData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignStaff = async (projectId: string, staffId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ assigned_staff_id: staffId })
        .eq('id', projectId);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: "Staff member assigned successfully",
      });
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast({
        title: "Error",
        description: "Failed to assign staff member",
        variant: "destructive",
      });
    }
  };

  const updateContractStatus = async (projectId: string, signed: boolean) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ contract_signed: signed })
        .eq('id', projectId);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: `Contract marked as ${signed ? 'signed' : 'not signed'}`,
      });
    } catch (error) {
      console.error('Error updating contract status:', error);
      toast({
        title: "Error",
        description: "Failed to update contract status",
        variant: "destructive",
      });
    }
  };

  const updatePoNumber = async (projectId: string, poNumber: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ po_number: poNumber })
        .eq('id', projectId);

      if (error) throw error;

      await loadData();
      setEditingProject(null);
      setEditPoNumber("");
      toast({
        title: "Success",
        description: "PO number updated successfully",
      });
    } catch (error) {
      console.error('Error updating PO number:', error);
      toast({
        title: "Error",
        description: "Failed to update PO number",
        variant: "destructive",
      });
    }
  };

  const canMoveToStageOne = (project: Project) => {
    if (project.current_stage !== 'incoming') return true;
    
    // Check if staff is assigned
    if (!project.assigned_staff_id) return false;
    
    // Check if contract is signed
    if (!project.contract_signed) return false;
    
    // Check if PO is provided (if required)
    if (project.po_required && !project.po_number) return false;
    
    return true;
  };

  const getValidationIssues = (project: Project) => {
    const issues = [];
    
    if (!project.assigned_staff_id) issues.push("No staff assigned");
    if (!project.contract_signed) issues.push("Contract not signed");
    if (project.po_required && !project.po_number) issues.push("PO number required");
    
    return issues;
  };

  const moveProject = async (projectId: string, newStageId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;

    // Check validation for moving from incoming to stage01
    if (project.current_stage === 'incoming' && !canMoveToStageOne(project)) {
      const issues = getValidationIssues(project);
      toast({
        title: "Cannot Move Project",
        description: `Please resolve: ${issues.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({ current_stage: newStageId })
        .eq('id', projectId);

      if (error) throw error;

      await loadData();

      // Show billing notification for non-retainer projects
      if (!project.is_retainer) {
        const stage = stages.find(s => s.id === newStageId);
        if (stage && stage.billing_percentage > 0) {
          toast({
            title: "Billing Triggered",
            description: `${stage.billing_percentage}% invoice generated for one-off project`,
          });
        }
      }

      toast({
        title: "Success",
        description: `Project moved to ${stages.find(s => s.id === newStageId)?.name}`,
      });
    } catch (error) {
      console.error('Error moving project:', error);
      toast({
        title: "Error",
        description: "Failed to move project",
        variant: "destructive",
      });
    }
  };

  const getProjectsForStage = (stageId: string) => {
    return projects.filter(project => project.current_stage === stageId);
  };

  const getNextStage = (currentStage: string) => {
    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  };

  const getStageColor = (stageId: string) => {
    const colors = {
      'incoming': 'bg-gray-100',
      'stage01': 'bg-blue-100',
      'stage02': 'bg-yellow-100',
      'stage03': 'bg-orange-100',
      'stage04': 'bg-red-100',
      'stage05': 'bg-green-100',
      'stage06': 'bg-purple-100',
    };
    return colors[stageId as keyof typeof colors] || 'bg-gray-100';
  };

  const startEditingPo = (project: Project) => {
    setEditingProject(project.id);
    setEditPoNumber(project.po_number || "");
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Workflow Board</h2>
        <p className="text-muted-foreground">Track projects through your creative workflow with staff assignments and project gates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto">
        {stages.map((stage) => (
          <div key={stage.id} className={`${getStageColor(stage.id)} p-4 rounded-lg min-h-[500px]`}>
            <h3 className="font-semibold text-sm mb-3">{stage.name}</h3>
            <div className="space-y-3">
              {getProjectsForStage(stage.id).map((project) => {
                const validationIssues = getValidationIssues(project);
                const canProgress = canMoveToStageOne(project);
                
                return (
                  <Card key={project.id} className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{project.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">{project.client?.company || project.client?.name}</p>
                        <p className="text-xs text-muted-foreground">{project.work_type}</p>
                        
                        {project.due_date && (
                          <div className="flex items-center space-x-1 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(project.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {project.is_retainer ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Retainer
                          </span>
                        ) : (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Project
                          </span>
                        )}

                        {/* Contract Status */}
                        <div className="flex items-center space-x-1 text-xs">
                          {project.contract_signed ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span className={project.contract_signed ? "text-green-600" : "text-red-600"}>
                            Contract {project.contract_signed ? "Signed" : "Not Signed"}
                          </span>
                          {project.current_stage === 'incoming' && (
                            <Button
                              size="sm"
                              variant={project.contract_signed ? "outline" : "default"}
                              className="ml-1 h-5 text-xs"
                              onClick={() => updateContractStatus(project.id, !project.contract_signed)}
                            >
                              {project.contract_signed ? "Mark Unsigned" : "Mark Signed"}
                            </Button>
                          )}
                        </div>

                        {/* PO Number */}
                        {project.po_required && (
                          <div className="space-y-1">
                            {editingProject === project.id ? (
                              <div className="space-y-1">
                                <Input
                                  value={editPoNumber}
                                  onChange={(e) => setEditPoNumber(e.target.value)}
                                  placeholder="Enter PO number"
                                  className="h-6 text-xs"
                                />
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    className="h-5 text-xs"
                                    onClick={() => updatePoNumber(project.id, editPoNumber)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 text-xs"
                                    onClick={() => setEditingProject(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-xs">
                                  PO: {project.po_number || "Not provided"}
                                </span>
                                {project.current_stage === 'incoming' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 text-xs ml-1"
                                    onClick={() => startEditingPo(project)}
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {project.assigned_staff ? (
                          <div className="flex items-center space-x-1 text-xs">
                            <User className="w-3 h-3" />
                            <span>{project.assigned_staff.name}</span>
                          </div>
                        ) : project.current_stage === 'incoming' ? (
                          <div className="space-y-2">
                            <p className="text-xs text-red-600">No staff assigned</p>
                            <Select onValueChange={(staffId) => assignStaff(project.id, staffId)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Assign staff" />
                              </SelectTrigger>
                              <SelectContent>
                                {staff.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name} - {member.role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <p className="text-xs text-red-600">No staff assigned</p>
                        )}

                        {project.estimated_hours && (
                          <p className="text-xs">Est. Hours: {project.estimated_hours}</p>
                        )}

                        {/* Validation Issues */}
                        {project.current_stage === 'incoming' && validationIssues.length > 0 && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            <div className="flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3" />
                              <span className="font-medium">Issues to resolve:</span>
                            </div>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {validationIssues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {getNextStage(project.current_stage) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => moveProject(project.id, getNextStage(project.current_stage)!.id)}
                            disabled={project.current_stage === 'incoming' && !canProgress}
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Move Forward
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
