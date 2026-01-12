// Created by Clevermode © 2025. All rights reserved.
import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import styles from "./DesktopCalendarLayout.module.css";
import type { Employee, CalendarJob } from "../pages/CalendarPage";

interface Props {
  date: Date;
  employees: Employee[];
  jobs: CalendarJob[];

  onJobClick: (jobId: string) => void;

  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;

  onMoveJob?: (
    jobId: string,
    employeeId: number,
    start: Date,
    end: Date,
    targetEmployeeId?: number
  ) => void;

  selectedEmployeeId?: number;

  scheduleMode?: { jobId: string; employeeId: number } | null;
  clearScheduleMode?: () => void;
}

const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const HOUR_WIDTH_PX = 104;
const DEFAULT_VIEW_START = 6;

const formatHourLabel = (h: number) => {
  if (h === 0) return "12AM";
  if (h < 12) return `${h}AM`;
  if (h === 12) return "12PM";
  return `${h - 12}PM`;
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function safeDate(d: Date | null | undefined, fallback: Date) {
  return d instanceof Date && !isNaN(d.getTime()) ? d : fallback;
}

// ✅ minutes to nearest 15
function snap15(mins: number) {
  return Math.round(mins / 15) * 15;
}

type PreviewTimes = Record<string, { start: Date; end: Date }>;
type DragMode = "move" | "resize";

type ActiveDrag = {
  mode: DragMode;
  jobId: string;
  employeeId: number; // row employee
  laneLeft: number;
  blockLeftAtMouseDown: number; // for drag offset
  mouseStartX: number;
  originalStart: Date;
  originalEnd: Date;
};

/* ================= ASSIGNMENT HELPERS =================
   Expect:
   - job.assignments: [{ employeeId, start, end, ... }]   (preferred)
   - (optional) job.assignmentsMap: { [employeeId]: { start, end } }
   Supports:
   - ISO string
   - Date
   - Firestore Timestamp (has toDate())
======================================================== */
function normalizeDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}
const toJsDate = (v: any): Date | null => {
  if (!v) return null;

  // Date
  if (v instanceof Date) return v;

  // Firestore Timestamp or Timestamp-like
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }

  // ISO string
  if (typeof v === "string") {
    const d = new Date(v);
    return !isNaN(d.getTime()) ? d : null;
  }

  return null;
};

const getAssignmentForEmployee = (job: CalendarJob, employeeId: number) => {
  const anyJob = job as any;

  // ✅ Array form: assignments: [{employeeId,start,end}]
  if (Array.isArray(anyJob.assignments)) {
    return (
      anyJob.assignments.find(
        (x: any) => Number(x?.employeeId) === Number(employeeId)
      ) || null
    );
  }

  // ✅ Map form: assignmentsMap: { "1": {start,end} }
  if (anyJob.assignmentsMap && anyJob.assignmentsMap[String(employeeId)]) {
    return anyJob.assignmentsMap[String(employeeId)];
  }

  return null;
};

const getAssignedEmployeeIdsFromAssignments = (job: CalendarJob): number[] => {
  const anyJob = job as any;

  if (Array.isArray(anyJob.assignments)) {
    return anyJob.assignments
      .map((a: any) => Number(a?.employeeId))
      .filter((n: number) => Number.isFinite(n));
  }

  if (anyJob.assignmentsMap && typeof anyJob.assignmentsMap === "object") {
    return Object.keys(anyJob.assignmentsMap)
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n));
  }

  return [];
};

const DesktopCalendarLayout: React.FC<Props> = ({
  date,
  employees,
  jobs,
  onJobClick,
  selectedEmployeeId,
  onAddJobAt,
  onMoveJob,
  scheduleMode,
  clearScheduleMode,
}) => {
  /* ================= REFS ================= */
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  // Active drag context lives in a ref to avoid rerender spam
  const activeDragRef = useRef<ActiveDrag | null>(null);

  // Prevent accidental modal-open click right after drag
  const suppressClickRef = useRef(false);

  /* ================= STATE ================= */
  // Local preview per (jobId-empId)
  const [previewTimes, setPreviewTimes] = useState<PreviewTimes>({});

  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => i),
    []
  );

  const findJobById = useCallback(
    (id: string) => jobs.find((j) => j.id === id) || null,
    [jobs]
  );

  /* ================= MAP JOBS BY EMPLOYEE (CALENDAR = scheduled true OR legacy undefined) ================= */
  const jobsByEmployee: Record<number, CalendarJob[]> = useMemo(() => {
    const map: Record<number, CalendarJob[]> = {};
    for (const e of employees) map[e.id] = [];

    for (const job of jobs) {
      for (const a of job.assignments ?? []) {
        // ✅ CALENDAR RULE:
        // - hide only if explicitly scheduled:false
        // - show if scheduled:true OR scheduled is missing (legacy data)
        const scheduledFlag = (a as any).scheduled;
        if (scheduledFlag === false) continue;

        // must have start/end to be drawable
        if (!a.start || !a.end) continue;

        // ✅ must be on the currently selected day (otherwise week/day gets messy)
        const startDate = new Date(a.start);
        if (isNaN(startDate.getTime())) continue;
        if (!sameDay(startDate, date)) continue;

        const empId = Number(a.employeeId);
        if (!Number.isFinite(empId)) continue;
        if (!map[empId]) continue;

        if (!selectedEmployeeId || empId === selectedEmployeeId) {
          // avoid duplicates
          if (!map[empId].some((j) => j.id === job.id)) {
            map[empId].push(job);
          }
        }
      }
    }

    return map;
  }, [jobs, employees, selectedEmployeeId, date]);

  /* ================= SCROLL SYNC ================= */
  useEffect(() => {
    const body = bodyScrollRef.current;
    const header = headerScrollRef.current;
    if (!body || !header) return;

    const sync = () => {
      header.scrollLeft = body.scrollLeft;
    };

    body.addEventListener("scroll", sync);
    return () => body.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = DEFAULT_VIEW_START * HOUR_WIDTH_PX;
    }
  }, []);

  /* ================= START/END PER EMPLOYEE (ASSIGNMENT SOURCE OF TRUTH) ================= */
  const getStartForEmployee = (
    job: CalendarJob,
    employeeId: number,
    fallback: Date
  ) => {
    const a = getAssignmentForEmployee(job, employeeId);
    const d = toJsDate(a?.start);
    return safeDate(d, fallback);
  };

  const getEndForEmployee = (
    job: CalendarJob,
    employeeId: number,
    fallback: Date
  ) => {
    const a = getAssignmentForEmployee(job, employeeId);
    const d = toJsDate(a?.end);
    return safeDate(d, fallback);
  };

  /* ================= GLOBAL MOUSE MOVE (PREVIEW ONLY) ================= */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const ctx = activeDragRef.current;
      if (!ctx) return;

      const job = findJobById(ctx.jobId);
      if (!job) return;

      const key = `${ctx.jobId}-${ctx.employeeId}`;

      if (ctx.mode === "move") {
        const x = e.clientX - ctx.laneLeft - ctx.blockLeftAtMouseDown;
        if (!Number.isFinite(x)) return;

        const hourFloat = x / HOUR_WIDTH_PX;
        const hour = Math.floor(hourFloat);
        const minute = snap15((hourFloat % 1) * 60);

        const finalHour = hour + (minute === 60 ? 1 : 0);
        const finalMinute = minute === 60 ? 0 : minute;

        const newStart = new Date(date);
        newStart.setHours(finalHour, finalMinute, 0, 0);

        const duration = Math.max(
          15 * 60 * 1000,
          ctx.originalEnd.getTime() - ctx.originalStart.getTime()
        );
        const newEnd = new Date(newStart.getTime() + duration);

        setPreviewTimes((prev) => ({
          ...prev,
          [key]: { start: newStart, end: newEnd },
        }));
      }

      if (ctx.mode === "resize") {
        const deltaX = e.clientX - ctx.mouseStartX;
        const deltaMinutes = snap15((deltaX / HOUR_WIDTH_PX) * 60);

        const start = ctx.originalStart;
        const minEnd = new Date(start.getTime() + 15 * 60000);

        const proposed = new Date(
          ctx.originalEnd.getTime() + deltaMinutes * 60000
        );
        const newEnd = proposed < minEnd ? minEnd : proposed;

        setPreviewTimes((prev) => ({
          ...prev,
          [key]: { start: ctx.originalStart, end: newEnd },
        }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const ctx = activeDragRef.current;
      if (!ctx) return;

      const key = `${ctx.jobId}-${ctx.employeeId}`;
      const pv = previewTimes[key];

      if (pv) {
        // 🔍 Mouse altındaki employee row’u bul
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const row = el?.closest("[data-employee-id]") as HTMLElement | null;

        const targetEmployeeId = row
          ? Number(row.dataset.employeeId)
          : ctx.employeeId; // fallback = aynı employee

        // 🧪 Debug (ilk testte çok faydalı)
        console.log("DRAG DROP", {
          from: ctx.employeeId,
          to: targetEmployeeId,
        });

        onMoveJob?.(
          ctx.jobId,
          ctx.employeeId,
          pv.start,
          pv.end,
          targetEmployeeId
        );
      }

      // Clear preview + drag
      activeDragRef.current = null;

      setPreviewTimes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      // suppress click that fires after mouseup
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [date, onMoveJob, previewTimes, findJobById]);

  /* ================= RENDER ================= */
  return (
    <div className={styles.calendarOuter}>
      {/* HEADER */}
      <div className={styles.stickyHeader}>
        <div className={styles.staffHeaderCell} />
        <div className={styles.headerScroll} ref={headerScrollRef}>
          <div className={styles.hoursRow}>
            {hours.map((h) => (
              <div key={h} className={styles.hourCell}>
                {formatHourLabel(h)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className={styles.bodyWrapper}>
        {/* STAFF COLUMN */}
        <div className={styles.staffColumn}>
          {employees.map((emp) => (
            <div key={emp.id} className={styles.staffCell}>
              <div className={styles.staffAvatarCircle}>
                {emp.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className={styles.staffName}>{emp.name}</div>
            </div>
          ))}
        </div>

        {/* TIMELINE */}
        <div
          className={`${styles.timelineScroll} timelineWrapper`}
          ref={bodyScrollRef}
        >
          {employees.map((emp) => {
            const empJobs =
              selectedEmployeeId && emp.id !== selectedEmployeeId
                ? []
                : jobsByEmployee[emp.id] || [];

            return (
              <div
                key={emp.id}
                className={styles.timelineRow}
                data-employee-id={emp.id}
              >
                <div className={styles.jobsLane}>
                  {/* GRID */}
                  <div className={styles.timeSlotsRow}>
                    {hours.map((h) => {
                      const slotStart = new Date(date);
                      slotStart.setHours(h, 0, 0, 0);
                      const slotEnd = new Date(slotStart);
                      slotEnd.setHours(slotEnd.getHours() + 1);

                      return (
                        <div
                          key={h}
                          className={styles.timeSlotCell}
                          onMouseDown={(e) => {
                            // schedule mode: click slot to place scheduled job on this employee row
                            if (!scheduleMode) return;
                            if (emp.id !== scheduleMode.employeeId) return;

                            e.preventDefault();
                            e.stopPropagation();

                            const start = new Date(date);
                            start.setHours(h, 0, 0, 0);

                            const end = new Date(start);
                            end.setHours(start.getHours() + 1);

                            onMoveJob?.(
                              scheduleMode.jobId,
                              scheduleMode.employeeId,
                              start,
                              end
                            );
                            clearScheduleMode?.();
                          }}
                        >
                          {onAddJobAt && (
                            <button
                              type="button"
                              className={styles.slotAddButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddJobAt(emp.id, slotStart, slotEnd);
                              }}
                            >
                              +
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* JOB BLOCKS */}
                  {empJobs.map((job) => {
                    const key = `${job.id}-${emp.id}`;

                    // Fallback ONLY if assignment missing (should not happen if mapped correctly)
                    const fallbackStart = new Date(date);
                    fallbackStart.setHours(9, 0, 0, 0);
                    const fallbackEnd = new Date(date);
                    fallbackEnd.setHours(10, 0, 0, 0);

                    // Use preview if dragging/resizing this exact row
                    const pv = previewTimes[key];
                    const start =
                      pv?.start ??
                      getStartForEmployee(job, emp.id, fallbackStart);
                    const end =
                      pv?.end ?? getEndForEmployee(job, emp.id, fallbackEnd);

                    // Only show blocks on the selected day
                    if (normalizeDay(start) !== normalizeDay(date)) return null;

                    const startMinutes =
                      start.getHours() * 60 + start.getMinutes();
                    const durationMinutes = Math.max(
                      15,
                      (end.getTime() - start.getTime()) / 60000
                    );

                    const left = (startMinutes / 60) * HOUR_WIDTH_PX;
                    const width = Math.max(
                      (durationMinutes / 60) * HOUR_WIDTH_PX,
                      60
                    );

                    return (
                      <div
                        key={key}
                        className={styles.jobBlock}
                        style={{
                          left,
                          width,
                          backgroundColor: job.color || "#fffdf0",
                        }}
                        onMouseDown={(e) => {
                          // ignore if resize handle
                          if ((e.target as HTMLElement).dataset.resize) return;

                          const lane = (e.currentTarget as HTMLElement).closest(
                            `.${styles.jobsLane}`
                          ) as HTMLElement | null;
                          if (!lane) return;

                          const laneRect = lane.getBoundingClientRect();
                          const blockRect = (
                            e.currentTarget as HTMLElement
                          ).getBoundingClientRect();

                          activeDragRef.current = {
                            mode: "move",
                            jobId: job.id,
                            employeeId: emp.id,
                            laneLeft: laneRect.left,
                            blockLeftAtMouseDown: e.clientX - blockRect.left,
                            mouseStartX: e.clientX,
                            originalStart: start,
                            originalEnd: end,
                          };
                        }}
                        onClick={(e) => {
                          // prevent accidental open on mouseup after drag
                          if (suppressClickRef.current) {
                            e.stopPropagation();
                            return;
                          }
                          onJobClick(job.id);
                        }}
                      >
                        <div className={styles.jobBlockTitle}>{job.title}</div>
                        <div className={styles.jobBlockCustomer}>
                          {job.customer}
                        </div>

                        {/* RESIZE HANDLE */}
                        <div
                          data-resize="1"
                          style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            width: 10,
                            height: "100%",
                            cursor: "ew-resize",
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();

                            const lane = (
                              e.currentTarget as HTMLElement
                            ).closest(
                              `.${styles.jobsLane}`
                            ) as HTMLElement | null;
                            if (!lane) return;

                            const laneRect = lane.getBoundingClientRect();

                            activeDragRef.current = {
                              mode: "resize",
                              jobId: job.id,
                              employeeId: emp.id,
                              laneLeft: laneRect.left,
                              blockLeftAtMouseDown: 0,
                              mouseStartX: e.clientX,
                              originalStart: start,
                              originalEnd: end,
                            };
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DesktopCalendarLayout;
