-- Ensure Tasks Persistence in Briefs Table
-- Run this in your Supabase SQL Editor to verify and fix task persistence

-- Check if tasks column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'briefs' 
        AND column_name = 'tasks'
    ) THEN
        ALTER TABLE briefs ADD COLUMN tasks JSONB DEFAULT '[]';
        RAISE NOTICE 'Added tasks column to briefs table';
    ELSE
        RAISE NOTICE 'Tasks column already exists in briefs table';
    END IF;
END $$;

-- Verify the column structure
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'briefs' 
AND column_name = 'tasks';

-- Show current briefs with tasks data
SELECT 
    id, 
    title, 
    description,
    tasks,
    created_at,
    updated_at
FROM briefs 
ORDER BY updated_at DESC 
LIMIT 5; 