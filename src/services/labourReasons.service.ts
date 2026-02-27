import { apiGet, apiPost, apiDelete } from "./api";
import { LabourReason } from "../config/labourReasons";

export async function fetchLabourReasons(companyId: number): Promise<LabourReason[]> {
  const data = await apiGet<LabourReason[]>(`/labour-reasons/${companyId}`);
  return data ?? [];
}

export async function createLabourReason(
  companyId: number,
  name: string,
  paid: boolean
): Promise<LabourReason | null> {
  return apiPost<LabourReason>(`/labour-reasons/${companyId}`, { name, paid });
}

export async function removeLabourReason(
  companyId: number,
  reasonId: number
): Promise<void> {
  await apiDelete(`/labour-reasons/${companyId}/${reasonId}`);
}
