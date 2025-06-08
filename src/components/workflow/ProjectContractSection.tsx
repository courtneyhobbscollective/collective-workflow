
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
    <div className="flex items-center space-x-1 text-xs">
      {contractSigned ? (
        <CheckCircle className="w-3 h-3 text-green-600" />
      ) : (
        <AlertCircle className="w-3 h-3 text-red-600" />
      )}
      <span className={contractSigned ? "text-green-600" : "text-red-600"}>
        Contract {contractSigned ? "Signed" : "Not Signed"}
      </span>
      {currentStage === 'incoming' && (
        <Button
          size="sm"
          variant={contractSigned ? "outline" : "default"}
          className="ml-1 h-5 text-xs"
          onClick={() => onUpdateContract(!contractSigned)}
        >
          {contractSigned ? "Mark Unsigned" : "Mark Signed"}
        </Button>
      )}
    </div>
  );
}
