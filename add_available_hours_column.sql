-- Add available_hours_per_week column to staff table
-- Run this in your Supabase SQL editor

ALTER TABLE staff 
ADD COLUMN available_hours_per_week INTEGER DEFAULT 22;

-- Add a comment to document the column
COMMENT ON COLUMN staff.available_hours_per_week IS 'Number of hours this staff member is available for project work per week';

-- Update existing staff members with default values if needed
UPDATE staff 
SET available_hours_per_week = 22 
WHERE available_hours_per_week IS NULL; 