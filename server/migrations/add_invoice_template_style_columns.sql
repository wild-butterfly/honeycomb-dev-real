-- Add missing style columns to invoice_templates

ALTER TABLE invoice_templates
ADD COLUMN IF NOT EXISTS header_background_color VARCHAR(7) DEFAULT '#fffef7',
ADD COLUMN IF NOT EXISTS border_color VARCHAR(7) DEFAULT '#fbbf24',
ADD COLUMN IF NOT EXISTS border_width VARCHAR(3) DEFAULT '1px',
ADD COLUMN IF NOT EXISTS table_header_background_color VARCHAR(7) DEFAULT '#fbbf24',
ADD COLUMN IF NOT EXISTS table_header_gradient_color VARCHAR(7) DEFAULT '#f59e0b',
ADD COLUMN IF NOT EXISTS table_header_text_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS table_header_style VARCHAR(10) DEFAULT 'solid',
ADD COLUMN IF NOT EXISTS description_background_color VARCHAR(7) DEFAULT '#fffef7',
ADD COLUMN IF NOT EXISTS description_border_color VARCHAR(7) DEFAULT '#fbbf24',
ADD COLUMN IF NOT EXISTS description_text_color VARCHAR(7) DEFAULT '#374151',
ADD COLUMN IF NOT EXISTS show_company_logo BOOLEAN DEFAULT true;
