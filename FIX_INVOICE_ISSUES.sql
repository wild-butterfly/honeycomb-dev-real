-- Fix invoice table issues
-- Run this in pgAdmin if invoice creation or download is failing

-- 1. Add missing 'category' column to invoice_line_items
--    (required for creating new invoices)
ALTER TABLE invoice_line_items
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'labour';

-- 2. Add any missing columns to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS template_id BIGINT,
ADD COLUMN IF NOT EXISTS material_discount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS material_markup NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS letterhead TEXT,
ADD COLUMN IF NOT EXISTS xero_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS xero_sync_status TEXT,
ADD COLUMN IF NOT EXISTS xero_last_sync_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Done
SELECT 'Invoice table fixes applied successfully' AS result;
