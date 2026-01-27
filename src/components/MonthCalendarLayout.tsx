// Created by Clevermode © 2025. All rights reserved.
import React, { useMemo, useRef, useEffect, useState } from "react";
import styles from "./MonthCalendarLayout.module.css";
import type { CalendarJob, Employee } from "../pages/CalendarPage";
import { buildCalendarItems, type CalendarItem } from "../utils/calendarItems";

interface Props {
  date: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  selectedStaff: number[];
  onStaffChange: (list: number[]) => void;
  onJobClick: (id: string) => void;
  onJobMove: (
    jobId: string,
    employeeId: number,
    newStart: Date,
    newEnd: Date,
    assignmentId: string,
  ) => void;
  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
}

/* ========================================================= */
/* DRAG STATE */
/* ========================================================= */

type MonthDrag = {
  item: CalendarItem;
  startX: number;
  startY: number;
  moved: boolean;
};

const MonthCalendarLayout: React.FC<Props> = ({
  date,
  jobs,
  employees,
  selectedStaff,
  onStaffChange,
  onJobClick,
  onJobMove,
  onAddJobAt,
}) => {
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const dragRef = useRef<MonthDrag | null>(null);
  const suppressClickRef = useRef(false);

  const year = date.getFullYear();
  const month = date.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const offset = (first.getDay() + 6) % 7;

  const days = Array.from(
    { length: last.getDate() },
    (_, i) => new Date(year, month, i + 1),
  );

  /* ================= ASSIGNMENTS BY DAY ================= */

  const itemsByDay = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    days.forEach((d) => (map[d.toDateString()] = []));

    const items = buildCalendarItems(jobs);

    for (const item of items) {
      if (
        selectedStaff.length > 0 &&
        !selectedStaff.includes(item.employeeId)
      ) {
        continue;
      }

      const key = item.start.toDateString();
      if (map[key]) map[key].push(item);
    }

    return map;
  }, [jobs, days, selectedStaff]);

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

  /* ================= RENDER ================= */

  return (
    <div className={styles.monthLayoutWide}>
      {/* STAFF FILTER */}
      <div className={styles.staffListWrapper}>
        <div className={styles.staffListTitle}>Staff</div>

        <div className={styles.staffList}>
          {employees.map((emp) => {
            const checked = selectedStaff.includes(emp.id);
            return (
              <label key={emp.id} className={styles.staffItem}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    checked
                      ? onStaffChange(selectedStaff.filter((x) => x !== emp.id))
                      : onStaffChange([...selectedStaff, emp.id])
                  }
                />
                <div className={styles.staffAvatar}>
                  {emp.name
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className={styles.staffName}>{emp.name}</div>
              </label>
            );
          })}
        </div>
      </div>

      {/* MONTH GRID */}
      <div className={styles.monthWrapper}>
        <div className={styles.weekHeader}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className={styles.weekDayLabel}>
              {d}
            </div>
          ))}
        </div>

        <div className={styles.daysGrid}>
          {Array.from({ length: offset }).map((_, i) => (
            <div key={i} className={styles.emptyCell} />
          ))}

          {days.map((day) => {
            const key = day.toDateString();
            const itemsToday = itemsByDay[key] || [];
            const dayNum = day.getDate();

            return (
              <div
                key={key}
                className={styles.dayCell}
                data-date={day.toISOString()}
                onMouseEnter={() => setHoverDay(dayNum)}
                onMouseLeave={() => setHoverDay(null)}
              >
                <div className={styles.dayNumber}>{dayNum}</div>

                <div className={styles.jobsList}>
                  {itemsToday.map((item) => (
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
                      {item.status === "quote" && (
                        <div className={styles.badgeQuote}>QUOTE</div>
                      )}
                      {item.status === "completed" && (
                        <div className={styles.badgeCompleted}>COMPLETED</div>
                      )}
                      {item.status === "return" && (
                        <div className={styles.badgeReturn}>NEED TO RETURN</div>
                      )}

                      <div className={styles.jobTitle}>{item.title}</div>
                      <div className={styles.jobCustomer}>{item.customer}</div>
                    </div>
                  ))}
                </div>

                <button
                  className={styles.slotAddButton}
                  style={{
                    opacity: hoverDay === dayNum ? 1 : 0,
                  }}
                  onClick={() => {
                    const start = new Date(day);
                    start.setHours(9, 0, 0, 0);

                    const end = new Date(start);
                    end.setHours(start.getHours() + 1);

                    const emp = selectedStaff[0] ?? employees[0]?.id;
                    if (emp) onAddJobAt(emp, start, end);
                  }}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.sidebarSpacer} />
    </div>
  );
};

export default MonthCalendarLayout;
