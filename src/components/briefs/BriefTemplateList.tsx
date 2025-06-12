
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BriefTemplate {
  id: string;
  client_id: string;
  template_name: string;
  work_type: string;
  deliverables: number;
  description: string | null;
  estimated_hours: number | null;
  project_value: number | null;
  client: {
    company: string;
  };
}

interface BriefTemplateListProps {
  templates: BriefTemplate[];
  onEditTemplate: (template: BriefTemplate) => void;
  onTemplateDeleted: () => void;
  onCreateFromTemplate: (template: BriefTemplate) => void;
}

export function BriefTemplateList({
  templates,
  onEditTemplate,
  onTemplateDeleted,
  onCreateFromTemplate
}: BriefTemplateListProps) {
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDeleteTemplate = async (templateId: string) => {
    setDeletingTemplate(templateId);
    try {
      const { error } = await supabase
        .from('brief_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      onTemplateDeleted();
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setDeletingTemplate(null);
    }
  };

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No brief templates found.</p>
            <p className="text-sm">Create your first template to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{template.template_name}</span>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditTemplate(template)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTemplate(template.id)}
                  disabled={deletingTemplate === template.id}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">{template.client.company}</p>
              <Badge variant="secondary" className="text-xs">
                {template.work_type}
              </Badge>
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              )}
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Deliverables: {template.deliverables}</span>
                {template.estimated_hours && (
                  <span>Est: {template.estimated_hours}h</span>
                )}
              </div>
              {template.project_value && (
                <div className="text-xs font-medium">
                  Value: £{template.project_value.toLocaleString()}
                </div>
              )}
              <Button
                size="sm"
                onClick={() => onCreateFromTemplate(template)}
                className="w-full mt-3"
              >
                Create Brief from Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
