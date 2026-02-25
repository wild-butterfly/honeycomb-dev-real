-- Check the users table structure
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check if RLS is enabled on users table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- Check RLS policies on users table
SELECT 
  policyname,
  tablename,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';
