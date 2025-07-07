-- Add new columns to existing clients table (preserves existing data)

-- Add company_name column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add type column with default
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'project' CHECK (type IN ('project', 'retainer'));

-- Add brand_assets column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_assets TEXT[] DEFAULT '{}';

-- Add brand_guidelines column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_guidelines TEXT;

-- Add brand_tone_of_voice column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_tone_of_voice TEXT;

-- Add brand_colors column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_colors TEXT[] DEFAULT '{}';

-- Add brand_fonts column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_fonts TEXT[] DEFAULT '{}';

-- Add social_media column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '[]';

-- Add contract_template column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_template TEXT;

-- Add chat_channel_id column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS chat_channel_id TEXT DEFAULT '';

-- Create index for company_name
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);

-- Update existing records to have the new default values
UPDATE clients SET 
  type = COALESCE(type, 'project'),
  brand_assets = COALESCE(brand_assets, '{}'),
  brand_colors = COALESCE(brand_colors, '{}'),
  brand_fonts = COALESCE(brand_fonts, '{}'),
  social_media = COALESCE(social_media, '[]'),
  chat_channel_id = COALESCE(chat_channel_id, '')
WHERE type IS NULL OR brand_assets IS NULL OR brand_colors IS NULL OR brand_fonts IS NULL OR social_media IS NULL OR chat_channel_id IS NULL; 