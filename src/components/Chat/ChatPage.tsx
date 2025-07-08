import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ChatChannel, ChatMessage } from '../../types';
import { ChatService } from '../../lib/chatService';
import { 
  Send, Paperclip, Smile, Search, Hash, 
  Users, MessageCircle, Image, File, Plus, Zap 
} from 'lucide-react';
import { capitalizeWords } from '../../lib/capitalizeWords';

const ChatPage: React.FC = () => {
  const { chatChannels, clients, staff, addChatChannel } = useApp();
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(
    chatChannels.length > 0 ? chatChannels[0] : null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [creatingChannel, setCreatingChannel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages for selected channel
  useEffect(() => {
    if (!selectedChannel) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const channelMessages = await ChatService.getChannelMessages(selectedChannel.id);
        setMessages(channelMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [selectedChannel]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!selectedChannel) return;

    // Unsubscribe from previous channel
    if (subscriptionRef.current) {
      ChatService.unsubscribeFromChannelMessages(selectedChannel.id);
    }

    // Subscribe to new channel
    subscriptionRef.current = ChatService.subscribeToChannelMessages(
      selectedChannel.id,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      },
      (error) => {
        console.error('Chat subscription error:', error);
      }
    );

    // Cleanup on unmount or channel change
    return () => {
      if (subscriptionRef.current) {
        ChatService.unsubscribeFromChannelMessages(selectedChannel.id);
      }
    };
  }, [selectedChannel]);

  const getSenderInfo = (senderId: string) => {
    const client = clients.find(c => c.id === senderId);
    if (client) return { name: client.name, avatar: null, type: 'client' };
    
    const staffMember = staff.find(s => s.id === senderId);
    if (staffMember) return { name: capitalizeWords(staffMember.name), avatar: staffMember.avatar, type: 'staff' };
    
    // Check if it's the current user
    if (user && user.id === senderId) {
      return { name: user.name, avatar: user.avatar, type: 'current-user' };
    }
    
    return { name: 'Unknown User', avatar: null, type: 'unknown' };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChannel || !user || sending) return;

    setSending(true);
    try {
      await ChatService.sendMessage(
        selectedChannel.id,
        user.id,
        messageText.trim()
      );
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    setMessageText(prev => prev + ` ![GIF](${gifUrl}) `);
    setShowGifPicker(false);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !user || creatingChannel) return;

    setCreatingChannel(true);
    try {
      const newChannel = await ChatService.createCustomChannel(newChannelName.trim());
      addChatChannel(newChannel);
      setSelectedChannel(newChannel);
      setNewChannelName('');
      setShowCreateChannel(false);
    } catch (error) {
      console.error('Failed to create channel:', error);
    } finally {
      setCreatingChannel(false);
    }
  };



  const ChannelList: React.FC = () => (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* Create Channel Button for Staff */}
          <div className="mb-4 px-3">
            <button
              onClick={() => setShowCreateChannel(true)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Channel</span>
            </button>
          </div>

          {/* All Channels */}
          {chatChannels.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No channels yet</p>
              <p className="text-xs text-gray-400 mt-1">Channels will be created automatically for clients</p>
            </div>
          ) : (
            chatChannels
              .filter(channel => {
                if (!searchTerm) return true;
                const client = clients.find(c => c.id === channel.clientId);
                return client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       channel.name.toLowerCase().includes(searchTerm.toLowerCase());
              })
              .map(channel => {
                const client = clients.find(c => c.id === channel.clientId);
                const isSelected = selectedChannel?.id === channel.id;
                
                // Determine display name and description based on channel type
                let displayName = channel.name;
                let description = '';
                
                if (channel.name === 'staff') {
                  displayName = 'Staff';
                  description = 'Internal team chat';
                } else if (channel.name === 'general') {
                  displayName = 'General';
                  description = 'General discussion';
                } else if (channel.name.startsWith('client-')) {
                  // This is a client channel
                  if (client) {
                    displayName = client.companyName || client.name;
                    description = `Client: ${client.name}`;
                  } else {
                    displayName = channel.name.replace('client-', '').replace(/-/g, ' ');
                    description = 'Client channel';
                  }
                } else if (client) {
                  // Fallback for any client channels
                  displayName = client.companyName || client.name;
                  description = `Client: ${client.name}`;
                } else {
                  // Custom staff channel
                  displayName = channel.name.replace(/-/g, ' ');
                  description = 'Staff channel';
                }
                
                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isSelected 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Hash className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{description}</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </button>
                );
              })
          )}
        </div>
      </div>
    </div>
  );

  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const sender = getSenderInfo(message.senderId);
    const isCurrentUser = user && message.senderId === user.id;

    return (
      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="flex-shrink-0">
            {sender.avatar ? (
              <img
                src={sender.avatar}
                alt={sender.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {sender.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          
          <div className={`mx-2 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
            <div className="text-xs text-gray-500 mb-1">
              {sender.name} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              isCurrentUser 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <ChannelList />
      

      
      {selectedChannel ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Hash className="h-5 w-5 text-gray-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedChannel.name === 'staff' ? 'Staff' : selectedChannel.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedChannel.participants.length} participants
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Users className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start the conversation by sending a message.
                  </p>
                </div>
              </div>
            ) : (
              messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message ${selectedChannel.name === 'staff' ? 'staff' : selectedChannel.name}...`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={sending}
                />
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                    <div className="grid grid-cols-8 gap-1">
                      {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'].map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className="p-1 hover:bg-gray-100 rounded text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* GIF Picker */}
                {showGifPicker && (
                  <div ref={gifPickerRef} className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 w-64">
                    <div className="text-sm font-medium text-gray-700 mb-2">Popular GIFs</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                        'https://media.giphy.com/media/26u4cqi2I30juCOGY/giphy.gif',
                        'https://media.giphy.com/media/l2Je66jG6mAAZxgqI/giphy.gif',
                        'https://media.giphy.com/media/3o7TKDEqg6OvOWzLtC/giphy.gif'
                      ].map((gif, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleGifSelect(gif)}
                          className="w-full h-20 bg-gray-100 rounded overflow-hidden hover:opacity-75"
                        >
                          <img src={gif} alt="GIF" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Smile className="h-5 w-5" />
              </button>
              
              <button
                type="button"
                onClick={() => setShowGifPicker(!showGifPicker)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Zap className="h-5 w-5" />
              </button>
              
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No channel selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose a channel from the sidebar to start chatting.
            </p>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Channel</h3>
            <form onSubmit={handleCreateChannel}>
              <div className="mb-4">
                <label htmlFor="channelName" className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  id="channelName"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Enter channel name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={creatingChannel}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors whitespace-nowrap"
                  disabled={creatingChannel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChannelName.trim() || creatingChannel}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {creatingChannel ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;