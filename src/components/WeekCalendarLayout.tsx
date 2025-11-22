import React, { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";

import styles from "./WeekCalendarLayout.module.css";
import { CalendarJob, Employee } from "../pages/CalendarPage";

interface Props {
  date: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  onJobClick: (id: number) => void;
  onJobMove: (
    id: number,
    employeeId: number,
    newStart: Date,
    newEnd: Date
  ) => void;

  /** TEK DOĞRU İMZA: Day view ve Week view için */
  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
}

const WeekCalendarLayout: React.FC<Props> = ({
  date,
  jobs,
  employees,
  onJobClick,
  onJobMove,
  onAddJobAt,
}) => {
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);

  /* ------------------ 1) HAFTA ------------------ */
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1);

  const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  /* ------------------ 2) DRAG END ------------------ */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const jobId = Number(active.id);
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const [dayIndex, employeeId] = String(over.id).split("-");
    const newDay = daysOfWeek[Number(dayIndex)];

    const oldStart = new Date(job.start);
    const duration = new Date(job.end).getTime() - oldStart.getTime();

    const newStart = new Date(newDay);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes());

    const newEnd = new Date(newStart.getTime() + duration);

    onJobMove(jobId, Number(employeeId), newStart, newEnd);
  };

  /* ------------------ JOB FİLTRE ------------------ */
  const getJobsForDayAndEmployee = (day: Date, empId: number) =>
    jobs.filter(
      (job) =>
        new Date(job.start).toDateString() === day.toDateString() &&
        job.assignedTo.includes(empId)
    );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={styles.weekWrapper}>
        {/* HEADER */}
        <div className={styles.headerRow}>
          <div className={styles.staffHeaderCell}></div>

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

/* ---------------- DROPPABLE CELL ---------------- */

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
  onJobClick: (id: number) => void;
  onAddJobAt: (employeeId: number, start: Date, end: Date) => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  const handleAdd = () => {
    const start = new Date(day);
    start.setHours(9, 0);
    const end = new Date(start);
    end.setHours(10);

    onAddJobAt(employee.id, start, end);
  };

  return (
    <div
      ref={setNodeRef}
      className={styles.dayCell}
      onMouseEnter={() => setHoverSlot(id)}
      onMouseLeave={() => setHoverSlot(null)}
    >
      {jobs.map((job) => (
        <DraggableJob key={job.id} job={job} onClick={() => onJobClick(job.id)} />
      ))}

      {hoverSlot === id && (
        <button className={styles.addBtn} onClick={handleAdd}>
          +
        </button>
      )}
    </div>
  );
}

/* ---------------- DRAGGABLE JOB ---------------- */

function DraggableJob({
  job,
  onClick,
}: {
  job: CalendarJob;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: job.id });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: job.color || "#faf7dc",
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={styles.jobBox}
      style={style}
    >
      <div className={styles.jobTitle}>{job.title}</div>
      <div className={styles.jobCustomer}>{job.customer}</div>

      <div className={styles.jobTime}>
        {new Date(job.start).toLocaleTimeString("en-AU", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}
