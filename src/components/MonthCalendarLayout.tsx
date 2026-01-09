// Created by Clevermode © 2025. All rights reserved.
import React, { useMemo, useState } from "react";
import styles from "./MonthCalendarLayout.module.css";
import type { CalendarJob, Employee } from "../pages/CalendarPage";
import {
  getJobStart,
  getJobEnd,
  getAssignedEmployeeIds,
} from "../utils/jobTime";

interface Props {
  date: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  selectedStaff: number[];
  onStaffChange: (list: number[]) => void;
  onJobClick: (id: string) => void;
  onJobMove: (
    id: string,
    employeeId: number,
    newStart: Date,
    newEnd: Date
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
  const [draggingJobId, setDraggingJobId] = useState<string | null>(null);

  const year = date.getFullYear();
  const month = date.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const offset = (first.getDay() + 6) % 7;

  const days = Array.from(
    { length: last.getDate() },
    (_, i) => new Date(year, month, i + 1)
  );

  /* ================= JOBS BY DAY (ASSIGNMENTS) ================= */

  const jobsByDay = useMemo(() => {
    const map: Record<string, CalendarJob[]> = {};

    days.forEach((d) => {
      map[d.toDateString()] = [];
    });

    jobs.forEach((job) => {
      const start = getJobStart(job);
      if (!start) return;

      const key = start.toDateString();

      // staff filter
      const empIds = getAssignedEmployeeIds(job);
      if (
        selectedStaff.length > 0 &&
        !empIds.some((id) => selectedStaff.includes(id))
      ) {
        return;
      }

      if (map[key]) {
        map[key].push(job);
      }
    });

    return map;
  }, [jobs, days, selectedStaff]);

  const findJobById = (id: string) => jobs.find((j) => j.id === id) || null;

  /* ================= BADGES ================= */

  const renderBadge = (job: CalendarJob) => {
    switch (job.status) {
      case "quote":
        return <div className={styles.badgeQuote}>QUOTE</div>;
      case "completed":
        return <div className={styles.badgeCompleted}>COMPLETED</div>;
      case "return":
        return <div className={styles.badgeReturn}>NEED TO RETURN</div>;
      default:
        return null;
    }
  };

  /* ================= DRAG & DROP ================= */

  const handleDropOnDay = (day: Date) => {
    if (!draggingJobId) return;

    const job = findJobById(draggingJobId);
    if (!job) return;

    const oldStart = getJobStart(job);
    const oldEnd = getJobEnd(job);
    if (!oldStart || !oldEnd) return;

    const newStart = new Date(day);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);

    const newEnd = new Date(day);
    newEnd.setHours(oldEnd.getHours(), oldEnd.getMinutes(), 0, 0);

    const employeeIds = getAssignedEmployeeIds(job);
    const employeeId = employeeIds[0] ?? employees[0]?.id;

    if (!employeeId) return;

    onJobMove(job.id, employeeId, newStart, newEnd);
    setDraggingJobId(null);
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
          {/* OFFSET */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={i} className={styles.emptyCell} />
          ))}

          {days.map((day) => {
            const key = day.toDateString();
            const jobsToday = jobsByDay[key] || [];
            const dayNum = day.getDate();

            return (
              <div
                key={key}
                className={styles.dayCell}
                onMouseEnter={() => setHoverDay(dayNum)}
                onMouseLeave={() => setHoverDay(null)}
                onDragOver={(e) => draggingJobId && e.preventDefault()}
                onDrop={() => handleDropOnDay(day)}
              >
                <div className={styles.dayNumber}>{dayNum}</div>

                <div className={styles.jobsList}>
                  {jobsToday.map((job) => (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={() => setDraggingJobId(job.id)}
                      onDragEnd={() => setDraggingJobId(null)}
                      onClick={() => onJobClick(job.id)}
                      className={styles.jobBox}
                      style={{
                        backgroundColor: job.color || "#faf7dc",
                      }}
                    >
                      {renderBadge(job)}
                      <div className={styles.jobTitle}>{job.title}</div>
                      <div className={styles.jobCustomer}>{job.customer}</div>
                    </div>
                  ))}
                </div>

                {hoverDay === dayNum && (
                  <button
                    className={styles.slotAddButton}
                    onClick={() => {
                      const start = new Date(day);
                      start.setHours(9, 0, 0, 0);

                      const end = new Date(start);
                      end.setHours(start.getHours() + 1);

                      const emp = selectedStaff[0] ?? employees[0]?.id;

                      if (emp) {
                        onAddJobAt(emp, start, end);
                      }
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

      <div className={styles.sidebarSpacer} />
    </div>
  );
};

export default MonthCalendarLayout;
