-- ============================================================
-- FIX USERS AND PROFILES FOR MULTI-TENANT SYSTEM
-- Resets avatars and creates proper admin users for each company
-- ============================================================

-- Step 1: Reset all avatars to default (NULL)
UPDATE users SET avatar = NULL WHERE avatar IS NOT NULL;

-- Step 2: Assign superadmin to company_id=1 as their "home" company
-- (Superadmins can still access all companies via impersonation)
UPDATE users 
SET company_id = 1 
WHERE role = 'superadmin' AND company_id IS NULL;

-- Step 3: Create admin users for each company that doesn't have one
-- This ensures every company has its own admin profile

-- For company_id=1 (A1 Testing) - create admin if doesn't exist
INSERT INTO users (email, password_hash, role, company_id, full_name, active)
SELECT 
  'admin@a1testing.com',
  '$2b$10$YourDefaultHashHere', -- This should be changed after creation
  'admin',
  1,
  'A1 Testing Admin',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM users 
  WHERE company_id = 1 
    AND role IN ('admin', 'owner')
    AND active = true
)
-- Only create if A1 Testing company exists
AND EXISTS (SELECT 1 FROM companies WHERE id = 1);

-- For company_id=2 (Tesla) - already has admin, just verify
-- User tesla@test.com exists with id=4

-- Step 4: View the results
SELECT 
  u.id,
  u.email,
  u.role,
  u.company_id,
  c.name as company_name,
  u.full_name,
  u.avatar,
  u.active
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
ORDER BY u.company_id, u.id;

-- Step 5: Verify each company has at least one admin
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(u.id) FILTER (WHERE u.role IN ('admin', 'owner', 'superadmin')) as admin_count,
  STRING_AGG(
    u.email || ' (' || u.role || ')', 
    ', '
  ) FILTER (WHERE u.role IN ('admin', 'owner', 'superadmin')) as admins
FROM companies c
LEFT JOIN users u ON u.company_id = c.id AND u.active = true
GROUP BY c.id, c.name
ORDER BY c.id;
