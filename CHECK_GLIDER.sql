-- ============================================================
-- INVESTIGATE GLIDER LTD DATABASE STATE
-- ============================================================

-- Check if Glider Ltd exists in companies table
SELECT id, name, created_at FROM companies WHERE LOWER(name) LIKE '%glider%' ORDER BY id;

-- Check ALL companies
SELECT id, name, created_at FROM companies ORDER BY id;

-- Check if there are any users associated with Glider Ltd
SELECT 
  u.id,
  u.email,
  u.role,
  u.company_id,
  c.name as company_name,
  u.full_name,
  u.active,
  u.created_at
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE c.name LIKE '%Glider%' OR u.email LIKE '%glider%'
ORDER BY u.id;

-- Check ALL users to see the full picture
SELECT 
  u.id,
  u.email,
  u.role,
  u.company_id,
  c.name as company_name,
  u.full_name,
  u.active
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
ORDER BY u.company_id NULLS FIRST, u.id;
