// Created by Clevermode © 2025. All rights reserved.

import React, { useMemo, useRef, useEffect, useState } from "react";
import styles from "./MonthCalendarLayout.module.css";

import type { Employee } from "../types/calendar";
import type { CalendarItem } from "../utils/calendarItems";
import StatusBadge from "./StatusBadge";
import { UsersIcon } from "@heroicons/react/24/solid";

/* =========================================================
   PROPS – ASSIGNMENT BASED (MONTH VIEW)
========================================================= */

type Props = {
  date: Date;
  employees: Employee[];
  items: CalendarItem[];
  selectedStaff: number[];
  onStaffChange: (ids: number[]) => void;

  onItemClick: (item: CalendarItem) => void;

  onAssignmentMove: (
    assignmentId: number,
    employeeId: number,
    start: Date,
    end: Date,
  ) => void;

  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
};

/* =========================================================
   TYPES
========================================================= */

type MonthCalendarItem = CalendarItem & {
  staffCount: number;
};

/* =========================================================
   DRAG STATE
========================================================= */

type MonthDrag = {
  item: CalendarItem;
  startX: number;
  startY: number;
  moved: boolean;
};

/* =========================================================
   COMPONENT
========================================================= */

const MonthCalendarLayout: React.FC<Props> = ({
  date,
  employees,
  items,
  selectedStaff,
  onStaffChange,
  onItemClick,
  onAssignmentMove,
  onAddJobAt,
}) => {
  const [hoverDay, setHoverDay] = useState<string | null>(null);

  const dragRef = useRef<MonthDrag | null>(null);
  const suppressClickRef = useRef(false);

  /* =========================================================
     MONTH RANGE
  ========================================================= */

  const year = date.getFullYear();
  const month = date.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const offset = (first.getDay() + 6) % 7;

  const days = useMemo(
    () =>
      Array.from(
        { length: last.getDate() },
        (_, i) => new Date(year, month, i + 1),
      ),
    [year, month, last.getDate()],
  );

  /* =========================================================
     GROUP ITEMS BY DAY (JOB SUMMARY)
  ========================================================= */

  const itemsByDay = useMemo(() => {
    const map: Record<string, MonthCalendarItem[]> = {};
    days.forEach((d) => (map[d.toDateString()] = []));

    const grouped = new Map<string, MonthCalendarItem>();

    for (const item of items) {
      if (selectedStaff.length && !selectedStaff.includes(item.employee_id))
        continue;

      const dayKey = new Date(
        item.start.getFullYear(),
        item.start.getMonth(),
        item.start.getDate(),
      ).toDateString();

      const groupKey = `${item.jobId}-${dayKey}`;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          ...item,
          staffCount: 1,
        });
      } else {
        grouped.get(groupKey)!.staffCount++;
      }
    }

    grouped.forEach((item) => {
      const dayKey = new Date(
        item.start.getFullYear(),
        item.start.getMonth(),
        item.start.getDate(),
      ).toDateString();

      if (map[dayKey]) map[dayKey].push(item);
    });

    return map;
  }, [items, days, selectedStaff]);

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
            ctx.item.employee_id,
            newStart,
            newEnd,
          );
        }
      }

      dragRef.current = null;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onAssignmentMove]);

  /* =========================================================
     RENDER
  ========================================================= */

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
                <div className={styles.staffName}>{emp.name}</div>
              </label>
            );
          })}
        </div>
      </div>

      {/* MONTH GRID */}
      <div className={styles.monthWrapper}>
        <div className={styles.daysGrid}>
          {Array.from({ length: offset }).map((_, i) => (
            <div key={i} />
          ))}

          {days.map((day) => {
            const key = day.toDateString();
            const itemsToday = itemsByDay[key] || [];

            return (
              <div
                key={key}
                className={styles.dayCell}
                data-date={day.toISOString()}
                onMouseEnter={() => setHoverDay(key)}
                onMouseLeave={() => setHoverDay(null)}
              >
                <div className={styles.dayNumber}>{day.getDate()}</div>

                {itemsToday.map((item) => (
                  <div
                    key={`${item.jobId}-${key}`}
                    className={styles.jobBox}
                    style={{ backgroundColor: item.color || "#fffdf0" }}
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
                  >
                    {item.status && (
                      <div className={styles.statusBadgeWrap}>
                        <StatusBadge status={item.status} />
                      </div>
                    )}

                    <div className={styles.jobTitle}>{item.title}</div>

                    {item.staffCount > 1 && (
                      <div className={styles.staffBadgeMini}>
                        <UsersIcon className={styles.staffIconMini} />
                        {item.staffCount}
                      </div>
                    )}
                  </div>
                ))}

                {/* ADD SLOT */}
                {hoverDay === key && !itemsToday.length && (
                  <button
                    className={styles.slotAddButton}
                    onClick={() => {
                      const start = new Date(day);
                      start.setHours(9, 0, 0, 0);

                      const end = new Date(start);
                      end.setHours(start.getHours() + 1);

                      const targetEmployeeId =
                        selectedStaff[0] ?? employees[0]?.id ?? 0;

                      onAddJobAt(targetEmployeeId, start, end);
                    }}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthCalendarLayout;
