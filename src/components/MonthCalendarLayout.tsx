// Created by Clevermode © 2025. All rights reserved.
import React, { useMemo, useState } from "react";
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
  const [draggingItem, setDraggingItem] = useState<CalendarItem | null>(null);

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

  /* ================= DRAG & DROP ================= */

  const handleDropOnDay = (day: Date, e: React.DragEvent) => {
    e.preventDefault();

    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;

    const parsed = JSON.parse(raw);

    const item: CalendarItem = {
      ...parsed,
      start: new Date(parsed.start),
      end: new Date(parsed.end),
    };

    const duration = item.end.getTime() - item.start.getTime();

    const newStart = new Date(day);
    newStart.setHours(item.start.getHours(), item.start.getMinutes(), 0, 0);

    const newEnd = new Date(newStart.getTime() + duration);

    onJobMove(item.jobId, item.employeeId, newStart, newEnd, item.assignmentId);

    setDraggingItem(null);
    setHoverDay(null);
  };

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
                onMouseEnter={() => setHoverDay(dayNum)}
                onMouseLeave={() => setHoverDay(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnDay(day, e)}
              >
                <div className={styles.dayNumber}>{dayNum}</div>

                <div className={styles.jobsList}>
                  {itemsToday.map((item) => (
                    <div
                      key={item.assignmentId}
                      draggable
                      className={styles.jobBox}
                      onDragStart={(e) => {
                        console.log("🟢 DRAG START", item.jobId);
                        setDraggingItem(item);
                        setHoverDay(null);

                        e.dataTransfer.setData(
                          "application/json",
                          JSON.stringify(item),
                        );
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDraggingItem(null)}
                      onClick={() => {
                        if (!draggingItem) {
                          onJobClick(item.jobId);
                        }
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

                {/* ADD BUTTON — HER ZAMAN DOM’DA */}
                <button
                  className={styles.slotAddButton}
                  style={{
                    opacity: hoverDay === dayNum && !draggingItem ? 1 : 0,
                    pointerEvents:
                      hoverDay === dayNum && !draggingItem ? "auto" : "none",
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
