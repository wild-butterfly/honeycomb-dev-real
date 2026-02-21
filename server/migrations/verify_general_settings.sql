-- ============================================================
-- GENERAL SETTINGS VERIFICATION QUERIES
-- Check that all tables, columns, triggers, and indexes exist
-- ============================================================

-- 1. CHECK: Verify new columns exist in companies table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'companies' 
AND column_name IN (
  'abn', 'payee_name', 'bsb_number', 'bank_account_number',
  'job_number_prefix', 'starting_job_number', 'currency', 
  'date_format', 'timezone', 'auto_assign_phase', 
  'show_state_on_invoices', 'auto_archive_unpriced',
  'unpriced_jobs_cleanup_days', 'expired_quotes_cleanup_days',
  'inactive_jobs_cleanup_days', 'auto_archive_stale_days'
)
ORDER BY ordinal_position;

-- 2. CHECK: Verify taxes table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'taxes'
ORDER BY ordinal_position;

-- 3. CHECK: Verify customer_sources table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customer_sources'
ORDER BY ordinal_position;

-- 4. CHECK: Verify indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('taxes', 'customer_sources', 'companies')
AND indexdef LIKE '%taxes%' OR indexdef LIKE '%customer_sources%'
ORDER BY indexname;

-- 5. CHECK: Verify triggers exist
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('taxes', 'customer_sources')
ORDER BY trigger_name;

-- 6. CHECK: View default GST data
SELECT id, company_id, name, rate, is_active, created_at
FROM public.taxes
LIMIT 10;

-- 7. CHECK: View default customer sources
SELECT id, company_id, name, is_active, usage_count, created_at
FROM public.customer_sources
ORDER BY company_id, name
LIMIT 20;

-- 8. CHECK: Verify foreign key constraints
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('taxes', 'customer_sources')
AND constraint_name LIKE '%fk%'
ORDER BY table_name;

-- 9. CHECK: Count total records
SELECT 
  'companies' as table_name, COUNT(*) as total_rows FROM public.companies
UNION ALL
SELECT 'taxes', COUNT(*) FROM public.taxes
UNION ALL
SELECT 'customer_sources', COUNT(*) FROM public.customer_sources;

-- 10. CHECK: View unique constraints
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('taxes', 'customer_sources')
AND constraint_type = 'UNIQUE'
ORDER BY table_name;
