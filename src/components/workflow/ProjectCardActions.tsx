
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ProjectStage {
  id: string;
  name: string;
  order_index: number;
  billing_percentage: number;
  description: string;
}

interface ProjectCardActionsProps {
  currentStage: string;
  stages: ProjectStage[];
  canProgress: boolean;
  onMoveProject: (newStageId: string) => void;
}

export function ProjectCardActions({ 
  currentStage, 
  stages, 
  canProgress, 
  onMoveProject 
}: ProjectCardActionsProps) {
  const getNextStage = (currentStage: string) => {
    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  };

  const nextStage = getNextStage(currentStage);

  if (!nextStage) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full mt-2"
      onClick={() => onMoveProject(nextStage.id)}
      disabled={currentStage === 'incoming' && !canProgress}
    >
      <ArrowRight className="w-3 h-3 mr-1" />
      Move Forward
    </Button>
  );
}
