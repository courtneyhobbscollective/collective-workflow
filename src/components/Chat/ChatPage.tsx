import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatChannel, ChatMessage } from '../../types';
import { 
  Send, Paperclip, Smile, Search, Hash, 
  Users, MessageCircle, Image, File 
} from 'lucide-react';
import { capitalizeWords } from '../../lib/capitalizeWords';

const ChatPage: React.FC = () => {
  const { chatChannels, clients, staff } = useApp();
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(
    chatChannels.length > 0 ? chatChannels[0] : null
  );
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock additional messages for demonstration
  const mockMessages: ChatMessage[] = [
    {
      id: 'm1',
      channelId: 'ch-1',
      senderId: '1',
      content: 'Looking forward to working with you on this project!',
      type: 'text',
      mentions: [],
      timestamp: new Date('2024-01-15T10:00:00')
    },
    {
      id: 'm2',
      channelId: 'ch-1',
      senderId: 's1',
      content: 'Thanks! I\'ve reviewed the brief and have some initial ideas. When would be a good time to discuss the creative direction?',
      type: 'text',
      mentions: ['1'],
      timestamp: new Date('2024-01-15T10:15:00')
    },
    {
      id: 'm3',
      channelId: 'ch-1',
      senderId: '1',
      content: 'How about tomorrow at 2 PM? We can go over the brand guidelines and discuss the shot list.',
      type: 'text',
      mentions: [],
      timestamp: new Date('2024-01-15T10:30:00')
    },
    {
      id: 'm4',
      channelId: 'ch-1',
      senderId: 's2',
      content: 'Perfect! I\'ll prepare some reference materials for the video editing style.',
      type: 'text',
      mentions: [],
      timestamp: new Date('2024-01-15T11:00:00')
    }
  ];

  const getChannelMessages = (channelId: string) => {
    return mockMessages.filter(msg => msg.channelId === channelId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const getSenderInfo = (senderId: string) => {
    const client = clients.find(c => c.id === senderId);
    if (client) return { name: client.name, avatar: null, type: 'client' };
    
    const staffMember = staff.find(s => s.id === senderId);
    if (staffMember) return { name: capitalizeWords(staffMember.name), avatar: staffMember.avatar, type: 'staff' };
    
    return { name: 'Unknown User', avatar: null, type: 'unknown' };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChannel) return;

    // In a real app, this would send the message to the backend
    console.log('Sending message:', messageText);
    setMessageText('');
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
          <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Client Channels
          </h3>
          {chatChannels.map(channel => {
            const client = clients.find(c => c.id === channel.clientId);
            const isSelected = selectedChannel?.id === channel.id;
            
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
                  <p className="text-sm font-medium truncate">{channel.name}</p>
                  <p className="text-xs text-gray-500 truncate">{client?.name}</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const sender = getSenderInfo(message.senderId);
    const isCurrentUser = message.senderId === 's1'; // Mock current user

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
                  <h2 className="text-lg font-semibold text-gray-900">{selectedChannel.name}</h2>
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
            {getChannelMessages(selectedChannel.id).map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
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
                  placeholder={`Message ${selectedChannel.name}...`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Smile className="h-5 w-5" />
              </button>
              
              <button
                type="submit"
                disabled={!messageText.trim()}
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
    </div>
  );
};

export default ChatPage;