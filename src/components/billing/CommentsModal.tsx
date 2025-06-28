import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

interface CommentsModalProps {
  recordId: string;
  comments: {[key: string]: string};
  onCommentsUpdate: (recordId: string, newComments: {[key: string]: string}) => void;
}

export function CommentsModal({ recordId, comments, onCommentsUpdate }: CommentsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState(comments[recordId] || "");

  const handleSave = () => {
    const newComments = { ...comments, [recordId]: currentComment };
    onCommentsUpdate(recordId, newComments);
    setIsOpen(false);
  };

  const hasComment = comments[recordId] && comments[recordId].trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MessageSquare className={`w-4 h-4 ${hasComment ? 'text-blue-600' : 'text-muted-foreground'}`} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={currentComment}
            onChange={(e) => setCurrentComment(e.target.value)}
            placeholder="Add a comment..."
            rows={4}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 