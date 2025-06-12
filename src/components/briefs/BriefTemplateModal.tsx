
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  company: string;
  is_retainer: boolean;
}

interface BriefTemplate {
  id: string;
  client_id: string;
  template_name: string;
  work_type: string;
  deliverables: number;
  description: string | null;
  estimated_hours: number | null;
  project_value: number | null;
}

interface BriefTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  template?: BriefTemplate | null;
  onTemplateCreated: () => void;
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

export function BriefTemplateModal({
  isOpen,
  onClose,
  clients,
  template,
  onTemplateCreated
}: BriefTemplateModalProps) {
  const [formData, setFormData] = useState({
    templateName: template?.template_name || "",
    clientId: template?.client_id || "",
    workType: template?.work_type || "",
    deliverables: template?.deliverables?.toString() || "1",
    description: template?.description || "",
    estimatedHours: template?.estimated_hours?.toString() || "",
    projectValue: template?.project_value?.toString() || "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const retainerClients = clients.filter(client => client.is_retainer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.templateName || !formData.clientId || !formData.workType) return;

    setLoading(true);
    try {
      const templateData = {
        template_name: formData.templateName,
        client_id: formData.clientId,
        work_type: formData.workType,
        deliverables: parseInt(formData.deliverables),
        description: formData.description || null,
        estimated_hours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        project_value: formData.projectValue ? parseFloat(formData.projectValue) : null,
        created_by: "System", // TODO: Replace with actual user when auth is implemented
      };

      if (template) {
        const { error } = await supabase
          .from('brief_templates')
          .update(templateData)
          .eq('id', template.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('brief_templates')
          .insert(templateData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }

      onTemplateCreated();
      onClose();
      setFormData({
        templateName: "",
        clientId: "",
        workType: "",
        deliverables: "1",
        description: "",
        estimatedHours: "",
        projectValue: "",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Template" : "Create Brief Template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="templateName">Template Name *</Label>
            <Input
              id="templateName"
              value={formData.templateName}
              onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
              placeholder="e.g., Monthly Social Media"
            />
          </div>
          
          <div>
            <Label htmlFor="client">Retainer Client *</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a retainer client" />
              </SelectTrigger>
              <SelectContent>
                {retainerClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deliverables">Deliverables *</Label>
              <Input
                id="deliverables"
                type="number"
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                placeholder="e.g., 3"
              />
            </div>
            <div>
              <Label htmlFor="estimatedHours">Est. Hours</Label>
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
            <Label htmlFor="projectValue">Project Value (£)</Label>
            <Input
              id="projectValue"
              type="number"
              step="0.01"
              value={formData.projectValue}
              onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
              placeholder="e.g., 5000.00"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the template requirements..."
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {template ? "Update Template" : "Create Template"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
