-- Create invoice_settings table for storing company invoice configuration
CREATE TABLE IF NOT EXISTS public.invoice_settings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  company_name VARCHAR(255),
  company_address TEXT,
  company_city VARCHAR(100),
  company_state VARCHAR(50),
  company_postal_code VARCHAR(20),
  company_phone VARCHAR(20),
  company_email VARCHAR(100),
  company_website VARCHAR(255),
  company_logo_url TEXT,
  tax_registration_number VARCHAR(50),
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_sort_code VARCHAR(20),
  bank_code VARCHAR(20),
  iban VARCHAR(50),
  swift_code VARCHAR(20),
  custom_invoice_notes TEXT,
  payment_terms TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key to companies table
  CONSTRAINT fk_invoice_settings_company 
    FOREIGN KEY (company_id) 
    REFERENCES public.companies(id) 
    ON DELETE CASCADE,
    
  -- Unique constraint: one settings per company
  CONSTRAINT unique_company_settings 
    UNIQUE(company_id)
);

-- Create index for faster lookups by company_id
CREATE INDEX IF NOT EXISTS idx_invoice_settings_company_id ON public.invoice_settings(company_id);

-- Add comment to table
COMMENT ON TABLE public.invoice_settings IS 'Stores invoice configuration and company details for PDF generation';
