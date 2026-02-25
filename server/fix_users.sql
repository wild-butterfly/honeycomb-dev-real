-- Fix user setup for multi-tenant profile system
-- Run this to reset avatars and set up proper company admins

-- 1. Reset all avatars to NULL (default)
UPDATE users SET avatar = NULL;

-- 2. View current users
SELECT id, email, role, company_id, full_name FROM users ORDER BY id;

-- 3. Update superadmin to have a company_id (assign to first company as home base)
-- You can change this if you want the superadmin to belong to a different company
UPDATE users 
SET company_id = 1 
WHERE role = 'superadmin' AND company_id IS NULL;

-- 4. Check if A1 Testing (company_id=1) has an admin user
-- If not, we need to create one or assign the existing superadmin

-- View companies
SELECT * FROM companies ORDER BY id;

-- Check users per company
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(u.id) as user_count,
  STRING_AGG(u.email || ' (' || u.role || ')', ', ') as users
FROM companies c
LEFT JOIN users u ON u.company_id = c.id AND u.active = true
GROUP BY c.id, c.name
ORDER BY c.id;
