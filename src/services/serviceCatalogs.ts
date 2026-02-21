import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import type { ServiceCatalog, ServiceCatalogItem } from "../types/serviceCatalogs";

const requireResult = <T>(value: T | null, label: string): T => {
  if (value === null) {
    throw new Error(`${label} request returned empty response`);
  }
  return value;
};

export const getServiceCatalogs = async (): Promise<ServiceCatalog[]> => {
  return (await apiGet<ServiceCatalog[]>("/service-catalogs")) || [];
};

export const createServiceCatalog = async (data: {
  name: string;
  is_active?: boolean;
}): Promise<ServiceCatalog> => {
  const result = await apiPost<ServiceCatalog>("/service-catalogs", data);
  return requireResult(result, "Create service catalog");
};

export const updateServiceCatalog = async (
  id: number,
  data: Partial<ServiceCatalog>
): Promise<ServiceCatalog> => {
  const result = await apiPut<ServiceCatalog>(`/service-catalogs/${id}`, data);
  return requireResult(result, "Update service catalog");
};

export const deleteServiceCatalog = async (id: number): Promise<{ id: number }> => {
  const result = await apiDelete<{ id: number }>(`/service-catalogs/${id}`);
  return requireResult(result, "Delete service catalog");
};

export const getServiceCatalogItems = async (
  serviceCatalogId: number
): Promise<ServiceCatalogItem[]> => {
  return (await apiGet<ServiceCatalogItem[]>(`/service-catalogs/${serviceCatalogId}/items`)) || [];
};

export const createServiceCatalogItem = async (
  serviceCatalogId: number,
  data: Partial<ServiceCatalogItem>
): Promise<ServiceCatalogItem> => {
  const result = await apiPost<ServiceCatalogItem>(
    `/service-catalogs/${serviceCatalogId}/items`,
    data
  );
  return requireResult(result, "Create service catalog item");
};

export const updateServiceCatalogItem = async (
  serviceCatalogId: number,
  itemId: number,
  data: Partial<ServiceCatalogItem>
): Promise<ServiceCatalogItem> => {
  const result = await apiPut<ServiceCatalogItem>(
    `/service-catalogs/${serviceCatalogId}/items/${itemId}`,
    data
  );
  return requireResult(result, "Update service catalog item");
};

export const deleteServiceCatalogItem = async (
  serviceCatalogId: number,
  itemId: number
): Promise<{ id: number }> => {
  const result = await apiDelete<{ id: number }>(
    `/service-catalogs/${serviceCatalogId}/items/${itemId}`
  );
  return requireResult(result, "Delete service catalog item");
};

export const getFavoriteServiceCatalogItems = async (): Promise<ServiceCatalogItem[]> => {
  return (await apiGet<ServiceCatalogItem[]>("/service-catalogs-favorites")) || [];
};
