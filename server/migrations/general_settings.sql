-- ============================================================
-- GENERAL SETTINGS MIGRATION
-- Professional multi-tenant architecture following Simpro/Fergus pattern
-- ============================================================

-- 1. Extend companies table with general settings
-- This keeps core business settings with the company (single source of truth)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS abn VARCHAR(50),
ADD COLUMN IF NOT EXISTS payee_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS bsb_number VARCHAR(10),
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS job_number_prefix VARCHAR(20) DEFAULT 'JOB',
ADD COLUMN IF NOT EXISTS starting_job_number INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'AUD',
ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Australia/Melbourne',
ADD COLUMN IF NOT EXISTS auto_assign_phase BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_state_on_invoices BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_archive_unpriced BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS unpriced_jobs_cleanup_days INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS expired_quotes_cleanup_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS inactive_jobs_cleanup_days INTEGER,
ADD COLUMN IF NOT EXISTS auto_archive_stale_days INTEGER DEFAULT 120;

-- 2. Create taxes table (company-specific tax rates)
-- Allows each company to define their own tax types
CREATE TABLE IF NOT EXISTS public.taxes (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate NUMERIC(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_taxes_company 
    FOREIGN KEY (company_id) 
    REFERENCES public.companies(id) 
    ON DELETE CASCADE,
    
  -- Prevent duplicate tax names per company
  CONSTRAINT unique_company_tax_name 
    UNIQUE(company_id, name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_taxes_company_id ON public.taxes(company_id);
CREATE INDEX IF NOT EXISTS idx_taxes_active ON public.taxes(company_id, is_active) WHERE is_active = true;

-- 3. Create customer_sources table (lead tracking)
-- Each company can customize their lead sources
CREATE TABLE IF NOT EXISTS public.customer_sources (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_customer_sources_company 
    FOREIGN KEY (company_id) 
    REFERENCES public.companies(id) 
    ON DELETE CASCADE,
    
  -- Prevent duplicate source names per company
  CONSTRAINT unique_company_source_name 
    UNIQUE(company_id, name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_sources_company_id ON public.customer_sources(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_sources_active ON public.customer_sources(company_id, is_active) WHERE is_active = true;

-- 4. Add comments for documentation
COMMENT ON COLUMN public.companies.abn IS 'Australian Business Number';
COMMENT ON COLUMN public.companies.bsb_number IS 'Bank State Branch number (Australian banking)';
COMMENT ON COLUMN public.companies.job_number_prefix IS 'Prefix for auto-generated job numbers (e.g., JOB, PROJ)';
COMMENT ON COLUMN public.companies.starting_job_number IS 'Starting number for job sequence';
COMMENT ON COLUMN public.companies.unpriced_jobs_cleanup_days IS 'Days before unpriced jobs move to stale';
COMMENT ON COLUMN public.companies.expired_quotes_cleanup_days IS 'Days before expired quotes move to stale';
COMMENT ON COLUMN public.companies.inactive_jobs_cleanup_days IS 'Days before inactive jobs move to stale (NULL = never)';
COMMENT ON COLUMN public.companies.auto_archive_stale_days IS 'Days before stale jobs auto-archive';

COMMENT ON TABLE public.taxes IS 'Company-specific tax rates (GST, State Tax, etc.) for multi-tenant invoicing';
COMMENT ON TABLE public.customer_sources IS 'Lead source tracking per company (Google, Referral, etc.) for marketing analytics';

-- 5. Insert default GST for existing companies (Australian standard)
INSERT INTO public.taxes (company_id, name, rate)
SELECT id, 'GST', 10.00
FROM public.companies
WHERE NOT EXISTS (
  SELECT 1 FROM public.taxes WHERE company_id = companies.id AND name = 'GST'
);

-- 6. Insert common default customer sources for existing companies
INSERT INTO public.customer_sources (company_id, name)
SELECT companies.id, source_name
FROM public.companies
CROSS JOIN (
  VALUES 
    ('Google Search'),
    ('Social Media'),
    ('Referral')
) AS sources(source_name)
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.customer_sources 
  WHERE company_id = companies.id AND name = source_name
);

-- 7. Create audit trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to taxes
DROP TRIGGER IF EXISTS update_taxes_modtime ON public.taxes;
CREATE TRIGGER update_taxes_modtime 
  BEFORE UPDATE ON public.taxes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_modified_column();

-- Apply trigger to customer_sources
DROP TRIGGER IF EXISTS update_customer_sources_modtime ON public.customer_sources;
CREATE TRIGGER update_customer_sources_modtime 
  BEFORE UPDATE ON public.customer_sources 
  FOR EACH ROW 
  EXECUTE FUNCTION update_modified_column();
