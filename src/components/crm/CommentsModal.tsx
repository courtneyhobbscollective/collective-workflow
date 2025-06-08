
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

interface CommentsModalProps {
  recordId: string;
  comments: {[key: string]: string};
  onCommentsUpdate: (recordId: string, newComments: {[key: string]: string}) => void;
}

export function CommentsModal({ recordId, comments, onCommentsUpdate }: CommentsModalProps) {
  const [commentDialogs, setCommentDialogs] = useState<{[key: string]: boolean}>({});
  const [newComment, setNewComment] = useState("");

  const openCommentDialog = (recordId: string) => {
    setCommentDialogs({...commentDialogs, [recordId]: true});
  };

  const closeCommentDialog = (recordId: string) => {
    setCommentDialogs({...commentDialogs, [recordId]: false});
    setNewComment("");
  };

  const addComment = (recordId: string) => {
    if (newComment.trim()) {
      const timestamp = new Date().toLocaleString();
      const comment = `[${timestamp}] ${newComment}`;
      const existingComments = comments[recordId] || "";
      const updatedComments = {
        ...comments,
        [recordId]: existingComments ? `${existingComments}\n${comment}` : comment
      };
      onCommentsUpdate(recordId, updatedComments);
      setNewComment("");
      closeCommentDialog(recordId);
    }
  };

  const formatComment = (commentText: string) => {
    const match = commentText.match(/^\[([^\]]+)\] (.+)$/);
    if (match) {
      const [, timestamp, comment] = match;
      return {
        comment,
        timestamp,
        username: "Staff User"
      };
    }
    return {
      comment: commentText,
      timestamp: "",
      username: "Staff User"
    };
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => openCommentDialog(recordId)}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project Comments</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="max-h-40 overflow-y-auto bg-gray-50 p-4 rounded-lg">
            {comments[recordId] ? (
              <div className="space-y-3">
                {comments[recordId].split('\n').map((commentLine, index) => {
                  if (!commentLine.trim()) return null;
                  const { comment, timestamp, username } = formatComment(commentLine);
                  return (
                    <div key={index} className="bg-white p-3 rounded-lg border">
                      <p className="text-sm text-gray-900 mb-2">{comment}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="font-medium">{username}</span>
                        <span>{timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
            )}
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-20"
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => addComment(recordId)}
                disabled={!newComment.trim()}
              >
                Add Comment
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => closeCommentDialog(recordId)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
