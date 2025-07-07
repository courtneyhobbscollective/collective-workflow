-- Incremental Database Update - Safe for existing data
-- Run this in your Supabase SQL Editor

-- Add missing columns to clients table (if they don't exist)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'project' CHECK (type IN ('project', 'retainer'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_assets TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_guidelines TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_tone_of_voice TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_colors TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_fonts TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_template TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS chat_channel_id TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Add missing columns to briefs table (if they don't exist)
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS assigned_staff_id UUID;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'incoming' CHECK (stage IN ('incoming', 'pre-production', 'production', 'amend-1', 'amend-2', 'final-delivery', 'client-submission'));
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS project_value DECIMAL(10,2);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'));

-- Add missing columns to invoices table (if they don't exist)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS brief_id UUID REFERENCES briefs(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS number TEXT UNIQUE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items JSONB;

-- Add missing columns to chat_channels table (if they don't exist)
ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general' CHECK (type IN ('general', 'project', 'client'));
ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_briefs_client_id ON briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON briefs(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Create or replace the update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_briefs_updated_at ON briefs;
CREATE TRIGGER update_briefs_updated_at
  BEFORE UPDATE ON briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_channels_updated_at ON chat_channels;
CREATE TRIGGER update_chat_channels_updated_at
  BEFORE UPDATE ON chat_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have default values for new columns
UPDATE clients SET 
  type = COALESCE(type, 'project'),
  brand_assets = COALESCE(brand_assets, '{}'),
  brand_colors = COALESCE(brand_colors, '{}'),
  brand_fonts = COALESCE(brand_fonts, '{}'),
  social_media = COALESCE(social_media, '[]'),
  chat_channel_id = COALESCE(chat_channel_id, ''),
  status = COALESCE(status, 'active')
WHERE type IS NULL OR brand_assets IS NULL OR brand_colors IS NULL OR brand_fonts IS NULL OR social_media IS NULL OR chat_channel_id IS NULL OR status IS NULL;

UPDATE briefs SET 
  stage = COALESCE(stage, 'incoming'),
  status = COALESCE(status, 'active')
WHERE stage IS NULL OR status IS NULL;

UPDATE invoices SET 
  vat_amount = COALESCE(vat_amount, 0),
  total_amount = COALESCE(total_amount, amount)
WHERE vat_amount IS NULL OR total_amount IS NULL;

UPDATE chat_channels SET 
  type = COALESCE(type, 'general')
WHERE type IS NULL;

-- Insert sample data if tables are empty
INSERT INTO clients (name, email, company_name, type, status) 
SELECT 'John Doe', 'john@example.com', 'Acme Corp', 'project', 'active'
WHERE NOT EXISTS (SELECT 1 FROM clients LIMIT 1);

INSERT INTO clients (name, email, company_name, type, status) 
SELECT 'Jane Smith', 'jane@example.com', 'Tech Solutions', 'retainer', 'active'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE email = 'jane@example.com');

INSERT INTO chat_channels (name) 
SELECT 'General'
WHERE NOT EXISTS (SELECT 1 FROM chat_channels WHERE name = 'General');

INSERT INTO chat_channels (name) 
SELECT 'Support'
WHERE NOT EXISTS (SELECT 1 FROM chat_channels WHERE name = 'Support'); 