-- Test Automated Billing Setup
-- Run this in Supabase SQL Editor to verify the setup

-- 1. Check if billing_queue table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'billing_queue'
) as billing_queue_exists;

-- 2. Check if billing_schedule table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'billing_schedule'
) as billing_schedule_exists;

-- 3. Check if invoice_items table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'invoice_items'
) as invoice_items_exists;

-- 4. Check if billing functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'generate_invoice_number',
  'add_retainer_to_billing_queue',
  'handle_brief_stage_billing',
  'process_billing_queue',
  'get_billing_dashboard_data'
);

-- 5. Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name IN (
  'trigger_retainer_billing_queue',
  'trigger_brief_stage_billing'
);

-- 6. Check if clients table has retainer columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN (
  'retainer_amount',
  'retainer_billing_day',
  'retainer_start_date',
  'retainer_end_date',
  'retainer_active'
)
ORDER BY column_name;

-- 7. Check if briefs table has billing columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'briefs' 
AND column_name IN (
  'billing_stage',
  'last_billing_date',
  'project_value'
)
ORDER BY column_name;

-- 8. Check if invoices table has billing columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name IN (
  'billing_type',
  'billing_stage',
  'billing_percentage',
  'invoice_number',
  'vat_amount',
  'total_amount'
)
ORDER BY column_name; 