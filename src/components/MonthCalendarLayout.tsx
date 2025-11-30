// Created by Clevermode © 2025. All rights reserved.
import React, { useState } from "react";
import styles from "./MonthCalendarLayout.module.css";
import { CalendarJob, Employee } from "../pages/CalendarPage";

interface Props {
  date: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  selectedStaff: number[];
  onStaffChange: (list: number[]) => void;
  onJobClick: (id: number) => void;
  onJobMove: (id: number, employeeId: number, newStart: Date, newEnd: Date) => void;
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

  const year = date.getFullYear();
  const month = date.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const offset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1));

  const getJobsForDay = (day: Date) =>
    jobs.filter((j) => {
      const d = new Date(j.start);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate() &&
        (selectedStaff.length === 0 || j.assignedTo.some((id) => selectedStaff.includes(id)))
      );
    });

  const renderBadge = (job: CalendarJob) => {
    if (!job.status || job.status === "active") return null;

    if (job.status === "quote")
      return <div className={styles.badgeQuote}>QUOTE</div>;

    if (job.status === "completed")
      return <div className={styles.badgeCompleted}>COMPLETED</div>;

    if (job.status === "return")
      return <div className={styles.badgeReturn}>NEED TO RETURN</div>;

    return null;
  };

  return (
    <div className={styles.monthLayoutWide}>
      {/* LEFT STAFF PANEL */}
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
                  className={styles.staffCheckbox}
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

      {/* MONTH CALENDAR */}
      <div className={styles.monthWrapper}>
        <div className={styles.weekHeader}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className={styles.weekDayLabel}>
              {d}
            </div>
          ))}
        </div>

        <div className={styles.daysGrid}>
          {Array.from({ length: offset }).map((_, idx) => (
            <div key={idx} className={styles.emptyCell} />
          ))}

          {days.map((day) => {
            const jobsToday = getJobsForDay(day);
            const dayNum = day.getDate();

            return (
              <div
                key={day.toISOString()}
                className={styles.dayCell}
                onMouseEnter={() => setHoverDay(dayNum)}
                onMouseLeave={() => setHoverDay(null)}
              >
                <div className={styles.dayNumber}>{dayNum}</div>

                <div className={styles.jobsList}>
                  {jobsToday.map((job) => (
                    <div
                      key={job.id}
                      className={styles.jobBox}
                      onClick={() => onJobClick(job.id)}
                      style={{ backgroundColor: job.color || "#faf7dc" }}
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
                      start.setHours(9, 0);
                      const end = new Date(start);
                      end.setHours(10);

                      const empId = selectedStaff[0] || employees[0].id;
                      onAddJobAt(empId, start, end);
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

      {/* SPACER */}
      <div className={styles.sidebarSpacer} />
    </div>
  );
};

export default MonthCalendarLayout;
