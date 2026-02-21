-- Service Catalogs and items (admin-managed)

CREATE TABLE IF NOT EXISTS service_catalogs (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_catalog_items (
  id BIGSERIAL PRIMARY KEY,
  service_catalog_id BIGINT NOT NULL REFERENCES service_catalogs(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sell_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 10,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_catalogs_company_id
  ON service_catalogs(company_id);

CREATE INDEX IF NOT EXISTS idx_service_catalog_items_company_id
  ON service_catalog_items(company_id);

CREATE INDEX IF NOT EXISTS idx_service_catalog_items_catalog_id
  ON service_catalog_items(service_catalog_id);
