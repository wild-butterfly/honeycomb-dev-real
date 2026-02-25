-- ============================================
-- VERIFY INVOICE TEMPLATE SAVES
-- ============================================

-- 1. Check if sections are being saved in invoice_templates
SELECT 
  id,
  name,
  sections,
  show_section_totals,
  show_line_items,
  show_line_quantities,
  show_line_prices,
  show_line_totals,
  created_at,
  updated_at
FROM invoice_templates
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check specific template with all column visibility settings
SELECT 
  id,
  name,
  company_id,
  is_default,
  status,
  sections,
  show_company_logo,
  show_section_totals,
  show_line_items,
  show_line_quantities,
  show_line_prices,
  show_line_totals,
  created_at
FROM invoice_templates
ORDER BY updated_at DESC
LIMIT 1;

-- 3. Check if logo_url is stored in general_settings
SELECT 
  company_id,
  logo_url,
  business_name,
  updated_at
FROM general_settings
ORDER BY updated_at DESC
LIMIT 5;

-- 4. Count total templates per company
SELECT 
  company_id,
  COUNT(*) as template_count,
  MAX(created_at) as latest_created
FROM invoice_templates
GROUP BY company_id
ORDER BY company_id;

-- 5. Check sections column data type and content
SELECT 
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'invoice_templates' 
AND column_name = 'sections';

-- 6. View raw sections data (to see if it's being saved as JSON)
SELECT 
  id,
  name,
  sections as sections_raw,
  LENGTH(sections) as sections_length
FROM invoice_templates
WHERE sections IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- 7. Test JSON parsing - check if sections can be parsed
SELECT 
  id,
  name,
  CASE 
    WHEN sections IS NULL THEN 'NULL'
    WHEN sections = '[]' THEN 'EMPTY ARRAY'
    WHEN sections = '""' THEN 'EMPTY STRING'
    ELSE 'HAS DATA'
  END as sections_status,
  sections
FROM invoice_templates
ORDER BY created_at DESC
LIMIT 5;

-- 8. Check all boolean visibility columns for the latest template
SELECT 
  id,
  name,
  show_company_logo,
  show_section_totals,
  show_line_items,
  show_line_quantities,
  show_line_prices,
  show_line_totals,
  show_labour_items,
  show_material_items
FROM invoice_templates
ORDER BY updated_at DESC
LIMIT 1;

-- 9. Get detailed info about the latest saved template
SELECT 
  id,
  company_id,
  name,
  is_default,
  status,
  main_color,
  accent_color,
  font_size,
  orientation,
  show_company_logo,
  document_title,
  sections,
  default_description,
  default_footer,
  created_at,
  updated_at
FROM invoice_templates
ORDER BY updated_at DESC
LIMIT 1 \gset

-- Show the ID for reference
\echo 'Latest Template ID:'
SELECT id, name FROM invoice_templates ORDER BY updated_at DESC LIMIT 1;
