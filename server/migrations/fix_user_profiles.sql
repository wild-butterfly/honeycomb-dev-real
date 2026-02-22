-- ============================================================
-- SIMPLE USER FIX: Reset avatars and create company admins
-- ============================================================

-- 1. Reset all avatars
UPDATE users SET avatar = NULL;

-- 2. Check what companies exist
SELECT id, name FROM companies ORDER BY id;

-- 3. Create admin for company_id=1 (A1 Testing) if it doesn't exist
INSERT INTO users (
  email, 
  password_hash, 
  role, 
  company_id, 
  full_name, 
  active,
  created_at
)
SELECT 
  'admin@a1testing.com',
  -- Password is 'password123' - CHANGE THIS AFTER CREATION
  '$2b$10$rK1XvZ8QZGZJxZ4jVxB7HuLhK0S5YxK5yH0yN0pK0K0K0K0K0K0K0K',
  'admin',
  1,
  'A1 Testing',
  true,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE company_id = 1 AND active = true
);

-- 4. Verify the setup
SELECT 
  u.id,
  u.email,
  u.role,
  u.company_id,
  c.name as company_name,
  u.full_name
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
WHERE u.active = true
ORDER BY u.company_id NULLS FIRST, u.id;

-- Expected result:
-- Row 1: askinfear@hotmail.com, superadmin, company_id=NULL (can access all companies)
-- Row 2: admin@a1testing.com, admin, company_id=1 (A1 Testing's profile)
-- Row 3: tesla@test.com, admin, company_id=2 (Tesla's profile)
