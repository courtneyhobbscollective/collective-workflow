
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmojiReactionPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const QUICK_REACTIONS = ["👍", "👎", "❤️", "😂", "😮", "😢", "😡", "🎉"];

export function EmojiReactionPicker({ onEmojiSelect, onClose }: EmojiReactionPickerProps) {
  return (
    <Card className="w-64 shadow-lg">
      <CardContent className="p-2">
        <div className="grid grid-cols-8 gap-1">
          {QUICK_REACTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-muted"
              onClick={() => onEmojiSelect(emoji)}
            >
              <span className="text-lg">{emoji}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
