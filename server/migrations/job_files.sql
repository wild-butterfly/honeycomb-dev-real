-- =====================================================
-- JOB FILES TABLE
-- =====================================================
-- Stores metadata for files uploaded to jobs
-- Actual files stored in file system or object storage (R2/S3)

CREATE TABLE IF NOT EXISTS job_files (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- File info
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,           -- Local: /uploads/jobs/123/file.pdf or R2: https://...
  file_size BIGINT NOT NULL,         -- Bytes
  file_type VARCHAR(100) NOT NULL,   -- MIME type: image/jpeg, application/pdf
  
  -- Organization
  folder VARCHAR(50) DEFAULT 'documents' NOT NULL,  -- documents, photos, reports, invoices
  
  -- Metadata
  uploaded_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Indexes for performance
  CONSTRAINT job_files_job_id_idx CHECK (job_id > 0),
  CONSTRAINT job_files_file_size_check CHECK (file_size > 0 AND file_size <= 20971520)  -- Max 20MB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_files_job_id ON job_files(job_id);
CREATE INDEX IF NOT EXISTS idx_job_files_folder ON job_files(folder);
CREATE INDEX IF NOT EXISTS idx_job_files_uploaded_at ON job_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_files_uploaded_by ON job_files(uploaded_by);

-- RLS Policies (commented out for now, enable when multi-tenant)
-- ALTER TABLE job_files ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view files for their company's jobs"
--   ON job_files FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM jobs
--       WHERE jobs.id = job_files.job_id
--       AND jobs.company_id = (SELECT company_id FROM employees WHERE user_id = auth.uid())
--     )
--   );

-- CREATE POLICY "Users can upload files to their company's jobs"
--   ON job_files FOR INSERT
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM jobs
--       WHERE jobs.id = job_files.job_id
--       AND jobs.company_id = (SELECT company_id FROM employees WHERE user_id = auth.uid())
--     )
--   );

-- CREATE POLICY "Users can delete files from their company's jobs"
--   ON job_files FOR DELETE
--   USING (
--     EXISTS (
--       SELECT 1 FROM jobs
--       WHERE jobs.id = job_files.job_id
--       AND jobs.company_id = (SELECT company_id FROM employees WHERE user_id = auth.uid())
--     )
--   );

-- Grant permissions (commented out for local dev, enable for Supabase)
-- GRANT SELECT, INSERT, DELETE ON job_files TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE job_files_id_seq TO authenticated;
