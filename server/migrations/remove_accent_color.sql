-- Remove unused accent_color column from invoice_templates table
-- This field is not being used in the application

ALTER TABLE invoice_templates DROP COLUMN IF EXISTS accent_color;
