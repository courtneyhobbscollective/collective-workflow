
import { Clock } from "lucide-react";

interface Client {
  id: string;
  name: string;
  company: string;
  is_retainer: boolean;
  email?: string;
}

interface ProjectCardHeaderProps {
  title: string;
  client?: Client;
  workType: string;
  dueDate?: string;
  isRetainer: boolean;
}

export function ProjectCardHeader({ 
  title, 
  client, 
  workType, 
  dueDate, 
  isRetainer 
}: ProjectCardHeaderProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{client?.company || client?.name}</p>
      <p className="text-xs text-muted-foreground">{workType}</p>
      
      {dueDate && (
        <div className="flex items-center space-x-1 text-xs">
          <Clock className="w-3 h-3" />
          <span>{new Date(dueDate).toLocaleDateString()}</span>
        </div>
      )}
      
      {isRetainer ? (
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          Retainer
        </span>
      ) : (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          Project
        </span>
      )}
    </div>
  );
}
