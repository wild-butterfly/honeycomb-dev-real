-- Invoice Templates Table
-- Stores customizable invoice templates for each company

CREATE TABLE IF NOT EXISTS invoice_templates (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Invoice Template',
  is_default BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Styling
  main_color VARCHAR(7) DEFAULT '#FFFFFF',
  accent_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#000000',
  font_size VARCHAR(20) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  indent_customer_address BOOLEAN DEFAULT false,
  orientation VARCHAR(20) DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
  
  -- Content
  document_title VARCHAR(255) DEFAULT 'Tax Invoice',
  show_line_quantities BOOLEAN DEFAULT true,
  show_line_prices BOOLEAN DEFAULT true,
  show_line_totals BOOLEAN DEFAULT true,
  show_section_totals BOOLEAN DEFAULT true,
  show_line_items BOOLEAN DEFAULT true,
  show_labour_quantities BOOLEAN DEFAULT true,
  show_labour_prices BOOLEAN DEFAULT true,
  show_labour_totals BOOLEAN DEFAULT true,
  show_labour_section_totals BOOLEAN DEFAULT true,
  show_labour_items BOOLEAN DEFAULT true,
  show_material_quantities BOOLEAN DEFAULT true,
  show_material_prices BOOLEAN DEFAULT true,
  show_material_totals BOOLEAN DEFAULT true,
  show_material_section_totals BOOLEAN DEFAULT true,
  show_material_items BOOLEAN DEFAULT true,
  default_description TEXT,
  default_footer TEXT,
  
  -- Line Items (JSON)
  sections JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_templates_company_id ON invoice_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_is_default ON invoice_templates(company_id, is_default);

-- Create default template for each existing company
INSERT INTO invoice_templates (
  company_id, name, is_default, status,
  main_color, accent_color, text_color, font_size,
  document_title, default_description, default_footer
)
SELECT 
  id as company_id,
  'Default invoice template' as name,
  true as is_default,
  'active' as status,
  '#FFFFFF' as main_color,
  '#FFFFFF' as accent_color,
  '#000000' as text_color,
  'medium' as font_size,
  'Tax Invoice' as document_title,
  'Thank you for the opportunity to work on your property. If you have any concerns please contact the office and we will answer any questions.

Our aim is to make every customer a repeat, referring customer.' as default_description,
  'Invoices are due to be paid by the due date. Please make deposits to our bank account number as specified and include your invoice number as reference.

Any queries on this invoice should be notified to us within 7 days. Please bring to our attention any concerns you may have with the invoice.' as default_footer
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM invoice_templates WHERE invoice_templates.company_id = companies.id
);
