// Created by Clevermode © 2025. All rights reserved.
import React, { useMemo, useRef, useEffect, useState } from "react";
import styles from "./WeekCalendarLayout.module.css";
import type { CalendarJob, Employee } from "../pages/CalendarPage";
import { buildCalendarItems, type CalendarItem } from "../utils/calendarItems";

/* ========================================================= */
/* TYPES */
/* ========================================================= */

interface Props {
  date: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  onJobClick: (id: string) => void;

  onJobMove: (
    jobId: string,
    fromEmployeeId: number,
    newStart: Date,
    newEnd: Date,
    targetEmployeeId?: number,
    assignmentId?: string,
  ) => void;

  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
}

/* ========================================================= */
/* DRAG STATE */
/* ========================================================= */

type WeekDrag = {
  item: CalendarItem;
  startX: number;
  startY: number;
  moved: boolean;
};

/* ========================================================= */
/* MAIN COMPONENT */
/* ========================================================= */

const WeekCalendarLayout: React.FC<Props> = ({
  date,
  jobs,
  employees,
  onJobClick,
  onJobMove,
  onAddJobAt,
}) => {
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);

  const dragRef = useRef<WeekDrag | null>(null);
  const suppressClickRef = useRef(false);

  /* ================= WEEK RANGE ================= */

  const startOfWeek = new Date(date);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(date.getDate() - ((date.getDay() + 6) % 7));

  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [startOfWeek.getTime()]);

  /* ================= BUILD ASSIGNMENTS ================= */

  const items = useMemo(() => buildCalendarItems(jobs), [jobs]);

  const itemsByDayAndEmployee = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};

    for (const item of items) {
      const key = `${item.employeeId}__${item.start.toDateString()}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }

    return map;
  }, [items]);

  /* ================= POINTER EVENTS ================= */

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return;

      const dx = Math.abs(e.clientX - dragRef.current.startX);
      const dy = Math.abs(e.clientY - dragRef.current.startY);

      if (dx > 4 || dy > 4) {
        dragRef.current.moved = true;
        suppressClickRef.current = true;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const ctx = dragRef.current;
      if (!ctx) return;

      if (ctx.moved) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el?.closest("[data-date]") as HTMLElement | null;

        if (cell) {
          const dateISO = cell.dataset.date!;
          const targetEmployeeId = Number(cell.dataset.employeeId);

          const day = new Date(dateISO);
          const duration = ctx.item.end.getTime() - ctx.item.start.getTime();

          const newStart = new Date(day);
          newStart.setHours(
            ctx.item.start.getHours(),
            ctx.item.start.getMinutes(),
            0,
            0,
          );

          const newEnd = new Date(newStart.getTime() + duration);

          onJobMove(
            ctx.item.jobId,
            ctx.item.employeeId,
            newStart,
            newEnd,
            targetEmployeeId,
            ctx.item.assignmentId,
          );
        }
      }

      dragRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onJobMove]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  /* ================= RENDER ================= */

  return (
    <div className={styles.weekWrapper}>
      {/* HEADER */}
      <div className={styles.headerRow}>
        <div className={styles.staffHeaderCell} />

        {daysOfWeek.map((day, i) => (
          <div key={i} className={styles.dayHeader}>
            <div className={styles.dayLabel}>
              {day.toLocaleDateString("en-AU", {
                weekday: "short",
                day: "numeric",
              })}
            </div>
          </div>
        ))}
      </div>

      {/* EMPLOYEE ROWS */}
      {employees.map((emp) => (
        <div key={emp.id} className={styles.row}>
          <div className={styles.staffCell}>
            <div className={styles.avatarCircle}>{getInitials(emp.name)}</div>
            <span className={styles.staffName}>{emp.name}</span>
          </div>

          {daysOfWeek.map((day) => {
            const key = `${emp.id}__${day.toDateString()}`;
            const itemsInCell = itemsByDayAndEmployee[key] || [];
            const cellId = `${emp.id}__${day.toISOString().slice(0, 10)}`;

            return (
              <div
                key={cellId}
                className={styles.dayCell}
                data-date={day.toISOString()}
                data-employee-id={emp.id}
                onMouseEnter={() => setHoverSlot(cellId)}
                onMouseLeave={() => setHoverSlot(null)}
              >
                {itemsInCell.map((item) => (
                  <div
                    key={item.assignmentId}
                    className={styles.jobBox}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      suppressClickRef.current = false;

                      dragRef.current = {
                        item,
                        startX: e.clientX,
                        startY: e.clientY,
                        moved: false,
                      };

                      (e.currentTarget as HTMLElement).setPointerCapture(
                        e.pointerId,
                      );
                    }}
                    onClick={(e) => {
                      if (suppressClickRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        suppressClickRef.current = false;
                        return;
                      }

                      onJobClick(item.jobId);
                    }}
                    style={{
                      backgroundColor: item.color || "#faf7dc",
                    }}
                  >
                    <div className={styles.dragHandle} aria-hidden>
                      ⋮⋮
                    </div>

                    <div className={styles.jobTitle}>{item.title}</div>
                    <div className={styles.jobCustomer}>{item.customer}</div>

                    <div className={styles.jobTime}>
                      {item.start.toLocaleTimeString("en-AU", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}

                {hoverSlot === cellId && itemsInCell.length === 0 && (
                  <button
                    className={styles.slotAddButton}
                    onClick={() => {
                      const start = new Date(day);
                      start.setHours(9, 0, 0, 0);

                      const end = new Date(start);
                      end.setHours(start.getHours() + 1);

                      onAddJobAt(emp.id, start, end);
                    }}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WeekCalendarLayout;
