-- Add calendar column to staff table
-- Run this in your Supabase SQL Editor

-- Add calendar column to store calendar entries as JSONB
ALTER TABLE staff ADD COLUMN IF NOT EXISTS calendar JSONB DEFAULT '[]';

-- Update existing staff records to have empty calendar arrays
UPDATE staff SET calendar = '[]' WHERE calendar IS NULL;

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'staff' AND column_name = 'calendar';

-- Show sample staff data with calendar
SELECT 
  id,
  name,
  email,
  calendar,
  created_at
FROM staff
LIMIT 5; 