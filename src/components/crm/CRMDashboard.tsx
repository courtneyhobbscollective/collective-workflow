import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Building, 
  Mail,
  Phone,
  Calendar,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  contact_person: string;
  is_active: boolean;
  is_retainer: boolean;
}

interface Message {
  id: string;
  client_id: string;
  subject: string;
  message: string;
  message_type: 'general' | 'urgent' | 'update' | 'reminder';
  sent_at: string;
  read_at: string | null;
  client: {
    company: string;
    name: string;
  };
}

export function CRMDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'general' | 'urgent' | 'update' | 'reminder'>('general');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
    loadMessages();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('company');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('client_messages')
        .select(`
          *,
          client:clients(company, name)
        `)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedClient || !subject.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please select a client and fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('client_messages')
        .insert({
          client_id: selectedClient.id,
          subject: subject.trim(),
          message: message.trim(),
          message_type: messageType,
          sent_at: new Date().toISOString()
        });

      if (error) throw error;

      // Reset form
      setSubject("");
      setMessage("");
      setMessageType('general');
      setSelectedClient(null);

      // Reload messages
      await loadMessages();

      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'update': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'reminder': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertCircle className="w-4 h-4" />;
      case 'update': return <MessageSquare className="w-4 h-4" />;
      case 'reminder': return <Calendar className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">CRM Dashboard</h2>
        <p className="text-muted-foreground">Send messages to clients and manage communications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Message Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Send Message to Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Client</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedClient?.id || ""}
                onChange={(e) => {
                  const client = clients.find(c => c.id === e.target.value);
                  setSelectedClient(client || null);
                }}
              >
                <option value="">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company} - {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Message Type</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as any)}
              >
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="update">Update</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter message subject..."
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={4}
              />
            </div>

            {/* Send Button */}
            <Button 
              onClick={sendMessage}
              disabled={!selectedClient || !subject.trim() || !message.trim()}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.slice(0, 5).map((msg) => (
                  <div key={msg.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getMessageTypeIcon(msg.message_type)}
                        <Badge className={getMessageTypeColor(msg.message_type)}>
                          {msg.message_type}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.sent_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-medium text-sm mb-1">{msg.subject}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      To: {msg.client.company} - {msg.client.name}
                    </div>
                    <div className="text-sm">
                      {msg.message.length > 100 
                        ? `${msg.message.substring(0, 100)}...` 
                        : msg.message
                      }
                    </div>
                    {msg.read_at && (
                      <div className="text-xs text-green-600 mt-2">
                        ✓ Read on {new Date(msg.read_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages sent yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Active Clients ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div key={client.id} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{client.company}</span>
                  {client.is_retainer && (
                    <Badge variant="secondary" className="text-xs">Retainer</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Contact: {client.contact_person}
                </div>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 