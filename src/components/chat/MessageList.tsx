
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Smile, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmojiReactionPicker } from "./EmojiReactionPicker";
import type { Json } from "@/integrations/supabase/types";

interface Message {
  id: string;
  content: string;
  sender_name: string;
  sender_email: string;
  message_type: string;
  created_at: string;
  reactions: Json;
}

interface MessageListProps {
  messages: Message[];
  currentUser: {
    name: string;
    email: string;
    profile_picture_url?: string | null;
  };
  allStaff?: Array<{
    name: string;
    email: string;
    profile_picture_url?: string | null;
  }>;
}

export function MessageList({ messages, currentUser, allStaff = [] }: MessageListProps) {
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

  console.log('MessageList rendering with messages:', messages.length);

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

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const getStaffProfilePicture = (senderEmail: string) => {
    const staff = allStaff.find(s => s.email === senderEmail);
    return staff?.profile_picture_url || null;
  };

  const formatMessageContent = (content: string, allStaff: Array<{name: string; email: string}>) => {
    // Replace @mentions with styled spans
    const mentionRegex = /@(\w+)/g;
    
    return content.replace(mentionRegex, (match, username) => {
      const mentionedStaff = allStaff.find(staff => 
        staff.name.toLowerCase().includes(username.toLowerCase())
      );
      
      if (mentionedStaff) {
        return `<span class="bg-blue-100 text-blue-800 px-1 rounded font-medium">${match}</span>`;
      }
      
      return match;
    });
  };

  const renderMessage = (message: Message) => {
    const reactions = Array.isArray(message.reactions) ? message.reactions : [];
    const profilePictureUrl = getStaffProfilePicture(message.sender_email);
    
    return (
      <div
        key={message.id}
        className="group flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-lg w-full"
      >
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={profilePictureUrl || undefined} />
          <AvatarFallback className="text-xs">
            {message.sender_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">{getFirstName(message.sender_name)}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <div className="relative w-full">
            {message.message_type === 'gif' ? (
              <img 
                src={message.content} 
                alt="GIF" 
                className="max-w-xs rounded-lg"
                style={{ maxHeight: '200px' }}
              />
            ) : (
              <div className="w-full">
                <div 
                  className="text-sm break-words"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessageContent(message.content, allStaff) 
                  }}
                />
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
          {reactions && reactions.length > 0 && (
            <div className="flex flex-wrap mt-2 space-x-1">
              {reactions.map((reaction: any, index: number) => (
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

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {messages.map(renderMessage)}
    </div>
  );
}
