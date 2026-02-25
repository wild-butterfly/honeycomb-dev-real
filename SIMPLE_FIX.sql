-- ============================================================
-- SIMPLE FIX: Reset avatars, fix superadmin name, create A1 admin
-- Copy and paste this entire script into pgAdmin and run it
-- ============================================================

-- 1. Reset all avatars to NULL
UPDATE users SET avatar = NULL WHERE avatar IS NOT NULL;

-- 2. Fix the superadmin name (should not be "Tesla")
UPDATE users 
SET full_name = 'Super Admin'
WHERE email = 'askinfear@hotmail.com' AND role = 'superadmin';

-- 3. Check if A1 Testing admin already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@a1testing.com') THEN
    -- Create A1 Testing admin user
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
      '$2b$10$N9qo8uLOickgx2ZMRZoMy.xRygO8R3Yp3k0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z',
      'admin',
      1,
      'A1 Testing Admin',
      '',
      'Administrator',
      'Management',
      true,
      CURRENT_TIMESTAMP
    );
    RAISE NOTICE 'Created admin@a1testing.com user';
  ELSE
    RAISE NOTICE 'admin@a1testing.com already exists';
  END IF;
END $$;

-- 4. Verify the fix - check all users
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
ORDER BY u.company_id NULLS FIRST, u.id;

-- Expected result:
-- Row 1: askinfear@hotmail.com | superadmin | NULL | NULL | Super Admin | NULL
-- Row 2: admin@a1testing.com   | admin      | 1    | A1 Testing | A1 Testing Admin | NULL  
-- Row 3: tesla@test.com        | admin      | 2    | Tesla | NULL or [value] | NULL
