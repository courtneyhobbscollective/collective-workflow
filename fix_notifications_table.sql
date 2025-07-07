-- Fix Notifications Table - Add missing actionUrl column
-- Run this in your Supabase SQL Editor

-- Add the missing actionUrl column to the notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Update the notifications table structure to match the TypeScript interface
-- The actionUrl field is optional, so we don't need to set a default value

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position; 