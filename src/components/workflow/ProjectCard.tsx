
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Clock, User, AlertCircle, CheckCircle } from "lucide-react";
import { ProjectValidation, canMoveToStageOne } from "./ProjectValidation";

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

interface ProjectCardProps {
  project: Project;
  staff: Staff[];
  stages: ProjectStage[];
  onAssignStaff: (projectId: string, staffId: string) => void;
  onUpdateContract: (projectId: string, signed: boolean) => void;
  onUpdatePoNumber: (projectId: string, poNumber: string) => void;
  onMoveProject: (projectId: string, newStageId: string) => void;
}

export function ProjectCard({
  project,
  staff,
  stages,
  onAssignStaff,
  onUpdateContract,
  onUpdatePoNumber,
  onMoveProject
}: ProjectCardProps) {
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editPoNumber, setEditPoNumber] = useState("");

  const getNextStage = (currentStage: string) => {
    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  };

  const startEditingPo = (project: Project) => {
    setEditingProject(project.id);
    setEditPoNumber(project.po_number || "");
  };

  const canProgress = canMoveToStageOne(project);

  return (
    <Card className="bg-white">
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
                onClick={() => onUpdateContract(project.id, !project.contract_signed)}
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
                      onClick={() => onUpdatePoNumber(project.id, editPoNumber)}
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
              <Select onValueChange={(staffId) => onAssignStaff(project.id, staffId)}>
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
          <ProjectValidation project={project} />

          {getNextStage(project.current_stage) && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={() => onMoveProject(project.id, getNextStage(project.current_stage)!.id)}
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
}
