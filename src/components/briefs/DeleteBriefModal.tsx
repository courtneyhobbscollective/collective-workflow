
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteBriefModalProps {
  briefTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteBriefModal({ briefTitle, open, onOpenChange, onConfirm }: DeleteBriefModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span>Delete Brief</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete "{briefTitle}"?
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This action cannot be undone. This will permanently delete the brief and all associated data including:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Project bookings and calendar entries</li>
              <li>Expenses and billing records</li>
              <li>Stage history and notifications</li>
              <li>Any uploaded files or links</li>
            </ul>
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="w-4 h-4 mr-2" />
            Permanently Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
