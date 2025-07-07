-- Add status field to briefs table
-- Run this in your Supabase SQL Editor

-- Add status column to briefs table
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'on-hold', 'waiting-for-client', 'shoot-booked', 'sent-for-client-feedback'));

-- Update existing briefs to have a default status
UPDATE briefs SET status = 'in-progress' WHERE status IS NULL;

-- Verify the change
SELECT 
  id,
  title,
  stage,
  status,
  created_at
FROM briefs
ORDER BY created_at DESC
LIMIT 10; 