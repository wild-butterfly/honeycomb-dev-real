import type { CalendarJob } from "../pages/CalendarPage";

/* ================= ASSIGNMENT HELPERS (NEW CORE) ================= */

export function getAssignmentForEmployee(
  job: CalendarJob,
  employeeId: number
) {
  return job.assignments?.find(a => a.employeeId === employeeId) || null;
}

export function getAssignmentStart(
  job: CalendarJob,
  employeeId: number
): Date | null {
  const a = getAssignmentForEmployee(job, employeeId);
  if (!a?.start) return null;
  const d = new Date(a.start);
  return isNaN(d.getTime()) ? null : d;
}

export function getAssignmentEnd(
  job: CalendarJob,
  employeeId: number
): Date | null {
  const a = getAssignmentForEmployee(job, employeeId);
  if (!a?.end) return null;
  const d = new Date(a.end);
  return isNaN(d.getTime()) ? null : d;
}

/* ================= LEGACY COMPAT (DO NOT REMOVE YET) ================= */

/**
 * 🔁 Legacy fallback:
 * Returns earliest assignment start
 * Used by Month / Week / Mobile views
 */
export function getJobStart(job: CalendarJob): Date {
  const first = job.assignments?.[0];
  if (!first?.start) return new Date(0);
  const d = new Date(first.start);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/**
 * 🔁 Legacy fallback:
 * Returns latest assignment end
 */
export function getJobEnd(job: CalendarJob): Date {
  const last = job.assignments?.[job.assignments.length - 1];
  if (!last?.end) return new Date(0);
  const d = new Date(last.end);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/**
 * 🔁 Legacy helper:
 * Used everywhere for filtering
 */
export function getAssignedEmployeeIds(job: CalendarJob): number[] {
  return job.assignments?.map(a => a.employeeId) || [];
}
