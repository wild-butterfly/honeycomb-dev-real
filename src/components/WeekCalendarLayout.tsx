// Created by Clevermode © 2025. All rights reserved.

import React, { useMemo, useRef, useEffect, useState } from "react";
import styles from "./WeekCalendarLayout.module.css";

import type { Employee } from "../types/calendar";
import type { CalendarItem } from "../utils/calendarItems";
import { getStartOfWeek } from "../utils/date";
import StatusBadge from "../components/StatusBadge";

/* =========================================================
   PROPS – ASSIGNMENT BASED
========================================================= */

interface Props {
  date: Date;
  employees: Employee[];

  // assignment-based items
  items: CalendarItem[];

  // 🔥 assignment-aware click
  onItemClick: (item: CalendarItem) => void;

  onAssignmentMove: (
    assignmentId: number,
    employee_id: number,
    newStart: Date,
    newEnd: Date,
  ) => void;

  onAddJobAt: (employee_id: number, start: Date, end: Date) => void;
}

/* =========================================================
   DRAG STATE
========================================================= */

type WeekDrag = {
  item: CalendarItem;
  startX: number;
  startY: number;
  moved: boolean;
};

/* =========================================================
   HELPERS
========================================================= */

const dayKeyLocal = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/* =========================================================
   COMPONENT
========================================================= */

const WeekCalendarLayout: React.FC<Props> = ({
  date,
  employees,
  items,
  onItemClick,
  onAssignmentMove,
  onAddJobAt,
}) => {
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);

  const dragRef = useRef<WeekDrag | null>(null);
  const suppressClickRef = useRef(false);

  /* =========================================================
     WEEK RANGE
  ========================================================= */

  const startOfWeek = useMemo(() => getStartOfWeek(date), [date]);

  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [startOfWeek]);

  /* =========================================================
     GROUP ITEMS BY DAY + EMPLOYEE
  ========================================================= */

  const itemsByDayAndEmployee = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};

    for (const item of items) {
      const key = `${item.employee_id}__${dayKeyLocal(item.start)}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }

    return map;
  }, [items]);

  /* =========================================================
     DRAG LOGIC
  ========================================================= */

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
          const day = new Date(cell.dataset.date!);
          const targetEmployeeId = Number(cell.dataset.employeeId);

          const duration = ctx.item.end.getTime() - ctx.item.start.getTime();

          const newStart = new Date(day);
          newStart.setHours(
            ctx.item.start.getHours(),
            ctx.item.start.getMinutes(),
            0,
            0,
          );

          const newEnd = new Date(newStart.getTime() + duration);

          onAssignmentMove(
            ctx.item.assignmentId,
            targetEmployeeId,
            newStart,
            newEnd,
          );
        }
      }

      dragRef.current = null;
      setTimeout(() => (suppressClickRef.current = false), 0);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onAssignmentMove]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className={styles.weekWrapper}>
      {/* HEADER */}
      <div className={styles.headerRow}>
        <div className={styles.staffHeaderCell} />

        {daysOfWeek.map((day, i) => (
          <div key={i} className={styles.dayHeader}>
            {day.toLocaleDateString("en-AU", {
              weekday: "short",
              day: "numeric",
            })}
          </div>
        ))}
      </div>

      {/* EMPLOYEE ROWS */}
      {employees.map((emp) => (
        <div key={emp.id} className={styles.row}>
          <div className={styles.staffCell}>
            <div className={styles.avatarCircle}>{getInitials(emp.name)}</div>
            <span>{emp.name}</span>
          </div>

          {daysOfWeek.map((day) => {
            const key = `${emp.id}__${dayKeyLocal(day)}`;
            const itemsInCell = itemsByDayAndEmployee[key] || [];
            const cellId = `${emp.id}_${day.toISOString()}`;

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
                      dragRef.current = {
                        item,
                        startX: e.clientX,
                        startY: e.clientY,
                        moved: false,
                      };
                    }}
                    onClick={() => {
                      if (suppressClickRef.current) return;
                      onItemClick(item);
                    }}
                    style={{
                      backgroundColor: item.color || "#faf7dc",
                    }}
                  >
                    <StatusBadge status={item.status} />
                    <div className={styles.jobTitle}>{item.title}</div>
                    {item.client && (
                      <div className={styles.jobCustomer}>{item.client}</div>
                    )}
                  </div>
                ))}

                {hoverSlot === cellId && !itemsInCell.length && (
                  <button
                    className={styles.slotAddButton}
                    onClick={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      if (suppressClickRef.current) return;

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
