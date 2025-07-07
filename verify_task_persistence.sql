-- Verify Task Persistence and Database State
-- Run this in your Supabase SQL Editor to verify everything is working

-- 1. Check briefs table structure
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'briefs' 
ORDER BY ordinal_position;

-- 2. Show current briefs with their tasks
SELECT 
    id, 
    title, 
    description,
    tasks,
    stage,
    created_at,
    updated_at
FROM briefs 
ORDER BY updated_at DESC;

-- 3. Test inserting a brief with tasks (if you want to test)
-- Uncomment the following lines to test task insertion:
/*
INSERT INTO briefs (
    title, 
    description, 
    client_id, 
    tasks,
    stage
) VALUES (
    'Test Brief with Tasks',
    'This is a test description that can be converted to tasks',
    (SELECT id FROM clients LIMIT 1),
    '[
        {"id": "t-1", "title": "First task", "completed": false},
        {"id": "t-2", "title": "Second task", "completed": true},
        {"id": "t-3", "title": "Third task", "completed": false}
    ]'::jsonb,
    'incoming'
) RETURNING id, title, tasks;
*/

-- 4. Show task statistics
SELECT 
    COUNT(*) as total_briefs,
    COUNT(CASE WHEN tasks IS NOT NULL AND jsonb_array_length(tasks) > 0 THEN 1 END) as briefs_with_tasks,
    SUM(CASE WHEN tasks IS NOT NULL THEN jsonb_array_length(tasks) ELSE 0 END) as total_tasks,
    SUM(CASE 
        WHEN tasks IS NOT NULL THEN 
            (SELECT COUNT(*) FROM jsonb_array_elements(tasks) AS task WHERE (task->>'completed')::boolean = true)
        ELSE 0 
    END) as completed_tasks
FROM briefs; 