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
import { MentionInput } from "./MentionInput";
import { formatChannelDisplayName } from "@/utils/channelUtils";
import { useStaff } from "@/contexts/StaffContext";
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

interface MentionCount {
  channel_id: string;
  unread_count: number;
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
  const [mentionCounts, setMentionCounts] = useState<MentionCount[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentStaff, allStaff } = useStaff();

  useEffect(() => {
    loadChannels();
    loadClients();
    if (currentStaff) {
      loadMentionCounts();
    }
  }, [currentStaff]);

  // Check for target channel ID from mention notifications
  useEffect(() => {
    const targetChannelId = sessionStorage.getItem('targetChannelId');
    if (targetChannelId && channels.length > 0) {
      const targetChannel = channels.find(channel => channel.id === targetChannelId);
      if (targetChannel) {
        setActiveChannel(targetChannel);
        sessionStorage.removeItem('targetChannelId'); // Clear after use
      }
    } else if (channels.length > 0 && !activeChannel) {
      // Only set default channel if no target channel is specified
      setActiveChannel(channels[0]);
    }
  }, [channels, activeChannel]);

  useEffect(() => {
    if (activeChannel) {
      console.log('Active channel changed to:', activeChannel.id);
      loadMessages(activeChannel.id);
      markMentionsAsRead(activeChannel.id);
      
      // Subscribe to new messages for this channel
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
            console.log('Real-time message received:', payload);
            const newMsg = {
              ...payload.new,
              reactions: payload.new.reactions || []
            } as Message;
            
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMsg.id);
              if (exists) {
                console.log('Message already exists, skipping duplicate');
                return prev;
              }
              console.log('Adding new message to state, new total:', prev.length + 1);
              return [...prev, newMsg];
            });
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to channel messages');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Subscription error, attempting to reconnect...');
            setTimeout(() => {
              console.log('Reloading messages due to subscription failure');
              loadMessages(activeChannel.id);
            }, 1000);
          }
        });

      return () => {
        console.log('Cleaning up realtime subscription for channel:', activeChannel.id);
        supabase.removeChannel(channel);
      };
    }
  }, [activeChannel]);

  useEffect(() => {
    if (currentStaff) {
      // Subscribe to mention updates
      const mentionChannel = supabase
        .channel('mention-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'message_mentions',
            filter: `mentioned_staff_email=eq.${currentStaff.email}`
          },
          () => {
            loadMentionCounts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(mentionChannel);
      };
    }
  }, [currentStaff]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  useEffect(() => {
    // Scroll the chat thread to the bottom by setting scrollTop
    const viewport = scrollAreaViewportRef.current;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

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
      
      console.log('Loaded channels:', data?.length);
      setChannels(data || []);
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

  const loadMentionCounts = async () => {
    if (!currentStaff) return;

    try {
      const { data, error } = await supabase
        .from('message_mentions')
        .select(`
          message_id,
          messages!inner(channel_id)
        `)
        .eq('mentioned_staff_email', currentStaff.email)
        .eq('is_read', false);

      if (error) throw error;

      // Count mentions per channel
      const counts: Record<string, number> = {};
      data?.forEach((mention: any) => {
        const channelId = mention.messages.channel_id;
        counts[channelId] = (counts[channelId] || 0) + 1;
      });

      const mentionCountsArray = Object.entries(counts).map(([channel_id, unread_count]) => ({
        channel_id,
        unread_count
      }));

      setMentionCounts(mentionCountsArray);
    } catch (error) {
      console.error('Error loading mention counts:', error);
    }
  };

  const markMentionsAsRead = async (channelId: string) => {
    if (!currentStaff) return;

    try {
      // First get the message IDs for the channel
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('channel_id', channelId);

      if (messagesError) throw messagesError;

      const messageIds = messages?.map(msg => msg.id) || [];

      if (messageIds.length > 0) {
        const { error } = await supabase
          .from('message_mentions')
          .update({ is_read: true })
          .eq('mentioned_staff_email', currentStaff.email)
          .eq('is_read', false)
          .in('message_id', messageIds);

        if (error) throw error;
      }
      
      loadMentionCounts();
    } catch (error) {
      console.error('Error marking mentions as read:', error);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      console.log('Loading messages for channel:', channelId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      console.log('Loaded messages:', data?.length);
      const formattedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        reactions: msg.reactions || []
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const processMentions = async (content: string, messageId: string) => {
    if (!currentStaff) return;

    console.log('Processing mentions for message:', content);
    console.log('Current staff:', currentStaff);

    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    
    console.log('Found mentions:', mentions);
    
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.substring(1).toLowerCase();
        console.log('Processing mention:', username);
        
        const mentionedStaff = allStaff.find(staff => 
          staff.name.toLowerCase().includes(username) ||
          staff.email.toLowerCase().includes(username)
        );

        console.log('Found mentioned staff:', mentionedStaff);

        if (mentionedStaff) {
          try {
            console.log('Creating mention for:', mentionedStaff.email);
            const { data, error } = await supabase
              .from('message_mentions')
              .insert({
                message_id: messageId,
                mentioned_staff_email: mentionedStaff.email,
                mentioned_staff_name: mentionedStaff.name
              })
              .select();

            if (error) {
              console.error('Error creating mention:', error);
            } else {
              console.log('Mention created successfully:', data);
            }
          } catch (error) {
            console.error('Error creating mention:', error);
          }
        }
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel || !currentStaff) return;

    console.log('Sending message:', newMessage);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          channel_id: activeChannel.id,
          content: newMessage,
          sender_name: currentStaff.name,
          sender_email: currentStaff.email,
          message_type: 'text'
        }])
        .select()
        .single();

      if (error) throw error;

      // Process mentions after message is created
      await processMentions(newMessage, data.id);

      console.log('Message sent successfully');
      setNewMessage("");
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      
      setTimeout(() => {
        console.log('Force reloading messages after send');
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
    if (!activeChannel || !currentStaff) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          channel_id: activeChannel.id,
          content: gifUrl,
          sender_name: currentStaff.name,
          sender_email: currentStaff.email,
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

  const getMentionCount = (channelId: string) => {
    const mentionData = mentionCounts.find(m => m.channel_id === channelId);
    return mentionData?.unread_count || 0;
  };

  function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!currentStaff) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Please select a staff member to use the chat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Chat</h2>
      </div>

      <div className="flex h-[calc(100vh-200px)] bg-background border border-border rounded-lg overflow-hidden">
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
              {channels.map((channel) => {
                const mentionCount = getMentionCount(channel.id);
                return (
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
                          {truncateText(formatChannelDisplayName(channel.name, channel.client?.company), 16)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {mentionCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-xs px-1">
                            {mentionCount}
                          </Badge>
                        )}
                        {getChannelBadge(channel)}
                      </div>
                    </div>
                  </Button>
                );
              })}
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
                      {truncateText(formatChannelDisplayName(activeChannel.name, activeChannel.client?.company), 16)}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" viewportRef={scrollAreaViewportRef}>
                <MessageList 
                  messages={messages} 
                  currentUser={{
                    name: currentStaff.name,
                    email: currentStaff.email,
                    profile_picture_url: currentStaff.profile_picture_url
                  }}
                  allStaff={allStaff}
                />
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <MentionInput
                      value={newMessage}
                      onChange={setNewMessage}
                      placeholder={`Message ${truncateText(formatChannelDisplayName(activeChannel.name, activeChannel.client?.company), 16)}`}
                      onSubmit={sendMessage}
                      allStaff={allStaff}
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
    </div>
  );
}
