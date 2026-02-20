-- employee_notes table migration
-- Run this SQL in your PostgreSQL database

CREATE TABLE IF NOT EXISTS employee_notes (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT employee_notes_job_fk FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT employee_notes_employee_fk FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Index for faster queries by job
CREATE INDEX IF NOT EXISTS idx_employee_notes_job_id ON employee_notes(job_id);

-- Index for faster queries by employee (for deletion authorization)
CREATE INDEX IF NOT EXISTS idx_employee_notes_employee_id ON employee_notes(employee_id);

-- Index for ordering by created_at
CREATE INDEX IF NOT EXISTS idx_employee_notes_created_at ON employee_notes(created_at DESC);

-- Optional: Add RLS policies if using Row Level Security
-- ALTER TABLE employee_notes ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY employee_notes_company_isolation ON employee_notes
-- USING (
--   job_id IN (
--     SELECT id FROM jobs WHERE company_id = current_setting('app.current_company_id')::bigint
--   )
-- );
