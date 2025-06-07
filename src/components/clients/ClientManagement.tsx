
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  organisation: string;
  email: string;
  phone: string;
  isRetainer: boolean;
  retainerAmount?: number;
  retainerHours?: number;
}

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([
    {
      id: "1",
      name: "Alice Cooper",
      organisation: "Tech Corp Ltd",
      email: "alice@techcorp.com",
      phone: "+44 123 456 7890",
      isRetainer: true,
      retainerAmount: 5000,
      retainerHours: 40,
    },
  ]);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    organisation: "",
    email: "",
    phone: "",
    isRetainer: false,
    retainerAmount: "",
    retainerHours: "",
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.organisation || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.isRetainer && (!formData.retainerAmount || !formData.retainerHours)) {
      toast({
        title: "Error",
        description: "Please fill in retainer amount and hours",
        variant: "destructive",
      });
      return;
    }

    const newClient: Client = {
      id: Date.now().toString(),
      name: formData.name,
      organisation: formData.organisation,
      email: formData.email,
      phone: formData.phone,
      isRetainer: formData.isRetainer,
      retainerAmount: formData.isRetainer ? Number(formData.retainerAmount) : undefined,
      retainerHours: formData.isRetainer ? Number(formData.retainerHours) : undefined,
    };

    setClients([...clients, newClient]);
    setFormData({
      name: "",
      organisation: "",
      email: "",
      phone: "",
      isRetainer: false,
      retainerAmount: "",
      retainerHours: "",
    });
    setShowForm(false);
    
    toast({
      title: "Success",
      description: "Client onboarded successfully",
    });
  };

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
            <CardTitle>Onboard New Client</CardTitle>
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
                  <Label htmlFor="organisation">Organisation Name *</Label>
                  <Input
                    id="organisation"
                    value={formData.organisation}
                    onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                    placeholder="Enter organisation name"
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
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="retainer"
                  checked={formData.isRetainer}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRetainer: checked })}
                />
                <Label htmlFor="retainer">Is this a retainer client?</Label>
              </div>

              {formData.isRetainer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-accent rounded-lg">
                  <div>
                    <Label htmlFor="retainerAmount">Monthly Retainer Amount (£)</Label>
                    <Input
                      id="retainerAmount"
                      type="number"
                      value={formData.retainerAmount}
                      onChange={(e) => setFormData({ ...formData, retainerAmount: e.target.value })}
                      placeholder="e.g., 5000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="retainerHours">Monthly Hours Included</Label>
                    <Input
                      id="retainerHours"
                      type="number"
                      value={formData.retainerHours}
                      onChange={(e) => setFormData({ ...formData, retainerHours: e.target.value })}
                      placeholder="e.g., 40"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button type="submit">Onboard Client</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>{client.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">{client.organisation}</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
                {client.isRetainer ? (
                  <div className="p-2 bg-green-50 rounded-md">
                    <p className="text-sm font-medium text-green-800">Retainer Client</p>
                    <p className="text-xs text-green-600">£{client.retainerAmount}/month - {client.retainerHours}h</p>
                  </div>
                ) : (
                  <div className="p-2 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Project Client</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
