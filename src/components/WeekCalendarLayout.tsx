// Created by Clevermode © 2025. All rights reserved.
import React, { useMemo, useState } from "react";
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
  const [draggingItem, setDraggingItem] = useState<CalendarItem | null>(null);

  /* ================= WEEK RANGE ================= */

  const startOfWeek = new Date(date);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // Monday

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
      const dayKey = item.start.toDateString();
      const key = `${item.employeeId}__${dayKey}`;

      if (!map[key]) map[key] = [];
      map[key].push(item);
    }

    return map;
  }, [items]);

  /* ================= DROP HANDLER ================= */

  const handleDropOnCell = (day: Date, employeeId: number) => {
    if (!draggingItem) return;

    const duration = draggingItem.end.getTime() - draggingItem.start.getTime();

    const newStart = new Date(day);
    newStart.setHours(
      draggingItem.start.getHours(),
      draggingItem.start.getMinutes(),
      0,
      0,
    );

    const newEnd = new Date(newStart.getTime() + duration);

    onJobMove(
      draggingItem.jobId,
      draggingItem.employeeId,
      newStart,
      newEnd,
      employeeId,
      draggingItem.assignmentId,
    );

    setDraggingItem(null);
  };

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
            const dayKey = day.toDateString();
            const mapKey = `${emp.id}__${dayKey}`;
            const itemsInCell = itemsByDayAndEmployee[mapKey] || [];

            const cellId = `${emp.id}__${day.toISOString().slice(0, 10)}`;

            return (
              <div
                key={cellId}
                className={`${styles.dayCell} ${
                  itemsInCell.length > 0 ? styles.hasJob : ""
                }`}
                onMouseEnter={() => setHoverSlot(cellId)}
                onMouseLeave={() => setHoverSlot(null)}
                onDragOver={(e) => draggingItem && e.preventDefault()}
                onDrop={() => handleDropOnCell(day, emp.id)}
              >
                {itemsInCell.map((item) => (
                  <div
                    key={item.assignmentId}
                    className={styles.jobBox}
                    draggable
                    onDragStart={() => setDraggingItem(item)}
                    onDragEnd={() => setDraggingItem(null)}
                    onClick={() => onJobClick(item.jobId)}
                    style={{
                      backgroundColor: item.color || "#faf7dc",
                    }}
                  >
                    <div className={styles.dragHandle} aria-hidden>
                      ⋮⋮
                    </div>

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
