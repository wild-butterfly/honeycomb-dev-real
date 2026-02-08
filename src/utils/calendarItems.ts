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

// 🔒 PostgreSQL local timestamp → JS Date (NO UTC SHIFT)
function parseLocal(v: unknown): Date | null {
  if (!v) return null;

  if (v instanceof Date) {
    return isNaN(v.getTime()) ? null : v;
  }

  if (typeof v === "string") {
    // "YYYY-MM-DD HH:mm:ss" → "YYYY-MM-DDTHH:mm:ss"
    const d = new Date(v.replace(" ", "T"));
    return isNaN(d.getTime()) ? null : d;
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
        return; // ❗ sadece bu assignment skip
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