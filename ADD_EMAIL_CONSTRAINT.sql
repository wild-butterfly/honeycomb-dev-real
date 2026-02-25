-- ============================================================
-- ADD UNIQUE CONSTRAINT TO EMAIL COLUMN
-- This ensures no duplicate emails can be registered
-- ============================================================

-- Check current constraints on users table
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Add UNIQUE constraint to email if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'users' 
    AND constraint_name = 'users_email_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    RAISE NOTICE 'Added UNIQUE constraint on users.email';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on users.email';
  END IF;
END $$;

-- Verify constraint was added
SELECT 
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'users' 
AND tc.constraint_type = 'UNIQUE';
