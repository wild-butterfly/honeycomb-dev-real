-- ============================================================
-- LABOUR REASONS MIGRATION
-- Per-company uncharged time reasons for the labour module
-- ============================================================

CREATE TABLE IF NOT EXISTS public.labour_reasons (
  id         SERIAL PRIMARY KEY,
  company_id INTEGER      NOT NULL,
  name       VARCHAR(150) NOT NULL,
  paid       BOOLEAN      NOT NULL DEFAULT true,
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_labour_reasons_company
    FOREIGN KEY (company_id)
    REFERENCES public.companies(id)
    ON DELETE CASCADE,

  CONSTRAINT unique_labour_reason_per_company
    UNIQUE (company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_labour_reasons_company
  ON public.labour_reasons(company_id);

CREATE INDEX IF NOT EXISTS idx_labour_reasons_active
  ON public.labour_reasons(company_id, is_active)
  WHERE is_active = true;

-- Auto-update updated_at on every row change
DROP TRIGGER IF EXISTS update_labour_reasons_modtime ON public.labour_reasons;
CREATE TRIGGER update_labour_reasons_modtime
  BEFORE UPDATE ON public.labour_reasons
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Seed default reasons for every existing company
INSERT INTO public.labour_reasons (company_id, name, paid)
SELECT c.id, r.name, r.paid
FROM public.companies c
CROSS JOIN (
  VALUES
    ('Travel Time',          true),
    ('Office Work',          true),
    ('Prep Work',            true),
    ('Supervision / Training', true),
    ('Quotes / Estimates',   true),
    ('Unpaid Lunch',         false),
    ('Annual Leave',         true),
    ('Stat Holiday',         true),
    ('Sick Leave',           true),
    ('Paid breaks',          true),
    ('Unpaid breaks',        false),
    ('Other',                true)
) AS r(name, paid)
ON CONFLICT (company_id, name) DO NOTHING;
