/**
 * Job Phase Update Helper
 * 
 * Automatically calculates and updates job phase based on status
 * Used when status changes to keep phase in sync
 */

import { JobStatus, JobPhase, getPhaseFromStatus } from "../types/JobLifecycle";

/**
 * Calculate the correct phase for a given status
 * Returns the phase that should be set when this status is applied
 */
export function getPhaseForStatus(status: string | JobStatus): JobPhase {
  // Normalize status string to enum value if needed
  let normalizedStatus = status as JobStatus;
  
  // If it's a string that matches an enum value, use it directly
  if (typeof status === "string" && Object.values(JobStatus).includes(status as JobStatus)) {
    normalizedStatus = status as JobStatus;
  }
  
  return getPhaseFromStatus(normalizedStatus);
}

/**
 * Build update payload for automatic phase sync
 * Used when updating job status to automatically set the phase
 */
export function buildPhaseUpdatePayload(
  status: string | JobStatus
): { phase: JobPhase; status?: string } {
  return {
    phase: getPhaseForStatus(status),
    status: typeof status === "string" ? status : undefined,
  };
}

/**
 * Predefined status transitions that trigger phase updates
 * Map old status → new status with automatic phase
 */
export const STATUS_TRANSITIONS = {
  // NEW → QUOTING
  newToQuoting: {
    from: [JobStatus.DRAFT, JobStatus.NEW, JobStatus.NEEDS_QUOTE],
    to: JobStatus.QUOTE_PREPARING,
    phase: JobPhase.QUOTING,
  },

  // QUOTING → QUOTE_ACCEPTED
  quoteAccepted: {
    from: [JobStatus.QUOTE_SENT, JobStatus.QUOTE_VIEWED],
    to: JobStatus.QUOTE_ACCEPTED,
    phase: JobPhase.SCHEDULED, // After acceptance, moves to SCHEDULED
  },

  // QUOTING → SCHEDULED
  quotingToScheduled: {
    from: [JobStatus.QUOTE_ACCEPTED],
    to: JobStatus.SCHEDULED,
    phase: JobPhase.SCHEDULED,
  },

  // SCHEDULED → IN_PROGRESS
  scheduledToInProgress: {
    from: [JobStatus.SCHEDULED, JobStatus.ASSIGNED],
    to: JobStatus.IN_PROGRESS,
    phase: JobPhase.IN_PROGRESS,
  },

  // IN_PROGRESS → COMPLETED
  inProgressToCompleted: {
    from: [JobStatus.IN_PROGRESS, JobStatus.ON_SITE, JobStatus.WORKING],
    to: JobStatus.COMPLETED,
    phase: JobPhase.COMPLETED,
  },

  // COMPLETED → INVOICING
  completedToInvoicing: {
    from: [JobStatus.COMPLETED, JobStatus.READY_TO_INVOICE],
    to: JobStatus.INVOICE_SENT,
    phase: JobPhase.INVOICING,
  },

  // INVOICING → PAID
  invoicingToPaid: {
    from: [JobStatus.AWAITING_PAYMENT, JobStatus.INVOICE_SENT],
    to: JobStatus.PAID,
    phase: JobPhase.PAID,
  },
} as const;

/**
 * Get the next recommended phase for a given status
 * Useful for UI workflows
 */
export function getNextPhaseRecommendation(currentStatus: JobStatus): JobPhase | null {
  const transitions = Object.values(STATUS_TRANSITIONS);
  
  for (const transition of transitions) {
    if ((transition.from as readonly JobStatus[]).includes(currentStatus)) {
      return transition.phase;
    }
  }
  
  return null;
}

/**
 * Helper to check if status change should trigger phase update
 */
export function shouldUpdatePhase(
  oldStatus: string,
  newStatus: string
): boolean {
  // Phase updates when status changes to a new value
  return oldStatus !== newStatus;
}
