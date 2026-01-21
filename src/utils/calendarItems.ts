// utils/calendarItems.ts
import type { CalendarJob } from "../pages/CalendarPage";

export type CalendarItem = {
  jobId: string;
  assignmentId: string;
  employeeId: number;
  start: Date;
  end: Date;
  title: string;
  customer: string;
  color?: string;
  status?: string;
};

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function buildCalendarItems(jobs: CalendarJob[]): CalendarItem[] {
  const items: CalendarItem[] = [];

  for (const job of jobs) {
    const assignments = (job as any).assignments ?? [];
    for (const a of assignments) {
      if (a?.scheduled === false) continue;

      const start = toDate(a.start);
      const end = toDate(a.end);
      const employeeId = Number(a.employeeId);

      if (!start || !end) continue;
      if (!Number.isFinite(employeeId)) continue;
      if (end <= start) continue;

      items.push({
        jobId: job.id,
        assignmentId:
          a.id ?? `${job.id}-${employeeId}-${start.getTime()}-${end.getTime()}`,
        employeeId,
        start,
        end,
        title: job.title,
        customer: job.customer,
        color: job.color,
        status: job.status,
      });
    }
  }

  return items;
}
