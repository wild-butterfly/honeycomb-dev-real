import React from "react";
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
}

const WeekCalendarLayout: React.FC<Props> = ({
  date,
  jobs,
  employees,
  onJobClick,
  onJobMove,
}) => {
  /** ----------------------------------------------------------------------
   * 1) HAFTANIN GÜNLERİNİ HESAPLA
   * -------------------------------------------------------------------- */
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday

  const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  /** ----------------------------------------------------------------------
   * 2) DRAG BİTTİĞİNDE JOB'UN YENİ KONUMUNU HESAPLA
   * -------------------------------------------------------------------- */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const jobId = Number(active.id);
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const [dayIndex, employeeId] = String(over.id).split("-");
    const newDay = daysOfWeek[Number(dayIndex)];

    // NEW START
    const oldStart = new Date(job.start);
    const newStart = new Date(newDay);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes());

    // NEW END
    const oldEnd = new Date(job.end);
    const duration = oldEnd.getTime() - oldStart.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    // CALLBACK
    onJobMove(jobId, Number(employeeId), newStart, newEnd);
  };

  /** ----------------------------------------------------------------------
   * 3) JOB FİLTRELEME
   * -------------------------------------------------------------------- */
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

            {/* DAYS FOR EMPLOYEE */}
            {daysOfWeek.map((day, i) => (
              <DroppableCell
                key={`${emp.id}-${i}`}
                id={`${i}-${emp.id}`}
                day={day}
                jobs={getJobsForDayAndEmployee(day, emp.id)}
                onJobClick={onJobClick}
              />
            ))}
          </div>
        ))}
      </div>
    </DndContext>
  );
};

export default WeekCalendarLayout;

/* -------------------------------------------------------------------------- */
/*                               DROPPABLE CELL                               */
/* -------------------------------------------------------------------------- */

function DroppableCell({
  id,
  day,
  jobs,
  onJobClick,
}: {
  id: string;
  day: Date;
  jobs: CalendarJob[];
  onJobClick: (id: number) => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={styles.dayCell}>
      {jobs.map((job) => (
        <DraggableJob
          key={job.id}
          job={job}
          onClick={() => onJobClick(job.id)}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                DRAGGABLE JOB                               */
/* -------------------------------------------------------------------------- */

function DraggableJob({
  job,
  onClick,
}: {
  job: CalendarJob;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: job.id });

  // CLICK vs DRAG algılama
  const downTimeRef = React.useRef<number | null>(null);

  const handleMouseDown = () => {
    downTimeRef.current = Date.now();
  };

  const handleMouseUp = () => {
    if (!downTimeRef.current) return;

    const delta = Date.now() - downTimeRef.current;

    // Eğer kullanıcı basıp sürüklemediyse click say
    if (delta < 200 && !isDragging) {
      onClick();
    }
  };

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
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
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
