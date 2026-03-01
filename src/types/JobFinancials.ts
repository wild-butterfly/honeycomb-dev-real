/**
 * Job Financials Types
 * 
 * Profit feature data structures
 */

/**
 * JobFinancials record from database
 */
export interface JobFinancials {
  id: number;
  job_id: number;
  labour_cost: number;
  material_cost: number;
  other_cost: number;
  total_cost: number;
  revenue: number;
  profit: number;
  margin: number;
  created_at: string;
  updated_at: string;
}

/**
 * JobFinancials input/update payload
 */
export interface JobFinancialsInput {
  labour_cost?: number;
  material_cost?: number;
  other_cost?: number;
  revenue?: number;
}

/**
 * Financial summary displayed in UI
 */
export interface FinancialSummary {
  revenue: number;
  labourCost: number;
  materialCost: number;
  otherCost: number;
  totalCost: number;
  profit: number;
  margin: number;
}

/**
 * Profit calculation helper
 */
export function calculateProfit(revenue: number, totalCost: number): number {
  return revenue - totalCost;
}

/**
 * Margin calculation helper
 * Returns percentage (0-100)
 */
export function calculateMargin(profit: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (profit / revenue) * 100;
}

/**
 * Format financial value with currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/**
 * Format percentage (e.g., 25.5%)
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
