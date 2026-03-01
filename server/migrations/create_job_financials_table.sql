-- Migration: Create job_financials table
-- Purpose: Track job costs, revenue, and profit calculations
-- Supports Flowody Profit feature

CREATE TABLE IF NOT EXISTS job_financials (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,
  
  -- Job reference
  job_id BIGINT NOT NULL UNIQUE,
  CONSTRAINT fk_job_financials_jobs
    FOREIGN KEY (job_id)
    REFERENCES jobs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Cost breakdown
  labour_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  material_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  other_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- Calculated totals (updated via trigger or API)
  total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- Profit = revenue - total_cost
  profit DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- Margin = (profit / revenue) * 100 (percentage)
  margin DECIMAL(5, 2) NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_job_financials_job_id ON job_financials(job_id);

-- Create index for profit calculations (e.g., for profit pipeline gauge)
CREATE INDEX IF NOT EXISTS idx_job_financials_profit ON job_financials(profit DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_job_financials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_job_financials_updated_at ON job_financials;
CREATE TRIGGER trigger_update_job_financials_updated_at
BEFORE UPDATE ON job_financials
FOR EACH ROW
EXECUTE FUNCTION update_job_financials_updated_at();

-- Trigger to auto-calculate total_cost from components
CREATE OR REPLACE FUNCTION calculate_job_financials_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_cost
  NEW.total_cost := COALESCE(NEW.labour_cost, 0) + 
                    COALESCE(NEW.material_cost, 0) + 
                    COALESCE(NEW.other_cost, 0);
  
  -- Update profit
  NEW.profit := COALESCE(NEW.revenue, 0) - NEW.total_cost;
  
  -- Update margin (avoid division by zero)
  IF NEW.revenue > 0 THEN
    NEW.margin := (NEW.profit / NEW.revenue) * 100;
  ELSE
    NEW.margin := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_job_financials_totals ON job_financials;
CREATE TRIGGER trigger_calculate_job_financials_totals
BEFORE INSERT OR UPDATE ON job_financials
FOR EACH ROW
EXECUTE FUNCTION calculate_job_financials_totals();

-- Add RLS policy for job_financials (if enabled on jobs)
ALTER TABLE job_financials ENABLE ROW LEVEL SECURITY;

-- Policy: Allow access to job_financials only if user's company matches job's company
CREATE POLICY job_financials_company_isolation ON job_financials
  USING (
    job_id IN (
      SELECT id FROM jobs 
      WHERE company_id = current_setting('app.current_company_id')::bigint
        OR current_setting('app.god_mode') = 'true'
    )
  );

-- Policy: Allow inserts if the job belongs to the user's company
CREATE POLICY job_financials_insert ON job_financials
  FOR INSERT
  WITH CHECK (
    job_id IN (
      SELECT id FROM jobs 
      WHERE company_id = current_setting('app.current_company_id')::bigint
        OR current_setting('app.god_mode') = 'true'
    )
  );
