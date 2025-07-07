-- Simple Clients Table Update - Add missing columns for enhanced client form
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
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position; 