import type { CalendarJob, JobStatus } from "../types/calendar";

/* ================= TYPES ================= */

export type CalendarItem = {
  jobId: number;
  assignmentId: number;

  employee_id: number;
  start: Date;
  end: Date;

  title: string;
  client: string;
  address?: string;

  color?: string;
  status?: JobStatus;

  isPrimary: boolean;
};

/* ================= HELPERS ================= */

function parseLocal(v: unknown): Date | null {
  if (!v) return null;

  if (v instanceof Date) {
    return isNaN(v.getTime()) ? null : v;
  }

  if (typeof v === "string") {
    // "YYYY-MM-DD HH:mm:ss"
    const [datePart, timePart] = v.split(" ");
    if (!datePart || !timePart) return null;

    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm, ss = 0] = timePart.split(":").map(Number);

    return new Date(y, m - 1, d, hh, mm, ss);
  }

  return null;
}

/* ================= BUILDER ================= */

export function buildCalendarItems(
  jobs: CalendarJob[],
): CalendarItem[] {
  const items: CalendarItem[] = [];

  for (const job of jobs) {
    if (!job.assignments || job.assignments.length === 0) continue;

    job.assignments.forEach((a, index) => {
      const start = parseLocal(a.start);
      const end = parseLocal(a.end);

      if (
        !a?.id ||
        !a.employee_id ||
        !start ||
        !end ||
        end <= start
      ) {
        return; 
      }

      items.push({
        jobId: job.id,
        assignmentId: Number(a.id),

        employee_id: Number(a.employee_id),
        start,
        end,

        title: job.title ?? "",
        client: job.client ?? "",
        address: job.address,

        color: job.color ?? "#fffdf0",
        status: job.status,

        isPrimary: index === 0,
      });
    });
  }

  return items;
}