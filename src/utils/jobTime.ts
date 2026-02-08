import type { CalendarJob, Assignment } from "../types/calendar";

/* =========================================================
   INTERNAL HELPERS
========================================================= */

function normalizeOvernight(start: Date, end: Date): Date {
  if (end <= start) {
    const fixed = new Date(end);
    fixed.setDate(fixed.getDate() + 1);
    return fixed;
  }
  return end;
}

function getAssignmentForEmployee(
  job: CalendarJob,
  employeeId: number,
): Assignment | undefined {
  return job.assignments?.find(
    (a) => Number(a.employee_id) === Number(employeeId),
  );
}

/* =========================================================
   ASSIGNMENT TIMES (PER EMPLOYEE)
========================================================= */

export function getAssignmentStart(
  job: CalendarJob,
  employeeId: number,
): Date | null {
  const a = getAssignmentForEmployee(job, employeeId);
  return a?.start ?? null;
}

export function getAssignmentEnd(
  job: CalendarJob,
  employeeId: number,
): Date | null {
  const a = getAssignmentForEmployee(job, employeeId);
  if (!a?.start || !a?.end) return null;

  return normalizeOvernight(a.start, a.end);
}

/* =========================================================
   JOB TIMES (PRIMARY ASSIGNMENT = EARLIEST START)
========================================================= */

function getPrimaryAssignment(job: CalendarJob): Assignment | null {
  if (!job.assignments?.length) return null;

  return job.assignments.reduce((earliest, a) =>
    a.start < earliest.start ? a : earliest,
  );
}

export function getJobStart(job: CalendarJob): Date | null {
  const a = getPrimaryAssignment(job);
  return a?.start ?? null;
}

export function getJobEnd(job: CalendarJob): Date | null {
  const a = getPrimaryAssignment(job);
  if (!a?.start || !a?.end) return null;

  return normalizeOvernight(a.start, a.end);
}

/* =========================================================
   JOB DURATION (SAME AS CALENDAR MODAL)
========================================================= */

export function getJobDurationHours(job: CalendarJob): number {
  const start = getJobStart(job);
  const end = getJobEnd(job);

  if (!start || !end) return 0;

  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}

/* =========================================================
   STAFF
========================================================= */

export function getAssignedEmployeeIds(job: CalendarJob): number[] {
  return (
    job.assignments
      ?.map((a) => Number(a.employee_id))
      .filter((id) => Number.isFinite(id)) ?? []
  );
}
