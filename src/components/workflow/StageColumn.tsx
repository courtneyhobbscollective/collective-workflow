
import { ProjectCard } from "./ProjectCard";

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

interface StageColumnProps {
  stage: ProjectStage;
  projects: Project[];
  staff: Staff[];
  stages: ProjectStage[];
  onAssignStaff: (projectId: string, staffId: string) => void;
  onUpdateContract: (projectId: string, signed: boolean) => void;
  onUpdatePoNumber: (projectId: string, poNumber: string) => void;
  onMoveProject: (projectId: string, newStageId: string) => void;
}

export function StageColumn({
  stage,
  projects,
  staff,
  stages,
  onAssignStaff,
  onUpdateContract,
  onUpdatePoNumber,
  onMoveProject
}: StageColumnProps) {
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

  return (
    <div className={`${getStageColor(stage.id)} p-4 rounded-lg min-h-[500px]`}>
      <h3 className="font-semibold text-sm mb-3">{stage.name}</h3>
      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            staff={staff}
            stages={stages}
            onAssignStaff={onAssignStaff}
            onUpdateContract={onUpdateContract}
            onUpdatePoNumber={onUpdatePoNumber}
            onMoveProject={onMoveProject}
          />
        ))}
      </div>
    </div>
  );
}
