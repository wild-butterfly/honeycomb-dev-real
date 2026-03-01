-- Fix any jobs that have draft, new, or needs_quote status but wrong phase
-- This ensures all PENDING statuses are in the pending phase

-- Check current state
SELECT 
  id,
  status,
  phase,
  customer_name,
  created_at
FROM jobs
WHERE status IN ('draft', 'Draft', 'new', 'New', 'needs_quote', 'Needs Quote')
  AND phase != 'pending'
ORDER BY created_at DESC;

-- Fix the phase for these jobs
UPDATE jobs
SET phase = 'pending'
WHERE status IN ('draft', 'Draft', 'new', 'New', 'needs_quote', 'Needs Quote', 'pending', 'Pending')
  AND phase != 'pending';

-- Verify the fix
SELECT 
  status,
  phase,
  COUNT(*) as count
FROM jobs
WHERE status IN ('draft', 'Draft', 'new', 'New', 'needs_quote', 'Needs Quote', 'pending', 'Pending')
GROUP BY status, phase
ORDER BY status, phase;
