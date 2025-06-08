
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash, Users, Send, Smile, Image, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageList } from "./MessageList";
import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";
import { ChannelCreationModal } from "./ChannelCreationModal";
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

interface Client {
  id: string;
  name: string;
  company: string;
}

export function ChatInterface() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Mock user for now - in a real app this would come from auth
  const currentUser = {
    name: "Staff Member",
    email: "staff@collective.uk"
  };

  useEffect(() => {
    loadChannels();
    loadClients();
  }, []);

  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel.id);
      subscribeToMessages(activeChannel.id);
    }
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select(`
          *,
          client:clients(name, company)
        `)
        .eq('is_archived', false)
        .order('is_general', { ascending: false })
        .order('name');

      if (error) throw error;
      
      setChannels(data || []);
      if (data && data.length > 0) {
        setActiveChannel(data[0]);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      toast({
        title: "Error",
        description: "Failed to load channels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, company')
        .eq('is_active', true)
        .order('company');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
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
      // Convert the data to match our Message interface
      const formattedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        reactions: msg.reactions || []
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = (channelId: string) => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          const newMsg = {
            ...payload.new,
            reactions: payload.new.reactions || []
          } as Message;
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          channel_id: activeChannel.id,
          content: newMessage,
          sender_name: currentUser.name,
          sender_email: currentUser.email,
          message_type: 'text'
        }]);

      if (error) throw error;

      setNewMessage("");
      setShowEmojiPicker(false);
      setShowGifPicker(false);
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
    if (!activeChannel) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          channel_id: activeChannel.id,
          content: gifUrl,
          sender_name: currentUser.name,
          sender_email: currentUser.email,
          message_type: 'gif'
        }]);

      if (error) throw error;
      setShowGifPicker(false);
    } catch (error) {
      console.error('Error sending GIF:', error);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleChannelCreated = () => {
    loadChannels();
  };

  const getChannelIcon = (channel: Channel) => {
    if (channel.is_general) return <Hash className="w-4 h-4 mr-2 text-muted-foreground" />;
    if (channel.client_id) return <Hash className="w-4 h-4 mr-2 text-blue-500" />;
    return <Hash className="w-4 h-4 mr-2 text-green-500" />;
  };

  const getChannelBadge = (channel: Channel) => {
    if (channel.is_general) return <Badge variant="outline" className="ml-2 text-xs">General</Badge>;
    if (channel.client_id) return <Badge variant="outline" className="ml-2 text-xs bg-blue-50">Client</Badge>;
    return <Badge variant="outline" className="ml-2 text-xs bg-green-50">Custom</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-background border border-border rounded-lg overflow-hidden">
      {/* Channel Sidebar */}
      <div className="w-80 border-r border-border bg-muted/30">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Team Chat
              </h3>
              <p className="text-sm text-muted-foreground">Internal communication</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowChannelModal(true)}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-full">
          <div className="p-2">
            {channels.map((channel) => (
              <Button
                key={channel.id}
                variant={activeChannel?.id === channel.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 h-auto p-3"
                onClick={() => setActiveChannel(channel)}
              >
                <div className="flex items-center w-full">
                  {getChannelIcon(channel)}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{channel.name}</div>
                    {channel.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {channel.description}
                      </div>
                    )}
                  </div>
                  {getChannelBadge(channel)}
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
                  <h3 className="font-semibold">{activeChannel.name}</h3>
                  {activeChannel.description && (
                    <p className="text-sm text-muted-foreground">
                      {activeChannel.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <MessageList messages={messages} currentUser={currentUser} />
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message #${activeChannel.name}`}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="pr-24"
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

      {/* Channel Creation Modal */}
      <ChannelCreationModal
        isOpen={showChannelModal}
        onClose={() => setShowChannelModal(false)}
        onChannelCreated={handleChannelCreated}
        clients={clients}
      />
    </div>
  );
}
