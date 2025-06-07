
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  title: string;
  client: string;
  isRetainer: boolean;
  dueDate: string;
  stage: string;
  assignedStaff?: string;
}

const stages = [
  { id: "incoming", name: "Incoming Brief", color: "bg-gray-100" },
  { id: "preproduction", name: "Pre-Production", color: "bg-blue-100" },
  { id: "production", name: "Production", color: "bg-yellow-100" },
  { id: "amend1", name: "Amend 1", color: "bg-orange-100" },
  { id: "amend2", name: "Amend 2", color: "bg-red-100" },
  { id: "delivery", name: "Final Delivery", color: "bg-green-100" },
  { id: "submission", name: "Client Submission", color: "bg-purple-100" },
];

export function WorkflowBoard() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "Website Development",
      client: "Tech Corp Ltd",
      isRetainer: true,
      dueDate: "2024-06-15",
      stage: "incoming",
    },
    {
      id: "2",
      title: "Logo Design",
      client: "Design Studio Inc",
      isRetainer: false,
      dueDate: "2024-06-10",
      stage: "production",
      assignedStaff: "John Smith",
    },
  ]);

  const { toast } = useToast();

  const moveProject = (projectId: string, newStage: string) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        // Trigger billing logic based on stage changes
        if (!project.isRetainer) {
          if (newStage === "preproduction") {
            toast({
              title: "Billing Triggered",
              description: "50% invoice generated for one-off project",
            });
          } else if (newStage === "amend1") {
            toast({
              title: "Billing Triggered",
              description: "30% invoice generated for one-off project",
            });
          } else if (newStage === "delivery") {
            toast({
              title: "Billing Triggered",
              description: "Final 20% invoice generated for one-off project",
            });
          }
        }
        
        return { ...project, stage: newStage };
      }
      return project;
    }));
  };

  const getProjectsForStage = (stageId: string) => {
    return projects.filter(project => project.stage === stageId);
  };

  const getNextStage = (currentStage: string) => {
    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1].id : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Workflow Board</h2>
        <p className="text-muted-foreground">Track projects through your creative workflow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto">
        {stages.map((stage) => (
          <div key={stage.id} className={`${stage.color} p-4 rounded-lg min-h-[400px]`}>
            <h3 className="font-semibold text-sm mb-3">{stage.name}</h3>
            <div className="space-y-3">
              {getProjectsForStage(stage.id).map((project) => (
                <Card key={project.id} className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{project.client}</p>
                      <div className="flex items-center space-x-1 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{project.dueDate}</span>
                      </div>
                      {project.isRetainer ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Retainer
                        </span>
                      ) : (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Project
                        </span>
                      )}
                      {project.assignedStaff && (
                        <p className="text-xs font-medium">Assigned: {project.assignedStaff}</p>
                      )}
                      {getNextStage(project.stage) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => moveProject(project.id, getNextStage(project.stage)!)}
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Move Forward
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
