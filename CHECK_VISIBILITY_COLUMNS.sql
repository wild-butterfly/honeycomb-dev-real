-- Check what's actually saved in template ID 38 (Invoice Template 5)
SELECT 
  id,
  name,
  show_section_totals,
  show_line_items,
  show_line_quantities,
  show_line_prices,
  show_line_totals,
  show_company_logo,
  sections,
  updated_at
FROM invoice_templates
WHERE id = 38;

-- Also check the most recent template
SELECT 
  id,
  name,
  show_section_totals,
  show_line_items,
  show_line_quantities,
  show_line_prices,
  show_line_totals,
  show_company_logo,
  sections,
  updated_at
FROM invoice_templates
ORDER BY updated_at DESC
LIMIT 1;
