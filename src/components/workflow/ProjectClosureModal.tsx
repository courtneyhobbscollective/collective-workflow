
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProjectClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  projectId: string;
}

interface ClosureChecklist {
  finalVersionUploaded: boolean;
  driveLink: string;
}

export function ProjectClosureModal({ isOpen, onClose, onComplete, projectId }: ProjectClosureModalProps) {
  const [checklist, setChecklist] = useState<ClosureChecklist>({
    finalVersionUploaded: false,
    driveLink: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadExistingChecklist();
    }
  }, [isOpen, projectId]);

  const loadExistingChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from('project_closure_checklist')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setChecklist({
          finalVersionUploaded: data.final_version_uploaded || false,
          driveLink: data.drive_link || ""
        });
      }
    } catch (error) {
      console.error('Error loading closure checklist:', error);
    }
  };

  const handleComplete = async () => {
    if (!checklist.finalVersionUploaded || !checklist.driveLink.trim()) {
      toast({
        title: "Incomplete Checklist",
        description: "Please complete all items before closing the project",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Save/update checklist
      const { error: checklistError } = await supabase
        .from('project_closure_checklist')
        .upsert({
          project_id: projectId,
          final_version_uploaded: checklist.finalVersionUploaded,
          drive_link: checklist.driveLink,
          completed_at: new Date().toISOString()
        });

      if (checklistError) throw checklistError;

      onComplete();
      onClose();
      
      toast({
        title: "Project Closure",
        description: "Project closure checklist completed successfully",
      });
    } catch (error) {
      console.error('Error completing closure checklist:', error);
      toast({
        title: "Error",
        description: "Failed to complete closure checklist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isComplete = checklist.finalVersionUploaded && checklist.driveLink.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project Closure Checklist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="final-version"
              checked={checklist.finalVersionUploaded}
              onCheckedChange={(checked) => 
                setChecklist(prev => ({ ...prev, finalVersionUploaded: checked as boolean }))
              }
            />
            <Label htmlFor="final-version" className="text-sm">
              Have you uploaded the final version of this project to the client's Drive?
            </Label>
          </div>
          
          <div>
            <Label htmlFor="drive-link">Drive Link</Label>
            <Input
              id="drive-link"
              value={checklist.driveLink}
              onChange={(e) => setChecklist(prev => ({ ...prev, driveLink: e.target.value }))}
              placeholder="Enter Drive link"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleComplete} 
            disabled={!isComplete || loading}
          >
            {loading ? "Completing..." : "Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
