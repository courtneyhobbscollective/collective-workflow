import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ClientBriefSubmissionFormProps {
  onBriefSubmitted: () => void;
  onClose: () => void;
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
  "Social content",
  "Other",
];

export function ClientBriefSubmissionForm({ onBriefSubmitted, onClose }: ClientBriefSubmissionFormProps) {
  const { clientProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    workType: "",
    deliverables: "",
    dueDate: "",
    poNumber: "",
    description: "",
    estimatedHours: "",
    treatAsOneoff: false,
    poRequired: true,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Pre-fill client-specific data if needed, though client_id is handled internally
    // For now, just ensure form is clean on mount
    setFormData({
      title: "",
      workType: "",
      deliverables: "",
      dueDate: "",
      poNumber: "",
      description: "",
      estimatedHours: "",
      treatAsOneoff: false,
      poRequired: true,
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientProfile) {
      toast({
        title: "Error",
        description: "Client profile not found. Cannot submit brief.",
        variant: "destructive",
      });
      return;
    }

    // Basic validation
    if (!formData.title || !formData.workType || !formData.deliverables || !formData.dueDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Title, Work Type, Deliverables, Due Date).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        client_id: clientProfile.client_id,
        title: formData.title,
        description: formData.description || null,
        work_type: formData.workType,
        deliverables: parseInt(formData.deliverables),
        due_date: formData.dueDate || null,
        estimated_hours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        po_number: formData.poNumber || null,
        project_value: null, // Clients do not set project value
        is_retainer: clientProfile.client.is_retainer, // Inherit from client profile
        treat_as_oneoff: formData.treatAsOneoff,
        contract_signed: false, // Always false for client submissions, agency handles
        po_required: formData.poRequired,
        current_stage: 'incoming', // New briefs start in 'incoming' stage
        status: 'active', // New briefs are active
      };

      const { error } = await supabase
        .from('projects')
        .insert(projectData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your brief has been submitted successfully!",
      });

      onBriefSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting brief:', error);
      toast({
        title: "Error",
        description: "Failed to submit brief. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Please provide details for your new project request.
      </p>
      <div>
        <Label htmlFor="title">Brief Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., New Marketing Campaign for Q3"
          required
        />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="deliverables">Number of Deliverables *</Label>
          <Input
            id="deliverables"
            type="number"
            value={formData.deliverables}
            onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
            placeholder="e.g., 3"
            min="1"
            required
          />
        </div>
        <div>
          <Label htmlFor="dueDate">Desired Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Brief Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the project requirements in detail..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="estimatedHours">Estimated Hours (Optional)</Label>
          <Input
            id="estimatedHours"
            type="number"
            value={formData.estimatedHours}
            onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
            placeholder="e.g., 40"
          />
        </div>
        <div>
          <Label htmlFor="poNumber">PO Number (Optional)</Label>
          <Input
            id="poNumber"
            value={formData.poNumber}
            onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
            placeholder="e.g., PO-2024-001"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="poRequired"
          checked={formData.poRequired}
          onCheckedChange={(checked) => setFormData({ ...formData, poRequired: checked })}
        />
        <Label htmlFor="poRequired">PO Required for this project?</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="treatAsOneoff"
          checked={formData.treatAsOneoff}
          onCheckedChange={(checked) => setFormData({ ...formData, treatAsOneoff: checked })}
        />
        <Label htmlFor="treatAsOneoff">Treat as one-off project (even if retainer client)</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            "Submit Brief"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}