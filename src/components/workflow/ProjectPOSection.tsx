
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProjectPOSectionProps {
  poRequired: boolean;
  poNumber?: string;
  currentStage: string;
  projectId: string;
  onUpdatePoNumber: (projectId: string, poNumber: string) => void;
}

export function ProjectPOSection({ 
  poRequired, 
  poNumber, 
  currentStage, 
  projectId, 
  onUpdatePoNumber 
}: ProjectPOSectionProps) {
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editPoNumber, setEditPoNumber] = useState("");

  const startEditingPo = () => {
    setEditingProject(projectId);
    setEditPoNumber(poNumber || "");
  };

  const handleSave = () => {
    onUpdatePoNumber(projectId, editPoNumber);
    setEditingProject(null);
  };

  if (!poRequired) return null;

  return (
    <div className="space-y-1">
      {editingProject === projectId ? (
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
              onClick={handleSave}
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
            PO: {poNumber || "Not provided"}
          </span>
          {currentStage === 'incoming' && (
            <Button
              size="sm"
              variant="outline"
              className="h-5 text-xs ml-1"
              onClick={startEditingPo}
            >
              Edit
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
