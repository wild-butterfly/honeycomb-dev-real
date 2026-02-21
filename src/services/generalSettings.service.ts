// src/services/generalSettings.service.ts
// General Settings API Service
// Connects React frontend to Express backend

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Helper function to get auth headers
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Try to get token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  return headers;
};

export interface GeneralSettingsData {
  business_name: string;
  abn: string;
  payee_name: string;
  bsb_number: string;
  bank_account_number: string;
  job_number_prefix: string;
  starting_job_number: string;
  currency: string;
  date_format: string;
  timezone: string;
  auto_assign_phase: boolean;
  show_state_on_invoices: boolean;
  auto_archive_unpriced: boolean;
  unpriced_jobs_cleanup_days: string;
  expired_quotes_cleanup_days: string;
  inactive_jobs_cleanup_days: string | null;
  auto_archive_stale_days: string;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
}

export interface CustomerSource {
  id: string;
  name: string;
}

export interface GeneralSettingsResponse {
  settings: GeneralSettingsData;
  taxes: Tax[];
  customerSources: CustomerSource[];
}

/* =========================================================
   GET GENERAL SETTINGS
========================================================= */
export const getGeneralSettings = async (
  companyId: number
): Promise<GeneralSettingsResponse> => {
  const url = `${API_BASE_URL}/general-settings/${companyId}`;
  console.log("[getGeneralSettings] Making request to:", url);
  
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  console.log("[getGeneralSettings] Response status:", response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[getGeneralSettings] Error response:", errorText);
    throw new Error("Failed to fetch general settings");
  }

  return response.json();
};

/* =========================================================
   UPDATE GENERAL SETTINGS
========================================================= */
export const updateGeneralSettings = async (
  companyId: number,
  data: Partial<GeneralSettingsData>
): Promise<{ message: string; settings: GeneralSettingsData }> => {
  const url = `${API_BASE_URL}/general-settings/${companyId}`;
  console.log("[updateGeneralSettings] Making request to:", url);
  console.log("[updateGeneralSettings] Payload:", data);
  
  const response = await fetch(url, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  console.log("[updateGeneralSettings] Response status:", response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[updateGeneralSettings] Error response:", errorText);
    throw new Error(`Failed to update general settings: ${response.statusText}`);
  }

  const result = await response.json();
  console.log("[updateGeneralSettings] Success:", result);
  return result;
};

/* =========================================================
   TAXES API
========================================================= */
export const addTax = async (
  companyId: number,
  name: string,
  rate: number
): Promise<{ message: string; tax: Tax }> => {
  const url = `${API_BASE_URL}/general-settings/${companyId}/taxes`;
  console.log("[addTax] Making request to:", url, { name, rate });
  
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ name, rate }),
  });

  console.log("[addTax] Response status:", response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[addTax] Error response:", errorText);
    throw new Error(`Failed to add tax: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[addTax] Success:", data);
  return data;
};

export const removeTax = async (
  companyId: number,
  taxId: string
): Promise<{ message: string }> => {
  const url = `${API_BASE_URL}/general-settings/${companyId}/taxes/${taxId}`;
  console.log("[removeTax] Making request to:", url);
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  console.log("[removeTax] Response status:", response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[removeTax] Error response:", errorText);
    throw new Error(`Failed to remove tax: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[removeTax] Success:", data);
  return data;
};

/* =========================================================
   CUSTOMER SOURCES API
========================================================= */
export const addCustomerSource = async (
  companyId: number,
  name: string
): Promise<{ message: string; source: CustomerSource }> => {
  const url = `${API_BASE_URL}/general-settings/${companyId}/sources`;
  console.log("[addCustomerSource] Making request to:", url, { name });
  
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ name }),
  });

  console.log("[addCustomerSource] Response status:", response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[addCustomerSource] Error response:", errorText);
    throw new Error(`Failed to add customer source: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[addCustomerSource] Success:", data);
  return data;
};

export const removeCustomerSource = async (
  companyId: number,
  sourceId: string
): Promise<{ message: string }> => {
  const url = `${API_BASE_URL}/general-settings/${companyId}/sources/${sourceId}`;
  console.log("[removeCustomerSource] Making request to:", url);
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  console.log("[removeCustomerSource] Response status:", response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[removeCustomerSource] Error response:", errorText);
    throw new Error(`Failed to remove customer source: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[removeCustomerSource] Success:", data);
  return data;
};

export const incrementSourceUsage = async (
  companyId: number,
  sourceId: string
): Promise<{ message: string }> => {
  const url = `${API_BASE_URL}/general-settings/${companyId}/sources/${sourceId}/increment`;
  console.log("[incrementSourceUsage] Making request to:", url);
  
  const response = await fetch(url, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
  });

  console.log("[incrementSourceUsage] Response status:", response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[incrementSourceUsage] Error response:", errorText);
    throw new Error(`Failed to increment source usage: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[incrementSourceUsage] Success:", data);
  return data;
};
