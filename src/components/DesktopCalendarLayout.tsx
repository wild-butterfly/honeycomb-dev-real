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
    targetEmployeeId?: number,
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

// ✅ minutes to nearest 15
function snap15(mins: number) {
  return Math.round(mins / 15) * 15;
}

function safeDate(d: Date | null | undefined, fallback: Date) {
  return d instanceof Date && !isNaN(d.getTime()) ? d : fallback;
}

/* ================= ASSIGNMENT HELPERS =================
   Expect:
   - job.assignments: [{ employeeId, start, end, ... }]   (preferred)
   - (optional) job.assignmentsMap: { [employeeId]: { start, end } }
   Supports:
   - ISO string
   - Date
   - Firestore Timestamp (has toDate())
======================================================== */

const toJsDate = (v: any): Date | null => {
  if (!v) return null;

  if (v instanceof Date) return v;

  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }

  if (typeof v === "string") {
    const d = new Date(v);
    return !isNaN(d.getTime()) ? d : null;
  }

  return null;
};

const getAssignmentForEmployee = (job: CalendarJob, employeeId: number) => {
  const anyJob = job as any;

  if (Array.isArray(anyJob.assignments)) {
    return (
      anyJob.assignments.find(
        (x: any) => Number(x?.employeeId) === Number(employeeId),
      ) || null
    );
  }

  if (anyJob.assignmentsMap && anyJob.assignmentsMap[String(employeeId)]) {
    return anyJob.assignmentsMap[String(employeeId)];
  }

  return null;
};

type DragMode = "move" | "resize";

type ActiveDrag = {
  mode: DragMode;
  jobId: string;

  fromEmployeeId: number; // drag start row
  currentTargetEmployeeId: number; // changes as you move vertically

  // pointerdown snapshot
  pointerStartX: number;
  pointerStartY: number;
  moved: boolean;

  // geometry snapshot
  laneLeftPx: number; // viewport px (left of lane)
  rowTopInTimelinePx: number; // content px top (relative to timeline content)

  // keep grab offset so dragging feels "attached"
  grabOffsetX: number; // px in lane-content coordinates: (pointerX in lane content) - (blockLeftPx)

  // original times (from assignment)
  originalStart: Date;
  originalEnd: Date;
  durationMs: number;

  // computed live
  liveStart: Date;
  liveEnd: Date;
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

  // Overlay ghost refs (imperative updates for smoothness)
  const ghostRef = useRef<HTMLDivElement>(null);

  // active drag lives in ref (no rerender spam)
  const activeDragRef = useRef<ActiveDrag | null>(null);

  // RAF throttle for pointermove
  const rafIdRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // click suppression after drag
  const suppressClickRef = useRef(false);

  // only rerender when drag starts/ends (hide original block, show ghost)
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => i),
    [],
  );

  const findJobById = useCallback(
    (id: string) => jobs.find((j) => j.id === id) || null,
    [jobs],
  );

  /* ================= DAY BOUNDS HELPERS ================= */
  const getDayBounds = useCallback((d: Date) => {
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    return { dayStart, dayEnd };
  }, []);

  const clampToDay = useCallback(
    (rawStart: Date, rawEnd: Date, day: Date) => {
      const { dayStart, dayEnd } = getDayBounds(day);

      const start = rawStart < dayStart ? dayStart : rawStart;
      const end = rawEnd > dayEnd ? dayEnd : rawEnd;

      return { start, end };
    },
    [getDayBounds],
  );

  /* ================= MAP JOBS BY EMPLOYEE (ASSIGNMENTS) ================= */
  const jobsByEmployee: Record<number, CalendarJob[]> = useMemo(() => {
    const map: Record<number, CalendarJob[]> = {};
    for (const e of employees) map[e.id] = [];

    for (const job of jobs) {
      for (const a of (job as any).assignments ?? []) {
        const scheduledFlag = (a as any).scheduled;
        if (scheduledFlag === false) continue;

        if (!a.start || !a.end) continue;

        const startDate = new Date(a.start);
        const endDate = new Date(a.end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) continue;

        // show if overlaps selected day
        const s = new Date(date);
        s.setHours(0, 0, 0, 0);
        const e = new Date(date);
        e.setHours(23, 59, 59, 999);

        const overlaps = startDate <= e && endDate >= s;
        if (!overlaps) continue;

        const empId = Number(a.employeeId);
        if (!Number.isFinite(empId)) continue;
        if (!map[empId]) continue;

        if (!selectedEmployeeId || empId === selectedEmployeeId) {
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

  /* ================= START/END PER EMPLOYEE ================= */
  const getStartForEmployee = (
    job: CalendarJob,
    employeeId: number,
    fallback: Date,
  ) => {
    const a = getAssignmentForEmployee(job, employeeId);
    const d = toJsDate(a?.start);
    return safeDate(d, fallback);
  };

  const getEndForEmployee = (
    job: CalendarJob,
    employeeId: number,
    fallback: Date,
  ) => {
    const a = getAssignmentForEmployee(job, employeeId);
    const d = toJsDate(a?.end);
    return safeDate(d, fallback);
  };

  /* ================= GEOMETRY HELPERS ================= */
  const minutesToPx = (minutes: number) => (minutes / 60) * HOUR_WIDTH_PX;
  const pxToMinutes = (px: number) => (px / HOUR_WIDTH_PX) * 60;

  const buildDateFromMinutes = (baseDay: Date, mins: number) => {
    const m = Math.max(0, Math.min(24 * 60, mins));
    const h = Math.floor(m / 60);
    const mm = Math.round(m - h * 60);
    const d = new Date(baseDay);
    d.setHours(h, mm, 0, 0);
    return d;
  };

  const readRowUnderPointer = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const row = el?.closest("[data-employee-id]") as HTMLElement | null;
    if (!row) return null;
    const n = Number(row.dataset.employeeId);
    return Number.isFinite(n) ? n : null;
  };

  const updateGhost = (
    topPx: number,
    leftPx: number,
    widthPx: number,
    bg: string,
  ) => {
    const g = ghostRef.current;
    if (!g) return;

    g.style.display = "block";
    g.style.transform = `translate3d(${leftPx}px, ${topPx}px, 0)`;
    g.style.width = `${Math.max(widthPx, 60)}px`;
    g.style.background = bg;
  };

  const hideGhost = () => {
    const g = ghostRef.current;
    if (!g) return;
    g.style.display = "none";
    g.style.transform = `translate3d(0,0,0)`;
    g.style.width = "0px";
  };

  /* ================= RAF DRAG LOOP ================= */
  const scheduleRaf = useCallback(() => {
    if (rafIdRef.current != null) return;

    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;

      const ctx = activeDragRef.current;
      const lp = lastPointerRef.current;
      const body = bodyScrollRef.current;

      if (!ctx || !lp || !body) return;

      const { x, y } = lp;

      // movement threshold
      if (!ctx.moved) {
        const dx = Math.abs(x - ctx.pointerStartX);
        const dy = Math.abs(y - ctx.pointerStartY);
        if (dx >= 3 || dy >= 3) {
          ctx.moved = true;
        }
      }

      // vertical target
      const maybeTarget = readRowUnderPointer(x, y);
      if (maybeTarget != null) {
        ctx.currentTargetEmployeeId = maybeTarget;
      }

      const scrollLeftNow = body.scrollLeft;

      // ✅ X in lane content coordinates, corrected with grabOffsetX in same coordinate space
      const xInLaneContent =
        x - ctx.laneLeftPx + scrollLeftNow - ctx.grabOffsetX;
      if (!Number.isFinite(xInLaneContent)) return;

      if (ctx.mode === "move") {
        const startMinutesRaw = pxToMinutes(xInLaneContent);
        const snapped = snap15(startMinutesRaw);

        const newStart = buildDateFromMinutes(date, snapped);
        const newEnd = new Date(newStart.getTime() + ctx.durationMs);

        const clamped = clampToDay(newStart, newEnd, date);
        if (clamped.end <= clamped.start) return;

        ctx.liveStart = clamped.start;
        ctx.liveEnd = clamped.end;

        const startMinutes =
          clamped.start.getHours() * 60 + clamped.start.getMinutes();
        const durationMinutes = Math.max(
          15,
          (clamped.end.getTime() - clamped.start.getTime()) / 60000,
        );

        const left = minutesToPx(startMinutes);
        const width = minutesToPx(durationMinutes);

        // row top based on current target row
        const rowLaneEl = document.querySelector(
          `[data-employee-id="${ctx.currentTargetEmployeeId}"] .${styles.jobsLane}`,
        ) as HTMLElement | null;

        let rowTopInTimeline = ctx.rowTopInTimelinePx;
        if (rowLaneEl) {
          const rowRect = rowLaneEl.getBoundingClientRect();
          const timelineRect = body.getBoundingClientRect();
          rowTopInTimeline = rowRect.top - timelineRect.top + body.scrollTop;
        }

        const ghostTop = rowTopInTimeline + 6;

        const job = findJobById(ctx.jobId);
        const bg = job?.color || "#fffdf0";
        updateGhost(ghostTop, left, width, bg);
      }

      if (ctx.mode === "resize") {
        // resize is driven directly by pointer X (no grabOffset)
        const endMinutesRaw = pxToMinutes(x - ctx.laneLeftPx + scrollLeftNow);
        const endSnapped = snap15(endMinutesRaw);

        const startMins =
          ctx.originalStart.getHours() * 60 + ctx.originalStart.getMinutes();
        const minEnd = startMins + 15;
        const finalEndMins = Math.max(minEnd, endSnapped);

        const newStart = new Date(ctx.originalStart);
        const newEnd = buildDateFromMinutes(date, finalEndMins);

        const clamped = clampToDay(newStart, newEnd, date);
        if (clamped.end <= clamped.start) return;

        ctx.liveStart = clamped.start;
        ctx.liveEnd = clamped.end;

        const startMinutes =
          clamped.start.getHours() * 60 + clamped.start.getMinutes();
        const durationMinutes = Math.max(
          15,
          (clamped.end.getTime() - clamped.start.getTime()) / 60000,
        );

        const left = minutesToPx(startMinutes);
        const width = minutesToPx(durationMinutes);

        const rowLaneEl = document.querySelector(
          `[data-employee-id="${ctx.fromEmployeeId}"] .${styles.jobsLane}`,
        ) as HTMLElement | null;

        let rowTopInTimeline = ctx.rowTopInTimelinePx;
        if (rowLaneEl) {
          const rowRect = rowLaneEl.getBoundingClientRect();
          const timelineRect = body.getBoundingClientRect();
          rowTopInTimeline = rowRect.top - timelineRect.top + body.scrollTop;
        }

        const ghostTop = rowTopInTimeline + 6;

        const job = findJobById(ctx.jobId);
        const bg = job?.color || "#fffdf0";
        updateGhost(ghostTop, left, width, bg);
      }
    });
  }, [clampToDay, date, findJobById]);

  /* ================= GLOBAL POINTER LISTENERS ================= */
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!activeDragRef.current) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      scheduleRaf();
    };

    const onPointerUp = () => {
      const ctx = activeDragRef.current;
      if (!ctx) return;

      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      if (ctx.moved && onMoveJob) {
        const target = ctx.currentTargetEmployeeId ?? ctx.fromEmployeeId;
        onMoveJob(
          ctx.jobId,
          ctx.fromEmployeeId,
          ctx.liveStart,
          ctx.liveEnd,
          target,
        );
      }

      if (ctx.moved) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }

      activeDragRef.current = null;
      lastPointerRef.current = null;
      setDraggingKey(null);
      hideGhost();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onMoveJob, scheduleRaf]);

  /* ================= START DRAG HELPERS ================= */
  const startMoveDrag = useCallback(
    (
      e: React.PointerEvent,
      job: CalendarJob,
      rowEmployeeId: number,
      rawStart: Date,
      rawEnd: Date,
      blockLeftPx: number,
    ) => {
      const body = bodyScrollRef.current;
      if (!body) return;

      const lane = (e.currentTarget as HTMLElement).closest(
        `.${styles.jobsLane}`,
      ) as HTMLElement | null;
      if (!lane) return;

      e.preventDefault();
      e.stopPropagation();

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}

      const laneRect = lane.getBoundingClientRect();
      const timelineRect = body.getBoundingClientRect();

      // ✅ FIX: grabOffsetX must be in lane-content coordinates
      // laneContentX = (clientX - laneLeft) + scrollLeft
      const laneContentX = e.clientX - laneRect.left + body.scrollLeft;

      // blockLeftPx is already lane-content coordinate
      const grabOffsetX = laneContentX - blockLeftPx;

      const durationMs = Math.max(
        15 * 60 * 1000,
        rawEnd.getTime() - rawStart.getTime(),
      );
      const clamped = clampToDay(rawStart, rawEnd, date);

      activeDragRef.current = {
        mode: "move",
        jobId: job.id,
        fromEmployeeId: rowEmployeeId,
        currentTargetEmployeeId: rowEmployeeId,

        pointerStartX: e.clientX,
        pointerStartY: e.clientY,
        moved: false,

        laneLeftPx: laneRect.left,
        rowTopInTimelinePx: laneRect.top - timelineRect.top + body.scrollTop,

        grabOffsetX,

        originalStart: rawStart,
        originalEnd: rawEnd,
        durationMs,

        liveStart: clamped.start,
        liveEnd: clamped.end,
      };

      setDraggingKey(`${job.id}-${rowEmployeeId}`);

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      scheduleRaf();
    },
    [clampToDay, date, scheduleRaf],
  );

  const startResizeDrag = useCallback(
    (
      e: React.PointerEvent,
      job: CalendarJob,
      rowEmployeeId: number,
      rawStart: Date,
      rawEnd: Date,
    ) => {
      const body = bodyScrollRef.current;
      if (!body) return;

      const lane = (e.currentTarget as HTMLElement).closest(
        `.${styles.jobsLane}`,
      ) as HTMLElement | null;
      if (!lane) return;

      e.preventDefault();
      e.stopPropagation();

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}

      const laneRect = lane.getBoundingClientRect();
      const timelineRect = body.getBoundingClientRect();

      const clamped = clampToDay(rawStart, rawEnd, date);
      const durationMs = Math.max(
        15 * 60 * 1000,
        clamped.end.getTime() - clamped.start.getTime(),
      );

      activeDragRef.current = {
        mode: "resize",
        jobId: job.id,
        fromEmployeeId: rowEmployeeId,
        currentTargetEmployeeId: rowEmployeeId,

        pointerStartX: e.clientX,
        pointerStartY: e.clientY,
        moved: false,

        laneLeftPx: laneRect.left,
        rowTopInTimelinePx: laneRect.top - timelineRect.top + body.scrollTop,

        grabOffsetX: 0,

        originalStart: clamped.start,
        originalEnd: clamped.end,
        durationMs,

        liveStart: clamped.start,
        liveEnd: clamped.end,
      };

      setDraggingKey(`${job.id}-${rowEmployeeId}`);

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      scheduleRaf();
    },
    [clampToDay, date, scheduleRaf],
  );

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
          {/* GHOST OVERLAY */}
          <div className={styles.ghostLayer} aria-hidden="true">
            <div ref={ghostRef} className={styles.dragGhost} />
          </div>

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
                          onMouseDown={(ev) => {
                            if (!scheduleMode) return;
                            if (emp.id !== scheduleMode.employeeId) return;

                            ev.preventDefault();
                            ev.stopPropagation();

                            const start = new Date(date);
                            start.setHours(h, 0, 0, 0);

                            const end = new Date(start);
                            end.setHours(start.getHours() + 1);

                            onMoveJob?.(
                              scheduleMode.jobId,
                              scheduleMode.employeeId,
                              start,
                              end,
                            );
                            clearScheduleMode?.();
                          }}
                        >
                          {onAddJobAt && (
                            <button
                              type="button"
                              className={styles.slotAddButton}
                              onClick={(ev) => {
                                ev.stopPropagation();
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

                    const fallbackStart = new Date(date);
                    fallbackStart.setHours(9, 0, 0, 0);
                    const fallbackEnd = new Date(date);
                    fallbackEnd.setHours(10, 0, 0, 0);

                    const rawStart = getStartForEmployee(
                      job,
                      emp.id,
                      fallbackStart,
                    );
                    const rawEnd = getEndForEmployee(job, emp.id, fallbackEnd);

                    const clamped = clampToDay(rawStart, rawEnd, date);
                    const start = clamped.start;
                    const end = clamped.end;
                    if (end <= start) return null;

                    const startMinutes =
                      start.getHours() * 60 + start.getMinutes();
                    const durationMinutes = Math.max(
                      15,
                      (end.getTime() - start.getTime()) / 60000,
                    );

                    const left = (startMinutes / 60) * HOUR_WIDTH_PX;
                    const width = Math.max(
                      (durationMinutes / 60) * HOUR_WIDTH_PX,
                      60,
                    );

                    const isDraggingThis = draggingKey === key;

                    return (
                      <div
                        key={key}
                        className={styles.jobBlock}
                        style={{
                          left,
                          width,
                          backgroundColor: job.color || "#fffdf0",
                          opacity: isDraggingThis ? 0 : 1,
                        }}
                        onPointerDown={(ev) => {
                          if ((ev.target as HTMLElement).dataset.resize) return;
                          // ✅ pass blockLeftPx to compute grabOffset correctly
                          startMoveDrag(
                            ev,
                            job,
                            emp.id,
                            rawStart,
                            rawEnd,
                            left,
                          );
                        }}
                        onClick={() => {
                          if (suppressClickRef.current) return;
                          const ctx = activeDragRef.current;
                          if (ctx?.moved) return;
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
                          className={styles.resizeHandle}
                          onPointerDown={(ev) => {
                            startResizeDrag(ev, job, emp.id, rawStart, rawEnd);
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
