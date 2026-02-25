-- Check company data in both tables
-- First check the companies table (what the API currently returns)
SELECT 
  id,
  name as business_name,
  abn,
  logo_url,
  created_at
FROM companies
ORDER BY id;

-- Then check the invoice_settings table (where address/phone/email are stored)
SELECT 
  id,
  company_id,
  company_name,
  company_address,
  company_city,
  company_state,
  company_postal_code,
  company_phone,
  company_email,
  company_website,
  company_logo_url,
  tax_registration_number,
  created_at,
  updated_at
FROM invoice_settings
ORDER BY company_id;

-- Check if your company has invoice_settings (replace 1 with your company_id):
-- SELECT * FROM invoice_settings WHERE company_id = 1;

-- Combined view of what SHOULD be returned:
SELECT 
  c.id as company_id,
  c.name as business_name,
  c.abn,
  c.logo_url,
  i.company_address,
  i.company_city,
  i.company_state,
  i.company_postal_code,
  i.company_phone,
  i.company_email,
  i.company_website
FROM companies c
LEFT JOIN invoice_settings i ON c.id = i.company_id
ORDER BY c.id;
