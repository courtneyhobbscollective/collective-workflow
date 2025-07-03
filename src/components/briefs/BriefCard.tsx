import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Trash2, 
  FileText, 
  Calendar, 
  Clock, 
  ChevronDown,
  User,
  Building
} from "lucide-react";

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

interface BriefCardProps {
  project: Project;
  onDelete: (project: Project) => void;
}

export function BriefCard({ project, onDelete }: BriefCardProps) {
  const dueDate = new Date(project.due_date);
  const isOverdue = dueDate < new Date();

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

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={project.id} className="border rounded-lg bg-white shadow-sm">
        <AccordionTrigger hideChevron className="flex items-center w-full px-4 py-4 hover:bg-muted/50 transition-colors group no-underline hover:no-underline focus:no-underline">
          <div className="flex flex-col items-start flex-1">
            {project.client?.company || project.client?.name ? (
              <Badge className="mb-1 bg-blue-100 text-blue-800 border border-blue-300 font-normal">
                {project.client?.company || project.client?.name}
              </Badge>
            ) : null}
            <h3 className="font-semibold text-base mb-1">{project.title}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
              <FileText className="w-3 h-3" />
              <span>{project.work_type}</span>
              <Calendar className="w-3 h-3" />
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                {dueDate.toLocaleDateString()}
              </span>
              {project.estimated_hours && (
                <>
                  <Clock className="w-3 h-3" />
                  <span>{project.estimated_hours}h</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {project.is_retainer ? (
                <Badge className="bg-green-100 text-green-800 border border-green-300 font-normal">
                  Retainer
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800 border border-blue-300 font-normal">
                  Project
                </Badge>
              )}
              {project.treat_as_oneoff && (
                <Badge className="bg-purple-100 text-purple-800 border border-purple-300 font-normal">
                  One-off
                </Badge>
              )}
              <Badge className={`${getStatusColor(project.current_stage)}`}>
                {getStageDisplayName(project.current_stage)}
              </Badge>
            </div>
          </div>
          
          {/* Chevron in a circle at the far right */}
          <span className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover:bg-accent transition-colors">
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          </span>
        </AccordionTrigger>
        
        <AccordionContent className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Client Information and Status */}
            <div className="space-y-4 h-full">
              <Card className="bg-gray-50 h-full">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2">Client Information</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-1">
                      <Building className="w-3 h-3" />
                      <span className="font-medium">Company:</span> {project.client?.company || project.client?.name}
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span className="font-medium">Contact:</span> {project.client?.name}
                    </div>
                    <div><span className="font-medium">Client Type:</span> {project.client?.is_retainer ? 'Retainer' : 'Project'}</div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Project Status</h4>
                    <div className="space-y-1 text-xs">
                      <div><span className="font-medium">Current Stage:</span> {getStageDisplayName(project.current_stage)}</div>
                      <div><span className="font-medium">Due Date:</span> {dueDate.toLocaleDateString()}</div>
                      {isOverdue && (
                        <div className="text-red-600 font-medium">⚠️ Overdue</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right: Project Details and Description */}
            <div className="space-y-4 h-full">
              <Card className="bg-gray-50 h-full">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2">Project Details</h4>
                  <div className="space-y-1 text-xs">
                    <div><span className="font-medium">Work Type:</span> {project.work_type}</div>
                    <div><span className="font-medium">Deliverables:</span> {project.deliverables}</div>
                    {project.po_number && (
                      <div><span className="font-medium">PO Number:</span> {project.po_number}</div>
                    )}
                    {project.estimated_hours && (
                      <div><span className="font-medium">Estimated Hours:</span> {project.estimated_hours}h</div>
                    )}
                    {project.project_value && (
                      <div><span className="font-medium">Project Value:</span> £{project.project_value.toLocaleString()}</div>
                    )}
                  </div>
                  {project.description && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">Description</h4>
                      <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                        {(project.description || '').split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex justify-end mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(project)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 