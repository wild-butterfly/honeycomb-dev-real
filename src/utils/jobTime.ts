import { CalendarJob } from "../pages/CalendarPage";

/* -----------------------------------------
   INTERNAL HELPERS
------------------------------------------ */

function getSortedAssignments(job: CalendarJob) {
  return [...job.assignments].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}

/* -----------------------------------------
   PUBLIC API
------------------------------------------ */

/**
 * Primary assignment = earliest start
 */
export function getPrimaryAssignment(job: CalendarJob) {
  const sorted = getSortedAssignments(job);
  return sorted[0] ?? null;
}

/**
 * Job start time (safe)
 */
export function getJobStart(job: CalendarJob): Date {
  const a = getPrimaryAssignment(job);
  return a ? new Date(a.start) : new Date(0); // 🔒 NEVER null
}

/**
 * Job end time = latest end across all assignments
 */
export function getJobEnd(job: CalendarJob): Date {
  if (job.assignments.length === 0) return new Date(0);

  const max = Math.max(
    ...job.assignments.map((a) => new Date(a.end).getTime())
  );

  return new Date(max);
}

/**
 * All assigned employee IDs (unique)
 */
export function getAssignedEmployeeIds(job: CalendarJob): number[] {
  return Array.from(
    new Set(job.assignments.map((a) => a.employeeId))
  );
}
