-- Add missing columns to companies table for logo and timestamps
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);

-- Create index for logo lookups
CREATE INDEX IF NOT EXISTS idx_companies_logo_url ON public.companies(logo_url);
CREATE INDEX IF NOT EXISTS idx_companies_updated_at ON public.companies(updated_at);
