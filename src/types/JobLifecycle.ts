/**
 * Flowody Job Lifecycle & Gauge System
 * 
 * JobPhase = high-level lifecycle (used for gauges) - 7 categories
 * JobStatus = detailed internal state - 26 detailed statuses
 * 
 * Gauges display phase distribution only.
 * JobStatus drives internal state transitions.
 */

/* ===============================
   JOB PHASES (Gauge Categories)
   7 dashboard gauge categories
================================ */
export enum JobPhase {
  PENDING = "pending",
  QUOTING = "quoting",
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  INVOICING = "invoicing",
  PAID = "paid"
}

/* ===============================
   JOB STATUS (Detailed Internal State)
   26 detailed job statuses
================================ */
export enum JobStatus {
  // PENDING phase (jobs created but not quoted)
  DRAFT = "draft",
  NEW = "new",
  NEEDS_QUOTE = "needs_quote",

  // QUOTING phase
  QUOTE_PREPARING = "quote_preparing",
  QUOTE_SENT = "quote_sent",
  QUOTE_VIEWED = "quote_viewed",
  QUOTE_ACCEPTED = "quote_accepted",
  QUOTE_DECLINED = "quote_declined",

  // SCHEDULED phase
  SCHEDULED = "scheduled",
  ASSIGNED = "assigned",

  // IN_PROGRESS phase
  IN_PROGRESS = "in_progress",
  ON_SITE = "on_site",
  WORKING = "working",
  WAITING_PARTS = "waiting_parts",

  // COMPLETED phase
  COMPLETED = "completed",
  READY_TO_INVOICE = "ready_to_invoice",

  // INVOICING phase
  INVOICE_DRAFT = "invoice_draft",
  INVOICE_SENT = "invoice_sent",
  AWAITING_PAYMENT = "awaiting_payment",

  // PAID phase
  PAID = "paid",
  PARTIALLY_PAID = "partially_paid",
  OVERDUE = "overdue"
}

/**
 * Phase Mapping Logic
 * Converts detailed JobStatus to high-level JobPhase
 */
export function getPhaseFromStatus(status: JobStatus): JobPhase {
  switch (status) {
    case JobStatus.DRAFT:
    case JobStatus.NEW:
    case JobStatus.NEEDS_QUOTE:
      return JobPhase.PENDING;

    case JobStatus.QUOTE_PREPARING:
    case JobStatus.QUOTE_SENT:
    case JobStatus.QUOTE_VIEWED:
    case JobStatus.QUOTE_ACCEPTED:
    case JobStatus.QUOTE_DECLINED:
      return JobPhase.QUOTING;

    case JobStatus.SCHEDULED:
    case JobStatus.ASSIGNED:
      return JobPhase.SCHEDULED;

    case JobStatus.IN_PROGRESS:
    case JobStatus.ON_SITE:
    case JobStatus.WORKING:
    case JobStatus.WAITING_PARTS:
      return JobPhase.IN_PROGRESS;

    case JobStatus.COMPLETED:
    case JobStatus.READY_TO_INVOICE:
      return JobPhase.COMPLETED;

    case JobStatus.INVOICE_DRAFT:
    case JobStatus.INVOICE_SENT:
    case JobStatus.AWAITING_PAYMENT:
      return JobPhase.INVOICING;

    case JobStatus.PAID:
    case JobStatus.PARTIALLY_PAID:
    case JobStatus.OVERDUE:
      return JobPhase.PAID;
  }
}

/**
 * Reverse mapping: return all statuses for a given phase
 */
export function getStatusesForPhase(phase: JobPhase): JobStatus[] {
  const statusMap: Record<JobPhase, JobStatus[]> = {
    [JobPhase.PENDING]: [
      JobStatus.DRAFT,
      JobStatus.NEW,
      JobStatus.NEEDS_QUOTE,
    ],
    [JobPhase.QUOTING]: [
      JobStatus.QUOTE_PREPARING,
      JobStatus.QUOTE_SENT,
      JobStatus.QUOTE_VIEWED,
      JobStatus.QUOTE_ACCEPTED,
      JobStatus.QUOTE_DECLINED,
    ],
    [JobPhase.SCHEDULED]: [
      JobStatus.SCHEDULED,
      JobStatus.ASSIGNED,
    ],
    [JobPhase.IN_PROGRESS]: [
      JobStatus.IN_PROGRESS,
      JobStatus.ON_SITE,
      JobStatus.WORKING,
      JobStatus.WAITING_PARTS,
    ],
    [JobPhase.COMPLETED]: [
      JobStatus.COMPLETED,
      JobStatus.READY_TO_INVOICE,
    ],
    [JobPhase.INVOICING]: [
      JobStatus.INVOICE_DRAFT,
      JobStatus.INVOICE_SENT,
      JobStatus.AWAITING_PAYMENT,
    ],
    [JobPhase.PAID]: [
      JobStatus.PAID,
      JobStatus.PARTIALLY_PAID,
      JobStatus.OVERDUE,
    ],
  };

  return statusMap[phase] || [];
}

/**
 * Get display label for JobStatus
 */
export function getStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    [JobStatus.DRAFT]: "Draft",
    [JobStatus.NEW]: "New Request",
    [JobStatus.NEEDS_QUOTE]: "To Quote",
    [JobStatus.QUOTE_PREPARING]: "Quote Preparing",
    [JobStatus.QUOTE_SENT]: "Quote Sent",
    [JobStatus.QUOTE_VIEWED]: "Quote Viewed",
    [JobStatus.QUOTE_ACCEPTED]: "Quote Accepted",
    [JobStatus.QUOTE_DECLINED]: "Quote Declined",
    [JobStatus.SCHEDULED]: "Scheduled",
    [JobStatus.ASSIGNED]: "Assigned",
    [JobStatus.IN_PROGRESS]: "In Progress",
    [JobStatus.ON_SITE]: "On Site",
    [JobStatus.WORKING]: "Working",
    [JobStatus.WAITING_PARTS]: "Waiting Parts",
    [JobStatus.COMPLETED]: "Completed",
    [JobStatus.READY_TO_INVOICE]: "Ready to Invoice",
    [JobStatus.INVOICE_DRAFT]: "Invoice Draft",
    [JobStatus.INVOICE_SENT]: "Invoice Sent",
    [JobStatus.AWAITING_PAYMENT]: "Awaiting Payment",
    [JobStatus.PAID]: "Paid",
    [JobStatus.PARTIALLY_PAID]: "Partially Paid",
    [JobStatus.OVERDUE]: "Overdue",
  };

  return labels[status] || status;
}

/**
 * Get display label for JobPhase
 */
export function getPhaseLabel(phase: JobPhase): string {
  const labels: Record<JobPhase, string> = {
    [JobPhase.PENDING]: "Pending",
    [JobPhase.QUOTING]: "Quoting",
    [JobPhase.SCHEDULED]: "Scheduled",
    [JobPhase.IN_PROGRESS]: "In Progress",
    [JobPhase.COMPLETED]: "Completed",
    [JobPhase.INVOICING]: "Invoicing",
    [JobPhase.PAID]: "Paid",
  };

  return labels[phase] || phase;
}

/**
 * Get description for JobPhase (for gauges)
 */
export function getPhaseDescription(phase: JobPhase): string {
  const descriptions: Record<JobPhase, string> = {
    [JobPhase.PENDING]: "Jobs awaiting quotes (draft, new, needs quote)",
    [JobPhase.QUOTING]: "Jobs currently in quote process",
    [JobPhase.SCHEDULED]: "Jobs booked but not started",
    [JobPhase.IN_PROGRESS]: "Jobs currently being worked on",
    [JobPhase.COMPLETED]: "Jobs finished and ready to invoice",
    [JobPhase.INVOICING]: "Invoices sent and awaiting payment",
    [JobPhase.PAID]: "Jobs fully paid",
  };

  return descriptions[phase] || "";
}

/**
 * Normalize raw/legacy status strings into canonical JobStatus values.
 */
export function normalizeJobStatus(rawStatus: string | JobStatus): JobStatus {
  const s = String(rawStatus || "")
    .trim()
    .toLowerCase();

  // PENDING phase statuses
  if (s === "draft") return JobStatus.DRAFT;
  if (s === "new" || s === "start") return JobStatus.NEW;
  if (s === "needs_quote" || s === "needs quote" || s === "pending")
    return JobStatus.NEEDS_QUOTE;

  // QUOTING phase statuses
  if (s === "pricing" || s === "quoting" || s === "quote" || s === "estimate")
    return JobStatus.QUOTE_PREPARING;
  if (s === "quote_preparing" || s === "quote preparing")
    return JobStatus.QUOTE_PREPARING;
  if (s === "quote_sent" || s === "quote sent" || s === "quotesent")
    return JobStatus.QUOTE_SENT;
  if (s === "quote_viewed" || s === "quote viewed")
    return JobStatus.QUOTE_VIEWED;
  if (s === "quote_accepted" || s === "quote accepted" || s === "quoteaccepted")
    return JobStatus.QUOTE_ACCEPTED;
  if (s === "quote_declined" || s === "quote declined")
    return JobStatus.QUOTE_DECLINED;

  // SCHEDULED phase statuses
  if (s === "scheduled" || s === "scheduling" || s === "schedule")
    return JobStatus.SCHEDULED;
  if (s === "assigned") return JobStatus.ASSIGNED;

  // IN_PROGRESS phase statuses
  if (
    s === "in_progress" ||
    s === "in progress" ||
    s === "inprogress" ||
    s === "active"
  )
    return JobStatus.IN_PROGRESS;
  if (s === "on_site" || s === "on site") return JobStatus.ON_SITE;
  if (s === "working") return JobStatus.WORKING;
  if (s === "waiting_parts" || s === "waiting parts")
    return JobStatus.WAITING_PARTS;

  // COMPLETED phase statuses
  if (
    s === "completed" ||
    s === "complete" ||
    s === "back_costing" ||
    s === "back costing" ||
    s === "need to return" ||
    s === "return"
  )
    return JobStatus.COMPLETED;
  if (s === "ready_to_invoice" || s === "ready to invoice")
    return JobStatus.READY_TO_INVOICE;

  // INVOICING phase statuses
  // Handle "invoice", "invoicing", "invoiced" → map to INVOICE_SENT
  if (
    s === "invoice" ||
    s === "invoicing" ||
    s === "invoiced"
  )
    return JobStatus.INVOICE_SENT;
  if (s === "invoice_draft" || s === "invoice draft")
    return JobStatus.INVOICE_DRAFT;
  if (s === "invoice_sent" || s === "invoice sent")
    return JobStatus.INVOICE_SENT;
  if (s === "awaiting_payment" || s === "awaiting payment")
    return JobStatus.AWAITING_PAYMENT;

  // PAID phase statuses
  if (s === "paid" || s === "payment") return JobStatus.PAID;
  if (s === "partially_paid" || s === "partially paid")
    return JobStatus.PARTIALLY_PAID;
  if (s === "overdue") return JobStatus.OVERDUE;

  // Default to NEEDS_QUOTE for unknown statuses (better than DRAFT)
  return JobStatus.NEEDS_QUOTE;
}

/**
 * Resolve a raw status string directly to phase.
 */
export function getPhaseFromRawStatus(rawStatus: string | JobStatus): JobPhase {
  return getPhaseFromStatus(normalizeJobStatus(rawStatus));
}
