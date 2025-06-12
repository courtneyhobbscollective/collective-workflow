
-- Create brief_templates table for reusable templates (without the problematic CHECK constraint)
CREATE TABLE public.brief_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  work_type TEXT NOT NULL,
  deliverables INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  estimated_hours INTEGER,
  project_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL
);

-- Add RLS policies for brief templates
ALTER TABLE public.brief_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view templates
CREATE POLICY "Allow all to view brief templates" 
  ON public.brief_templates 
  FOR SELECT 
  USING (true);

-- Allow all authenticated users to insert templates
CREATE POLICY "Allow all to create brief templates" 
  ON public.brief_templates 
  FOR INSERT 
  WITH CHECK (true);

-- Allow all authenticated users to update templates
CREATE POLICY "Allow all to update brief templates" 
  ON public.brief_templates 
  FOR UPDATE 
  USING (true);

-- Allow all authenticated users to delete templates
CREATE POLICY "Allow all to delete brief templates" 
  ON public.brief_templates 
  FOR DELETE 
  USING (true);

-- Add index for better performance
CREATE INDEX idx_brief_templates_client_id ON public.brief_templates(client_id);

-- Create validation trigger to ensure templates are only for retainer clients
CREATE OR REPLACE FUNCTION validate_brief_template_client()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the client is a retainer client
  IF NOT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = NEW.client_id AND is_retainer = true
  ) THEN
    RAISE EXCEPTION 'Brief templates can only be created for retainer clients';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_brief_template_client_trigger
  BEFORE INSERT OR UPDATE ON public.brief_templates
  FOR EACH ROW
  EXECUTE FUNCTION validate_brief_template_client();

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_brief_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brief_templates_updated_at
  BEFORE UPDATE ON public.brief_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_brief_templates_updated_at();
