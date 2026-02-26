-- Quote Templates Table
-- Stores customizable quote templates for each company

CREATE TABLE IF NOT EXISTS quote_templates (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Quote Template',
  is_default BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Styling
  main_color VARCHAR(7) DEFAULT '#FFFFFF',
  accent_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#000000',
  font_size VARCHAR(20) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  indent_customer_address BOOLEAN DEFAULT false,
  orientation VARCHAR(20) DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
  header_background_color VARCHAR(7) DEFAULT '#ffffff',
  border_color VARCHAR(7) DEFAULT '#fbbf24',
  border_width VARCHAR(3) DEFAULT '1px',
  table_header_background_color VARCHAR(7) DEFAULT '#fbbf24',
  table_header_gradient_color VARCHAR(7) DEFAULT '#f59e0b',
  table_header_text_color VARCHAR(7) DEFAULT '#ffffff',
  table_header_style VARCHAR(10) DEFAULT 'solid',
  description_background_color VARCHAR(7) DEFAULT '#fafafa',
  description_border_color VARCHAR(7) DEFAULT '#fbbf24',
  description_text_color VARCHAR(7) DEFAULT '#374151',
  show_company_logo BOOLEAN DEFAULT true,
  
  -- Content
  document_title VARCHAR(255) DEFAULT 'Quote',
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
CREATE INDEX IF NOT EXISTS idx_quote_templates_company_id ON quote_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_quote_templates_is_default ON quote_templates(company_id, is_default);

