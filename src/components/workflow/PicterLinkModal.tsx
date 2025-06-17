import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PicterLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (picterLink: string) => void;
  currentLink?: string;
}

export function PicterLinkModal({ isOpen, onClose, onSubmit, currentLink }: PicterLinkModalProps) {
  const [picterLink, setPicterLink] = useState(currentLink || "");

  const handleSubmit = () => {
    if (picterLink.trim()) {
      let formattedLink = picterLink.trim();
      // Prepend https:// if no protocol is specified
      if (!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
        formattedLink = `https://${formattedLink}`;
      }
      onSubmit(formattedLink);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Picter Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="picter-link">Picter Link</Label>
            <Input
              id="picter-link"
              value={picterLink}
              onChange={(e) => setPicterLink(e.target.value)}
              placeholder="Enter Picter link (e.g., picter.com/your-project)"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!picterLink.trim()}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}