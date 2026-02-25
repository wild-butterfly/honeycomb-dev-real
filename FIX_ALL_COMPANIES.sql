-- ============================================================
-- CHECK ALL COMPANIES AND CREATE MISSING ADMIN USERS
-- ============================================================

-- 1. First, let's see ALL companies
SELECT id, name FROM companies ORDER BY id;

-- 2. See which companies have admin users
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(u.id) as admin_count,
  STRING_AGG(u.email, ', ') as admin_emails
FROM companies c
LEFT JOIN users u ON u.company_id = c.id AND u.role IN ('admin', 'owner') AND u.active = true
GROUP BY c.id, c.name
ORDER BY c.id;

-- 3. Create admin users for ALL companies that don't have one
DO $$
DECLARE
  company_record RECORD;
  admin_email TEXT;
  company_slug TEXT;
BEGIN
  FOR company_record IN 
    SELECT c.id, c.name 
    FROM companies c
    WHERE NOT EXISTS (
      SELECT 1 FROM users u 
      WHERE u.company_id = c.id 
      AND u.role IN ('admin', 'owner') 
      AND u.active = true
    )
  LOOP
    -- Create email from company name (e.g., "Glider Ltd" -> "admin@glider.com")
    company_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(company_record.name, ' ', 1), '[^a-z0-9]', '', 'g'));
    admin_email := 'admin@' || company_slug || '.com';
    
    -- Insert admin user
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
      admin_email,
      '$2b$10$N9qo8uLOickgx2ZMRZoMy.xRygO8R3Yp3k0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z',
      'admin',
      company_record.id,
      company_record.name || ' Admin',
      '',
      'Administrator',
      'Management',
      true,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Created admin for company: % (ID: %, Email: %)', company_record.name, company_record.id, admin_email;
  END LOOP;
END $$;

-- 4. Verify all companies now have admin users
SELECT 
  c.id as company_id,
  c.name as company_name,
  u.id as user_id,
  u.email,
  u.role,
  u.full_name,
  u.avatar
FROM companies c
LEFT JOIN users u ON u.company_id = c.id AND u.role IN ('admin', 'owner', 'superadmin') AND u.active = true
ORDER BY c.id, u.id;
