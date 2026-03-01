/**
 * Dashboard Gauge Types and Configuration
 * 
 * Defines gauge data structures and gauge display configuration
 */

import { JobPhase, JobStatus } from "./JobLifecycle";

/**
 * Status breakdown for gauge hover detail
 */
export interface StatusBreakdownItem {
  status: JobStatus;
  count: number;
  label: string;
}

/**
 * Complete gauge data structure for frontend display
 */
export interface GaugeData {
  phase: JobPhase;
  label: string;
  description: string;
  jobCount: number;
  totalValue: number;
  statusBreakdown: StatusBreakdownItem[];
}

/**
 * Query result from backend gauge data endpoint
 */
export interface GaugeQueryResult {
  phase: JobPhase;
  job_count: number;
  total_value: number;
  status_breakdown: Array<{
    status: JobStatus;
    count: number;
  }>;
}

/**
 * Dashboard Gauge Labels and Descriptions
 * FINAL Flowody UX naming standard
 * 
 * Pending = Draft, New, Needs Quote
 * NOT Pricing → use Quoting
 * NOT Payments → use Paid
 * NOT Back Costing → use Profit tab
 */
export const DASHBOARD_GAUGES = [
  {
    phase: JobPhase.PENDING,
    label: "Pending",
    description: "Jobs awaiting quotes (draft, new, needs quote)",
  },
  {
    phase: JobPhase.QUOTING,
    label: "Quoting",
    description: "Jobs currently in quote process",
  },
  {
    phase: JobPhase.SCHEDULED,
    label: "Scheduled",
    description: "Jobs booked but not started",
  },
  {
    phase: JobPhase.IN_PROGRESS,
    label: "In Progress",
    description: "Jobs currently being worked on",
  },
  {
    phase: JobPhase.COMPLETED,
    label: "Completed",
    description: "Jobs finished and ready to invoice",
  },
  {
    phase: JobPhase.INVOICING,
    label: "Invoicing",
    description: "Invoices sent and awaiting payment",
  },
  {
    phase: JobPhase.PAID,
    label: "Paid",
    description: "Jobs fully paid",
  },
] as const;

/**
 * Get gauge config by phase
 */
export function getGaugeConfig(phase: JobPhase) {
  return DASHBOARD_GAUGES.find((g) => g.phase === phase) || DASHBOARD_GAUGES[0];
}

/**
 * Color palette for gauges (matching dashboard theme)
 */
export const GAUGE_COLORS: Record<JobPhase, string> = {
  [JobPhase.PENDING]: "#FFC8C8", // light red
  [JobPhase.QUOTING]: "#FFD9A8", // light orange
  [JobPhase.SCHEDULED]: "#B8DEFF", // light blue
  [JobPhase.IN_PROGRESS]: "#DDB8FF", // light purple
  [JobPhase.COMPLETED]: "#B8ECEC", // light cyan
  [JobPhase.INVOICING]: "#FFF4A8", // light yellow
  [JobPhase.PAID]: "#C8F0D4", // light green
};

/**
 * Get color for gauge by phase
 */
export function getGaugeColor(phase: JobPhase): string {
  return GAUGE_COLORS[phase] || "#f0f0f0";
}

/**
 * Status-specific color palette
 * Darker shades of phase color for each status within the phase
 */
export const STATUS_COLORS: Record<JobStatus, string> = {
  // PENDING phase
  // Draft: inactive, unfinished, not part of workflow
  [JobStatus.DRAFT]: "#FFEB99",      // pastel yellow
  // New Request: active, new customer request, medium urgency
  [JobStatus.NEW]: "#FFCCAA",         // pastel peach
  // To Quote: confirmed job, high urgency, waiting for pricing
  [JobStatus.NEEDS_QUOTE]: "#FFB3B3", // pastel pink
  
  // QUOTING phase - oranges
  [JobStatus.QUOTE_PREPARING]: "#FFCCAA",  // lighter orange
  [JobStatus.QUOTE_SENT]: "#FFD9A8",       // light orange
  [JobStatus.QUOTE_VIEWED]: "#FFC999",     // medium orange
  [JobStatus.QUOTE_ACCEPTED]: "#FFB980",   // darker orange
  [JobStatus.QUOTE_DECLINED]: "#FF9966",   // darkest orange (alert)
  
  // SCHEDULED phase - blues
  [JobStatus.SCHEDULED]: "#B8DEFF",  // light blue
  [JobStatus.ASSIGNED]: "#8FC9FF",   // darker blue
  
  // IN_PROGRESS phase - purples
  [JobStatus.IN_PROGRESS]: "#DDB8FF",  // light purple
  [JobStatus.ON_SITE]: "#C99FFF",      // medium purple
  [JobStatus.WORKING]: "#B580FF",      // darker purple
  [JobStatus.WAITING_PARTS]: "#D46A6A", // reddish (alert)
  
  // COMPLETED phase - cyans
  [JobStatus.COMPLETED]: "#B8ECEC",       // light cyan
  [JobStatus.READY_TO_INVOICE]: "#88DCDC", // darker cyan
  
  // INVOICING phase - yellows
  [JobStatus.INVOICE_DRAFT]: "#FFFFB0",     // pale yellow
  [JobStatus.INVOICE_SENT]: "#FFF4A8",      // light yellow
  [JobStatus.AWAITING_PAYMENT]: "#FFE680",  // darker yellow
  
  // PAID phase - greens
  [JobStatus.PAID]: "#C8F0D4",          // light green
  [JobStatus.PARTIALLY_PAID]: "#99E6BA", // medium green
  [JobStatus.OVERDUE]: "#FF5555",       // red (alert)
};

/**
 * Get color for specific job status
 */
export function getStatusColor(status: JobStatus): string {
  return STATUS_COLORS[status] || "#e0e0e0";
}

/**
 * Calculate days since quote was sent (for expired quote detection)
 */
export function getDaysSinceQuoteSent(quoteSentDate: string | null | undefined): number {
  if (!quoteSentDate) return 0;
  const sent = new Date(quoteSentDate);
  const now = new Date();
  const diffTime = now.getTime() - sent.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if quote is expired (older than 14 days)
 */
export function isQuoteExpired(quoteSentDate: string | null | undefined): boolean {
  const days = getDaysSinceQuoteSent(quoteSentDate);
  return days > 14; // 14-day quote expiry
}
