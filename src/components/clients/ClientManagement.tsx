import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, UserPlus, Edit, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateClientUserModal } from "./CreateClientUserModal";
import { ResendPasswordModal } from "./ResendPasswordModal";
import { ClientCard } from "./ClientCard";

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
  // Removed 'user' object as it's not needed for this check and causes RLS issues
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
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedClientForUserCreation, setSelectedClientForUserCreation] = useState<Client | null>(null);
  const [showResendPasswordModal, setShowResendPasswordModal] = useState(false); // New state
  const [selectedClientForPasswordReset, setSelectedClientForPasswordReset] = useState<Client | null>(null); // New state

  useEffect(() => {
    loadClients();
    loadClientProfiles();
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
        .select('client_id, user_id'); 
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
      await loadClientProfiles();
      
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
    loadClientProfiles();
    setShowCreateUserModal(false);
    setSelectedClientForUserCreation(null);
  };

  const handleResendPasswordClick = (client: Client) => {
    setSelectedClientForPasswordReset(client);
    setShowResendPasswordModal(true);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clients.map((client) => {
          const clientUser = clientProfiles.find(profile => profile.client_id === client.id);
          const hasUser = !!clientUser;
          
          return (
            <ClientCard 
              key={client.id} 
              client={client} 
              hasUser={hasUser} 
              onEdit={handleEdit} 
              onCreateUser={handleCreateUserClick}
              onResendPassword={handleResendPasswordClick} 
            />
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

      {selectedClientForPasswordReset && (
        <ResendPasswordModal
          isOpen={showResendPasswordModal}
          onClose={() => setShowResendPasswordModal(false)}
          clientEmail={selectedClientForPasswordReset.email}
        />
      )}
    </div>
  );
}