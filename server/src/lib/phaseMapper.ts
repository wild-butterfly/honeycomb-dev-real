/**
 * Phase Update Helper (Backend)
 * 
 * Automatically maps status changes to phases
 * Used by jobs controller
 */

/**
 * Map status to phase for backward compatibility with existing system
 */
export function mapStatusToPhase(status: string | null | undefined): string {
  if (!status) return "pending";
  
  const s = String(status).trim().toLowerCase();
  
  // PENDING group (must be FIRST to catch these statuses)
  if (["draft", "new", "needs_quote", "pending"].includes(s)) {
    return "pending";
  }
  
  // QUOTING group
  if (["quote", "quoting", "quote_preparing", "quote_sent", "quote_viewed", "quote_accepted", "quote_declined"].includes(s)) {
    return "quoting";
  }
  
  // SCHEDULED group
  if (["scheduled", "assigned"].includes(s)) {
    return "scheduled";
  }
  
  // IN_PROGRESS group
  if (["in_progress", "on_site", "working", "waiting_parts"].includes(s)) {
    return "in_progress";
  }
  
  // COMPLETED group
  if (["completed", "ready_to_invoice"].includes(s)) {
    return "completed";
  }
  
  // INVOICING group
  if (["invoice_draft", "invoice_sent", "awaiting_payment"].includes(s)) {
    return "invoicing";
  }
  
  // PAID group
  if (["paid", "partially_paid", "overdue"].includes(s)) {
    return "paid";
  }
  
  // Default to pending for any unknown status
  return "pending";
}

/**
 * Get SQL fragment for phase update
 * Used in UPDATE queries to auto-sync phase with status
 */
export function getPhaseUpdateFragment(statusValue: string | null): string {
  if (!statusValue) return "'pending'";
  const phase = mapStatusToPhase(statusValue);
  return `'${phase}'`;
}

/**
 * Valid phases for constraint checking
 */
export const VALID_PHASES = [
  "pending",
  "quoting",
  "scheduled",
  "in_progress",
  "completed",
  "invoicing",
  "paid"
] as const;
