
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Smile, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmojiReactionPicker } from "./EmojiReactionPicker";

interface Message {
  id: string;
  content: string;
  sender_name: string;
  sender_email: string;
  message_type: string;
  created_at: string;
  reactions: any[];
}

interface MessageListProps {
  messages: Message[];
  currentUser: {
    name: string;
    email: string;
  };
}

export function MessageList({ messages, currentUser }: MessageListProps) {
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .insert([{
          message_id: messageId,
          user_name: currentUser.name,
          user_email: currentUser.email,
          emoji: emoji
        }]);

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
    setShowReactionPicker(null);
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_email === currentUser.email;
    
    return (
      <div
        key={message.id}
        className={`group flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-lg ${
          isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
        <Avatar className="w-8 h-8">
          <AvatarFallback className="text-xs">
            {message.sender_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">{message.sender_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <div className={`relative ${isOwnMessage ? 'flex justify-end' : ''}`}>
            {message.message_type === 'gif' ? (
              <img 
                src={message.content} 
                alt="GIF" 
                className="max-w-xs rounded-lg"
                style={{ maxHeight: '200px' }}
              />
            ) : (
              <div className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
                isOwnMessage 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                {message.content}
              </div>
            )}
            
            {/* Reaction button */}
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0 bg-background"
                onClick={() => setShowReactionPicker(message.id)}
              >
                <Smile className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap mt-2 space-x-1">
              {message.reactions.map((reaction, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                >
                  {reaction.emoji} {reaction.count}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {/* Reaction Picker */}
        {showReactionPicker === message.id && (
          <div className="absolute z-10 mt-8">
            <EmojiReactionPicker
              onEmojiSelect={(emoji) => addReaction(message.id, emoji)}
              onClose={() => setShowReactionPicker(null)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {messages.map(renderMessage)}
    </div>
  );
}
