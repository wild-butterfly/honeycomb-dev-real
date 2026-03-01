-- Migration: Normalize existing job statuses to the new 7-phase workflow
-- Safe to run multiple times (only updates rows not already using phase keys)
--
-- Old values → new phase keys:
--   pending / Pending              → new
--   active  / Active               → in_progress
--   complete / Complete / completed → completed
--   quote / pricing / estimate     → quote
--   scheduled / scheduling          → scheduled

UPDATE jobs
SET status = CASE
  WHEN LOWER(TRIM(status)) IN ('pending', 'start', '') THEN 'new'
  WHEN LOWER(TRIM(status)) IN ('active', 'in progress', 'in_progress') THEN 'in_progress'
  WHEN LOWER(TRIM(status)) IN (
    'complete', 'completed', 'paid', 'payment',
    'invoiced', 'invoice', 'back costing', 'back_costing'
  ) THEN 'completed'
  WHEN LOWER(TRIM(status)) IN ('quote', 'pricing', 'estimate') THEN 'quote'
  WHEN LOWER(TRIM(status)) IN ('quote_sent', 'quote sent') THEN 'quote_sent'
  WHEN LOWER(TRIM(status)) IN ('quote_accepted', 'quote accepted') THEN 'quote_accepted'
  WHEN LOWER(TRIM(status)) IN ('scheduled', 'scheduling', 'schedule') THEN 'scheduled'
  ELSE 'new'
END
WHERE LOWER(TRIM(COALESCE(status, ''))) NOT IN (
  'new', 'quote', 'quote_sent', 'quote_accepted', 'scheduled', 'in_progress', 'completed'
);
