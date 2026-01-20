// Created by Clevermode © 2025. All rights reserved.
import React, { useMemo, useState } from "react";
import styles from "./WeekCalendarLayout.module.css";
import type { CalendarJob, Employee } from "../pages/CalendarPage";
import {
  getJobStart,
  getJobEnd,
  getAssignedEmployeeIds,
} from "../utils/jobTime";

/* ========================================================= */
/* TYPES */
/* ========================================================= */

interface Props {
  date: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  onJobClick: (id: string) => void;
  onJobMove: (
    id: string,
    employeeId: number,
    newStart: Date,
    newEnd: Date,
  ) => void;
  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
}

type DragPayload = {
  jobId: string;
  fromEmployeeId: number;
  fromDayKey: string; // toDateString()
} | null;

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
  const [dragging, setDragging] = useState<DragPayload>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOfWeek.getTime()]);

  const findJobById = (id: string) => jobs.find((j) => j.id === id) || null;

  /* ================= FILTER JOBS ================= */

  const getJobsForDayAndEmployee = (day: Date, empId: number) =>
    jobs.filter((job) => {
      const start = getJobStart(job);
      if (!start) return false;

      return (
        start.toDateString() === day.toDateString() &&
        getAssignedEmployeeIds(job).includes(empId)
      );
    });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  /* ================= DROP HANDLER ================= */

  const handleDropOnCell = (day: Date, employeeId: number) => {
    if (!dragging) return;

    const job = findJobById(dragging.jobId);
    if (!job) {
      setDragging(null);
      return;
    }

    const oldStart = getJobStart(job);
    const oldEnd = getJobEnd(job);
    if (!oldStart || !oldEnd) {
      setDragging(null);
      return;
    }

    // Same slot → no-op
    const targetDayKey = day.toDateString();
    const sameDay = dragging.fromDayKey === targetDayKey;
    const sameEmp = dragging.fromEmployeeId === employeeId;
    if (sameDay && sameEmp) {
      setDragging(null);
      return;
    }

    const duration = oldEnd.getTime() - oldStart.getTime();

    const newStart = new Date(day);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);

    const newEnd = new Date(newStart.getTime() + duration);

    // Optional overlap protection (aynı anda aynı personele çakışma)
    const conflict = jobs.some((j) => {
      if (j.id === job.id) return false;
      const s = getJobStart(j);
      const e = getJobEnd(j);
      if (!s || !e) return false;

      return (
        getAssignedEmployeeIds(j).includes(employeeId) &&
        s < newEnd &&
        e > newStart
      );
    });

    if (conflict) {
      alert("This employee already has a job at this time.");
      setDragging(null);
      return;
    }

    onJobMove(job.id, employeeId, newStart, newEnd);
    setDragging(null);
  };

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

          {daysOfWeek.map((day, i) => {
            const cellId = `${emp.id}__${day.toISOString().slice(0, 10)}`;
            const jobsInCell = getJobsForDayAndEmployee(day, emp.id);

            return (
              <DroppableCell
                key={cellId}
                id={cellId}
                day={day}
                employee={emp}
                jobs={jobsInCell}
                hoverSlot={hoverSlot}
                setHoverSlot={setHoverSlot}
                dragging={dragging}
                onDropOnCell={handleDropOnCell}
                onJobClick={onJobClick}
                onAddJobAt={onAddJobAt}
                onDragStartJob={(jobId, fromEmpId, fromDayKey) =>
                  setDragging({ jobId, fromEmployeeId: fromEmpId, fromDayKey })
                }
                onDragEndJob={() => setDragging(null)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WeekCalendarLayout;

/* ========================================================= */
/* DROPPABLE CELL */
/* ========================================================= */

function DroppableCell({
  id,
  day,
  employee,
  jobs,
  hoverSlot,
  setHoverSlot,
  dragging,
  onDropOnCell,
  onJobClick,
  onAddJobAt,
  onDragStartJob,
  onDragEndJob,
}: {
  id: string;
  day: Date;
  employee: Employee;
  jobs: CalendarJob[];
  hoverSlot: string | null;
  setHoverSlot: (x: string | null) => void;
  dragging: DragPayload;
  onDropOnCell: (day: Date, employeeId: number) => void;
  onJobClick: (id: string) => void;
  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
  onDragStartJob: (
    jobId: string,
    fromEmpId: number,
    fromDayKey: string,
  ) => void;
  onDragEndJob: () => void;
}) {
  const handleAdd = () => {
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    onAddJobAt(employee.id, start, end);
  };

  return (
    <div
      className={`${styles.dayCell} ${jobs.length > 0 ? styles.hasJob : ""}`}
      onMouseEnter={() => setHoverSlot(id)}
      onMouseLeave={() => setHoverSlot(null)}
      onDragOver={(e) => {
        if (dragging) e.preventDefault(); // drop'ı aktif eder
      }}
      onDrop={() => onDropOnCell(day, employee.id)}
    >
      {jobs.map((job) => (
        <NativeDraggableJob
          key={`${job.id}::${employee.id}`}
          job={job}
          employeeId={employee.id}
          dayKey={day.toDateString()}
          onDragStart={onDragStartJob}
          onDragEnd={onDragEndJob}
          onClick={() => onJobClick(job.id)}
        />
      ))}

      {hoverSlot === id && jobs.length === 0 && (
        <button className={styles.slotAddButton} onClick={handleAdd}>
          +
        </button>
      )}
    </div>
  );
}

/* ========================================================= */
/* NATIVE DRAGGABLE JOB */
/* ========================================================= */

function NativeDraggableJob({
  job,
  employeeId,
  dayKey,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  job: CalendarJob;
  employeeId: number;
  dayKey: string;
  onDragStart: (jobId: string, fromEmpId: number, fromDayKey: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  let badge = null;
  if (job.status === "quote") {
    badge = <div className={styles.badgeQuote}>QUOTE</div>;
  } else if (job.status === "completed") {
    badge = <div className={styles.badgeCompleted}>COMPLETED</div>;
  } else if (job.status === "return") {
    badge = <div className={styles.badgeReturn}>NEED TO RETURN</div>;
  }

  const start = getJobStart(job) ?? new Date();

  return (
    <div
      className={styles.jobBox}
      draggable
      onDragStart={() => onDragStart(job.id, employeeId, dayKey)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        backgroundColor: job.color || "#faf7dc",
      }}
    >
      {/* Month’taki gibi “handle” görünümü istersen sadece görsel */}
      <div className={styles.dragHandle} aria-hidden>
        ⋮⋮
      </div>

      {badge}

      <div className={styles.jobTitle}>{job.title}</div>
      <div className={styles.jobCustomer}>{job.customer}</div>

      <div className={styles.jobTime}>
        {start.toLocaleTimeString("en-AU", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}
