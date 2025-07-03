import { useState, useEffect } from "react";
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
  estimated_shoot_hours: number | null;
  estimated_edit_hours: number | null;
  project_value: number | null;
  recurrence_type: string;
  recurrence_day: string;
  recurrence_start_date: string | null;
  recurrence_end_date: string | null;
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
  "Social Media Content",
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
  console.log('BriefTemplateModal props:', { isOpen, template });
  const [formData, setFormData] = useState({
    templateName: template?.template_name || "",
    clientId: template?.client_id || "",
    workType: template?.work_type || "",
    deliverables: template?.deliverables?.toString() || "1",
    description: template?.description || "",
    estimatedHours: template?.estimated_hours?.toString() || "",
    estimatedShootHours: template?.estimated_shoot_hours?.toString() || "",
    estimatedEditHours: template?.estimated_edit_hours?.toString() || "",
    projectValue: template?.project_value?.toString() || "",
    recurrenceType: template?.recurrence_type || "none",
    recurrenceDay: template?.recurrence_day || "",
    recurrenceStartDate: template?.recurrence_start_date || "",
    recurrenceEndDate: template?.recurrence_end_date || "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      templateName: template?.template_name || "",
      clientId: template?.client_id || "",
      workType: template?.work_type || "",
      deliverables: template?.deliverables?.toString() || "1",
      description: template?.description || "",
      estimatedHours: template?.estimated_hours?.toString() || "",
      estimatedShootHours: template?.estimated_shoot_hours?.toString() || "",
      estimatedEditHours: template?.estimated_edit_hours?.toString() || "",
      projectValue: template?.project_value?.toString() || "",
      recurrenceType: template?.recurrence_type || "none",
      recurrenceDay: template?.recurrence_day || "",
      recurrenceStartDate: template?.recurrence_start_date || "",
      recurrenceEndDate: template?.recurrence_end_date || "",
    });
  }, [template, isOpen]);

  const retainerClients = clients.filter(client => client.is_retainer);

  const isDualHoursType = ["Video Production", "Photography", "Social Media Content"].includes(formData.workType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called', { template, formData });
    if (!formData.templateName || !formData.clientId || !formData.workType) return;

    setLoading(true);
    try {
      const templateData = {
        template_name: formData.templateName,
        client_id: formData.clientId,
        work_type: formData.workType,
        deliverables: parseInt(formData.deliverables),
        description: formData.description || null,
        estimated_hours: !isDualHoursType ? (formData.estimatedHours ? parseInt(formData.estimatedHours) : null) : null,
        estimated_shoot_hours: isDualHoursType ? (formData.estimatedShootHours ? parseInt(formData.estimatedShootHours) : null) : null,
        estimated_edit_hours: isDualHoursType ? (formData.estimatedEditHours ? parseInt(formData.estimatedEditHours) : null) : null,
        project_value: formData.projectValue ? parseFloat(formData.projectValue) : null,
        created_by: "System", // TODO: Replace with actual user when auth is implemented
        recurrence_type: formData.recurrenceType,
        recurrence_day: formData.recurrenceDay,
        recurrence_start_date: formData.recurrenceStartDate || null,
        recurrence_end_date: formData.recurrenceEndDate || null,
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
        estimatedShootHours: "",
        estimatedEditHours: "",
        projectValue: "",
        recurrenceType: "none",
        recurrenceDay: "",
        recurrenceStartDate: "",
        recurrenceEndDate: "",
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
      <DialogContent className="max-w-md" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
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
            {isDualHoursType ? (
              <>
                <div>
                  <Label htmlFor="estimatedShootHours">Estimated Shoot Hours</Label>
                  <Input
                    id="estimatedShootHours"
                    type="number"
                    value={formData.estimatedShootHours}
                    onChange={(e) => setFormData({ ...formData, estimatedShootHours: e.target.value })}
                    placeholder="e.g., 8"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">Set to 0 if no shoot hours are required. 0 means no shoot booking will be created.</p>
                </div>
                <div>
                  <Label htmlFor="estimatedEditHours">Estimated Edit Hours</Label>
                  <Input
                    id="estimatedEditHours"
                    type="number"
                    value={formData.estimatedEditHours}
                    onChange={(e) => setFormData({ ...formData, estimatedEditHours: e.target.value })}
                    placeholder="e.g., 12"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">Set to 0 if no edit hours are required. 0 means no edit booking will be created.</p>
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="estimatedHours">Est. Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  placeholder="e.g., 12"
                />
              </div>
            )}
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
            <Label htmlFor="recurrenceType">Recurrence</Label>
            <Select value={formData.recurrenceType} onValueChange={value => setFormData({ ...formData, recurrenceType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select recurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.recurrenceType === "weekly" || formData.recurrenceType === "biweekly" ? (
            <div>
              <Label htmlFor="recurrenceDay">Day of Week</Label>
              <Select value={formData.recurrenceDay} onValueChange={value => setFormData({ ...formData, recurrenceDay: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day of week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {formData.recurrenceType === "monthly" ? (
            <div>
              <Label htmlFor="recurrenceDay">Day of Month</Label>
              <Input
                id="recurrenceDay"
                type="number"
                min="1"
                max="31"
                value={formData.recurrenceDay}
                onChange={e => setFormData({ ...formData, recurrenceDay: e.target.value })}
                placeholder="e.g., 1 for 1st of month"
              />
            </div>
          ) : null}
          {formData.recurrenceType !== "none" && (
            <div className="flex gap-2">
              <div>
                <Label htmlFor="recurrenceStartDate">Start Date</Label>
                <Input
                  id="recurrenceStartDate"
                  type="date"
                  value={formData.recurrenceStartDate}
                  onChange={e => setFormData({ ...formData, recurrenceStartDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="recurrenceEndDate">End Date</Label>
                <Input
                  id="recurrenceEndDate"
                  type="date"
                  value={formData.recurrenceEndDate}
                  onChange={e => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                />
              </div>
            </div>
          )}

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
