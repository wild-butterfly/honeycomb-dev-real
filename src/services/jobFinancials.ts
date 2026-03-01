/**
 * JobFinancials Service
 * 
 * API client for job financials operations
 */

import { apiGet, apiPost, apiPut } from "./api";
import type { JobFinancials, JobFinancialsInput } from "../types/JobFinancials";

/**
 * Get financials for a specific job
 */
export async function getJobFinancials(
  jobId: string | number
): Promise<JobFinancials> {
  const response = await apiGet(`/api/jobs/${jobId}/financials`);
  return response;
}

/**
 * Create financials record for a job
 */
export async function createJobFinancials(
  jobId: string | number,
  data: JobFinancialsInput
): Promise<JobFinancials> {
  const response = await apiPost(`/api/jobs/${jobId}/financials`, data);
  return response;
}

/**
 * Update financials for a job
 */
export async function updateJobFinancials(
  jobId: string | number,
  data: Partial<JobFinancialsInput>
): Promise<JobFinancials> {
  const response = await apiPut(`/api/jobs/${jobId}/financials`, data);
  return response;
}

/**
 * Update labour cost for a job
 */
export async function updateLabourCost(
  jobId: string | number,
  labourCost: number
): Promise<JobFinancials> {
  return updateJobFinancials(jobId, { labour_cost: labourCost });
}

/**
 * Update material cost for a job
 */
export async function updateMaterialCost(
  jobId: string | number,
  materialCost: number
): Promise<JobFinancials> {
  return updateJobFinancials(jobId, { material_cost: materialCost });
}

/**
 * Update other costs for a job
 */
export async function updateOtherCost(
  jobId: string | number,
  otherCost: number
): Promise<JobFinancials> {
  return updateJobFinancials(jobId, { other_cost: otherCost });
}

/**
 * Update revenue for a job
 */
export async function updateRevenue(
  jobId: string | number,
  revenue: number
): Promise<JobFinancials> {
  return updateJobFinancials(jobId, { revenue });
}

/**
 * Get gauge data (all jobs grouped by phase with financial summaries)
 */
export async function getGaugeData() {
  const response = await apiGet("/api/gauges/phases");
  return response;
}
