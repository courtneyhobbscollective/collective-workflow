
import { useState } from "react";
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
import { AlertTriangle, Trash2, UserX } from "lucide-react";
import type { Staff } from "@/types/staff";

interface DeleteStaffModalProps {
  staff: Staff;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (staffId: string, permanent: boolean) => void;
}

export function DeleteStaffModal({ staff, open, onOpenChange, onConfirm }: DeleteStaffModalProps) {
  const [deleteType, setDeleteType] = useState<'deactivate' | 'permanent'>('deactivate');

  const handleConfirm = () => {
    onConfirm(staff.id, deleteType === 'permanent');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span>Remove Staff Member</span>
          </DialogTitle>
          <DialogDescription>
            Choose how you want to remove {staff.name} from the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action will immediately revoke {staff.name}'s access to the system.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                id="deactivate"
                name="deleteType"
                value="deactivate"
                checked={deleteType === 'deactivate'}
                onChange={(e) => setDeleteType(e.target.value as 'deactivate')}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="deactivate" className="flex items-center space-x-2 cursor-pointer">
                  <UserX className="w-4 h-4" />
                  <span className="font-medium">Deactivate (Recommended)</span>
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Keeps staff member in the system but removes access. Can be reactivated later.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="radio"
                id="permanent"
                name="deleteType"
                value="permanent"
                checked={deleteType === 'permanent'}
                onChange={(e) => setDeleteType(e.target.value as 'permanent')}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="permanent" className="flex items-center space-x-2 cursor-pointer">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span className="font-medium text-destructive">Permanent Delete</span>
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Completely removes staff member and all associated data. This cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant={deleteType === 'permanent' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {deleteType === 'permanent' ? 'Permanently Delete' : 'Deactivate'} {staff.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
