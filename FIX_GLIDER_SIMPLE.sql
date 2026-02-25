-- ============================================================
-- SIMPLE FIX: Create admin for Glider Ltd
-- ============================================================

-- Insert admin user for Glider Ltd (company_id = 3)
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
  'admin@glider.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMy.xRygO8R3Yp3k0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z',
  'admin',
  3,
  'Glider Ltd Admin',
  '',
  'Administrator',
  'Management',
  true,
  CURRENT_TIMESTAMP
);

-- Verify all companies now have admins
SELECT 
  c.id as company_id,
  c.name as company_name,
  u.id as user_id,
  u.email,
  u.role,
  u.full_name
FROM companies c
LEFT JOIN users u ON u.company_id = c.id AND u.role IN ('admin', 'owner') AND u.active = true
ORDER BY c.id, u.id;
