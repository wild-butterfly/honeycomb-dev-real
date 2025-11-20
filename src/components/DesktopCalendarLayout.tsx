import React, { useMemo, useState } from "react";
import styles from "../pages/CalendarPage.module.css";
import type { Employee, CalendarJob } from "../pages/CalendarPage";

type JobsByEmployee = { [empId: number]: CalendarJob[] };

interface Props {
  date: Date;
  employees: Employee[];
  jobsByEmployee: JobsByEmployee;
  onAddJobAt?: (employeeId: number, start: Date, end: Date) => void;
  onMoveJob?: (
    jobId: number,
    employeeId: number,
    start: Date,
    end: Date
  ) => void;
  onJobClick?: (jobId: number) => void;
}

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 18;
const HOUR_WIDTH_PX = 104;

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DesktopCalendarLayout: React.FC<Props> = ({
  date,
  employees,
  jobsByEmployee,
  onAddJobAt,
  onMoveJob,
  onJobClick,
}) => {
  const [draggingJobId, setDraggingJobId] = useState<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);

  const hours = useMemo(
    () =>
      Array.from(
        { length: DAY_END_HOUR - DAY_START_HOUR },
        (_, i) => DAY_START_HOUR + i
      ),
    []
  );

  const hourWidth = HOUR_WIDTH_PX;

  const allJobs: CalendarJob[] = useMemo(
    () => Object.values(jobsByEmployee).flat(),
    [jobsByEmployee]
  );

  const findJobById = (id: number) =>
    allJobs.find((j) => j.id === id) || null;

  // === DRAG & DROP FONKSİYONU ===
  const handleDropOnSlot = (e: React.DragEvent, employeeId: number) => {
    if (!draggingJobId || !onMoveJob) return;

    const job = findJobById(draggingJobId);
    if (!job) return;

    const lane = (e.currentTarget as HTMLElement).closest(
      `.${styles.jobsLane}`
    ) as HTMLElement;

    if (!lane) return;

    const laneRect = lane.getBoundingClientRect();

    // 🔥 Cursor + job offset düzeltildi
    const relativeX = (e.clientX - laneRect.left) - dragOffsetX;

    const hourOffset = relativeX / HOUR_WIDTH_PX;
    const rawHour = DAY_START_HOUR + hourOffset;

    // En yakın 15 dakikaya snap et
    const hours = Math.floor(rawHour);
    const minuteFloat = (rawHour % 1) * 60;
    const minuteRounded = Math.round(minuteFloat / 15) * 15;

    const finalHour = hours + (minuteRounded === 60 ? 1 : 0);
    const finalMinute = minuteRounded === 60 ? 0 : minuteRounded;

    const newStart = new Date(date);
    newStart.setHours(finalHour, finalMinute, 0, 0);

    const originalStart = new Date(job.start);
    const originalEnd = new Date(job.end);

    const duration = originalEnd.getTime() - originalStart.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    onMoveJob(draggingJobId, employeeId, newStart, newEnd);
    setDraggingJobId(null);
  };

  return (
    <div>
      {/* Header row */}
      <div className={styles.timelineRow}>
        <div className={styles.staffCell}></div>
        <div className={styles.jobsLane}>
          <div className={styles.timeSlotsHeader}>
            {hours.map((h) => (
              <div key={h} className={styles.timeSlotHeaderCell}>
                {h}:00
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className={styles.timelineBodyArea}>
        {employees.map((emp) => {
          const jobs = jobsByEmployee[emp.id] || [];

          return (
            <div key={emp.id} className={styles.timelineRow}>
              <div className={styles.staffCell}>
                <div className={styles.staffAvatarCircle}>
                  {emp.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className={styles.staffName}>{emp.name}</div>
              </div>

              <div className={styles.jobsLane}>
                {/* Slots */}
                <div className={styles.jobsLaneSlots}>
                  {hours.map((h) => {
                    const slotStart = new Date(date);
                    slotStart.setHours(h, 0, 0, 0);
                    const slotEnd = new Date(slotStart);
                    slotEnd.setHours(slotEnd.getHours() + 1);

                    return (
                      <div
                        key={h}
                        className={styles.timeSlotCell}
                        onDragOver={(e) => draggingJobId && e.preventDefault()}
                        onDrop={(e) => handleDropOnSlot(e, emp.id)}
                      >
                        {onAddJobAt && (
                          <button
                            type="button"
                            className={styles.slotAddButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddJobAt(emp.id, slotStart, slotEnd);
                            }}
                          >
                            +
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* JOBS */}
                {jobs.map((job) => {
                  const start = new Date(job.start);
                  const end = new Date(job.end);
                  if (!sameDay(start, date)) return null;

                  const startMinutes =
                    (start.getHours() - DAY_START_HOUR) * 60 +
                    start.getMinutes();

                  const durationMinutes =
                    (end.getTime() - start.getTime()) / 60000;

                  const left = (startMinutes / 60) * hourWidth;
                  const width = Math.max(
                    (durationMinutes / 60) * hourWidth - 8,
                    70
                  );

                  return (
                    <div
                      key={job.id}
                      className={styles.jobBlock}
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                        backgroundColor: job.color || "#fffef9",
                      }}
                      draggable
                      onDragStart={(e) => {
                        setDraggingJobId(job.id);
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setDragOffsetX(e.clientX - rect.left);
                      }}
                      onDragEnd={() => setDraggingJobId(null)}
                      onClick={() => onJobClick?.(job.id)}
                    >
                      <div className={styles.jobBlockTitle}>{job.title}</div>
                      <div className={styles.jobBlockCustomer}>
                        {job.customer}
                      </div>
                      {job.location && (
                        <div className={styles.jobBlockLocation}>
                          {job.location}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DesktopCalendarLayout;
