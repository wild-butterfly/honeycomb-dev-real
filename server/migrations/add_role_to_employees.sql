-- Add role/trade column to employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS role VARCHAR(100) DEFAULT NULL;

COMMENT ON COLUMN public.employees.role IS 'Trade or role title e.g. Electrician, Plumber, Technician';
