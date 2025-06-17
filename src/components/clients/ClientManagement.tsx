import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, UserPlus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateClientUserModal } from "./CreateClientUserModal"; // New import

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  contact_person: string;
  phone: string;
  address: string;
  is_retainer: boolean;
  is_active: boolean;
}

interface ClientProfile {
  user_id: string;
  client_id: string;
  user: { // Added user object to ClientProfile interface
    email: string;
  } | null;
}

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    contact_person: "",
    address: "",
    is_retainer: false,
  });
  const { toast } = useToast();
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]); // New state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false); // New state
  const [selectedClientForUserCreation, setSelectedClientForUserCreation] = useState<Client | null>(null); // New state

  useEffect(() => {
    loadClients();
    loadClientProfiles(); // Load client profiles on mount
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

  const loadClientProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select(`
          *,
          user:auth.users(email)
        `); // Fetch user email
      if (error) throw error;
      setClientProfiles(data || []);
    } catch (error) {
      console.error('Error loading client profiles:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      company: "",
      email: "",
      phone: "",
      contact_person: "",
      address: "",
      is_retainer: false,
    });
    setEditingClient(null);
    setShowForm(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email || "",
      phone: client.phone || "",
      contact_person: client.contact_person || "",
      address: client.address || "",
      is_retainer: client.is_retainer,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Client updated successfully",
        });
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Client onboarded successfully",
        });
      }

      resetForm();
      await loadClients();
      await loadClientProfiles(); // Reload profiles after client changes
      
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: editingClient ? "Failed to update client" : "Failed to onboard client",
        variant: "destructive",
      });
    }
  };

  const handleCreateUserClick = (client: Client) => {
    setSelectedClientForUserCreation(client);
    setShowCreateUserModal(true);
  };

  const handleUserCreated = () => {
    loadClientProfiles(); // Reload profiles to update button state
    setShowCreateUserModal(false);
    setSelectedClientForUserCreation(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Client Management</h2>
          <p className="text-muted-foreground">Onboard and manage your clients</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Onboard Client
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingClient ? 'Edit Client' : 'Onboard New Client'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Client Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Primary contact person"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Company address"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="retainer"
                  checked={formData.is_retainer}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_retainer: checked })}
                />
                <Label htmlFor="retainer">Is this a retainer client?</Label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">
                  {editingClient ? 'Update Client' : 'Onboard Client'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => {
          const clientUser = clientProfiles.find(profile => profile.client_id === client.id);
          const hasUser = !!clientUser;
          
          return (
            <Card key={client.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-5 h-5" />
                    <span>{client.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(client)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{client.company}</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                  <p className="text-sm text-muted-foreground">{client.phone}</p>
                  {client.contact_person && (
                    <p className="text-sm text-muted-foreground">Contact: {client.contact_person}</p>
                  )}
                  {client.is_retainer ? (
                    <div className="p-2 bg-green-50 rounded-md">
                      <p className="text-sm font-medium text-green-800">Retainer Client</p>
                    </div>
                  ) : (
                    <div className="p-2 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium text-blue-800">Project Client</p>
                    </div>
                  )}
                  {hasUser ? (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-md text-sm">
                      <p className="font-medium text-green-800">Client User Created:</p>
                      <p className="text-green-700">{clientUser?.user?.email}</p>
                      <p className="text-xs text-green-600 mt-1">Password was set during creation.</p>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleCreateUserClick(client)}
                      disabled={hasUser}
                    >
                      Create Client User
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedClientForUserCreation && (
        <CreateClientUserModal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          client={selectedClientForUserCreation}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
}