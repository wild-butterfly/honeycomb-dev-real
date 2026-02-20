// Created by Clevermode © 2025. All rights reserved.

import React, {
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";
import styles from "./DesktopCalendarLayout.module.css";

import type { Employee } from "../types/calendar";
import StatusBadge from "../components/StatusBadge";
import type { CalendarItem } from "../utils/calendarItems";

/* =========================================================
   PROPS – ASSIGNMENT-BASED (POSTGRES SAFE)
========================================================= */

interface Props {
  date: Date;
  employees: Employee[];
  items: CalendarItem[];
  selectedStaff: number[];

  onItemClick: (item: CalendarItem) => void;

  onAssignmentMove: (
    assignmentId: number,
    employee_id: number,
    start: Date,
    end: Date,
  ) => void;

  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
}

/* =========================================================
   CONSTANTS & HELPERS
========================================================= */

const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const HOUR_WIDTH_PX = 104;

const formatHourLabel = (h: number) => {
  if (h === 0) return "12AM";
  if (h < 12) return `${h}AM`;
  if (h === 12) return "12PM";
  return `${h - 12}PM`;
};

const snap15 = (mins: number) => Math.round(mins / 15) * 15;

const toJsDate = (v: any): Date | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

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

const getDayBounds = (d: Date) => {
  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(d);
  dayEnd.setHours(23, 59, 59, 999);

  return { dayStart, dayEnd };
};

const clampToDay = (start: Date, end: Date, day: Date) => {
  const { dayStart, dayEnd } = getDayBounds(day);
  return {
    start: start < dayStart ? dayStart : start,
    end: end > dayEnd ? dayEnd : end,
  };
};

/* =========================================================
   DRAG STATE
========================================================= */

type ActiveDrag = {
  mode: "move" | "resize-start" | "resize-end";
  item: CalendarItem;

  fromEmployeeId: number;
  currentTargetEmployeeId: number;

  pointerStartX: number;
  pointerStartY: number;
  moved: boolean;

  laneLeftPx: number;
  rowTopPx: number;

  grabOffsetX: number;
  resizeOffsetX?: number;

  originalStart: Date;
  originalEnd: Date;
  durationMs: number;

  liveStart: Date;
  liveEnd: Date;
};

/* =========================================================
   COMPONENT
========================================================= */

const DesktopCalendarLayout: React.FC<Props> = ({
  date,
  employees,
  items,
  selectedStaff,
  onItemClick,
  onAssignmentMove,
  onAddJobAt,
}) => {
  const didInitialScrollRef = useRef(false);

  const visibleEmployees = useMemo(
    () =>
      selectedStaff.length
        ? employees.filter((e) => selectedStaff.includes(e.id))
        : employees,
    [employees, selectedStaff],
  );

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  const activeDragRef = useRef<ActiveDrag | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const rowRectsRef = useRef<{ empId: number; top: number; bottom: number }[]>(
    [],
  );

  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const assignmentsByEmployee = useMemo(() => {
    const map: Record<number, CalendarItem[]> = {};
    visibleEmployees.forEach((e) => (map[e.id] = []));

    const { dayStart, dayEnd } = getDayBounds(date);

    for (const item of items) {
      if (!map[item.employee_id]) continue;

      const s = toJsDate(item.start);
      const e = toJsDate(item.end);
      if (!s || !e) continue;
      if (e < dayStart || s > dayEnd) continue;

      map[item.employee_id].push(item);
    }

    return map;
  }, [items, visibleEmployees, date]);

  /* =========================================================
   DRAG LOOP (FIXED – MOVE + RESIZE)
========================================================= */
  suppressClickRef.current = false;

  const scheduleRaf = useCallback(() => {
    if (rafRef.current != null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      const ctx = activeDragRef.current;
      const ptr = lastPointerRef.current;
      const body = bodyScrollRef.current;
      if (!ctx || !ptr || !body) return;

      const { x, y } = ptr;

      // moved threshold
      if (!ctx.moved) {
        const dx = x - ctx.pointerStartX;
        const dy = y - ctx.pointerStartY;

        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          ctx.moved = true;
        }
      }

      // employee row detection (CACHED — SMOOTH)
      for (const row of rowRectsRef.current) {
        if (y >= row.top && y <= row.bottom) {
          ctx.currentTargetEmployeeId = row.empId;
          break;
        }
      }

      const scrollLeft = body.scrollLeft;
      const xInLane = x - ctx.laneLeftPx + scrollLeft - ctx.grabOffsetX;

      /* =========================
       RESIZE MODE (FIXED)
    ========================= */

      if (ctx.mode === "resize-start" || ctx.mode === "resize-end") {
        const deltaPx = x - ctx.pointerStartX;

        // tiny jitter guard
        if (Math.abs(deltaPx) < 2) return;

        const deltaMinutes = snap15(pxToMinutes(deltaPx));

        const originalStartMinutes =
          ctx.originalStart.getHours() * 60 + ctx.originalStart.getMinutes();
        const originalEndMinutes =
          ctx.originalEnd.getHours() * 60 + ctx.originalEnd.getMinutes();

        const nextStartMinutes =
          ctx.mode === "resize-start"
            ? originalStartMinutes + deltaMinutes
            : originalStartMinutes;
        const nextEndMinutes =
          ctx.mode === "resize-end"
            ? originalEndMinutes + deltaMinutes
            : originalEndMinutes;

        const newStart = buildDateFromMinutes(date, nextStartMinutes);
        const newEnd = buildDateFromMinutes(date, nextEndMinutes);

        const clamped = clampToDay(newStart, newEnd, date);
        if (clamped.end <= clamped.start) return;

        ctx.liveStart = clamped.start;
        ctx.liveEnd = clamped.end;

        // ghost update
        const left = minutesToPx(
          clamped.start.getHours() * 60 + clamped.start.getMinutes(),
        );
        const width = minutesToPx(
          (clamped.end.getTime() - clamped.start.getTime()) / 60000,
        );

        const g = ghostRef.current;
        if (!g) return;

        g.style.display = "block";
        g.style.transform = `translate3d(${left}px, ${ctx.rowTopPx + 6}px, 0)`;
        g.style.width = `${Math.max(width, 60)}px`;
        g.style.background = ctx.item.color ?? "#fffdf0";
        return;
      }

      /* =========================
       MOVE MODE
    ========================= */

      const startMins = snap15(pxToMinutes(xInLane));
      const newStart = buildDateFromMinutes(date, startMins);
      const newEnd = new Date(newStart.getTime() + ctx.durationMs);

      const clamped = clampToDay(newStart, newEnd, date);
      if (clamped.end <= clamped.start) return;

      ctx.liveStart = clamped.start;
      ctx.liveEnd = clamped.end;

      const left = minutesToPx(
        clamped.start.getHours() * 60 + clamped.start.getMinutes(),
      );
      const width = minutesToPx(
        (clamped.end.getTime() - clamped.start.getTime()) / 60000,
      );

      const g = ghostRef.current;
      if (!g) return;

      g.style.display = "block";
      g.style.transform = `translate3d(${left}px, ${ctx.rowTopPx + 6}px, 0)`;
      g.style.width = `${Math.max(width, 60)}px`;
      g.style.background = ctx.item.color ?? "#fffdf0";
    });
  }, [date]);
  /* =========================================================
     GLOBAL POINTER
  ========================================================== */

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!activeDragRef.current) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      scheduleRaf();
    };

    const up = () => {
      const ctx = activeDragRef.current;
      if (!ctx) return;

      if (ctx.moved && onAssignmentMove) {
        const snappedStart = buildDateFromMinutes(
          date,
          snap15(ctx.liveStart.getHours() * 60 + ctx.liveStart.getMinutes()),
        );

        const snappedEnd = buildDateFromMinutes(
          date,
          snap15(ctx.liveEnd.getHours() * 60 + ctx.liveEnd.getMinutes()),
        );

        onAssignmentMove(
          ctx.item.assignmentId,
          ctx.currentTargetEmployeeId,
          snappedStart,
          snappedEnd,
        );
      }

      suppressClickRef.current = ctx.moved;
      setTimeout(() => (suppressClickRef.current = false), 0);

      activeDragRef.current = null;
      lastPointerRef.current = null;
      setDraggingKey(null);

      if (ghostRef.current) ghostRef.current.style.display = "none";
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [onAssignmentMove, scheduleRaf]);

  /* =========================================================
   SCROLL SYNC (HEADER ↔ BODY)
  ========================================================= */

  useEffect(() => {
    const body = bodyScrollRef.current;
    const header = headerScrollRef.current;
    if (!body || !header) return;

    const syncHeader = () => {
      header.scrollLeft = body.scrollLeft;
    };

    body.addEventListener("scroll", syncHeader);
    return () => body.removeEventListener("scroll", syncHeader);
  }, []);

  /* =========================================================
   INITIAL HORIZONTAL SCROLL (CENTER 6AM–6PM)
  ========================================================= */
  useLayoutEffect(() => {
    const body = bodyScrollRef.current;
    if (!body) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    const tryScroll = () => {
      const firstRow = body.querySelector(
        `.${styles.timeSlotsRow}`,
      ) as HTMLElement | null;

      const firstCell = body.querySelector(
        `.${styles.timeSlotCell}`,
      ) as HTMLElement | null;

      if (
        !firstRow ||
        !firstCell ||
        firstRow.scrollWidth === 0 ||
        body.clientWidth === 0
      ) {
        if (attempts++ < MAX_ATTEMPTS) {
          requestAnimationFrame(tryScroll);
        }
        return;
      }

      const viewportWidth = body.clientWidth;
      const totalTimelineWidth = firstRow.scrollWidth;
      const zeroHourOffset = firstCell.offsetLeft;

      const TARGET_HOUR = 13;

      const targetX =
        zeroHourOffset + TARGET_HOUR * HOUR_WIDTH_PX + HOUR_WIDTH_PX / 2;

      body.scrollLeft = Math.max(
        0,
        Math.min(
          targetX - viewportWidth / 2,
          totalTimelineWidth - viewportWidth,
        ),
      );
    };

    tryScroll();
  }, [date, visibleEmployees.length]);

  /* =========================================================
     START MOVE
  ========================================================== */

  const startMoveDrag = (
    e: React.PointerEvent | PointerEvent,
    item: CalendarItem,
    rowEmployeeId: number,
    rawStart: Date,
    rawEnd: Date,
    leftPx: number,
  ) => {
    const body = bodyScrollRef.current;
    if (!body) return;

    const lane = (e.target as HTMLElement | null)?.closest(
      `.${styles.jobsLane}`,
    ) as HTMLElement | null;

    if (!lane) return;

    e.preventDefault();
    e.stopPropagation();

    if ("pointerId" in e && lane.setPointerCapture) {
      try {
        lane.setPointerCapture(e.pointerId);
      } catch {}
    }

    const laneRect = lane.getBoundingClientRect();
    const timelineRect = body.getBoundingClientRect();

    const grabOffsetX = e.clientX - laneRect.left + body.scrollLeft - leftPx;

    const clamped = clampToDay(rawStart, rawEnd, date);
    const durationMs = clamped.end.getTime() - clamped.start.getTime();

    // 🔥 CACHE EMPLOYEE ROWS (lag fix)
    rowRectsRef.current = [];

    const rows = document.querySelectorAll(
      `.${styles.timelineRow}`,
    ) as NodeListOf<HTMLElement>;

    rows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      const empId = Number(row.dataset.employeeId);
      if (!isNaN(empId)) {
        rowRectsRef.current.push({
          empId,
          top: rect.top,
          bottom: rect.bottom,
        });
      }
    });

    activeDragRef.current = {
      mode: "move",
      item,
      fromEmployeeId: rowEmployeeId,
      currentTargetEmployeeId: rowEmployeeId,
      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
      moved: false,
      laneLeftPx: laneRect.left,
      rowTopPx: laneRect.top - timelineRect.top + body.scrollTop,
      grabOffsetX,
      originalStart: clamped.start,
      originalEnd: clamped.end,
      durationMs,
      liveStart: clamped.start,
      liveEnd: clamped.end,
    };

    setDraggingKey(`${item.assignmentId}-${rowEmployeeId}`);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    scheduleRaf();
  };

  const dragIntentRef = useRef<{
    item: CalendarItem;
    startX: number;
    startY: number;
    empId: number;
    s: Date;
    e: Date;
    left: number;
  } | null>(null);

  /* =========================================================
   DRAG INTENT → REAL DRAG (WEEK MODEL)
========================================================= */

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const intent = dragIntentRef.current;
      if (!intent || activeDragRef.current) return;

      const dx = Math.abs(e.clientX - intent.startX);
      const dy = Math.abs(e.clientY - intent.startY);

      if (dx > 6 || dy > 6) {
        suppressClickRef.current = true;

        startMoveDrag(
          e as any,
          intent.item,
          intent.empId,
          intent.s,
          intent.e,
          intent.left,
        );

        dragIntentRef.current = null;
      }
    };

    const up = () => {
      dragIntentRef.current = null;
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [startMoveDrag]);

  /* =========================================================
   START RESIZE (FIXED)
========================================================= */

  const startResizeDrag = (
    e: React.PointerEvent,
    item: CalendarItem,
    rowEmployeeId: number,
    rawStart: Date,
    rawEnd: Date,
    leftPx: number,
    side: "start" | "end",
  ) => {
    const body = bodyScrollRef.current;
    if (!body) return;

    const lane = (e.target as HTMLElement)?.closest(
      `.${styles.jobsLane}`,
    ) as HTMLElement | null;

    if (!lane) return;

    e.preventDefault();
    e.stopPropagation();
    lane.setPointerCapture(e.pointerId);

    const laneRect = lane.getBoundingClientRect();
    const timelineRect = body.getBoundingClientRect();

    const clamped = clampToDay(rawStart, rawEnd, date);

    activeDragRef.current = {
      mode: side === "start" ? "resize-start" : "resize-end",
      item,
      fromEmployeeId: rowEmployeeId,
      currentTargetEmployeeId: rowEmployeeId,

      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
      moved: false,

      laneLeftPx: laneRect.left,
      rowTopPx: laneRect.top - timelineRect.top + body.scrollTop,

      grabOffsetX: 0,

      resizeOffsetX: 0,

      originalStart: clamped.start,
      originalEnd: clamped.end,
      durationMs: clamped.end.getTime() - clamped.start.getTime(),

      liveStart: clamped.start,
      liveEnd: clamped.end,
    };

    setDraggingKey(`${item.assignmentId}-${rowEmployeeId}`);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    scheduleRaf();
  };
  /* =========================================================
     RENDER
  ========================================================== */

  const isDragging = Boolean(draggingKey);

  return (
    <div
      className={`${styles.calendarOuter} ${isDragging ? styles.dragging : ""}`}
    >
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

      <div className={styles.bodyWrapper}>
        <div className={styles.staffColumn}>
          {visibleEmployees.map((e) => (
            <div key={e.id} className={styles.staffCell}>
              <div className={styles.staffAvatarCircle}>
                {e.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className={styles.staffName}>{e.name}</div>
            </div>
          ))}
        </div>

        <div className={styles.timelineScroll} ref={bodyScrollRef}>
          <div className={styles.ghostLayer}>
            <div ref={ghostRef} className={styles.dragGhost} />
          </div>

          {visibleEmployees.map((emp) => (
            <div
              key={emp.id}
              className={styles.timelineRow}
              data-employee-id={emp.id}
            >
              <div className={styles.jobsLane}>
                <div className={styles.timeSlotsRow}>
                  {hours.map((h) => {
                    const s = new Date(date);
                    s.setHours(h, 0, 0, 0);
                    const e = new Date(s);
                    e.setHours(e.getHours() + 1);

                    return (
                      <div key={h} className={styles.timeSlotCell}>
                        <button
                          className={styles.slotAddButton}
                          onClick={(ev) => {
                            if (suppressClickRef.current) return;
                            onAddJobAt(emp.id, s, e);
                          }}
                        >
                          +
                        </button>
                      </div>
                    );
                  })}
                </div>

                {assignmentsByEmployee[emp.id]?.map((item) => {
                  const s = toJsDate(item.start)!;
                  const e = toJsDate(item.end)!;

                  const startM = s.getHours() * 60 + s.getMinutes();
                  const durM = (e.getTime() - s.getTime()) / 60000;
                  const isLongJob = durM > 60;

                  const left = minutesToPx(startM);
                  const width = Math.max(minutesToPx(durM), 60);

                  const key = `${item.jobId}-${item.assignmentId}-${emp.id}`;

                  return (
                    <div
                      key={key}
                      className={styles.jobBlock}
                      style={{
                        left,
                        width,
                        backgroundColor: item.color ?? "#fffdf0",
                        opacity: draggingKey === key ? 0 : 1,
                      }}
                      onPointerDown={(ev) => {
                        dragIntentRef.current = {
                          item,
                          startX: ev.clientX,
                          startY: ev.clientY,
                          empId: emp.id,
                          s,
                          e,
                          left,
                        };
                      }}
                      onClick={() => {
                        if (!suppressClickRef.current) {
                          onItemClick(item);
                        }
                      }}
                    >
                      <StatusBadge status={item.status} />

                      <div className={styles.jobBlockTitle}>{item.title}</div>

                      {/* Less than 1 hour → title + customer */}
                      {item.client && (
                        <div className={styles.jobBlockCustomer}>
                          {item.client}
                        </div>
                      )}

                      {/* Mora than 1 hour → add address */}
                      {isLongJob && item.address && (
                        <div className={styles.jobBlockAddress}>
                          {item.address}
                        </div>
                      )}

                      {/* ✅ RESIZE HANDLE */}
                      <div
                        className={`${styles.resizeHandle} ${styles.resizeHandleLeft}`}
                        onPointerDown={(ev) =>
                          startResizeDrag(ev, item, emp.id, s, e, left, "start")
                        }
                      />
                      <div
                        className={`${styles.resizeHandle} ${styles.resizeHandleRight}`}
                        onPointerDown={(ev) =>
                          startResizeDrag(ev, item, emp.id, s, e, left, "end")
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesktopCalendarLayout;
