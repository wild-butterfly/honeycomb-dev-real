-- Add category column to invoice_line_items
-- This allows categorizing items as 'labour', 'material', 'fee', etc.

ALTER TABLE invoice_line_items
ADD COLUMN category VARCHAR(50) DEFAULT 'labour';

-- Create index for faster filtering
CREATE INDEX idx_invoice_line_items_category ON invoice_line_items(category);

-- Add comment
COMMENT ON COLUMN invoice_line_items.category IS 'Item category: labour, material, fee, subcontractor, etc.';
