
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Brief {
  id: string;
  clientName: string;
  isRetainer: boolean;
  workType: string;
  deliverables: number;
  dueDate: string;
  poNumber: string;
  description: string;
  estimatedHours: number;
  status: string;
  assignedStaff?: string;
}

const workTypes = [
  "Logo Design",
  "Website Development",
  "Branding",
  "Marketing Campaign",
  "Social Media Management",
  "Print Design",
  "Photography",
  "Video Production",
];

export function BriefManagement() {
  const [briefs, setBriefs] = useState<Brief[]>([
    {
      id: "1",
      clientName: "Tech Corp Ltd",
      isRetainer: true,
      workType: "Website Development",
      deliverables: 3,
      dueDate: "2024-06-15",
      poNumber: "PO-2024-001",
      description: "Redesign company website with modern UI/UX",
      estimatedHours: 40,
      status: "incoming",
    },
  ]);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    isRetainer: "",
    workType: "",
    deliverables: "",
    dueDate: "",
    poNumber: "",
    description: "",
    estimatedHours: "",
  });
  const { toast } = useToast();

  // Mock clients data
  const clients = [
    { name: "Tech Corp Ltd", isRetainer: true },
    { name: "Design Studio Inc", isRetainer: false },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.workType || !formData.deliverables || !formData.dueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedClient = clients.find(c => c.name === formData.clientName);
    
    const newBrief: Brief = {
      id: Date.now().toString(),
      clientName: formData.clientName,
      isRetainer: selectedClient?.isRetainer || false,
      workType: formData.workType,
      deliverables: Number(formData.deliverables),
      dueDate: formData.dueDate,
      poNumber: formData.poNumber,
      description: formData.description,
      estimatedHours: Number(formData.estimatedHours),
      status: "incoming",
    };

    setBriefs([...briefs, newBrief]);
    setFormData({
      clientName: "",
      isRetainer: "",
      workType: "",
      deliverables: "",
      dueDate: "",
      poNumber: "",
      description: "",
      estimatedHours: "",
    });
    setShowForm(false);
    
    toast({
      title: "Success",
      description: "Brief created successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Brief Management</h2>
          <p className="text-muted-foreground">Create and manage project briefs</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Brief
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Brief</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client">Client *</Label>
                  <Select value={formData.clientName} onValueChange={(value) => setFormData({ ...formData, clientName: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.name} value={client.name}>
                          {client.name} {client.isRetainer ? "(Retainer)" : "(Project)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="workType">Type of Work *</Label>
                  <Select value={formData.workType} onValueChange={(value) => setFormData({ ...formData, workType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work type" />
                    </SelectTrigger>
                    <SelectContent>
                      {workTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deliverables">Number of Deliverables *</Label>
                  <Input
                    id="deliverables"
                    type="number"
                    value={formData.deliverables}
                    onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                    placeholder="e.g., 3"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input
                    id="poNumber"
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    placeholder="e.g., PO-2024-001"
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    placeholder="e.g., 40"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Brief Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the project requirements..."
                  rows={4}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Create Brief</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {briefs.map((brief) => (
          <Card key={brief.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>{brief.workType}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">{brief.clientName}</p>
                <p className="text-sm text-muted-foreground">{brief.description}</p>
                <div className="flex justify-between items-center text-xs">
                  <span>Deliverables: {brief.deliverables}</span>
                  <span>Due: {brief.dueDate}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Hours: {brief.estimatedHours}</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                    {brief.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
