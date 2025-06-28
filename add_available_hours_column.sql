-- Add available_hours_per_week column to staff table
-- Run this in your Supabase SQL editor

ALTER TABLE staff 
ADD COLUMN available_hours_per_week INTEGER DEFAULT 0;

-- Add a comment to document the column
COMMENT ON COLUMN staff.available_hours_per_week IS 'Number of hours this staff member is available for project work per week (0 = not included in utilisation)';

-- Update existing staff members with default values if needed
UPDATE staff 
SET available_hours_per_week = 0 
WHERE available_hours_per_week IS NULL; 