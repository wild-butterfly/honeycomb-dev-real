-- Migration: Add phase column to jobs table
-- Purpose: Support Flowody Job Lifecycle system with JobPhase enum

-- Add phase column with required phases
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS phase VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD CONSTRAINT phase_enum CHECK (
  phase IN (
    'pending', 'quoting', 'scheduled', 'in_progress',
    'completed', 'invoicing', 'paid'
  )
);

-- Create index for efficient phase filtering in gauges
CREATE INDEX IF NOT EXISTS idx_jobs_phase ON jobs(phase);

-- Create index for company + phase filtering
CREATE INDEX IF NOT EXISTS idx_jobs_company_phase ON jobs(company_id, phase);

-- Update existing jobs based on their status (legacy)
-- Map old status values to new phases if needed
UPDATE jobs
SET phase = CASE
  WHEN status IN ('quote', 'quote_sent', 'quote_accepted') THEN 'quoting'
  WHEN status IN ('scheduled', 'assigned') THEN 'scheduled'
  WHEN status = 'in_progress' THEN 'in_progress'
  WHEN status = 'completed' THEN 'completed'
  ELSE 'pending'
END
WHERE phase = 'pending'; -- Only update defaults
