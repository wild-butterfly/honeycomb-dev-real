-- Create invoices table with line items

CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id BIGINT,
  invoice_number VARCHAR(50),
  type VARCHAR(50) DEFAULT 'DRAFT',
  delivery_status VARCHAR(50) DEFAULT 'NOT_SENT',
  status VARCHAR(50) DEFAULT 'UNPAID',
  payment_period VARCHAR(50),
  card_payment_fee VARCHAR(50),
  subtotal NUMERIC(12, 2) DEFAULT 0,
  tax_amount NUMERIC(12, 2) DEFAULT 0,
  total_with_tax NUMERIC(12, 2) DEFAULT 0,
  amount_paid NUMERIC(12, 2) DEFAULT 0,
  amount_unpaid NUMERIC(12, 2) DEFAULT 0,
  labour_discount NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  online_payments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  markup NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_company_id
  ON invoices(company_id);

CREATE INDEX IF NOT EXISTS idx_invoices_job_id
  ON invoices(job_id);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id
  ON invoices(customer_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id
  ON invoice_line_items(invoice_id);

