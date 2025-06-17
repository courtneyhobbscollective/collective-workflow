import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash, Send, Smile, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageList } from "@/components/chat/MessageList";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { GifPicker } from "@/components/chat/GifPicker";
import { MentionInput } from "@/components/chat/MentionInput"; // Reusing MentionInput for client side
import { formatChannelDisplayName } from "@/utils/channelUtils";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

interface Channel {
  id: string;
  name: string;
  description: string;
  client_id: string | null;
  is_general: boolean;
  client?: {
    name: string;
    company: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_name: string;
  sender_email: string;
  message_type: string;
  created_at: string;
  reactions: Json;
}

export function ClientChatInterface() {
  const { user, clientProfile } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (clientProfile?.client_id) {
      loadChannels(clientProfile.client_id);
    }
  }, [clientProfile]);

  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel.id);
      
      const channel = supabase
        .channel(`messages-${activeChannel.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${activeChannel.id}`
          },
          (payload) => {
            const newMsg = {
              ...payload.new,
              reactions: payload.new.reactions || []
            } as Message;
            
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMsg.id);
              if (exists) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChannels = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select(`
          *,
          client:clients(name, company)
        `)
        .eq('client_id', clientId)
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;
      
      setChannels(data || []);
      if (data && data.length > 0) {
        setActiveChannel(data[0]);
      }
    } catch (error) {
      console.error('Error loading client channels:', error);
      toast({
        title: "Error",
        description: "Failed to load client channels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      const formattedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        reactions: msg.reactions || []
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel || !user || !clientProfile) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          channel_id: activeChannel.id,
          content: newMessage,
          sender_name: clientProfile.client.name, // Client's name
          sender_email: user.email, // Client's email
          message_type: 'text'
        }]);

      if (error) throw error;

      setNewMessage("");
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      
      // Force reload messages to ensure real-time update
      setTimeout(() => {
        loadMessages(activeChannel.id);
      }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const sendGif = async (gifUrl: string) => {
    if (!activeChannel || !user || !clientProfile) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          channel_id: activeChannel.id,
          content: gifUrl,
          sender_name: clientProfile.client.name,
          sender_email: user.email,
          message_type: 'gif'
        }]);

      if (error) throw error;
      setShowGifPicker(false);
      
      setTimeout(() => {
        loadMessages(activeChannel.id);
      }, 500);
    } catch (error) {
      console.error('Error sending GIF:', error);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getChannelIcon = (channel: Channel) => {
    if (channel.client_id) return <Hash className="w-4 h-4 mr-2 text-blue-500" />;
    return <Hash className="w-4 h-4 mr-2 text-gray-500" />; // Fallback
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading chat...</div>;
  }

  if (!clientProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Client profile not loaded. Cannot access chat.</p>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        <p>No chat channels available for your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Client Chat</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Chatting as:</span>
          <span className="font-medium">{clientProfile.client.name}</span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)] bg-background border border-border rounded-lg overflow-hidden">
        {/* Channel Sidebar */}
        <div className="w-80 border-r border-border bg-muted/30">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center">
              <Hash className="w-4 h-4 mr-2" />
              Your Channels
            </h3>
            <p className="text-sm text-muted-foreground">Project & general discussions</p>
          </div>
          
          <ScrollArea className="h-full">
            <div className="p-2">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={activeChannel?.id === channel.id ? "secondary" : "ghost"}
                  className="w-full justify-start mb-1 h-auto p-3 relative"
                  onClick={() => setActiveChannel(channel)}
                >
                  <div className="flex items-center w-full">
                    {getChannelIcon(channel)}
                    <div className="flex-1 text-left">
                      <div className="font-medium">
                        {formatChannelDisplayName(channel.name, channel.client?.company)}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs bg-blue-50">Client</Badge>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChannel && (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center">
                  {getChannelIcon(activeChannel)}
                  <div>
                    <h3 className="font-semibold">
                      {formatChannelDisplayName(activeChannel.name, activeChannel.client?.company)}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <MessageList 
                  messages={messages} 
                  currentUser={{
                    name: clientProfile.client.name,
                    email: user?.email || '',
                    profile_picture_url: undefined // Clients don't have profile pictures in this system
                  }}
                  allStaff={[]} // No staff mentions for clients
                />
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <MentionInput
                      value={newMessage}
                      onChange={setNewMessage}
                      placeholder={`Message ${formatChannelDisplayName(activeChannel.name, activeChannel.client?.company)}`}
                      onSubmit={sendMessage}
                      allStaff={[]} // No staff mentions for clients
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="h-6 w-6 p-0"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowGifPicker(!showGifPicker)}
                        className="h-6 w-6 p-0"
                      >
                        <Image className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-20 right-4">
                    <EmojiPicker onEmojiSelect={addEmoji} onClose={() => setShowEmojiPicker(false)} />
                  </div>
                )}

                {/* GIF Picker */}
                {showGifPicker && (
                  <div className="absolute bottom-20 right-4">
                    <GifPicker onGifSelect={sendGif} onClose={() => setShowGifPicker(false)} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}