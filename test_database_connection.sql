-- Test database connection and status column
-- Run this in your Supabase SQL Editor

-- Check if briefs table exists and has the status column
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'briefs' 
  AND column_name = 'status';

-- Check current briefs data
SELECT 
  id,
  title,
  stage,
  status,
  created_at
FROM briefs
LIMIT 5;

-- Count total briefs
SELECT COUNT(*) as total_briefs FROM briefs; 