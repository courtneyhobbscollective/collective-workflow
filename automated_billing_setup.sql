-- Automated Billing System Setup
-- Run this in your Supabase SQL Editor

-- Add missing columns to clients table for retainer billing
ALTER TABLE clients ADD COLUMN IF NOT EXISTS retainer_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS retainer_billing_day INTEGER DEFAULT 1; -- Day of month for billing
ALTER TABLE clients ADD COLUMN IF NOT EXISTS retainer_start_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS retainer_end_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS retainer_active BOOLEAN DEFAULT false;

-- Add missing columns to briefs table for project billing
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS project_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS billing_stage TEXT DEFAULT 'not-started' CHECK (billing_stage IN ('not-started', '50-percent', '30-percent', '20-percent', 'completed'));
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS last_billing_date DATE;

-- Add missing columns to invoices table for automated billing
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'manual' CHECK (billing_type IN ('manual', 'retainer', 'project-stage'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_stage TEXT; -- For project stage billing
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_percentage INTEGER; -- For project stage billing
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount + vat_amount) STORED;

-- Create billing_queue table for automated billing management
CREATE TABLE IF NOT EXISTS billing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES briefs(id) ON DELETE SET NULL,
  billing_type TEXT NOT NULL CHECK (billing_type IN ('retainer', 'project-stage')),
  billing_stage TEXT, -- For project stage billing
  billing_percentage INTEGER, -- For project stage billing
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create billing_schedule table for retainer clients
CREATE TABLE IF NOT EXISTS billing_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  billing_day INTEGER NOT NULL CHECK (billing_day >= 1 AND billing_day <= 31),
  amount DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  last_billed_date DATE,
  next_billing_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_items table for detailed invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_billing_queue_status ON billing_queue(status);
CREATE INDEX IF NOT EXISTS idx_billing_queue_due_date ON billing_queue(due_date);
CREATE INDEX IF NOT EXISTS idx_billing_queue_client ON billing_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_billing_schedule_next_billing ON billing_schedule(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_billing_schedule_client ON billing_schedule(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_billing_type ON invoices(billing_type);
CREATE INDEX IF NOT EXISTS idx_briefs_billing_stage ON briefs(billing_stage);

-- Enable RLS on new tables
ALTER TABLE billing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for billing_queue
CREATE POLICY "Users can view all billing queue items" ON billing_queue
  FOR SELECT USING (true);

CREATE POLICY "Users can insert billing queue items" ON billing_queue
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update billing queue items" ON billing_queue
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete billing queue items" ON billing_queue
  FOR DELETE USING (true);

-- RLS Policies for billing_schedule
CREATE POLICY "Users can view all billing schedules" ON billing_schedule
  FOR SELECT USING (true);

CREATE POLICY "Users can insert billing schedules" ON billing_schedule
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update billing schedules" ON billing_schedule
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete billing schedules" ON billing_schedule
  FOR DELETE USING (true);

-- RLS Policies for invoice_items
CREATE POLICY "Users can view all invoice items" ON invoice_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert invoice items" ON invoice_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update invoice items" ON invoice_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete invoice items" ON invoice_items
  FOR DELETE USING (true);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get the next number based on current year and month
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d{4})(\d{2})-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM invoices 
  WHERE invoice_number LIKE 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-%';
  
  -- Format: INV-YYYYMM-XXXX
  invoice_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to add retainer client to billing queue
CREATE OR REPLACE FUNCTION add_retainer_to_billing_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a retainer client and they should be billed this month
  IF NEW.type = 'retainer' AND NEW.retainer_active = true THEN
    -- Check if we haven't already queued them for this month
    IF NOT EXISTS (
      SELECT 1 FROM billing_queue 
      WHERE client_id = NEW.id 
      AND billing_type = 'retainer'
      AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', CURRENT_DATE)
    ) THEN
      -- Add to billing queue
      INSERT INTO billing_queue (
        client_id,
        billing_type,
        amount,
        due_date,
        notes
      ) VALUES (
        NEW.id,
        'retainer',
        NEW.retainer_amount,
        CURRENT_DATE + INTERVAL '30 days',
        'Monthly retainer billing'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle brief stage changes and trigger project billing
CREATE OR REPLACE FUNCTION handle_brief_stage_billing()
RETURNS TRIGGER AS $$
DECLARE
  client_record RECORD;
  billing_amount DECIMAL(10,2);
  billing_percentage INTEGER;
  billing_stage_text TEXT;
BEGIN
  -- Get client information
  SELECT * INTO client_record FROM clients WHERE id = NEW.client_id;
  
  -- Only process project clients
  IF client_record.type = 'project' AND NEW.project_value > 0 THEN
    -- Determine billing stage and amount based on brief stage
    CASE NEW.stage
      WHEN 'pre-production' THEN
        billing_percentage := 50;
        billing_stage_text := '50-percent';
        billing_amount := (NEW.project_value * 50) / 100;
      WHEN 'amend-1' THEN
        billing_percentage := 30;
        billing_stage_text := '30-percent';
        billing_amount := (NEW.project_value * 30) / 100;
      WHEN 'final-delivery' THEN
        billing_percentage := 20;
        billing_stage_text := '20-percent';
        billing_amount := (NEW.project_value * 20) / 100;
      ELSE
        RETURN NEW; -- No billing for other stages
    END CASE;
    
    -- Check if we haven't already billed for this stage
    IF NEW.billing_stage != billing_stage_text THEN
      -- Add to billing queue
      INSERT INTO billing_queue (
        client_id,
        brief_id,
        billing_type,
        billing_stage,
        billing_percentage,
        amount,
        due_date,
        notes
      ) VALUES (
        NEW.client_id,
        NEW.id,
        'project-stage',
        billing_stage_text,
        billing_percentage,
        billing_amount,
        CURRENT_DATE + INTERVAL '30 days',
        'Project stage billing: ' || billing_stage_text || ' for ' || NEW.title
      );
      
      -- Update brief billing stage
      NEW.billing_stage := billing_stage_text;
      NEW.last_billing_date := CURRENT_DATE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to process billing queue and create invoices
CREATE OR REPLACE FUNCTION process_billing_queue()
RETURNS INTEGER AS $$
DECLARE
  queue_item RECORD;
  new_invoice_id UUID;
  processed_count INTEGER := 0;
BEGIN
  -- Process all pending items in billing queue
  FOR queue_item IN 
    SELECT * FROM billing_queue 
    WHERE status = 'pending' 
    AND due_date <= CURRENT_DATE + INTERVAL '7 days' -- Process items due within 7 days
    ORDER BY due_date ASC
  LOOP
    -- Generate invoice
    INSERT INTO invoices (
      client_id,
      brief_id,
      invoice_number,
      amount,
      vat_amount,
      billing_type,
      billing_stage,
      billing_percentage,
      status,
      due_date,
      notes
    ) VALUES (
      queue_item.client_id,
      queue_item.brief_id,
      generate_invoice_number(),
      queue_item.amount,
      (queue_item.amount * 0.20), -- 20% VAT
      queue_item.billing_type,
      queue_item.billing_stage,
      queue_item.billing_percentage,
      'draft',
      queue_item.due_date,
      queue_item.notes
    ) RETURNING id INTO new_invoice_id;
    
    -- Add invoice item
    INSERT INTO invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price
    ) VALUES (
      new_invoice_id,
      CASE 
        WHEN queue_item.billing_type = 'retainer' THEN 'Monthly Retainer'
        WHEN queue_item.billing_type = 'project-stage' THEN 
          'Project Stage: ' || COALESCE(queue_item.billing_stage, 'Unknown')
        ELSE 'Service'
      END,
      1,
      queue_item.amount
    );
    
    -- Mark queue item as processed
    UPDATE billing_queue 
    SET status = 'processed', 
        processed_at = NOW(),
        processed_by = auth.uid()
    WHERE id = queue_item.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_retainer_billing_queue
  AFTER INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION add_retainer_to_billing_queue();

CREATE TRIGGER trigger_brief_stage_billing
  AFTER UPDATE ON briefs
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION handle_brief_stage_billing();

-- Create a scheduled job to process billing queue daily
-- Note: This would need to be set up in Supabase Edge Functions or a cron job
-- For now, we'll create a function that can be called manually

-- Function to get billing dashboard data
CREATE OR REPLACE FUNCTION get_billing_dashboard_data()
RETURNS TABLE (
  total_pending_amount DECIMAL(10,2),
  total_overdue_amount DECIMAL(10,2),
  pending_retainer_count INTEGER,
  pending_project_count INTEGER,
  overdue_invoices_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN i.status = 'sent' THEN i.total_amount ELSE 0 END), 0) as total_pending_amount,
    COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN i.total_amount ELSE 0 END), 0) as total_overdue_amount,
    COUNT(CASE WHEN bq.billing_type = 'retainer' AND bq.status = 'pending' THEN 1 END) as pending_retainer_count,
    COUNT(CASE WHEN bq.billing_type = 'project-stage' AND bq.status = 'pending' THEN 1 END) as pending_project_count,
    COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) as overdue_invoices_count
  FROM invoices i
  LEFT JOIN billing_queue bq ON bq.client_id = i.client_id;
END;
$$ LANGUAGE plpgsql; 