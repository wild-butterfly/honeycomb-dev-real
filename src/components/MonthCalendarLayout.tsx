// Created by Clevermode © 2025. All rights reserved.
import React from "react";
import {
  DndContext,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

import styles from "./MonthCalendarLayout.module.css";
import { CalendarJob, Employee } from "../pages/CalendarPage";
import SidebarJobs from "./SidebarJobs";

/* -------------------------------------------------------------------------- */
/*                             DRAGGABLE JOB CARD                              */
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

  // Prevent drag from blocking clicks
  const downTimeRef = React.useRef<number | null>(null);

  const handleMouseDown = () => {
    downTimeRef.current = Date.now();
  };

  const handleMouseUp = () => {
    if (!downTimeRef.current) return;
    const delta = Date.now() - downTimeRef.current;

    if (delta < 180 && !isDragging) {
      onClick();
    }
  };

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: job.color || "#f8f8f8",
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               DROPPABLE DAY CELL                            */
/* -------------------------------------------------------------------------- */

function DroppableDayCell({
  id,
  date,
  jobs,
  onJobClick,
}: {
  id: string;
  date: Date;
  jobs: CalendarJob[];
  onJobClick: (id: number) => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={styles.dayCell}>
      <div className={styles.dayNumber}>{date.getDate()}</div>

      <div className={styles.jobsContainer}>
        {jobs.map((job) => (
          <DraggableJob
            key={job.id}
            job={job}
            onClick={() => onJobClick(job.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              MAIN MONTH VIEW                                */
/* -------------------------------------------------------------------------- */

interface Props {
  date: Date;
  jobs: CalendarJob[];
  employees: Employee[];
  selectedStaff: number[];
  onStaffChange: (ids: number[]) => void;
  onJobClick: (jobId: number) => void;
  onJobMove: (id: number, employeeId: number, newStart: Date, newEnd: Date) => void;
}

const MonthCalendarLayout: React.FC<Props> = ({
  date,
  jobs,
  employees,
  selectedStaff,
  onStaffChange,
  onJobClick,
  onJobMove,
}) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);

  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - startDay + 1;
    if (dayNum <= 0 || dayNum > daysInMonth) return null;
    return new Date(year, month, dayNum);
  });

  // Group jobs by day
  const jobsByDay: { [key: number]: CalendarJob[] } = {};
  jobs.forEach((job) => {
    const d = new Date(job.start);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!jobsByDay[day]) jobsByDay[day] = [];
      jobsByDay[day].push(job);
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const jobId = Number(active.id);
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    // over.id format → "day-YYYY-M-D"
    const overId = String(over.id);
    const [, y, m, d] = overId.split("-");
    const newDay = new Date(Number(y), Number(m), Number(d));

    // Preserve original time
    const oldStart = new Date(job.start);
    const newStart = new Date(newDay);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes());

    const duration = new Date(job.end).getTime() - oldStart.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    // Option A: Employee stays the same
    onJobMove(job.id, job.assignedTo[0], newStart, newEnd);
  };

  const handleStaffToggle = (id: number) => {
    if (selectedStaff.includes(id)) {
      onStaffChange(selectedStaff.filter((s) => s !== id));
    } else {
      onStaffChange([...selectedStaff, id]);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={styles.monthLayoutWrapper}>
        {/* LEFT: Staff List */}
        <aside className={styles.staffSidebar}>
          <div className={styles.staffTitle}>Staff</div>
          {employees.map((emp) => (
            <label key={emp.id} className={styles.staffCheckbox}>
              <input
                type="checkbox"
                checked={selectedStaff.includes(emp.id)}
                onChange={() => handleStaffToggle(emp.id)}
              />
              <span>{emp.name}</span>
            </label>
          ))}
        </aside>

        {/* CENTER: Month Grid */}
        <div className={styles.monthGrid}>
          {daysArray.map((day, i) =>
            day ? (
              <DroppableDayCell
                key={i}
                id={`day-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                date={day}
                jobs={jobsByDay[day.getDate()] ?? []}
                onJobClick={onJobClick}
              />
            ) : (
              <div key={i} className={styles.emptyCell}></div>
            )
          )}
        </div>

        {/* RIGHT: Sidebar Job List */}
        <aside className={styles.sidebarJobs}>
          <SidebarJobs jobs={jobs} />
        </aside>
      </div>
    </DndContext>
  );
};

export default MonthCalendarLayout;
