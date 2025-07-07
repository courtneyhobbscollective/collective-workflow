-- Verify Hours Calculations and Data Persistence
-- Run this in your Supabase SQL Editor to check everything is working

-- 1. Check staff table structure and data
SELECT 
  'STAFF TABLE STRUCTURE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- 2. Check briefs table structure and data
SELECT 
  'BRIEFS TABLE STRUCTURE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'briefs' 
ORDER BY ordinal_position;

-- 3. Check current staff data with hours
SELECT 
  'STAFF DATA' as check_type,
  id,
  name,
  email,
  monthly_available_hours,
  hourly_rate,
  skills,
  avatar_url,
  created_at
FROM staff
ORDER BY created_at DESC;

-- 4. Check current briefs data with hours and assignments
SELECT 
  'BRIEFS DATA' as check_type,
  id,
  title,
  client_id,
  estimated_hours,
  assigned_staff,
  stage,
  due_date,
  contract_signed,
  created_at
FROM briefs
ORDER BY created_at DESC;

-- 5. Calculate total hours assigned per staff member
SELECT 
  'STAFF HOURS CALCULATION' as check_type,
  s.id,
  s.name,
  s.monthly_available_hours as capacity,
  COALESCE(SUM(
    (b.estimated_hours->>'shoot')::numeric + 
    (b.estimated_hours->>'edit')::numeric
  ), 0) as total_assigned_hours,
  s.monthly_available_hours - COALESCE(SUM(
    (b.estimated_hours->>'shoot')::numeric + 
    (b.estimated_hours->>'edit')::numeric
  ), 0) as available_hours
FROM staff s
LEFT JOIN briefs b ON s.id = ANY(b.assigned_staff)
GROUP BY s.id, s.name, s.monthly_available_hours
ORDER BY s.name;

-- 6. Check for any staff with overbooking
SELECT 
  'OVERBOOKING CHECK' as check_type,
  s.id,
  s.name,
  s.monthly_available_hours as capacity,
  COALESCE(SUM(
    (b.estimated_hours->>'shoot')::numeric + 
    (b.estimated_hours->>'edit')::numeric
  ), 0) as total_assigned_hours,
  CASE 
    WHEN COALESCE(SUM(
      (b.estimated_hours->>'shoot')::numeric + 
      (b.estimated_hours->>'edit')::numeric
    ), 0) > s.monthly_available_hours 
    THEN 'OVERBOOKED'
    ELSE 'OK'
  END as status
FROM staff s
LEFT JOIN briefs b ON s.id = ANY(b.assigned_staff)
GROUP BY s.id, s.name, s.monthly_available_hours
HAVING COALESCE(SUM(
  (b.estimated_hours->>'shoot')::numeric + 
  (b.estimated_hours->>'edit')::numeric
), 0) > s.monthly_available_hours
ORDER BY total_assigned_hours DESC;

-- 7. Check brief assignments and required hours
SELECT 
  'BRIEF ASSIGNMENTS' as check_type,
  b.id,
  b.title,
  (b.estimated_hours->>'shoot')::numeric as shoot_hours,
  (b.estimated_hours->>'edit')::numeric as edit_hours,
  (b.estimated_hours->>'shoot')::numeric + (b.estimated_hours->>'edit')::numeric as total_required_hours,
  b.assigned_staff,
  array_length(b.assigned_staff, 1) as staff_count
FROM briefs b
WHERE b.assigned_staff IS NOT NULL AND array_length(b.assigned_staff, 1) > 0
ORDER BY total_required_hours DESC;

-- 8. Verify JSONB structure for estimated_hours
SELECT 
  'JSONB STRUCTURE CHECK' as check_type,
  id,
  title,
  estimated_hours,
  jsonb_typeof(estimated_hours) as hours_type,
  estimated_hours ? 'shoot' as has_shoot,
  estimated_hours ? 'edit' as has_edit
FROM briefs
WHERE estimated_hours IS NOT NULL
LIMIT 5;

-- 9. Check for any data inconsistencies
SELECT 
  'DATA CONSISTENCY CHECK' as check_type,
  'briefs_with_null_hours' as issue,
  COUNT(*) as count
FROM briefs 
WHERE estimated_hours IS NULL
UNION ALL
SELECT 
  'briefs_with_invalid_hours' as issue,
  COUNT(*) as count
FROM briefs 
WHERE estimated_hours IS NOT NULL 
  AND (estimated_hours->>'shoot')::numeric < 0 
  OR (estimated_hours->>'edit')::numeric < 0
UNION ALL
SELECT 
  'staff_with_null_hours' as issue,
  COUNT(*) as count
FROM staff 
WHERE monthly_available_hours IS NULL
UNION ALL
SELECT 
  'staff_with_invalid_hours' as issue,
  COUNT(*) as count
FROM staff 
WHERE monthly_available_hours <= 0;

-- 10. Summary statistics
SELECT 
  'SUMMARY STATISTICS' as check_type,
  (SELECT COUNT(*) FROM staff) as total_staff,
  (SELECT COUNT(*) FROM briefs) as total_briefs,
  (SELECT COUNT(*) FROM briefs WHERE assigned_staff IS NOT NULL AND array_length(assigned_staff, 1) > 0) as briefs_with_assignments,
  (SELECT AVG(monthly_available_hours) FROM staff) as avg_staff_capacity,
  (SELECT AVG((estimated_hours->>'shoot')::numeric + (estimated_hours->>'edit')::numeric) FROM briefs WHERE estimated_hours IS NOT NULL) as avg_brief_hours; 