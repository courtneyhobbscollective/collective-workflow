import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

interface ProjectContractSectionProps {
  contractSigned: boolean;
  currentStage: string;
  onUpdateContract: (signed: boolean) => void;
}

export function ProjectContractSection({ 
  contractSigned, 
  currentStage, 
  onUpdateContract 
}: ProjectContractSectionProps) {
  return (
    <div className="relative flex flex-col items-center justify-center text-xs py-4 min-h-[64px]">
      <div className="flex items-center space-x-1 mb-2">
        {contractSigned ? (
          <CheckCircle className="w-3 h-3 text-green-600" />
        ) : (
          <AlertCircle className="w-3 h-3 text-red-600" />
        )}
        <span className={contractSigned ? "text-green-600" : "text-red-600"}>
          Contract {contractSigned ? "Signed" : "Not Signed"}
        </span>
      </div>
      {currentStage === 'incoming' && (
        <Button
          size="sm"
          variant={contractSigned ? "outline" : "default"}
          className="h-5 text-xs shadow-lg"
          onClick={() => onUpdateContract(!contractSigned)}
        >
          {contractSigned ? "Mark Unsigned" : "Mark Signed"}
        </Button>
      )}
    </div>
  );
}
