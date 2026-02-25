-- Check what columns exist in companies table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- Check if logo_url exists
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'companies' AND column_name = 'logo_url';

-- Check if updated_at exists
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'companies' AND column_name = 'updated_at';

-- Check if avatar exists
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'companies' AND column_name = 'avatar';
