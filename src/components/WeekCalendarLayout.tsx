// Created by Clevermode © 2025. All rights reserved.
import React, { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";

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
    newEnd: Date
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

  /* ================= WEEK RANGE ================= */

  const startOfWeek = new Date(date);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // Monday

  const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  /* ================= DRAG END ================= */

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const jobId = String(active.id).split("::")[0];
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const [dayIndex, employeeId] = String(over.id).split("-");
    const newDay = daysOfWeek[Number(dayIndex)];

    const oldStart = getJobStart(job);
    const oldEnd = getJobEnd(job);
    if (!oldStart || !oldEnd) return;

    const duration = oldEnd.getTime() - oldStart.getTime();

    const newStart = new Date(newDay);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);

    const newEnd = new Date(newStart.getTime() + duration);

    onJobMove(job.id, Number(employeeId), newStart, newEnd);
  };

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

  /* ================= RENDER ================= */

  return (
    <DndContext onDragEnd={handleDragEnd}>
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

            {daysOfWeek.map((day, i) => (
              <DroppableCell
                key={`${emp.id}-${i}`}
                id={`${i}-${emp.id}`}
                day={day}
                employee={emp}
                jobs={getJobsForDayAndEmployee(day, emp.id)}
                hoverSlot={hoverSlot}
                setHoverSlot={setHoverSlot}
                onJobClick={onJobClick}
                onAddJobAt={onAddJobAt}
              />
            ))}
          </div>
        ))}
      </div>
    </DndContext>
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
  onJobClick,
  onAddJobAt,
}: {
  id: string;
  day: Date;
  employee: Employee;
  jobs: CalendarJob[];
  hoverSlot: string | null;
  setHoverSlot: (x: string | null) => void;
  onJobClick: (id: string) => void;
  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  const handleAdd = () => {
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    onAddJobAt(employee.id, start, end);
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.dayCell} ${jobs.length > 0 ? styles.hasJob : ""}`}
      onMouseEnter={() => setHoverSlot(id)}
      onMouseLeave={() => setHoverSlot(null)}
    >
      {jobs.map((job) => (
        <DraggableJob
          key={`${job.id}::${employee.id}`}
          job={job}
          employeeId={employee.id}
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
/* DRAGGABLE JOB */
/* ========================================================= */

function DraggableJob({
  job,
  employeeId,
  onClick,
}: {
  job: CalendarJob;
  employeeId: number;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${job.id}::${employeeId}`,
    });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: job.color || "#faf7dc",
  };

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
      ref={setNodeRef}
      className={styles.jobBox}
      style={style}
      onClick={onClick}
    >
      {/* DRAG HANDLE */}
      <div
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
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
