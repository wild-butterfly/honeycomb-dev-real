-- ============================================================
-- QUICK FIX: Reset avatars and create A1 Testing admin
-- ============================================================

-- STEP 1: Reset all avatars to default (NULL)
UPDATE users SET avatar = NULL;

-- STEP 2: Check what companies exist
SELECT id, name FROM companies ORDER BY id;

-- STEP 3: Check current users
SELECT id, email, role, company_id, full_name FROM users WHERE active = true ORDER BY id;

-- STEP 4: Create A1 Testing admin user (company_id = 1)
-- Find out which company_id is A1 Testing from STEP 2
-- Replace the company_id value below if A1 Testing is not id=1

INSERT INTO users (
  email, 
  password_hash, 
  role, 
  company_id, 
  full_name, 
  phone,
  job_title,
  department,
  active,
  created_at
) VALUES (
  'admin@a1testing.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMy.xRygO8R3Yp3k0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z', -- Change password after creation by logging in
  'admin',
  1, -- Change this if A1 Testing has a different company_id
  'A1 Testing',
  '',
  '',
  'Full-Stack Developer',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- STEP 5: Verify - you should now see 3 users:
-- 1. askinfear@hotmail.com (superadmin, company_id=null or 1)
-- 2. admin@a1testing.com (admin, company_id=1) 
-- 3. tesla@test.com (admin, company_id=2)

SELECT 
  u.id,
  u.email,
  u.role,
  u.company_id,
  c.name as company_name,
  u.full_name,
  u.avatar
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
WHERE u.active = true
ORDER BY u.company_id, u.id;

-- Done! Now when you:
-- - Select "A1 Testing" dropdown → Shows A1 Testing admin profile
-- - Select "Tesla" dropdown → Shows Tesla admin profile (tesla@test.com)
