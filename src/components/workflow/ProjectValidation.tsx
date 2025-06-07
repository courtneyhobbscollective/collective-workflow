
import { AlertCircle } from "lucide-react";

interface Project {
  id: string;
  assigned_staff_id: string | null;
  contract_signed: boolean;
  po_required: boolean;
  po_number: string;
  current_stage: string;
}

interface ProjectValidationProps {
  project: Project;
}

export const canMoveToStageOne = (project: Project) => {
  if (project.current_stage !== 'incoming') return true;
  
  // Check if staff is assigned
  if (!project.assigned_staff_id) return false;
  
  // Check if contract is signed
  if (!project.contract_signed) return false;
  
  // Check if PO is provided (if required)
  if (project.po_required && !project.po_number) return false;
  
  return true;
};

export const getValidationIssues = (project: Project) => {
  const issues = [];
  
  if (!project.assigned_staff_id) issues.push("No staff assigned");
  if (!project.contract_signed) issues.push("Contract not signed");
  if (project.po_required && !project.po_number) issues.push("PO number required");
  
  return issues;
};

export function ProjectValidation({ project }: ProjectValidationProps) {
  const validationIssues = getValidationIssues(project);

  if (project.current_stage !== 'incoming' || validationIssues.length === 0) {
    return null;
  }

  return (
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
  );
}
