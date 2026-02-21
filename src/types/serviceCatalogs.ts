export type ServiceCatalog = {
  id: number;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ServiceCatalogItem = {
  id: number;
  service_catalog_id: number;
  name: string;
  description?: string;
  unit?: string;
  cost_price: number;
  sell_price: number;
  tax_rate: number;
  is_favorite: boolean;
  service_catalog_name?: string;
};
