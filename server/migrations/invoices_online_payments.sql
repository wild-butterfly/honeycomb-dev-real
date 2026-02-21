-- Add online payments flag to invoices

ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS online_payments_enabled BOOLEAN NOT NULL DEFAULT TRUE;
