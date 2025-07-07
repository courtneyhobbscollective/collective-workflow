import { supabase } from './supabase';
import { ChatChannel, ChatMessage } from '../types';

export class ChatService {
  // Create a new chat channel for a client
  static async createChannelForClient(clientId: string, clientName: string): Promise<ChatChannel> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const channelName = `client-${clientName.toLowerCase().replace(/\s+/g, '-')}`;
    
    console.log('Creating channel for client:', { clientId, clientName, channelName });
    
    const { data, error } = await supabase
      .from('chat_channels')
      .insert({
        client_id: clientId,
        name: channelName,
        participants: [], // Will be populated with staff members
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
    
    console.log('Channel created successfully:', data);
    
    return {
      id: data.id,
      clientId: data.client_id,
      name: data.name,
      participants: data.participants || [],
      messages: [],
      createdAt: new Date(data.created_at)
    };
  }

  // Create or get the staff channel
  static async getOrCreateStaffChannel(): Promise<ChatChannel> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // First, try to find existing staff channel
    const { data: existingChannel, error: findError } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('name', 'staff')
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw findError;
    }

    if (existingChannel) {
      return {
        id: existingChannel.id,
        clientId: existingChannel.client_id,
        name: existingChannel.name,
        participants: existingChannel.participants || [],
        messages: [],
        createdAt: new Date(existingChannel.created_at)
      };
    }

    // Create staff channel if it doesn't exist
    const { data, error } = await supabase
      .from('chat_channels')
      .insert({
        client_id: null, // Staff channel has no client
        name: 'staff',
        participants: [], // Will be populated with all staff members
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      clientId: data.client_id,
      name: data.name,
      participants: data.participants || [],
      messages: [],
      createdAt: new Date(data.created_at)
    };
  }

  // Create or get the general channel
  static async getOrCreateGeneralChannel(): Promise<ChatChannel> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // First, try to find existing general channel
    const { data: existingChannel, error: findError } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('name', 'general')
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw findError;
    }

    if (existingChannel) {
      return {
        id: existingChannel.id,
        clientId: existingChannel.client_id,
        name: existingChannel.name,
        participants: existingChannel.participants || [],
        messages: [],
        createdAt: new Date(existingChannel.created_at)
      };
    }

    // Create general channel if it doesn't exist
    const { data, error } = await supabase
      .from('chat_channels')
      .insert({
        client_id: null, // General channel has no client
        name: 'general',
        participants: [], // Will be populated with all staff members
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      clientId: data.client_id,
      name: data.name,
      participants: data.participants || [],
      messages: [],
      createdAt: new Date(data.created_at)
    };
  }

  // Create a custom channel (for staff)
  static async createCustomChannel(
    name: string, 
    description?: string, 
    participants?: string[]
  ): Promise<ChatChannel> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    console.log('Creating custom channel:', { name, description, participants });
    
    const { data, error } = await supabase
      .from('chat_channels')
      .insert({
        client_id: null, // Custom channels have no client
        name: name.toLowerCase().replace(/\s+/g, '-'),
        participants: participants || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating custom channel:', error);
      throw error;
    }
    
    console.log('Custom channel created successfully:', data);
    
    return {
      id: data.id,
      clientId: data.client_id,
      name: data.name,
      participants: data.participants || [],
      messages: [],
      createdAt: new Date(data.created_at)
    };
  }

  // Get all channels
  static async getChannels(): Promise<ChatChannel[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('chat_channels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(channel => ({
      id: channel.id,
      clientId: channel.client_id,
      name: channel.name,
      participants: channel.participants || [],
      messages: [],
      createdAt: new Date(channel.created_at)
    }));
  }

  // Get messages for a specific channel
  static async getChannelMessages(channelId: string): Promise<ChatMessage[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles(name, avatar_url)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(message => ({
      id: message.id,
      channelId: message.channel_id,
      senderId: message.sender_id,
      content: message.content,
      type: message.type,
      mentions: message.mentions || [],
      timestamp: new Date(message.created_at)
    }));
  }

  // Send a message to a channel
  static async sendMessage(
    channelId: string, 
    senderId: string, 
    content: string, 
    type: 'text' | 'image' | 'gif' | 'file' = 'text',
    mentions: string[] = []
  ): Promise<ChatMessage> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        sender_id: senderId,
        content,
        type,
        mentions,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      channelId: data.channel_id,
      senderId: data.sender_id,
      content: data.content,
      type: data.type,
      mentions: data.mentions || [],
      timestamp: new Date(data.created_at)
    };
  }

  // Subscribe to real-time messages for a channel
  static subscribeToChannelMessages(
    channelId: string, 
    onMessage: (message: ChatMessage) => void,
    onError?: (error: any) => void
  ) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const channel = supabase.channel(`chat_messages:${channelId}`);
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          const message: ChatMessage = {
            id: payload.new.id,
            channelId: payload.new.channel_id,
            senderId: payload.new.sender_id,
            content: payload.new.content,
            type: payload.new.type,
            mentions: payload.new.mentions || [],
            timestamp: new Date(payload.new.created_at)
          };
          onMessage(message);
        }
      )
      .on('error', (error: any) => {
        console.error('Chat subscription error:', error);
        if (onError) onError(error);
      })
      .subscribe();
      
    return channel;
  }

  // Unsubscribe from channel messages
  static unsubscribeFromChannelMessages(channelId: string) {
    if (!supabase) return;
    
    supabase.channel(`chat_messages:${channelId}`).unsubscribe();
  }

  // Add participant to channel
  static async addParticipantToChannel(channelId: string, participantId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get current participants
    const { data: channel, error: fetchError } = await supabase
      .from('chat_channels')
      .select('participants')
      .eq('id', channelId)
      .single();

    if (fetchError) throw fetchError;

    const currentParticipants = channel.participants || [];
    if (!currentParticipants.includes(participantId)) {
      const updatedParticipants = [...currentParticipants, participantId];
      
      const { error } = await supabase
        .from('chat_channels')
        .update({ participants: updatedParticipants })
        .eq('id', channelId);

      if (error) throw error;
    }
  }

  // Remove participant from channel
  static async removeParticipantFromChannel(channelId: string, participantId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get current participants
    const { data: channel, error: fetchError } = await supabase
      .from('chat_channels')
      .select('participants')
      .eq('id', channelId)
      .single();

    if (fetchError) throw fetchError;

    const currentParticipants = channel.participants || [];
    const updatedParticipants = currentParticipants.filter((id: string) => id !== participantId);
    
    const { error } = await supabase
      .from('chat_channels')
      .update({ participants: updatedParticipants })
      .eq('id', channelId);

    if (error) throw error;
  }

  // Delete a message (for moderators/admins)
  static async deleteMessage(messageId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  }

  // Search messages in a channel
  static async searchMessages(channelId: string, searchTerm: string): Promise<ChatMessage[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('channel_id', channelId)
      .ilike('content', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    return (data || []).map(message => ({
      id: message.id,
      channelId: message.channel_id,
      senderId: message.sender_id,
      content: message.content,
      type: message.type,
      mentions: message.mentions || [],
      timestamp: new Date(message.created_at)
    }));
  }

  // Get channel info with participant details
  static async getChannelWithParticipants(channelId: string): Promise<ChatChannel & { participantDetails: any[] }> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('chat_channels')
      .select(`
        *,
        profiles!chat_channels_participants_fkey(id, name, avatar_url, role)
      `)
      .eq('id', channelId)
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      clientId: data.client_id,
      name: data.name,
      participants: data.participants || [],
      messages: [],
      createdAt: new Date(data.created_at),
      participantDetails: data.profiles || []
    };
  }
} 