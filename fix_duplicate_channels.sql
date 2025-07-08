-- Fix duplicate general channels and clean up chat channels
-- Run this in your Supabase SQL Editor

-- First, let's see what channels we have
SELECT 'Current channels:' as info;
SELECT id, name, client_id, created_at FROM chat_channels ORDER BY created_at;

-- Delete any duplicate general channels (keep the oldest one)
DELETE FROM chat_channels 
WHERE name = 'general' 
AND id NOT IN (
  SELECT MIN(id) 
  FROM chat_channels 
  WHERE name = 'general'
);

-- Delete any duplicate staff channels (keep the oldest one)
DELETE FROM chat_channels 
WHERE name = 'staff' 
AND id NOT IN (
  SELECT MIN(id) 
  FROM chat_channels 
  WHERE name = 'staff'
);

-- Update client channels to have better names (remove timestamp from existing ones)
UPDATE chat_channels 
SET name = CONCAT('client-', LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g')))
WHERE client_id IS NOT NULL 
AND name LIKE 'client-%';

-- Show the cleaned up channels
SELECT 'Cleaned up channels:' as info;
SELECT id, name, client_id, created_at FROM chat_channels ORDER BY created_at; 