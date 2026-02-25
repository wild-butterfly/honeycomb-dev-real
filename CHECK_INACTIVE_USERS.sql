-- Check if there are any INACTIVE users for Glider Ltd
-- Maybe the user was created but marked inactive?
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
WHERE u.company_id = 3 OR c.name LIKE '%Glider%'
ORDER BY u.id;

-- Check for any failed user insertions or constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'users' 
AND constraint_type IN ('UNIQUE', 'CHECK');
