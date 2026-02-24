-- Add logo_url column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_logo_url ON companies(logo_url);
