-- Customers table for multi-tenant customer management
-- Safe to run multiple times

CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Core identity
  company_name TEXT NOT NULL,
  customer_source TEXT,

  -- Main/default contact
  main_contact_first_name TEXT,
  main_contact_last_name TEXT,
  main_contact_title TEXT,
  main_contact_type TEXT,
  main_contact_value TEXT,
  main_secondary_contact_type TEXT,
  main_contact_email TEXT,

  -- Physical address
  address_line1 TEXT,
  address_line2 TEXT,
  suburb TEXT,
  city TEXT,
  state_region TEXT,
  postcode TEXT,
  country TEXT,

  -- Flags
  same_as_main_contact BOOLEAN NOT NULL DEFAULT TRUE,
  same_as_physical_address BOOLEAN NOT NULL DEFAULT TRUE,

  -- Billing contact (optional override)
  billing_contact_first_name TEXT,
  billing_contact_last_name TEXT,
  billing_contact_title TEXT,
  billing_contact_type TEXT,
  billing_contact_value TEXT,
  billing_contact_email TEXT,

  -- Customer settings
  pricing_tier TEXT,
  payment_terms TEXT,
  card_payment_fee TEXT,
  charge_out_rate NUMERIC(12,2),
  material_discount NUMERIC(7,2),
  labour_discount NUMERIC(7,2),
  custom_tax_rate NUMERIC(7,2),
  disable_invoice_reminders TEXT,
  attach_invoice_pdf BOOLEAN NOT NULL DEFAULT FALSE,
  disable_quote_reminders TEXT,

  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_company_id
  ON customers(company_id);

CREATE INDEX IF NOT EXISTS idx_customers_company_name
  ON customers(company_name);

CREATE INDEX IF NOT EXISTS idx_customers_created_at
  ON customers(created_at DESC);
