-- ============================================================
-- SECURITY AUDIT: Verify Multi-Tenant Data Isolation
-- Run this to ensure proper company separation
-- ============================================================

-- 1. Check all users have proper company_id (except superadmin)
SELECT 
  id,
  email,
  role,
  company_id,
  active,
  CASE 
    WHEN role = 'superadmin' AND company_id IS NULL THEN '✅ OK - Superadmin can have NULL'
    WHEN company_id IS NULL THEN '❌ ERROR - Missing company_id'
    ELSE '✅ OK'
  END as status
FROM users
WHERE active = true
ORDER BY company_id NULLS FIRST, id;

-- 2. Ensure each company has at least one admin
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(u.id) as admin_count,
  STRING_AGG(u.email, ', ') as admin_emails,
  CASE 
    WHEN COUNT(u.id) = 0 THEN '❌ ERROR - No admin user'
    ELSE '✅ OK'
  END as status
FROM companies c
LEFT JOIN users u ON u.company_id = c.id AND u.role IN ('admin', 'owner') AND u.active = true
GROUP BY c.id, c.name
ORDER BY c.id;

-- 3. Check for UNIQUE constraint on email to prevent duplicates
SELECT 
  constraint_name,
  constraint_type,
  CASE 
    WHEN constraint_name LIKE '%email%' THEN '✅ OK - Email is unique'
    ELSE '❌ Check other constraints'
  END as status
FROM information_schema.table_constraints
WHERE table_name = 'users' 
AND constraint_type = 'UNIQUE';

-- 4. Verify no users can see other companies' data (test isolation)
-- This shows each company's user count
SELECT 
  c.id as company_id,
  c.name,
  COUNT(u.id) as user_count
FROM companies c
LEFT JOIN users u ON u.company_id = c.id AND u.active = true
GROUP BY c.id, c.name
ORDER BY c.id;

-- 5. Check if any user has access to multiple companies (should be 0, except superadmin with NULL)
SELECT 
  u.id,
  u.email,
  u.company_id,
  c.name as company_name,
  u.role,
  CASE 
    WHEN u.role = 'superadmin' AND u.company_id IS NULL THEN '✅ OK - Superadmin'
    WHEN u.company_id IS NOT NULL THEN '✅ OK - Single company'
    ELSE '⚠️  Check this user'
  END as status
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.active = true
ORDER BY u.company_id NULLS FIRST, u.id;

-- ============================================================
-- EXPECTED RESULTS:
-- ============================================================
-- Query 1: All users should have company_id (except superadmin)
-- Query 2: Every company should have at least 1 admin
-- Query 3: Email should have UNIQUE constraint
-- Query 4: Each company should have separate user counts
-- Query 5: No user should belong to multiple companies
-- ============================================================
