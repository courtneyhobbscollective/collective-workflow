import { useState, useEffect } from "react";
import { Bell, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface MentionNotification {
  id: string;
  message_id: string;
  mentioned_staff_email: string;
  mentioned_staff_name: string;
  is_read: boolean;
  created_at: string;
  messages: {
    content: string;
    sender_name: string;
    created_at: string;
    channel_id: string;
  };
}

interface NotificationBellProps {
  onTabChange: (tab: string) => void;
  staffEmail?: string;
}

export function NotificationBell({ onTabChange, staffEmail }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mentionNotifications, setMentionNotifications] = useState<MentionNotification[]>([]);
  const [channelNames, setChannelNames] = useState<Record<string, string>>({});

  // Fetch unread mentions and channel names
  const loadMentionsAndChannels = async () => {
    if (!staffEmail) return;
    const { data, error } = await supabase
      .from('message_mentions')
      .select(`id, message_id, mentioned_staff_email, mentioned_staff_name, is_read, created_at, messages:messages(content, sender_name, created_at, channel_id)`)
      .eq('mentioned_staff_email', staffEmail)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    if (error) return;
    setMentionNotifications(data || []);
    // Fetch channel names
    const channelIds = [...new Set((data || []).map(n => n.messages?.channel_id).filter(Boolean))];
    if (channelIds.length > 0) {
      const { data: channels } = await supabase
        .from('channels')
        .select('id, name, is_general, client:clients(company)')
        .in('id', channelIds);
      const names: Record<string, string> = {};
      channels?.forEach(channel => {
        if (channel.is_general) names[channel.id] = 'General';
        else if (channel.client?.company) names[channel.id] = `${channel.name} (${channel.client.company})`;
        else names[channel.id] = channel.name;
      });
      setChannelNames(names);
    }
  };

  useEffect(() => { loadMentionsAndChannels(); }, [staffEmail]);

  // Mark as read
  const handleViewMention = async (notification: MentionNotification) => {
    await supabase.from('message_mentions').update({ is_read: true }).eq('id', notification.id);
    setMentionNotifications(prev => prev.filter(n => n.id !== notification.id));
    if (notification.messages?.channel_id) {
      sessionStorage.setItem('targetChannelId', notification.messages.channel_id);
    }
    onTabChange('chat');
    setIsOpen(false);
  };
  // Dismiss
  const handleDismissMention = async (notification: MentionNotification) => {
    await supabase.from('message_mentions').update({ is_read: true }).eq('id', notification.id);
    setMentionNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  const unreadCount = mentionNotifications.length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2 h-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-md shadow-lg z-50">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-sm">Notifications</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount === 0 ? 'No new mentions' : `${unreadCount} unread mention${unreadCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {unreadCount === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No new notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {mentionNotifications.map((notification) => {
                  const channelId = notification.messages?.channel_id;
                  const channelName = channelNames[channelId || ''] || 'Unknown Channel';
                  return (
                    <div key={notification.id} className="p-3 hover:bg-gray-50 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          <MessageSquare className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              <span className="text-orange-600">@{notification.mentioned_staff_name}</span> mentioned in <span className="font-semibold">{channelName}</span>
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              by {notification.messages?.sender_name || 'Someone'} • {new Date(notification.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-6 px-2"
                            onClick={() => handleViewMention(notification)}
                          >
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs h-6 w-6 p-0 hover:bg-gray-100"
                            onClick={() => handleDismissMention(notification)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 